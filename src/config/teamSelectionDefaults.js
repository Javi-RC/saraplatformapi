/**
 * Default Team Selection Configuration
 * Contains all default values for team selection, personality optimization, CBR, and decision tree
 * 
 * This configuration matches the hardcoded values previously used in the services
 * to ensure backward compatibility when no custom configuration is provided
 */

const DEFAULT_TEAM_SELECTION_CONFIG = {
  // Phase 1: Technical Matching (Manhattan Distance Weights)
  phase1: {
    // Main components weights for Manhattan distance calculation
    skillsWeight: 0.4,
    experienceWeight: 0.3,
    complexityWeight: 0.2,
    availabilityWeight: 0.1,
    
    // Detailed availability sub-components
    availabilityComponents: {
      hoursWeight: 0.5,
      startDateWeight: 0.2,
      travelWeight: 0.15,
      offHoursWeight: 0.15
    },
    
    // Thresholds and factors
    skillMatchPenalty: 5,
    experienceNormalizationFactor: 2,
    complexityMultiplier: 1.5,
    
    // Complexity estimation factors
    complexityFactors: {
      certificationsBonus: 0.5,
      advancedSkillsBonus: 0.5,
      projectsBonus: 0.5,
      experienceBonus: 0.5
    },
    
    // Candidate pool size multiplier
    candidatePoolMultiplier: 2
  },
  
  // Phase 2: Personality Optimization
  phase2: {
    enabled: true,
    
    // Project profile weights by personality trait
    projectProfiles: {
      innovation: {
        Openness: { min: 3.5, optimal: 4.0, weight: 0.35 },
        Extraversion: { min: 3.0, optimal: 3.5, weight: 0.20 },
        Conscientiousness: { min: 2.5, optimal: 3.5, weight: 0.20 },
        Agreeableness: { min: 3.0, optimal: 3.5, weight: 0.15 },
        Neuroticism: { max: 3.5, optimal: 2.5, weight: 0.10 }
      },
      maintenance: {
        Conscientiousness: { min: 4.0, optimal: 4.5, weight: 0.40 },
        Agreeableness: { min: 3.5, optimal: 4.0, weight: 0.25 },
        Neuroticism: { max: 3.0, optimal: 2.5, weight: 0.15 },
        Openness: { min: 2.5, optimal: 3.0, weight: 0.10 },
        Extraversion: { min: 2.5, optimal: 3.0, weight: 0.10 }
      },
      crisis: {
        Conscientiousness: { min: 4.0, optimal: 4.5, weight: 0.35 },
        Neuroticism: { max: 2.5, optimal: 2.0, weight: 0.30 },
        Extraversion: { min: 3.0, optimal: 3.5, weight: 0.20 },
        Agreeableness: { min: 3.0, optimal: 3.5, weight: 0.10 },
        Openness: { min: 2.5, optimal: 3.0, weight: 0.05 }
      },
      research: {
        Openness: { min: 4.0, optimal: 4.5, weight: 0.40 },
        Conscientiousness: { min: 3.0, optimal: 3.5, weight: 0.25 },
        Neuroticism: { max: 3.0, optimal: 2.5, weight: 0.15 },
        Extraversion: { min: 2.5, optimal: 3.0, weight: 0.10 },
        Agreeableness: { min: 3.0, optimal: 3.5, weight: 0.10 }
      },
      standard: {
        Conscientiousness: { min: 3.5, optimal: 4.0, weight: 0.30 },
        Openness: { min: 3.0, optimal: 3.5, weight: 0.25 },
        Agreeableness: { min: 3.0, optimal: 3.5, weight: 0.20 },
        Extraversion: { min: 2.5, optimal: 3.0, weight: 0.15 },
        Neuroticism: { max: 3.5, optimal: 3.0, weight: 0.10 }
      }
    },
    
    // Synergy calculation weights (Complementarity and Balance removed)
    synergyWeights: {
      roleDiversityWeight: 0.30,
      projectFitWeight: 0.40,
      previousCollaborationsWeight: 0.30
    }
  },
  
  // Previous Collaborations Configuration
  previousCollaborations: {
    // Puntos otorgados por cada colaboración previa entre miembros del equipo
    pointsPerCollaboration: 10,
    // Máximo de puntos que puede aportar una pareja (evita dominio de parejas muy frecuentes)
    maxPointsPerPair: 30,
    // Bonus por colaboraciones recientes (últimos 6 meses)
    recentCollaborationBonus: 5
  },
  
  // CBR (Case-Based Reasoning) Configuration
  cbr: {
    // Dimension weights for similarity calculation
    dimensionWeights: {
      coordination: 0.25,
      technical: 0.30,
      team: 0.20,
      management: 0.15,
      organizational: 0.10
    },
    
    // CBR parameters
    kSimilarCases: 5,
    minSimilarityThreshold: 0.3
  },
  
  // Decision Tree Configuration (Expert Rules)
  decisionTree: {
    // Risk detection thresholds (29 most important and defensible thresholds)
    // Only business-critical thresholds are exposed for PM configuration
    riskThresholds: {
      // TIER 1: Critical Thresholds (Skill Gap)
      // Different industries have different skill gap tolerances
      skillGapCritical: 0.5,              // Tech match ratio < 50% = CRITICAL risk
      skillGapMajor: 0.7,                 // Tech match ratio < 70% = MAJOR risk
      minTechnologiesThreshold: 3,        // Missing 3+ critical techs = HIGH risk
      maxJuniorRatio: 0.6,                // Max 60% juniors in complex projects
      minProficiencyThreshold: 2.0,       // Min avg proficiency 2.0/5 for complex projects
      
      // TIER 1: Critical Thresholds (Communication)
      // Distributed vs local teams have different communication needs
      minTimeOverlapHours: 2,             // ≤2h overlap → favor async tools
      normalOverlapHours: 6,              // ≥6h overlap → sync tools viable
      
      // TIER 1: Critical Thresholds (Team Overload)
      // Organizational cultures vary in acceptable workload
      overloadCritical: 60,               // 60+ hours/week = CRITICAL overload
      overloadHigh: 50,                   // 50+ hours/week = HIGH overload
      overloadAverageHours: 45,           // 45+ hours/week avg = team overload risk
      maxConcurrentProjectsThreshold: 2,  // >2 concurrent projects = overload risk
      
      // TIER 1: Critical Thresholds (Scope Creep)
      // Startups vs corporations have different formality levels
      minDescriptionLength: 500,          // <500 chars = unclear requirements
      minKeyRoles: 3,                     // <3 defined key roles = scope creep risk
      clientTimeOverlapHours: 4,          // <4h/day with client = alignment issues
      
      // TIER 2: Important Thresholds (Dependencies)
      // Project complexity varies by industry and team structure
      minCriticalDependencies: 3,         // 3+ critical deps = dependency risk
      minInvolvedTeams: 2,                // 2+ teams involved = coordination risk
      timelineBufferPercentage: 30,       // 30% timeline buffer for integration
      
      // TIER 2: Important Thresholds (Knowledge Management)
      // Team size and documentation needs vary by organization
      maxTeamSizeForKM: 5,                // Teams >5 need formal KM
      kmRiskScoreHigh: 6,                 // Score ≥6 = HIGH KM risk
      
      // TIER 2: Important Thresholds (Process Maturity)
      // Organizations have different maturity levels
      maturityScoreLow: 1.5,              // Maturity <1.5 = HIGH process mismatch
      maturityScoreMedium: 2.5,           // Maturity <2.5 = MEDIUM process mismatch
      
      // TIER 2: Important Thresholds (Cultural/Timezone)
      // Global teams need special configuration
      highCulturalDiversityThreshold: 3,  // 3+ cultures = compliance risk
      minTimezonesForRisk: 3,             // 3+ timezones = scheduling risk
      minTimeOverlapHoursThreshold: 3     // <3h overlap = timezone scheduling issues
    },
    
    // Personality-based risk thresholds (Big Five traits)
    personalityRiskThresholds: {
      agreeablenessLow: 2.5,              // Agreeableness <2.5 = conflict risk
      agreeablenessVarianceHigh: 1.5,     // Variance >1.5 = team conflict risk
      neuroticismHigh: 3.5                // Neuroticism >3.5 = burnout/stress risk
    }
  }
};

/**
 * Get configuration with fallback to defaults
 * Merges project configuration with defaults
 * 
 * @param {Object} projectConfig - Project-specific configuration
 * @returns {Object} Merged configuration
 */
function getTeamSelectionConfig(projectConfig) {
  if (!projectConfig || !projectConfig.teamSelectionConfig) {
    return DEFAULT_TEAM_SELECTION_CONFIG;
  }
  
  // Deep merge project config with defaults
  return deepMerge(DEFAULT_TEAM_SELECTION_CONFIG, projectConfig.teamSelectionConfig);
}

/**
 * Deep merge two objects
 * @private
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
}

/**
 * Check if value is an object
 * @private
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Extract specific configuration section
 * 
 * @param {Object} project - Project document
 * @param {string} section - Configuration section ('phase1', 'phase2', 'cbr', 'decisionTree')
 * @returns {Object} Configuration section with defaults
 */
function getConfigSection(project, section) {
  const fullConfig = getTeamSelectionConfig(project);
  return fullConfig[section] || DEFAULT_TEAM_SELECTION_CONFIG[section];
}

/**
 * Validate configuration values
 * Ensures all weights sum to 1.0 where applicable
 * 
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validation result with errors
 */
function validateTeamSelectionConfig(config) {
  const errors = [];
  
  // Validate Phase 1 weights sum to 1.0
  if (config.phase1) {
    const phase1Sum = 
      (config.phase1.skillsWeight || 0) +
      (config.phase1.experienceWeight || 0) +
      (config.phase1.complexityWeight || 0) +
      (config.phase1.availabilityWeight || 0);
    
    if (Math.abs(phase1Sum - 1.0) > 0.01) {
      errors.push(`Phase 1 weights must sum to 1.0 (current: ${phase1Sum.toFixed(2)})`);
    }
    
    // Validate availability components
    if (config.phase1.availabilityComponents) {
      const availSum = 
        (config.phase1.availabilityComponents.hoursWeight || 0) +
        (config.phase1.availabilityComponents.startDateWeight || 0) +
        (config.phase1.availabilityComponents.travelWeight || 0) +
        (config.phase1.availabilityComponents.offHoursWeight || 0);
      
      if (Math.abs(availSum - 1.0) > 0.01) {
        errors.push(`Availability components must sum to 1.0 (current: ${availSum.toFixed(2)})`);
      }
    }
  }
  
  // Validate Phase 2 synergy weights sum to 1.0
  if (config.phase2 && config.phase2.synergyWeights) {
    const synergySum = 
      (config.phase2.synergyWeights.roleDiversityWeight || 0) +
      (config.phase2.synergyWeights.projectFitWeight || 0) +
      (config.phase2.synergyWeights.previousCollaborationsWeight || 0);
    
    if (Math.abs(synergySum - 1.0) > 0.01) {
      errors.push(`Synergy weights must sum to 1.0 (current: ${synergySum.toFixed(2)})`);
    }
  }
  
  // Validate CBR dimension weights sum to 1.0
  if (config.cbr && config.cbr.dimensionWeights) {
    const cbrSum = 
      (config.cbr.dimensionWeights.coordination || 0) +
      (config.cbr.dimensionWeights.technical || 0) +
      (config.cbr.dimensionWeights.team || 0) +
      (config.cbr.dimensionWeights.management || 0) +
      (config.cbr.dimensionWeights.organizational || 0);
    
    if (Math.abs(cbrSum - 1.0) > 0.01) {
      errors.push(`CBR dimension weights must sum to 1.0 (current: ${cbrSum.toFixed(2)})`);
    }
  }
  
  // Validate project profile weights for each personality trait
  if (config.phase2 && config.phase2.projectProfiles) {
    Object.keys(config.phase2.projectProfiles).forEach(profileName => {
      const profile = config.phase2.projectProfiles[profileName];
      const traitWeights = Object.keys(profile).map(trait => profile[trait].weight || 0);
      const sum = traitWeights.reduce((a, b) => a + b, 0);
      
      if (Math.abs(sum - 1.0) > 0.01) {
        errors.push(`${profileName} personality weights must sum to 1.0 (current: ${sum.toFixed(2)})`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get configuration summary for display to PM
 * 
 * @param {Object} project - Project document
 * @returns {Object} Human-readable configuration summary
 */
function getConfigurationSummary(project) {
  const config = getTeamSelectionConfig(project);
  
  return {
    phase1: {
      name: 'Fase 1: Coincidencia Técnica',
      description: 'Basada en distancia Manhattan para skills, experiencia, complejidad y disponibilidad',
      weights: {
        skills: `${(config.phase1.skillsWeight * 100).toFixed(0)}%`,
        experience: `${(config.phase1.experienceWeight * 100).toFixed(0)}%`,
        complexity: `${(config.phase1.complexityWeight * 100).toFixed(0)}%`,
        availability: `${(config.phase1.availabilityWeight * 100).toFixed(0)}%`
      },
      availabilityBreakdown: {
        hours: `${(config.phase1.availabilityComponents.hoursWeight * 100).toFixed(0)}%`,
        startDate: `${(config.phase1.availabilityComponents.startDateWeight * 100).toFixed(0)}%`,
        travel: `${(config.phase1.availabilityComponents.travelWeight * 100).toFixed(0)}%`,
        offHours: `${(config.phase1.availabilityComponents.offHoursWeight * 100).toFixed(0)}%`
      },
      parameters: {
        candidatePoolMultiplier: config.phase1.candidatePoolMultiplier,
        skillMatchPenalty: config.phase1.skillMatchPenalty,
        experienceNormalization: config.phase1.experienceNormalizationFactor
      }
    },
    phase2: {
      name: 'Fase 2: Optimización por Personalidad',
      description: 'Usa Big Five y análisis de sinergia de equipo',
      enabled: config.phase2.enabled,
      synergyWeights: {
        roleDiversity: `${(config.phase2.synergyWeights.roleDiversityWeight * 100).toFixed(0)}%`,
        projectFit: `${(config.phase2.synergyWeights.projectFitWeight * 100).toFixed(0)}%`,
        previousCollaborations: `${(config.phase2.synergyWeights.previousCollaborationsWeight * 100).toFixed(0)}%`
      }
    },
    cbr: {
      name: 'CBR: Razonamiento Basado en Casos',
      description: 'Predicción de riesgos basada en proyectos similares',
      dimensionWeights: {
        coordination: `${(config.cbr.dimensionWeights.coordination * 100).toFixed(0)}%`,
        technical: `${(config.cbr.dimensionWeights.technical * 100).toFixed(0)}%`,
        team: `${(config.cbr.dimensionWeights.team * 100).toFixed(0)}%`,
        management: `${(config.cbr.dimensionWeights.management * 100).toFixed(0)}%`,
        organizational: `${(config.cbr.dimensionWeights.organizational * 100).toFixed(0)}%`
      },
      parameters: {
        kSimilarCases: config.cbr.kSimilarCases,
        minSimilarity: `${(config.cbr.minSimilarityThreshold * 100).toFixed(0)}%`
      }
    },
    decisionTree: {
      name: 'Árbol de Decisión: Reglas Expertas',
      description: 'Detección de riesgos mediante reglas predefinidas',
      thresholds: config.decisionTree.riskThresholds
    }
  };
}

module.exports = {
  DEFAULT_TEAM_SELECTION_CONFIG,
  getTeamSelectionConfig,
  getConfigSection,
  validateTeamSelectionConfig,
  getConfigurationSummary
};
