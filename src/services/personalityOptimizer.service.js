const BFI44Response = require('../models/bfi44.model');
const teamSynergyService = require('./teamSynergy.service');
const { toStableBfi44Profile } = require('../utils/bfi44ProfileMapper');

/**
 * Personality Optimizer Service
 * Optimizes team composition based on personality complementarity
 * Uses Big Five personality traits to enhance team selection
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Exclusively handles personality-based optimization
 * - Open/Closed: Extensible for new optimization strategies
 * - Liskov Substitution: Can replace or enhance existing selection algorithms
 * - Dependency Inversion: Depends on abstractions (teamSynergyService)
 * 
 * IMPORTANT: This service does NOT exclude candidates
 * It reorders and optimizes already technically qualified candidates
 * 
 * @module services/personalityOptimizer
 */
class PersonalityOptimizerService {
  /**
   * Optimize team composition by personality complementarity
   * Takes technically qualified candidates and reorders them for optimal synergy
   * 
   * @param {Array} technicallyQualifiedCandidates - Candidates already filtered by technical skills
   * @param {Object} projectRequirements - Project requirements including type
   * @param {number} teamSize - Target team size
   * @returns {Promise<Object>} Optimized team with synergy metrics
   */
  async optimizeTeamComposition(technicallyQualifiedCandidates, projectRequirements = {}, teamSize = 5) {
    // Input validation
    if (!technicallyQualifiedCandidates || technicallyQualifiedCandidates.length === 0) {
      return {
        optimized: false,
        reason: 'No candidates provided',
        team: []
      };
    }

    // Load BFI44 profiles for all candidates
    const candidatesWithProfiles = await this._loadCandidateProfiles(technicallyQualifiedCandidates);

    // Separate candidates with and without BFI44 profiles
    const withProfiles = candidatesWithProfiles.filter(c => c.bfi44Profile !== null);
    const withoutProfiles = candidatesWithProfiles.filter(c => c.bfi44Profile === null);

    // If no one has profiles, return original order
    if (withProfiles.length === 0) {
      return {
        optimized: false,
        reason: 'No BFI-44 profiles available for optimization',
        team: technicallyQualifiedCandidates.slice(0, teamSize),
        recommendation: 'Request candidates to complete BFI-44 assessment for better team composition'
      };
    }

    // Optimize team selection
    const optimizedTeam = await this._selectOptimalCombination(
      withProfiles,
      projectRequirements,
      teamSize
    );

    // Fill remaining slots with candidates without profiles (maintaining technical order)
    const remainingSlots = teamSize - optimizedTeam.length;
    if (remainingSlots > 0) {
      optimizedTeam.push(...withoutProfiles.slice(0, remainingSlots));
    }

    // Calculate synergy metrics for the optimized team
    const synergyAnalysis = await teamSynergyService.calculateTeamSynergy(
      optimizedTeam,
      projectRequirements
    );

    return {
      optimized: true,
      team: optimizedTeam,
      synergy: synergyAnalysis,
      optimization: {
        candidatesWithProfiles: withProfiles.length,
        candidatesWithoutProfiles: withoutProfiles.length,
        totalCandidates: technicallyQualifiedCandidates.length,
        profileCoverage: `${Math.round((withProfiles.length / technicallyQualifiedCandidates.length) * 100)}%`
      }
    };
  }

  /**
   * Select optimal combination of team members
   * Uses greedy algorithm with complementarity scoring
   * 
   * @private
   */
  async _selectOptimalCombination(candidatesWithProfiles, projectRequirements, teamSize) {
    const selectedTeam = [];
    const remainingCandidates = [...candidatesWithProfiles];

    // Determine project type for optimization strategy
    const projectType = this._determineProjectType(projectRequirements);
    const projectProfile = teamSynergyService.constructor.PROJECT_PROFILES[projectType];

    const seedMember = this._selectSeedMember(remainingCandidates, projectProfile);
    selectedTeam.push(seedMember);
    this._removeFromArray(remainingCandidates, seedMember);

    while (selectedTeam.length < teamSize && remainingCandidates.length > 0) {
      const nextMember = await this._selectMostComplementary(
        selectedTeam,
        remainingCandidates,
        projectRequirements
      );

      if (nextMember) {
        selectedTeam.push(nextMember);
        this._removeFromArray(remainingCandidates, nextMember);
      } else {
        break; // No more suitable candidates
      }
    }

    return selectedTeam;
  }

  /**
   * Select seed member (first member) based on project fit
   * 
   * @private
   */
  _selectSeedMember(candidates, projectProfile) {
    let bestCandidate = candidates[0];
    let bestScore = -Infinity;

    candidates.forEach(candidate => {
      const score = this._calculateProjectFitScore(candidate.bfi44Profile, projectProfile);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    });

    return bestCandidate;
  }

  /**
   * Select the most complementary member to current team
   * 
   * @private
   */
  async _selectMostComplementary(currentTeam, candidates, projectRequirements) {
    let bestCandidate = null;
    let bestSynergyScore = -Infinity;

    for (const candidate of candidates) {
      // Create hypothetical team with this candidate
      const hypotheticalTeam = [...currentTeam, candidate];

      // Calculate synergy for this combination
      const synergy = await teamSynergyService.calculateTeamSynergy(
        hypotheticalTeam,
        projectRequirements
      );

      if (synergy.available && synergy.overallScore > bestSynergyScore) {
        bestSynergyScore = synergy.overallScore;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Calculate how well a personality profile fits project requirements
   * 
   * @private
   */
  _calculateProjectFitScore(profile, projectProfile) {
    if (!profile || !projectProfile) return 0;

    const requirements = projectProfile.requirements;
    let totalScore = 0;
    let totalWeight = 0;

    Object.keys(requirements).forEach(trait => {
      const req = requirements[trait];
      const value = profile[trait];

      if (value !== undefined) {
        const optimal = req.optimal;
        const weight = req.weight || 0.2;

        // Calculate distance from optimal (lower is better)
        const distance = Math.abs(value - optimal);
        
        const score = Math.max(0, 100 - (distance * 50));

        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Load BFI44 profiles for candidates
   * 
   * @private
   */
  async _loadCandidateProfiles(candidates) {
    // Extract userIds correctly - get the actual ObjectId, not the full object
    const userIds = candidates.map(c => {
      const userId = c.userId || c.user?._id || c.user;
      // If userId is an object with _id, extract _id; otherwise use as-is
      return userId._id || userId;
    });

    const bfi44Results = await BFI44Response.find({
      userId: { $in: userIds }
    }).sort({ createdAt: -1 });

    // Create map for quick lookup - handle duplicates by keeping only the most recent
    const profileMap = new Map();
    bfi44Results.forEach(result => {
      const userIdStr = result.userId.toString();
      
      // Skip if we already have a profile for this user (we sorted by createdAt desc, so first is most recent)
      if (profileMap.has(userIdStr)) {
        return;
      }

      const profile = toStableBfi44Profile(result.results);
      // Convert lowercase keys to uppercase for compatibility
      const traits = profile?.traits ? {
        Openness: profile.traits.openness,
        Conscientiousness: profile.traits.conscientiousness,
        Extraversion: profile.traits.extraversion,
        Agreeableness: profile.traits.agreeableness,
        Neuroticism: profile.traits.neuroticism
      } : null;
      
      profileMap.set(userIdStr, traits);
    });

    // Attach profiles to candidates
    const result = candidates.map(candidate => {
      const userId = candidate.userId || candidate.user?._id || candidate.user;
      const userIdStr = (userId._id || userId).toString();
      const profile = profileMap.get(userIdStr);
      return {
        ...candidate,
        bfi44Profile: profile || null
      };
    });

    return result;
  }

  /**
   * Determine project type from requirements
   * 
   * @private
   */
  _determineProjectType(projectRequirements) {
    const { 
      projectType,
      requiredExperienceLevel,
      isInnovative,
      isMaintenance,
      expectedDuration 
    } = projectRequirements;

    // Explicit project type
    if (projectType && teamSynergyService.constructor.PROJECT_PROFILES[projectType]) {
      return projectType;
    }

    // Heuristics
    if (isInnovative === true || requiredExperienceLevel === 'expert') {
      return 'innovation';
    }
    if (isMaintenance === true) {
      return 'maintenance';
    }
    if (expectedDuration && expectedDuration < 3) {
      return 'crisis';
    }

    return 'standard';
  }

  /**
   * Remove item from array by reference
   * 
   * @private
   */
  _removeFromArray(array, item) {
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }
  }

  /**
   * Compare two team compositions and explain differences
   * Useful for A/B testing and explaining optimization benefits
   * 
   * @param {Array} originalTeam - Original team (before optimization)
   * @param {Array} optimizedTeam - Optimized team (after optimization)
   * @param {Object} projectRequirements - Project requirements
   * @returns {Promise<Object>} Comparison report
   */
  async compareTeamCompositions(originalTeam, optimizedTeam, projectRequirements = {}) {
    const [originalSynergy, optimizedSynergy] = await Promise.all([
      teamSynergyService.calculateTeamSynergy(originalTeam, projectRequirements),
      teamSynergyService.calculateTeamSynergy(optimizedTeam, projectRequirements)
    ]);

    const improvement = optimizedSynergy.available && originalSynergy.available
      ? optimizedSynergy.overallScore - originalSynergy.overallScore
      : null;

    return {
      original: originalSynergy,
      optimized: optimizedSynergy,
      improvement: {
        score: improvement,
        percentage: improvement !== null ? `${improvement > 0 ? '+' : ''}${improvement}%` : 'N/A',
        isImprovement: improvement > 0,
        message: this._getImprovementMessage(improvement)
      },
      changes: this._identifyChanges(originalTeam, optimizedTeam)
    };
  }

  /**
   * Get improvement message
   * 
   * @private
   */
  _getImprovementMessage(improvement) {
    if (improvement === null) {
      return 'Unable to compare due to missing personality data';
    }
    if (improvement > 10) {
      return 'Significant improvement in team synergy';
    }
    if (improvement > 5) {
      return 'Moderate improvement in team synergy';
    }
    if (improvement > 0) {
      return 'Slight improvement in team synergy';
    }
    if (improvement === 0) {
      return 'No change in team synergy';
    }
    return 'Team synergy decreased (technical fit may be prioritized)';
  }

  /**
   * Identify changes between two teams
   * 
   * @private
   */
  _identifyChanges(originalTeam, optimizedTeam) {
    const originalIds = new Set(originalTeam.map(m => 
      (m.userId || m.user?._id || m.user).toString()
    ));
    const optimizedIds = new Set(optimizedTeam.map(m => 
      (m.userId || m.user?._id || m.user).toString()
    ));

    const added = optimizedTeam.filter(m => 
      !originalIds.has((m.userId || m.user?._id || m.user).toString())
    );
    const removed = originalTeam.filter(m => 
      !optimizedIds.has((m.userId || m.user?._id || m.user).toString())
    );
    const unchanged = originalTeam.filter(m => 
      optimizedIds.has((m.userId || m.user?._id || m.user).toString())
    );

    return {
      added: added.length,
      removed: removed.length,
      unchanged: unchanged.length,
      reordered: added.length > 0 || removed.length > 0
    };
  }

  /**
   * Validate if adding a new member improves team synergy
   * Useful when incrementally building teams
   * 
   * @param {Array} currentTeam - Current team members
   * @param {Object} candidateMember - Candidate to add
   * @param {Object} projectRequirements - Project requirements
   * @returns {Promise<Object>} Validation result with recommendation
   */
  async validateTeamAddition(currentTeam, candidateMember, projectRequirements = {}) {
    // Calculate current team synergy
    const currentSynergy = await teamSynergyService.calculateTeamSynergy(
      currentTeam,
      projectRequirements
    );

    // Calculate synergy with new member
    const newTeam = [...currentTeam, candidateMember];
    const newSynergy = await teamSynergyService.calculateTeamSynergy(
      newTeam,
      projectRequirements
    );

    const improvement = newSynergy.available && currentSynergy.available
      ? newSynergy.overallScore - currentSynergy.overallScore
      : null;

    return {
      recommended: improvement === null || improvement >= 0,
      currentSynergy: currentSynergy.available ? currentSynergy.overallScore : null,
      newSynergy: newSynergy.available ? newSynergy.overallScore : null,
      improvement,
      message: this._getAdditionMessage(improvement),
      details: {
        current: currentSynergy,
        withCandidate: newSynergy
      }
    };
  }

  /**
   * Get addition validation message
   * 
   * @private
   */
  _getAdditionMessage(improvement) {
    if (improvement === null) {
      return 'Unable to assess impact due to missing personality data - proceeding based on technical fit';
    }
    if (improvement > 5) {
      return 'Excellent addition - significantly improves team synergy';
    }
    if (improvement > 0) {
      return 'Good addition - improves team synergy';
    }
    if (improvement === 0) {
      return 'Neutral addition - maintains current synergy level';
    }
    if (improvement > -5) {
      return 'Acceptable - slight decrease in synergy but may be justified by technical skills';
    }
    return 'Warning - may negatively impact team synergy. Consider alternatives if available.';
  }

  /**
   * Generate personality-aware hiring recommendations
   * Identifies personality profiles that would complement current team
   * 
   * @param {Array} currentTeam - Current team members
   * @param {Object} projectRequirements - Project requirements
   * @returns {Promise<Object>} Hiring recommendations
   */
  async generateHiringRecommendations(currentTeam, projectRequirements = {}) {
    const synergy = await teamSynergyService.calculateTeamSynergy(
      currentTeam,
      projectRequirements
    );

    if (!synergy.available) {
      return {
        available: false,
        message: 'Unable to generate recommendations without personality data'
      };
    }

    const recommendations = {
      idealProfiles: [],
      avoidProfiles: [],
      reasoning: []
    };

    // Analyze current team composition
    const currentRoles = synergy.metrics.roleDiversity.distribution;
    const allRoles = teamSynergyService.constructor.TEAM_ROLES;
    const projectProfile = teamSynergyService.constructor.PROJECT_PROFILES[synergy.projectType];

    // Identify missing roles
    const missingRoles = projectProfile.idealRoles.filter(role => 
      !currentRoles[role] || currentRoles[role] === 0
    );

    missingRoles.forEach(roleKey => {
      const role = allRoles[roleKey];
      if (role) {
        recommendations.idealProfiles.push({
          role: roleKey,
          name: role.name,
          description: role.description,
          desiredTraits: role.traits,
          priority: 'high'
        });
        recommendations.reasoning.push(
          `Seek ${role.name} to fill missing role in team`
        );
      }
    });

    // Check for personality imbalances
    const traits = synergy.metrics.balance.traitBalance;
    Object.keys(traits).forEach(trait => {
      const balance = traits[trait];
      if (balance.average < 2.5) {
        recommendations.idealProfiles.push({
          trait,
          recommendation: `Higher ${trait}`,
          reason: `Team average is low (${balance.average.toFixed(2)})`,
          priority: 'medium'
        });
      } else if (balance.average > 3.8) {
        recommendations.avoidProfiles.push({
          trait,
          recommendation: `Very high ${trait}`,
          reason: `Team average is already high (${balance.average.toFixed(2)})`,
          priority: 'low'
        });
      }
    });

    // Address conflict risks
    if (synergy.metrics.conflictRisk.risksDetected > 0) {
      synergy.metrics.conflictRisk.risks.forEach(risk => {
        if (risk.type === 'high_stress_tendency') {
          recommendations.idealProfiles.push({
            trait: 'Neuroticism',
            recommendation: 'Low Neuroticism (< 2.5)',
            reason: 'To balance high team stress tendency',
            priority: 'high'
          });
        }
        if (risk.type === 'low_discipline') {
          recommendations.idealProfiles.push({
            trait: 'Conscientiousness',
            recommendation: 'High Conscientiousness (> 4.0)',
            reason: 'To improve team discipline and reliability',
            priority: 'high'
          });
        }
      });
    }

    return {
      available: true,
      currentTeamSize: currentTeam.length,
      projectType: synergy.projectType,
      recommendations
    };
  }
}

module.exports = new PersonalityOptimizerService();
