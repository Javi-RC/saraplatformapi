const { cvRepository, userRepository, organizationRepository, projectRepository } = require('../../repositories');
const personalityOptimizer = require('./personalityOptimizer.service');
const { getConfigSection } = require('../../config/teamSelectionDefaults');
const AppError = require('../../utils/AppError');

/**
 * Team Selection Service
 * Selects the ideal team for a project using Manhattan distance
 * based on required skills vs actual employee skills
 * 
 * Enhanced with personality-based optimization for better team synergy
 * NOW SUPPORTS: Configurable weights and parameters via project configuration
 * Follows SOLID principles:
 * - Single Responsibility: Team selection based on technical fit
 * - Open/Closed: Extended with personality optimization without modifying core logic
 * - Dependency Inversion: Depends on personalityOptimizer abstraction
 */
class TeamSelectionService {
  /**
   * Builds the empty-but-well-formed result of a team selection.
   *
   * These paths used to `return []`, while the happy path returned
   * `{ team, metadata, ... }`. Callers destructure `{ team, metadata }`, so an
   * organization with no employees (or no accepted curricula) yielded `undefined`
   * for both and failed further downstream with an unrelated error.
   *
   * @param {number} teamSize - Requested team size
   * @param {number} allEmployeesInOrg - Active employees in the organization
   * @param {number} employeesWithAcceptedCV - Employees with an accepted curriculum
   * @returns {Object} Same shape as a successful selection, with an empty team
   * @private
   */
  _emptySelection(teamSize, allEmployeesInOrg = 0, employeesWithAcceptedCV = 0) {
    return {
      team: [],
      metadata: {
        requestedSize: teamSize,
        availableEmployees: employeesWithAcceptedCV,
        selectedSize: 0,
        isComplete: false,
        shortage: teamSize,
        allEmployeesInOrg,
        employeesWithAcceptedCV,
        candidatePoolSize: 0,
        personalityOptimized: false
      },
      synergy: null,
      optimization: null
    };
  }

  /**
   * Selects the ideal team for a project
   * Combines technical skill matching (Manhattan distance) with personality optimization
   * NOW USES: Project-specific configuration for weights and parameters
   * 
   * @param {Object} projectRequirements - Project requirements
   * @param {string} organizationId - Organization ID
   * @param {number} teamSize - Desired team size
   * @param {boolean} enablePersonalityOptimization - Enable personality-based optimization (default: true)
   * @param {Object} project - Project document with configuration (optional)
   * @returns {Promise<Object>} Team selection result with synergy metrics
   */
  async selectOptimalTeam(projectRequirements, organizationId, teamSize = 5, enablePersonalityOptimization = true, project = null) {
    const {
      mainTechnologies = [],
      requiredExperienceLevel = 'mid',
      weeklyHoursPerMember = 40
    } = projectRequirements;

    // Get configuration from project or use defaults
    const config = getConfigSection(project, 'phase1');

    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    const employeeIds = organization.employees
      .filter(emp => emp.status === 'active')
      .map(emp => emp.user);

    if (employeeIds.length === 0) {
      return this._emptySelection(teamSize, 0, 0);
    }

    const cvs = await cvRepository.find({
      userId: { $in: employeeIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    }, {
      populate: [{ path: 'userId', select: 'name email avatar' }]
    });

    // Filter out curricula where userId populate failed (deleted users)
    const validCvs = cvs.filter(cv => cv.userId != null);

    if (validCvs.length === 0) {
      return this._emptySelection(teamSize, employeeIds.length, cvs.length);
    }

    const normalizedRequiredTechs = mainTechnologies.map(tech => 
      this.normalizeTechnology(tech)
    );

    // Batch-load all active projects for these employees (avoids N+1 in calculateAvailabilityDistance)
    const allActiveProjects = await projectRepository.find({
      'assignedEmployees.user': { $in: employeeIds },
      status: { $in: ['active', 'draft'] }
    });

    const scoredEmployees = await Promise.all(
      validCvs.map(async cv => {
        const score = await this.calculateEmployeeScore({
          cv,
          requiredTechs: normalizedRequiredTechs,
          experienceLevel: requiredExperienceLevel,
          weeklyHours: weeklyHoursPerMember,
          config,
          activeProjects: allActiveProjects
        });

        return {
          userId: cv.userId._id,
          user: cv.userId,
          cv: cv,
          score: score.total,
          details: score.details,
          matchedSkills: score.matchedSkills,
          missingSkills: score.missingSkills
        };
      })
    );

    // Manhattan distance: lower is better. Without this sort the "top candidates"
    // slice below was just the order MongoDB happened to return the CVs in.
    scoredEmployees.sort((a, b) => a.score - b.score);

    // Use configurable candidate pool multiplier
    const candidatePoolSize = Math.min(
      teamSize * config.candidatePoolMultiplier,
      scoredEmployees.length
    );
    const topCandidates = scoredEmployees.slice(0, candidatePoolSize);

    let finalTeam;
    let optimizationResult = null;

    if (enablePersonalityOptimization && topCandidates.length > 0) {
      try {
        optimizationResult = await personalityOptimizer.optimizeTeamComposition(
          topCandidates,
          projectRequirements,
          teamSize
        );

        if (optimizationResult.optimized) {
          finalTeam = optimizationResult.team;
        } else {
          finalTeam = topCandidates.slice(0, teamSize);
        }
      } catch (error) {
        console.error('Error optimizing team composition:', error);
        finalTeam = topCandidates.slice(0, teamSize);
      }
    } else {
      finalTeam = topCandidates.slice(0, teamSize);
    }

    const metadata = {
      requestedSize: teamSize,
      availableEmployees: cvs.length,
      selectedSize: finalTeam.length,
      isComplete: finalTeam.length >= teamSize,
      shortage: Math.max(0, teamSize - finalTeam.length),
      allEmployeesInOrg: employeeIds.length,
      employeesWithAcceptedCV: cvs.length,
      candidatePoolSize: topCandidates.length,
      personalityOptimized: optimizationResult?.optimized || false
    };

    return {
      team: finalTeam,
      metadata,
      synergy: optimizationResult?.synergy || null,
      optimization: optimizationResult?.optimization || null
    };
  }

  /**
   * Selects complementary employees to complete an existing team
   * Considers both technical fit and personality complementarity with existing team
   * 
   * @param {Object} projectRequirements - Project requirements
   * @param {string} organizationId - Organization ID
   * @param {Array} currentTeamUserIds - IDs of users already assigned
   * @param {number} remainingSlots - Number of employees missing
   * @param {boolean} enablePersonalityOptimization - Enable personality-based optimization (default: true)
   * @returns {Promise<Object>} Array of suggested employees and metadata
   */
  async selectComplementaryTeam(projectRequirements, organizationId, currentTeamUserIds = [], remainingSlots = 1, enablePersonalityOptimization = true) {
    const {
      mainTechnologies = [],
      requiredExperienceLevel = 'mid',
      weeklyHoursPerMember = 40
    } = projectRequirements;

    // Use the same Phase 1 configuration as the rest of the system (project-specific when present)
    const phase1Config = getConfigSection(projectRequirements, 'phase1');

    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    const employeeIds = organization.employees
      .filter(emp => emp.status === 'active')
      .map(emp => emp.user)
      .filter(userId => !currentTeamUserIds.some(id => id.toString() === userId.toString()));

    if (employeeIds.length === 0) {
      return {
        suggestions: [],
        metadata: {
          requestedSize: remainingSlots,
          availableEmployees: 0,
          selectedSize: 0,
          isComplete: false,
          shortage: remainingSlots
        }
      };
    }

    const cvs = await cvRepository.find({
      userId: { $in: employeeIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    }, {
      populate: [{ path: 'userId', select: 'name email avatar' }]
    });

    // Filter out curricula where userId populate failed (deleted users)
    const validCvs = cvs.filter(cv => cv.userId != null);

    if (validCvs.length === 0) {
      console.warn(`No valid curricula found for organization ${organizationId}. Total curricula: ${cvs.length}, Valid: ${validCvs.length}`);
      return {
        suggestions: [],
        metadata: {
          requestedSize: remainingSlots,
          availableEmployees: 0,
          selectedSize: 0,
          isComplete: false,
          shortage: remainingSlots
        }
      };
    }

    const normalizedRequiredTechs = mainTechnologies.map(tech => 
      this.normalizeTechnology(tech)
    );

    // Batch-load all active projects for these employees (avoids N+1 in calculateAvailabilityDistance)
    const allEmployeeIds = validCvs.map(cv => cv.userId._id || cv.userId);
    const allActiveProjects = await projectRepository.find({
      'assignedEmployees.user': { $in: allEmployeeIds },
      status: { $in: ['active', 'draft'] }
    });

    const scoredEmployees = await Promise.all(
      validCvs.map(async cv => {
        const score = await this.calculateEmployeeScore({
          cv,
          requiredTechs: normalizedRequiredTechs,
          experienceLevel: requiredExperienceLevel,
          weeklyHours: weeklyHoursPerMember,
          config: phase1Config,
          activeProjects: allActiveProjects
        });

        return {
          userId: cv.userId._id || cv.userId,
          user: cv.userId,
          cv: cv,
          score: score.total,
          details: score.details,
          matchedSkills: score.matchedSkills,
          missingSkills: score.missingSkills
        };
      })
    );

    scoredEmployees.sort((a, b) => a.score - b.score);

    // Use configurable candidate pool multiplier (same as Phase 1 selectOptimalTeam)
    const candidatePoolSize = Math.min(
      remainingSlots * phase1Config.candidatePoolMultiplier,
      scoredEmployees.length
    );
    const topCandidates = scoredEmployees.slice(0, candidatePoolSize);

    let finalSuggestions;
    let validationResults = [];

    if (enablePersonalityOptimization && scoredEmployees.length > 0 && currentTeamUserIds.length > 0) {
      try {
        const currentTeam = await cvRepository.find({
          userId: { $in: currentTeamUserIds },
          organization: organizationId,
          organizationStatus: 'accepted'
        }, {
          populate: [{ path: 'userId', select: 'name email avatar' }]
        });

        const allCandidateValidations = await Promise.all(
          scoredEmployees.map(async candidate => {
            const validation = await personalityOptimizer.validateTeamAddition(
              currentTeam,
              candidate,
              projectRequirements
            );
            return {
              candidate,
              validation
            };
          })
        );

        validationResults = allCandidateValidations.map(cv => ({
          userId: cv.candidate.userId,
          recommended: cv.validation.recommended,
          synergyImpact: cv.validation.improvement,
          message: cv.validation.message
        }));

        const topCandidateValidations = allCandidateValidations
          .filter(cv => topCandidates.some(tc => tc.userId.toString() === cv.candidate.userId.toString()));

        topCandidateValidations.sort((a, b) => {
          const improvementA = a.validation.improvement || 0;
          const improvementB = b.validation.improvement || 0;
          return improvementB - improvementA;
        });

        finalSuggestions = topCandidateValidations
          .slice(0, remainingSlots)
          .map(cv => cv.candidate);

      } catch (error) {
        console.error('Error in complementary team optimization:', error);
        finalSuggestions = topCandidates.slice(0, remainingSlots);
      }
    } else {
      finalSuggestions = topCandidates.slice(0, remainingSlots);
    }

    const metadata = {
      requestedSize: remainingSlots,
      availableEmployees: validCvs.length,
      selectedSize: finalSuggestions.length,
      isComplete: finalSuggestions.length >= remainingSlots,
      shortage: Math.max(0, remainingSlots - finalSuggestions.length),
      currentTeamSize: currentTeamUserIds.length,
      candidatePoolSize: topCandidates.length,
      personalityOptimized: validationResults.length > 0
    };

    return {
      suggestions: finalSuggestions,
      metadata,
      synergyValidation: validationResults.length > 0 ? validationResults : null
    };
  }

  /**
   * Resolves a usable Phase 1 configuration.
   *
   * Guards against a caller passing something that is not a Phase 1 config
   * (which previously produced `undefined` weights and an overall score of NaN,
   * silently disabling the technical ranking). A malformed config now falls back
   * to the defaults and says so, instead of poisoning the arithmetic.
   *
   * @param {Object} config - Candidate configuration
   * @returns {Object} A configuration with numeric weights
   * @private
   */
  _resolvePhase1Config(config) {
    const REQUIRED_WEIGHTS = ['skillsWeight', 'experienceWeight', 'complexityWeight', 'availabilityWeight'];
    const isUsable = config && REQUIRED_WEIGHTS.every(weight => typeof config[weight] === 'number');

    if (config && !isUsable) {
      console.warn('[teamSelection] Invalid Phase 1 config received; falling back to defaults');
    }

    return isUsable ? config : getConfigSection(null, 'phase1');
  }

  /**
   * Calculates employee score using Manhattan distance (lower is better).
   *
   * Takes a single options object on purpose: the previous positional signature
   * had seven parameters and every production call site silently omitted one,
   * shifting every argument after it.
   *
   * @param {Object} options
   * @param {Object} options.cv - Employee curriculum
   * @param {Array} options.requiredTechs - Normalized required technologies
   * @param {string} [options.experienceLevel='mid'] - Required experience level
   * @param {string} [options.complexity='medium'] - Required complexity level.
   *   No field on the Project model feeds this yet, so callers legitimately omit it.
   * @param {number} [options.weeklyHours=40] - Required weekly hours
   * @param {Object} [options.config] - Phase 1 configuration with weights
   * @param {Array} [options.activeProjects=[]] - Pre-loaded active projects (avoids an N+1 query)
   * @returns {Object} Score and details
   */
  async calculateEmployeeScore({
    cv,
    requiredTechs,
    experienceLevel = 'mid',
    complexity = 'medium',
    weeklyHours = 40,
    config = null,
    activeProjects = []
  } = {}) {
    // Validate input
    if (!cv || !cv.userId) {
      console.error('Invalid curriculum or missing userId in calculateEmployeeScore');
      return {
        total: Infinity,
        details: { error: 'Invalid curriculum data' },
        matchedSkills: [],
        missingSkills: requiredTechs || []
      };
    }

    let manhattanDistance = 0;
    const details = {};
    const matchedSkills = [];
    const missingSkills = [];

    const phase1Config = this._resolvePhase1Config(config);
    const allActiveProjects = activeProjects;

    const skillsDistance = this.calculateSkillsDistance(
      cv.skills?.technical || [],
      requiredTechs,
      matchedSkills,
      missingSkills,
      phase1Config
    );
    manhattanDistance += skillsDistance * phase1Config.skillsWeight;
    details.skillsDistance = skillsDistance;

    const experienceDistance = this.calculateExperienceDistance(
      cv.experience || [],
      experienceLevel,
      phase1Config
    );
    manhattanDistance += experienceDistance * phase1Config.experienceWeight;
    details.experienceDistance = experienceDistance;

    const complexityDistance = this.calculateComplexityMatch(
      cv,
      complexity,
      phase1Config
    );
    manhattanDistance += complexityDistance * phase1Config.complexityWeight;
    details.complexityDistance = complexityDistance;

    const availabilityDistance = await this.calculateAvailabilityDistance(
      cv,
      weeklyHours,
      phase1Config,
      allActiveProjects
    );
    manhattanDistance += availabilityDistance * phase1Config.availabilityWeight;
    details.availabilityDistance = availabilityDistance;

    // A non-finite score would silently break every downstream sort (NaN makes a
    // comparator return NaN, which leaves the array untouched). Fail loudly-ish:
    // rank the candidate last rather than corrupting the whole ranking.
    if (!Number.isFinite(manhattanDistance)) {
      console.error('[teamSelection] Non-finite score computed', { details });
      return {
        total: Infinity,
        details: { ...details, error: 'Non-finite score' },
        matchedSkills,
        missingSkills
      };
    }

    return {
      total: manhattanDistance,
      details,
      matchedSkills,
      missingSkills
    };
  }

  /**
   * Calculates Manhattan distance for technical skills
   * NOW USES: config.skillMatchPenalty for missing skills
   * @param {Array} employeeSkills - Employee skills
   * @param {Array} requiredTechs - Required technologies
   * @param {Array} matchedSkills - Array to store matching skills
   * @param {Array} missingSkills - Array to store missing skills
   * @param {Object} config - Configuration object
   * @returns {number} Distance
   */
  calculateSkillsDistance(employeeSkills, requiredTechs, matchedSkills, missingSkills, config) {
    const phase1Config = config || getConfigSection(null, 'phase1');

    if (!Array.isArray(requiredTechs) || requiredTechs.length === 0) return 0;

    const normalizedEmployeeSkills = employeeSkills.map(skill => ({
      name: this.normalizeTechnology(skill.name),
      level: this.normalizeSkillLevel(skill.level),
      original: skill
    }));

    let totalDistance = 0;
    let matchCount = 0;

    requiredTechs.forEach(requiredTech => {
      const match = normalizedEmployeeSkills.find(empSkill => 
        empSkill.name === requiredTech
      );

      if (match) {
        const distance = Math.abs(match.level - 3);
        totalDistance += distance;
        matchCount++;
        matchedSkills.push({
          skill: requiredTech,
          level: match.original.level,
          distance
        });
      } else {
        totalDistance += (phase1Config.skillMatchPenalty ?? 5);
        missingSkills.push(requiredTech);
      }
    });

    return totalDistance / requiredTechs.length;
  }

  /**
   * Calculates distance based on work experience
   * NOW USES: config.experienceNormalizationFactor
   * @param {Array} experiences - Employee experiences
   * @param {string} requiredLevel - Required level
   * @param {Object} config - Configuration object
   * @returns {number} Distance
   */
  calculateExperienceDistance(experiences, requiredLevel, config) {
    const totalYears = this.calculateTotalYearsOfExperience(experiences);
    
    const expectedYears = {
      junior: 1,
      mid: 3,
      senior: 6,
      expert: 10
    };

    const required = expectedYears[requiredLevel] || 3;
    
    const distance = Math.abs(totalYears - required);
    const normFactor = config.experienceNormalizationFactor || 2;
    return Math.min(distance / normFactor, 5);
  }

  /**
   * Calculates total years of experience
   * @param {Array} experiences - Work experiences
   * @returns {number} Total years
   */
  calculateTotalYearsOfExperience(experiences) {
    if (!experiences || experiences.length === 0) return 0;

    let totalMonths = 0;

    experiences.forEach(exp => {
      const start = this.parseDate(exp.startDate);
      const end = exp.current ? new Date() : this.parseDate(exp.endDate);

      if (start && end) {
        const months = this.monthsDifference(start, end);
        totalMonths += months;
      }
    });

    return totalMonths / 12;
  }

  /**
   * Calculates distance based on system complexity
   * NOW USES: config.complexityMultiplier
   * @param {Object} cv - Employee curriculum
   * @param {string} complexity - Required complexity
   * @param {Object} config - Configuration object
   * @returns {number} Distance
   */
  calculateComplexityMatch(cv, complexity, config) {
    const complexityScore = this.estimateEmployeeComplexityLevel(cv, config);
    
    const complexityMap = {
      low: 1,
      medium: 2,
      high: 3
    };

    const required = complexityMap[complexity] || 2;
    const distance = Math.abs(complexityScore - required);
    const multiplier = config.complexityMultiplier || 1.5;
    
    return Math.min(distance * multiplier, 5);
  }

  /**
   * Estimates the complexity level an employee can handle
   * NOW USES: config.complexityFactors for bonuses
   * @param {Object} cv - Employee curriculum
   * @param {Object} config - Configuration object
   * @returns {number} Complexity score (1-3)
   */
  estimateEmployeeComplexityLevel(cv, config) {
    let score = 1;
    const factors = config.complexityFactors || {};

    if (cv.certifications && cv.certifications.length >= 2) {
      score += factors.certificationsBonus || 0.5;
    }

    const advancedSkills = (cv.skills?.technical || []).filter(s => 
      s.level === 'experto' || s.level === 'avanzado'
    );
    if (advancedSkills.length >= 5) {
      score += factors.advancedSkillsBonus || 0.5;
    }

    if (cv.projects && cv.projects.length >= 3) {
      score += factors.projectsBonus || 0.5;
    }

    const years = this.calculateTotalYearsOfExperience(cv.experience || []);
    if (years >= 5) {
      score += factors.experienceBonus || 0.5;
    }

    return Math.min(score, 3);
  }

  /**
   * Calculates availability distance considering multiple factors
   * NOW USES: config.availabilityComponents for weights
   * @param {Object} cv - Employee curriculum
   * @param {number} requiredHours - Required weekly hours
   * @param {Object} config - Configuration object
   * @returns {Promise<number>} Distance (0-5)
   * 
   * Metric components:
   * 1. Hours availability (configurable, default 50%) - Free hours vs required
   * 2. Start date (configurable, default 20%) - When can they start?
   * 3. Travel availability (configurable, default 15%) - If the project requires travel
   * 4. Off-hours work (configurable, default 15%) - Availability for overtime/on-call
   */
  async calculateAvailabilityDistance(cv, requiredHours, config, allActiveProjects = []) {
    const components = config.availabilityComponents || {};
    
    const userId = cv.userId._id || cv.userId;
    let totalDistance = 0;
    
    // ============================================================
    // 1. HOURS AVAILABILITY (configurable weight)
    // ============================================================
    const activeProjects = allActiveProjects.length > 0
      ? allActiveProjects.filter(p =>
          (p.assignedEmployees || []).some(emp =>
            emp.user && emp.user.toString() === userId.toString()
          )
        )
      : await projectRepository.find({
          'assignedEmployees.user': userId,
          status: { $in: ['active', 'draft'] }
        });

    let occupiedHours = 0;
    activeProjects.forEach(project => {
      occupiedHours += project.weeklyHoursPerMember || 0;
    });

    const availableHours = 40 - occupiedHours;
    let hoursDistance = 0;
    
    if (availableHours < requiredHours) {
      const shortage = requiredHours - availableHours;
      hoursDistance = Math.min(shortage / 10, 5); // Max 5 puntos
    }
    
    totalDistance += hoursDistance * (components.hoursWeight || 0.5);

    // ============================================================
    // 2. START DATE (configurable weight)
    // ============================================================
    let startDateDistance;
    const availability = cv.availability || {};
    
    if (availability.immediate === true) {
      // Available immediately - no penalty
      startDateDistance = 0;
    } else if (availability.startDate) {
      // Calculate days until they can start
      const startDate = new Date(availability.startDate);
      const now = new Date();
      const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilStart <= 0) {
        // Can start already
        startDateDistance = 0;
      } else if (daysUntilStart <= 7) {
        // Less than one week - minimal penalty
        startDateDistance = 1;
      } else if (daysUntilStart <= 14) {
        // 1-2 weeks
        startDateDistance = 2;
      } else if (daysUntilStart <= 30) {
        // 2-4 weeks
        startDateDistance = 3;
      } else if (daysUntilStart <= 60) {
        // 1-2 months
        startDateDistance = 4;
      } else {
        // More than 2 months - maximum penalty
        startDateDistance = 5;
      }
    } else {
      // No availability information - assume not immediate
      startDateDistance = 2.5;
    }
    
    totalDistance += startDateDistance * (components.startDateWeight || 0.2);

    // ============================================================
    // 3. TRAVEL AVAILABILITY (configurable weight)
    // ============================================================
    let travelDistance;
    
    // TODO: In the future, the project should indicate if travel is required
    // For now, we consider it beneficial but not critical
    const travelFrequency = availability.travelFrequency || 'none';
    
    if (availability.willingToTravel === true) {
      // Willing to travel
      if (travelFrequency === 'always' || travelFrequency === 'frequently') {
        travelDistance = 0; // No penalty
      } else if (travelFrequency === 'occasionally') {
        travelDistance = 1; // Minimal penalty
      } else {
        travelDistance = 2; // Says they travel but doesn't specify frequency
      }
    } else {
      // Not willing to travel or no information
      travelDistance = 3;
    }
    
    totalDistance += travelDistance * (components.travelWeight || 0.15);

    // ============================================================
    // 4. OFF-HOURS WORK (configurable weight)
    // ============================================================
    let offHoursDistance;
    
    if (availability.willingToWorkOffHours === true) {
      const overtimeAvailability = availability.overtimeAvailability || 'none';
      
      if (overtimeAvailability === 'full') {
        offHoursDistance = 0; // Maximum flexibility
      } else if (overtimeAvailability === 'flexible') {
        offHoursDistance = 1; // Good flexibility
      } else if (overtimeAvailability === 'limited') {
        offHoursDistance = 2; // Limited flexibility
      } else {
        offHoursDistance = 2.5; // Says yes but doesn't specify how much
      }
      
      // Bonus if available for on-call or weekends
      if (availability.onCallAvailability === true) {
        offHoursDistance = Math.max(0, offHoursDistance - 0.5);
      }
      if (availability.weekendAvailability === true) {
        offHoursDistance = Math.max(0, offHoursDistance - 0.5);
      }
    } else {
      // Not willing to work off-hours
      offHoursDistance = 4;
    }
    
    totalDistance += offHoursDistance * (components.offHoursWeight || 0.15);

    // ============================================================
    // Clamp final result between 0 and 5
    // ============================================================
    return Math.min(Math.max(totalDistance, 0), 5);
  }

  /**
   * Normalizes a technology for comparison
   * @param {string} tech - Technology name
   * @returns {string} Normalized technology
   */
  normalizeTechnology(tech) {
    if (!tech) return '';
    
    let normalized = tech.toLowerCase().trim();
    
    const aliases = {
      'javascript': ['js', 'javascript', 'ecmascript'],
      'typescript': ['ts', 'typescript'],
      'python': ['python', 'python3', 'py'],
      'java': ['java', 'jdk'],
      'react': ['react', 'reactjs', 'react.js'],
      'vue': ['vue', 'vuejs', 'vue.js'],
      'angular': ['angular', 'angularjs'],
      'node': ['node', 'nodejs', 'node.js'],
      'express': ['express', 'expressjs', 'express.js'],
      'mongodb': ['mongodb', 'mongo'],
      'postgresql': ['postgresql', 'postgres', 'pg'],
      'mysql': ['mysql', 'mariadb'],
      'docker': ['docker', 'containerization'],
      'kubernetes': ['kubernetes', 'k8s'],
      'aws': ['aws', 'amazon web services'],
      'azure': ['azure', 'microsoft azure'],
      'gcp': ['gcp', 'google cloud', 'google cloud platform']
    };

    for (const [canonical, variations] of Object.entries(aliases)) {
      if (variations.includes(normalized)) {
        return canonical;
      }
    }

    return normalized;
  }

  /**
   * Normalizes skill level to a number
   * @param {string} level - Skill level
   * @returns {number} Numeric level (0-4)
   */
  normalizeSkillLevel(level) {
    const levelMap = {
      'básico': 1,
      'intermedio': 2,
      'avanzado': 3,
      'experto': 4
    };

    return levelMap[level?.toLowerCase()] || 2;
  }

  /**
   * Parses a date from string format
   * @param {string} dateStr - Date string
   * @returns {Date|null} Parsed date
   */
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    const formats = [
      //(\d{4})-(\d{2})-(\d{2})/,
      /(\d{2})-(\d{4})/,
      /(\d{4})/,
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (match.length === 4) {
          return new Date(match[1], match[2] - 1, match[3]);
        } else if (match.length === 3) {
          return new Date(match[2], match[1] - 1, 1);
        } else if (match.length === 2) {
          return new Date(match[1], 0, 1);
        }
      }
    }

    return null;
  }

  /**
   * Calculates the difference in months between two dates
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {number} Month difference
   */
  monthsDifference(start, end) {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth());
  }

  /**
   * Gets detailed information about the selected team
   * @param {Array} selectedTeam - Selected team
   * @param {Object} metadata - Selection metadata
   * @returns {Object} Team information
   */
  getTeamSummary(selectedTeam, metadata = null) {
    if (selectedTeam.length === 0) {
      return {
        teamSize: 0,
        averageScore: 0,
        skillsCoverage: [],
        skillsGaps: [],
        warnings: ['No employees available with accepted curricula']
      };
    }

    const averageScore = selectedTeam.reduce((sum, emp) => sum + emp.score, 0) / selectedTeam.length;
    const allMatchedSkills = new Set();
    const allMissingSkills = new Set();
    
    selectedTeam.forEach(emp => {
      emp.matchedSkills.forEach(s => allMatchedSkills.add(s.skill));
      emp.missingSkills.forEach(s => allMissingSkills.add(s));
    });

    // Remove from missing skills any skill that is covered by at least one team member
    allMissingSkills.forEach(skill => {
      if (allMatchedSkills.has(skill)) {
        allMissingSkills.delete(skill);
      }
    });

    const warnings = [];
    if (metadata) {
      if (!metadata.isComplete) {
        warnings.push(
          `Incomplete team: ${metadata.requestedSize} employees needed but only ${metadata.selectedSize} available (${metadata.shortage} missing)`
        );
      }
      if (metadata.employeesWithAcceptedCV < metadata.allEmployeesInOrg) {
        const pending = metadata.allEmployeesInOrg - metadata.employeesWithAcceptedCV;
        warnings.push(
          `There are ${pending} employee(s) in the organization without an accepted curriculum who were not considered`
        );
      }
    }
    
    if (allMissingSkills.size > 0) {
      warnings.push(
        `The team does not cover the following technologies: ${Array.from(allMissingSkills).join(', ')}`
      );
    }

    if (averageScore > 2.5) {
      warnings.push(
        `The average team score is high (${averageScore.toFixed(2)}), indicating a suboptimal match with the requirements`
      );
    }

    return {
      teamSize: selectedTeam.length,
      averageScore: averageScore.toFixed(2),
      skillsCoverage: Array.from(allMatchedSkills),
      skillsGaps: Array.from(allMissingSkills),
      warnings: warnings.length > 0 ? warnings : undefined,
      members: selectedTeam.map(emp => ({
        userId: emp.userId,
        name: emp.user.name,
        email: emp.user.email,
        score: emp.score.toFixed(2),
        matchedSkills: emp.matchedSkills,
        missingSkills: emp.missingSkills
      }))
    };
  }

  /**
   * Generates specific risks based on team deficiencies
   * @param {Object} metadata - Selection metadata
   * @param {Object} summary - Team summary
   * @param {Object} projectRequirements - Project requirements
   * @returns {Array} Array of identified risks
   */
  generateTeamRisks(metadata, summary, projectRequirements) {
    const risks = [];

    if (metadata && !metadata.isComplete) {
      const severityMap = {
        1: 'low',
        2: 'medium',
        3: 'high',
        4: 'critical'
      };
      
      const shortageRatio = metadata.shortage / metadata.requestedSize;
      let severity = 'low';
      let confidence = 0.75;
      
      if (shortageRatio >= 0.5) {
        severity = 'critical';
        confidence = 0.95;
      } else if (shortageRatio >= 0.3) {
        severity = 'high';
        confidence = 0.85;
      } else if (shortageRatio >= 0.1) {
        severity = 'medium';
        confidence = 0.80;
      }

      risks.push({
        type: 'team_overload',
        title: 'Insufficient Team',
        description: `The project requires ${metadata.requestedSize} employees but only ${metadata.selectedSize} are available. ${metadata.shortage} team member(s) missing.`,
        severity,
        impact: {
          schedule: 'Significant delays in deliveries',
          quality: 'Possible quality deterioration due to overload',
          cost: 'Increased costs due to overtime',
          team: 'Burnout and staff turnover'
        },
        recommendations: [
          'Consider hiring new employees',
          'Reduce project scope',
          'Extend delivery timelines',
          'Request employees from other organizations (outsourcing)',
          'Review prioritization of active projects'
        ],
        detectedBy: 'team_selection',
        confidence
      });
    }

    if (summary.skillsGaps && summary.skillsGaps.length > 0) {
      const criticalSkills = summary.skillsGaps.length;
      let severity = 'low';
      let confidence = 0.85;

      if (criticalSkills >= 3) {
        severity = 'high';
        confidence = 0.95;
      } else if (criticalSkills >= 2) {
        severity = 'medium';
        confidence = 0.90;
      }

      risks.push({
        type: 'skill_gap',
        title: 'Technologies Not Covered',
        description: `The selected team has no experience in ${criticalSkills} required technology(ies): ${summary.skillsGaps.join(', ')}`,
        severity,
        impact: {
          schedule: 'Delays due to learning curve',
          quality: 'Possible errors due to lack of experience',
          cost: 'Additional training costs',
          technical: 'Technical debt from suboptimal solutions'
        },
        recommendations: [
          `Provide training in: ${summary.skillsGaps.join(', ')}`,
          'Hire external consultants with these skills',
          'Search for employees with these technologies in other organizations',
          'Consider alternative technologies that the team masters',
          'Assign extra time for learning'
        ],
        detectedBy: 'team_selection',
        confidence,
        missingSkills: summary.skillsGaps
      });
    }

    if (summary.averageScore && parseFloat(summary.averageScore) > 2.5) {
      risks.push({
        type: 'skill_gap',
        title: 'Suboptimal Team Match',
        description: `The team has an average score of ${summary.averageScore}, indicating a significant distance between required and available skills`,
        severity: 'medium',
        confidence: 0.75,
        impact: {
          quality: 'Code quality lower than expected',
          schedule: 'Longer time to complete tasks',
          team: 'Frustration from working outside comfort zone'
        },
        recommendations: [
          'Review if there are better candidates in the organization',
          'Evaluate pending curriculum approvals',
          'Consider intensive pre-project training',
          'Adjust development velocity expectations'
        ],
        detectedBy: 'team_selection'
      });
    }

    return risks;
  }

  /**
   * Converts technical score (Manhattan distance) to a 0-100 matchScore
   * where higher is better
   * 
   * @param {number} manhattanScore - Original score (distance)
   * @param {Object} details - Score details
   * @param {number} synergyBonus - Synergy bonus (0-20 additional points)
   * @returns {number} Match score 0-100
   */
  calculateMatchScore(manhattanScore, details = {}, synergyBonus = 0) {
    // Define ranges for normalization
    const PERFECT_SCORE = 0;      // Distance 0 = 100 points
    const EXCELLENT_SCORE = 1.5;  // Distance 1.5 = 85 points
    const GOOD_SCORE = 2.5;       // Distance 2.5 = 70 points
    const ACCEPTABLE_SCORE = 4;   // Distance 4 = 50 points
    const POOR_SCORE = 6;         // Distance 6 = 25 points
    const WORST_SCORE = 10;       // Distance 10+ = 0 points

    let baseScore;

    if (manhattanScore <= PERFECT_SCORE) {
      baseScore = 100;
    } else if (manhattanScore <= EXCELLENT_SCORE) {
      // Linear interpolation between 100-85
      baseScore = 100 - ((manhattanScore - PERFECT_SCORE) / (EXCELLENT_SCORE - PERFECT_SCORE)) * 15;
    } else if (manhattanScore <= GOOD_SCORE) {
      // Linear interpolation between 85-70
      baseScore = 85 - ((manhattanScore - EXCELLENT_SCORE) / (GOOD_SCORE - EXCELLENT_SCORE)) * 15;
    } else if (manhattanScore <= ACCEPTABLE_SCORE) {
      // Linear interpolation between 70-50
      baseScore = 70 - ((manhattanScore - GOOD_SCORE) / (ACCEPTABLE_SCORE - GOOD_SCORE)) * 20;
    } else if (manhattanScore <= POOR_SCORE) {
      // Linear interpolation between 50-25
      baseScore = 50 - ((manhattanScore - ACCEPTABLE_SCORE) / (POOR_SCORE - ACCEPTABLE_SCORE)) * 25;
    } else if (manhattanScore <= WORST_SCORE) {
      // Linear interpolation between 25-0
      baseScore = 25 - ((manhattanScore - POOR_SCORE) / (WORST_SCORE - POOR_SCORE)) * 25;
    } else {
      baseScore = 0;
    }

    // Add synergy bonus (maximum 20 additional points)
    const finalScore = Math.min(100, Math.max(0, baseScore + synergyBonus));

    return Math.round(finalScore * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculates synergy bonus based on personality validation
   * @param {Object} validation - validateTeamAddition result
   * @returns {number} Bonus of 0-20 points
   */
  calculateSynergyBonus(validation) {
    if (!validation) return 0;

    // If not recommended, apply penalty
    if (validation.recommended === false) {
      return -10; // 10-point penalty
    }

    // If recommended, calculate bonus based on synergy improvement
    const improvement = validation.improvement || 0;
    
    if (improvement >= 0.15) return 20;  // Excellent improvement: +20 points
    if (improvement >= 0.10) return 15;  // Very good improvement: +15 points
    if (improvement >= 0.05) return 10;  // Good improvement: +10 points
    if (improvement >= 0.02) return 5;   // Moderate improvement: +5 points
    if (improvement > 0) return 2;       // Slight improvement: +2 points (only if improvement > 0)
    
    return 0; // No improvement = no bonus
  }
}

module.exports = new TeamSelectionService();
