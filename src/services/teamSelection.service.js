const CV = require('../models/cv.model');
const User = require('../models/user.model');
const Organization = require('../models/organization.model');
const personalityOptimizer = require('./personalityOptimizer.service');
const { getConfigSection } = require('../config/teamSelectionDefaults');

/**
 * Team Selection Service
 * Selecciona el equipo ideal para un proyecto usando distancia Manhattan
 * basándose en las skills requeridas vs skills reales de los empleados
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
   * Selecciona el equipo ideal para un proyecto
   * Combines technical skill matching (Manhattan distance) with personality optimization
   * NOW USES: Project-specific configuration for weights and parameters
   * 
   * @param {Object} projectRequirements - Requisitos del proyecto
   * @param {string} organizationId - ID de la organización
   * @param {number} teamSize - Tamaño del equipo deseado
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

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const employeeIds = organization.employees
      .filter(emp => emp.status === 'active')
      .map(emp => emp.user);

    if (employeeIds.length === 0) {
      return [];
    }

    const cvs = await CV.find({
      userId: { $in: employeeIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    }).populate('userId', 'name email avatar');

    // Filter out CVs where userId populate failed (deleted users)
    const validCvs = cvs.filter(cv => cv.userId != null);

    if (validCvs.length === 0) {
      return [];
    }

    const normalizedRequiredTechs = mainTechnologies.map(tech => 
      this.normalizeTechnology(tech)
    );

    const scoredEmployees = await Promise.all(
      validCvs.map(async cv => {
        const score = await this.calculateEmployeeScore(
          cv,
          normalizedRequiredTechs,
          requiredExperienceLevel,
          weeklyHoursPerMember,
          config // Pass configuration
        );
        
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
   * Selecciona empleados complementarios para completar un equipo existente
   * Considers both technical fit and personality complementarity with existing team
   * 
   * @param {Object} projectRequirements - Requisitos del proyecto
   * @param {string} organizationId - ID de la organización
   * @param {Array} currentTeamUserIds - IDs de usuarios ya asignados
   * @param {number} remainingSlots - Número de empleados que faltan
   * @param {boolean} enablePersonalityOptimization - Enable personality-based optimization (default: true)
   * @returns {Promise<Object>} Array de empleados sugeridos y metadata
   */
  async selectComplementaryTeam(projectRequirements, organizationId, currentTeamUserIds = [], remainingSlots = 1, enablePersonalityOptimization = true) {
    const {
      mainTechnologies = [],
      requiredExperienceLevel = 'mid',
      weeklyHoursPerMember = 40
    } = projectRequirements;

    // Use the same Phase 1 configuration as the rest of the system (project-specific when present)
    const phase1Config = getConfigSection(projectRequirements, 'phase1');

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
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

    const cvs = await CV.find({
      userId: { $in: employeeIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    }).populate('userId', 'name email avatar');

    // Filter out CVs where userId populate failed (deleted users)
    const validCvs = cvs.filter(cv => cv.userId != null);

    if (validCvs.length === 0) {
      console.warn(`No valid CVs found for organization ${organizationId}. Total CVs: ${cvs.length}, Valid: ${validCvs.length}`);
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

    const scoredEmployees = await Promise.all(
      validCvs.map(async cv => {
        const score = await this.calculateEmployeeScore(
          cv,
          normalizedRequiredTechs,
          requiredExperienceLevel,
          weeklyHoursPerMember,
          phase1Config
        );
        
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

    const candidatePoolSize = Math.min(remainingSlots * 2, scoredEmployees.length);
    const topCandidates = scoredEmployees.slice(0, candidatePoolSize);

    let finalSuggestions;
    let validationResults = [];

    if (enablePersonalityOptimization && scoredEmployees.length > 0 && currentTeamUserIds.length > 0) {
      try {
        const currentTeam = await CV.find({
          userId: { $in: currentTeamUserIds },
          organization: organizationId,
          organizationStatus: 'accepted'
        }).populate('userId', 'name email avatar');

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
   * Calcula el score de un empleado usando distancia Manhattan
   * NOW USES: Configurable weights from project configuration
   * 
   * @param {Object} cv - CV del empleado
   * @param {Array} requiredTechs - Tecnologías requeridas normalizadas
   * @param {string} experienceLevel - Nivel de experiencia requerido
   * @param {string} complexity - Complejidad del proyecto
   * @param {number} weeklyHours - Horas semanales requeridas
   * @param {Object} config - Configuration object with weights
   * @returns {Object} Score y detalles
   */
  async calculateEmployeeScore(cv, requiredTechs, experienceLevel, complexity, weeklyHours, config) {
    // Validate input
    if (!cv || !cv.userId) {
      console.error('Invalid CV or missing userId in calculateEmployeeScore');
      return {
        total: Infinity,
        details: { error: 'Invalid CV data' },
        matchedSkills: [],
        missingSkills: requiredTechs || []
      };
    }

    let manhattanDistance = 0;
    const details = {};
    const matchedSkills = [];
    const missingSkills = [];

    // Ensure we always have a valid Phase 1 configuration
    const phase1Config = config || getConfigSection(null, 'phase1');

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
      phase1Config
    );
    manhattanDistance += availabilityDistance * phase1Config.availabilityWeight;
    details.availabilityDistance = availabilityDistance;

    return {
      total: manhattanDistance,
      details,
      matchedSkills,
      missingSkills
    };
  }

  /**
   * Calcula la distancia Manhattan para skills técnicas
   * NOW USES: config.skillMatchPenalty for missing skills
   * @param {Array} employeeSkills - Skills del empleado
   * @param {Array} requiredTechs - Tecnologías requeridas
   * @param {Array} matchedSkills - Array para almacenar skills coincidentes
   * @param {Array} missingSkills - Array para almacenar skills faltantes
   * @param {Object} config - Configuration object
   * @returns {number} Distancia
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
   * Calcula la distancia por experiencia laboral
   * NOW USES: config.experienceNormalizationFactor
   * @param {Array} experiences - Experiencias del empleado
   * @param {string} requiredLevel - Nivel requerido
   * @param {Object} config - Configuration object
   * @returns {number} Distancia
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
   * Calcula años totales de experiencia
   * @param {Array} experiences - Experiencias laborales
   * @returns {number} Años totales
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
   * Calcula la distancia por complejidad del sistema
   * NOW USES: config.complexityMultiplier
   * @param {Object} cv - CV del empleado
   * @param {string} complexity - Complejidad requerida
   * @param {Object} config - Configuration object
   * @returns {number} Distancia
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
   * Estima el nivel de complejidad que puede manejar un empleado
   * NOW USES: config.complexityFactors for bonuses
   * @param {Object} cv - CV del empleado
   * @param {Object} config - Configuration object
   * @returns {number} Score de complejidad (1-3)
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
   * Calcula la distancia por disponibilidad considerando múltiples factores
   * NOW USES: config.availabilityComponents for weights
   * @param {Object} cv - CV del empleado
   * @param {number} requiredHours - Horas semanales requeridas
   * @param {Object} config - Configuration object
   * @returns {Promise<number>} Distancia (0-5)
   * 
   * Componentes de la métrica:
   * 1. Disponibilidad de horas (configurable, default 50%) - Horas libres vs requeridas
   * 2. Fecha de inicio (configurable, default 20%) - ¿Cuándo puede empezar?
   * 3. Disponibilidad para viajar (configurable, default 15%) - Si el proyecto requiere viajes
   * 4. Trabajo fuera de horario (configurable, default 15%) - Disponibilidad para overtime/guardias
   */
  async calculateAvailabilityDistance(cv, requiredHours, config) {
    const Project = require('../models/project.model');
    const components = config.availabilityComponents || {};
    
    const userId = cv.userId._id || cv.userId;
    let totalDistance = 0;
    
    // ============================================================
    // 1. DISPONIBILIDAD DE HORAS (peso configurable)
    // ============================================================
    const activeProjects = await Project.find({
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
    // 2. FECHA DE INICIO (peso configurable)
    // ============================================================
    let startDateDistance = 0;
    const availability = cv.availability || {};
    
    if (availability.immediate === true) {
      // Disponible inmediatamente - sin penalización
      startDateDistance = 0;
    } else if (availability.startDate) {
      // Calcular días hasta que puede empezar
      const startDate = new Date(availability.startDate);
      const now = new Date();
      const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilStart <= 0) {
        // Ya puede empezar
        startDateDistance = 0;
      } else if (daysUntilStart <= 7) {
        // Menos de una semana - penalización mínima
        startDateDistance = 1;
      } else if (daysUntilStart <= 14) {
        // 1-2 semanas
        startDateDistance = 2;
      } else if (daysUntilStart <= 30) {
        // 2-4 semanas
        startDateDistance = 3;
      } else if (daysUntilStart <= 60) {
        // 1-2 meses
        startDateDistance = 4;
      } else {
        // Más de 2 meses - penalización máxima
        startDateDistance = 5;
      }
    } else {
      // Sin información de disponibilidad - asumimos no inmediata
      startDateDistance = 2.5;
    }
    
    totalDistance += startDateDistance * (components.startDateWeight || 0.2);

    // ============================================================
    // 3. DISPONIBILIDAD PARA VIAJAR (peso configurable)
    // ============================================================
    let travelDistance = 0;
    
    // TODO: En el futuro, el proyecto debería indicar si requiere viajes
    // Por ahora, consideramos que es beneficioso pero no crítico
    const travelFrequency = availability.travelFrequency || 'none';
    
    if (availability.willingToTravel === true) {
      // Dispuesto a viajar
      if (travelFrequency === 'always' || travelFrequency === 'frequently') {
        travelDistance = 0; // Sin penalización
      } else if (travelFrequency === 'occasionally') {
        travelDistance = 1; // Penalización mínima
      } else {
        travelDistance = 2; // Dice que viaja pero no especifica frecuencia
      }
    } else {
      // No dispuesto a viajar o sin información
      travelDistance = 3;
    }
    
    totalDistance += travelDistance * (components.travelWeight || 0.15);

    // ============================================================
    // 4. TRABAJO FUERA DE HORARIO (peso configurable)
    // ============================================================
    let offHoursDistance = 0;
    
    if (availability.willingToWorkOffHours === true) {
      const overtimeAvailability = availability.overtimeAvailability || 'none';
      
      if (overtimeAvailability === 'full') {
        offHoursDistance = 0; // Máxima flexibilidad
      } else if (overtimeAvailability === 'flexible') {
        offHoursDistance = 1; // Buena flexibilidad
      } else if (overtimeAvailability === 'limited') {
        offHoursDistance = 2; // Flexibilidad limitada
      } else {
        offHoursDistance = 2.5; // Dice que sí pero no especifica cuánto
      }
      
      // Bonus si está disponible para guardias o fines de semana
      if (availability.onCallAvailability === true) {
        offHoursDistance = Math.max(0, offHoursDistance - 0.5);
      }
      if (availability.weekendAvailability === true) {
        offHoursDistance = Math.max(0, offHoursDistance - 0.5);
      }
    } else {
      // No dispuesto a trabajar fuera de horario
      offHoursDistance = 4;
    }
    
    totalDistance += offHoursDistance * (components.offHoursWeight || 0.15);

    // ============================================================
    // Limitar el resultado final entre 0 y 5
    // ============================================================
    return Math.min(Math.max(totalDistance, 0), 5);
  }

  /**
   * Normaliza una tecnología para comparación
   * @param {string} tech - Nombre de la tecnología
   * @returns {string} Tecnología normalizada
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
   * Normaliza el nivel de skill a un número
   * @param {string} level - Nivel de skill
   * @returns {number} Nivel numérico (0-4)
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
   * Parsea una fecha en formato string
   * @param {string} dateStr - Fecha en string
   * @returns {Date|null} Fecha parseada
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
   * Calcula la diferencia en meses entre dos fechas
   * @param {Date} start - Fecha inicio
   * @param {Date} end - Fecha fin
   * @returns {number} Meses de diferencia
   */
  monthsDifference(start, end) {
    return (end.getFullYear() - start.getFullYear()) * 12 + 
           (end.getMonth() - start.getMonth());
  }

  /**
   * Obtiene información detallada del equipo seleccionado
   * @param {Array} selectedTeam - Equipo seleccionado
   * @param {Object} metadata - Metadata de la selección
   * @returns {Object} Información del equipo
   */
  getTeamSummary(selectedTeam, metadata = null) {
    if (selectedTeam.length === 0) {
      return {
        teamSize: 0,
        averageScore: 0,
        skillsCoverage: [],
        skillsGaps: [],
        warnings: ['No employees available with accepted CVs']
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
          `Equipo incompleto: Se necesitan ${metadata.requestedSize} empleados pero solo hay ${metadata.selectedSize} disponibles (faltan ${metadata.shortage})`
        );
      }
      if (metadata.employeesWithAcceptedCV < metadata.allEmployeesInOrg) {
        const pending = metadata.allEmployeesInOrg - metadata.employeesWithAcceptedCV;
        warnings.push(
          `There are ${pending} employee(s) in the organization without an accepted CV who were not considered`
        );
      }
    }
    
    if (allMissingSkills.size > 0) {
      warnings.push(
        `El equipo no cubre las siguientes tecnologías: ${Array.from(allMissingSkills).join(', ')}`
      );
    }

    if (averageScore > 2.5) {
      warnings.push(
        `El score promedio del equipo es alto (${averageScore.toFixed(2)}), lo que indica un match subóptimo con los requisitos`
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
   * Genera riesgos específicos basados en deficiencias del equipo
   * @param {Object} metadata - Metadata de la selección
   * @param {Object} summary - Resumen del equipo
   * @param {Object} projectRequirements - Requisitos del proyecto
   * @returns {Array} Array de riesgos identificados
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
        confidence: 0.80,
        impact: {
          quality: 'Code quality lower than expected',
          schedule: 'Longer time to complete tasks',
          team: 'Frustration from working outside comfort zone'
        },
        recommendations: [
          'Review if there are better candidates in the organization',
          'Evaluate pending CV approvals',
          'Consider intensive pre-project training',
          'Adjust development velocity expectations'
        ],
        detectedBy: 'team_selection',
        confidence: 0.75
      });
    }

    return risks;
  }

  /**
   * Convierte el score técnico (distancia Manhattan) a un matchScore de 0-100
   * donde mayor es mejor
   * 
   * @param {number} manhattanScore - Score original (distancia)
   * @param {Object} details - Detalles del score
   * @param {number} synergyBonus - Bonus de sinergia (0-20 puntos adicionales)
   * @returns {number} Match score de 0-100
   */
  calculateMatchScore(manhattanScore, details = {}, synergyBonus = 0) {
    // Definir rangos para normalización
    const PERFECT_SCORE = 0;      // Distancia 0 = 100 puntos
    const EXCELLENT_SCORE = 1.5;  // Distancia 1.5 = 85 puntos
    const GOOD_SCORE = 2.5;       // Distancia 2.5 = 70 puntos
    const ACCEPTABLE_SCORE = 4;   // Distancia 4 = 50 puntos
    const POOR_SCORE = 6;         // Distancia 6 = 25 puntos
    const WORST_SCORE = 10;       // Distancia 10+ = 0 puntos

    let baseScore;

    if (manhattanScore <= PERFECT_SCORE) {
      baseScore = 100;
    } else if (manhattanScore <= EXCELLENT_SCORE) {
      // Interpolación lineal entre 100-85
      baseScore = 100 - ((manhattanScore - PERFECT_SCORE) / (EXCELLENT_SCORE - PERFECT_SCORE)) * 15;
    } else if (manhattanScore <= GOOD_SCORE) {
      // Interpolación lineal entre 85-70
      baseScore = 85 - ((manhattanScore - EXCELLENT_SCORE) / (GOOD_SCORE - EXCELLENT_SCORE)) * 15;
    } else if (manhattanScore <= ACCEPTABLE_SCORE) {
      // Interpolación lineal entre 70-50
      baseScore = 70 - ((manhattanScore - GOOD_SCORE) / (ACCEPTABLE_SCORE - GOOD_SCORE)) * 20;
    } else if (manhattanScore <= POOR_SCORE) {
      // Interpolación lineal entre 50-25
      baseScore = 50 - ((manhattanScore - ACCEPTABLE_SCORE) / (POOR_SCORE - ACCEPTABLE_SCORE)) * 25;
    } else if (manhattanScore <= WORST_SCORE) {
      // Interpolación lineal entre 25-0
      baseScore = 25 - ((manhattanScore - POOR_SCORE) / (WORST_SCORE - POOR_SCORE)) * 25;
    } else {
      baseScore = 0;
    }

    // Agregar bonus de sinergia (máximo 20 puntos adicionales)
    const finalScore = Math.min(100, Math.max(0, baseScore + synergyBonus));

    return Math.round(finalScore * 10) / 10; // Redondear a 1 decimal
  }

  /**
   * Calcula el bonus de sinergia basado en la validación de personalidad
   * @param {Object} validation - Resultado de validateTeamAddition
   * @returns {number} Bonus de 0-20 puntos
   */
  calculateSynergyBonus(validation) {
    if (!validation) return 0;

    // Si no es recomendado, aplicar penalización
    if (validation.recommended === false) {
      return -10; // Penalización de 10 puntos
    }

    // Si es recomendado, calcular bonus basado en mejora de sinergia
    const improvement = validation.improvement || 0;
    
    if (improvement >= 0.15) return 20;  // Mejora excelente: +20 puntos
    if (improvement >= 0.10) return 15;  // Mejora muy buena: +15 puntos
    if (improvement >= 0.05) return 10;  // Mejora buena: +10 puntos
    if (improvement >= 0.02) return 5;   // Mejora moderada: +5 puntos
    if (improvement > 0) return 2;       // Mejora leve: +2 puntos (solo si improvement > 0)
    
    return 0; // Sin mejora = sin bonus
  }
}

module.exports = new TeamSelectionService();
