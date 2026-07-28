const i18n = require('../../../i18n');
const { getConfigSection } = require('../../../config/teamSelectionDefaults');

/**
 * Classification of communication tools as synchronous or asynchronous
 */
const COMMUNICATION_TOOLS = {
  synchronous: [
    'zoom', 'microsoft teams', 'google meet', 'skype', 'webex',
    'teams', 'meet', 'video call', 'phone', 'telephone',
    'video conference', 'videoconferencia', 'llamada'
  ],
  asynchronous: [
    'slack', 'email', 'correo', 'jira', 'trello', 'asana',
    'confluence', 'notion', 'github', 'gitlab', 'discord',
    'mattermost', 'basecamp', 'monday', 'clickup'
  ]
};

// Legacy placeholder: some rule implementations still return a `recommendations` field.
// Final recommendations must be taken from the risk catalog (typicalRecommendations).
const recommendations = [];

function mergeDecisionTreeConfig(baseConfig, overrideConfig) {
  if (!overrideConfig || typeof overrideConfig !== 'object') return baseConfig;

  const merged = {
    ...baseConfig,
    ...overrideConfig
  };

  if (overrideConfig.riskThresholds && typeof overrideConfig.riskThresholds === 'object') {
    merged.riskThresholds = {
      ...(baseConfig?.riskThresholds || {}),
      ...overrideConfig.riskThresholds
    };
  }

  if (overrideConfig.personalityRiskThresholds && typeof overrideConfig.personalityRiskThresholds === 'object') {
    merged.personalityRiskThresholds = {
      ...(baseConfig?.personalityRiskThresholds || {}),
      ...overrideConfig.personalityRiskThresholds
    };
  }

  return merged;
}

function getEffectiveDecisionTreeConfig(project) {
  const configFromTeamSelection = getConfigSection(project, 'decisionTree');

  // Backward compatibility: if legacy top-level project.decisionTree exists (older DB shape)
  // and there is no custom teamSelectionConfig.decisionTree, merge legacy values on top.
  if (!project?.teamSelectionConfig?.decisionTree && project?.decisionTree) {
    return mergeDecisionTreeConfig(configFromTeamSelection, project.decisionTree);
  }

  return configFromTeamSelection;
}

/**
 * Helper function to determine the effective work mode
 * Handles inheritance from organization and resolves to one of 5 modes
 * @param {Object} project - Project document
 * @param {Object} organization - Organization document
 * @returns {string} One of: office_mode, office_first, office_remote_mix, remote_first, remote_mode
 */
function getEffectiveWorkMode(project, organization) {
  const projectMode = project?.workMode;
  
  // If project inherits or doesn't specify, use organization policy
  if (!projectMode || projectMode === 'inherit_from_organization') {
    return organization?.workModePolicy || 'office_mode';
  }
  
  return projectMode;
}

/**
 * Check if work mode is primarily remote (remote_first or remote_mode)
 * @param {string} workMode - Work mode string
 * @returns {boolean}
 */
function isRemotePredominant(workMode) {
  return workMode === 'remote_first' || workMode === 'remote_mode';
}

/**
 * Check if work mode is primarily on-site (office_mode or office_first)
 * @param {string} workMode - Work mode string
 * @returns {boolean}
 */
function isOfficePredominant(workMode) {
  return workMode === 'office_mode' || workMode === 'office_first';
}

/**
 * Helper: Classify value into 5 equal intervals
 * Returns: 'VERY HIGH', 'HIGH', 'NORMAL', 'LOW', 'VERY LOW'
 */
function classifyIntoFiveIntervals(value, min, max) {
  if (max === min) return 'NORMAL';
  
  const range = max - min;
  const intervalSize = range / 5;
  
  if (value <= min + intervalSize) return 'VERY HIGH';
  if (value <= min + 2 * intervalSize) return 'HIGH';
  if (value <= min + 3 * intervalSize) return 'NORMAL';
  if (value <= min + 4 * intervalSize) return 'LOW';
  return 'VERY LOW';
}

/**
 * Helper: Classify tool as synchronous or asynchronous
 */
function classifyTool(toolName) {
  const lowerTool = toolName?.toLowerCase() || '';
  
  if (COMMUNICATION_TOOLS.synchronous.some(t => lowerTool.includes(t))) {
    return 'synchronous';
  }
  if (COMMUNICATION_TOOLS.asynchronous.some(t => lowerTool.includes(t))) {
    return 'asynchronous';
  }
  return 'unknown';
}

/**
 * Helper: Convert risk label to severity level
 */
function labelToSeverity(label) {
  const mapping = {
    'VERY HIGH': 'high',
    'HIGH': 'medium-high',
    'NORMAL': 'medium',
    'LOW': 'low',
    'VERY LOW': 'low'
  };
  return mapping[label] || 'medium';
}

/**
 * Calculate average team experience
 */
function calculateTeamExperience(team) {
  if (!team || team.length === 0) return 2.5;
  
  // If team members have experience data
  let totalExp = 0;
  let count = 0;
  
  team.forEach(member => {
    // Assuming member has yearsOfExperience field
    if (member.yearsOfExperience) {
      totalExp += member.yearsOfExperience;
      count++;
    }
  });
  
  if (count === 0) return 2.5; // Default to mid-level
  
  const avgYears = totalExp / count;
  
  // Convert years to 1-5 scale
  if (avgYears < 1) return 1;
  if (avgYears < 3) return 2;
  if (avgYears < 5) return 3;
  if (avgYears < 8) return 4;
  return 5;
}

/**
 * Calculate technology match between project and team
 * Updated to use team analysis structure
 */
function calculateTechMatch(requiredTechs, teamAnalysis) {
  if (!requiredTechs || requiredTechs.length === 0) return 0.8;
  if (!teamAnalysis || !teamAnalysis.skills) return 0.3;
  
  const teamSkills = teamAnalysis.skills.all || [];
  if (teamSkills.length === 0) return 0.3;
  
  // Count how many required techs are covered by team
  const requiredLower = requiredTechs.map(t => t.toLowerCase());
  const matchedTechs = requiredLower.filter(reqTech =>
    teamSkills.some(skill => 
      skill.toLowerCase().includes(reqTech) || reqTech.includes(skill.toLowerCase())
    )
  );
  
  return matchedTechs.length / requiredTechs.length;
}

/**
 * Get numeric severity score
 */
function getSeverityScore(severity) {
  const scores = {
    'low': 1,
    'medium': 2,
    'medium-high': 3,
    'high': 4,
    'critical': 5
  };
  return scores[severity] || 2;
}

/**
 * Helper function to build risks directly from the centralized catalog
 * Returns ONLY the minimal risk reference (type + severity + source).
 * @param {string} riskType - The type of risk from the catalog
 * @param {object} dynamicData - Dynamic runtime data (severity, source)
 * @returns {object|null} Minimal risk reference or null if not found in catalog
 */
function buildRiskFromCatalog(riskType, dynamicData = {}) {
  const catalogEntry = i18n.getRiskMetadata(riskType);
  
  if (!catalogEntry) {
    console.warn(`Risk type '${riskType}' not found in catalog`);
    return null;
  }
  
  // Return ONLY the minimal risk reference.
  // Descriptions, recommendations, and any other metadata must be resolved from the catalog elsewhere.
  return {
    type: riskType,
    severity: dynamicData.severity || 'medium',
    source: dynamicData.source || 'expert_rules'
  };
}

/**
 * Legacy function for backward compatibility - now uses buildRiskFromCatalog
 * @deprecated Use buildRiskFromCatalog instead
 */
function enrichRiskWithCatalogMetadata(risk) {
  if (!risk || !risk.type) return risk;
  
  const catalogMetadata = i18n.getRiskMetadata(risk.type);
  if (!catalogMetadata) return risk;
  
  return {
    ...risk,
    title: catalogMetadata.title || risk.title,
    description: catalogMetadata.description || risk.description,
    category: catalogMetadata.category || risk.category,
    isHofstedeRelated: catalogMetadata.isHofstedeRelated !== undefined ? catalogMetadata.isHofstedeRelated : risk.isHofstedeRelated,
    recommendations: risk.recommendations && risk.recommendations.length > 0 
      ? risk.recommendations 
      : (catalogMetadata.typicalRecommendations || [])
  };
}

module.exports = {
  COMMUNICATION_TOOLS,
  recommendations,
  mergeDecisionTreeConfig,
  getEffectiveDecisionTreeConfig,
  getEffectiveWorkMode,
  isRemotePredominant,
  isOfficePredominant,
  classifyIntoFiveIntervals,
  classifyTool,
  labelToSeverity,
  calculateTeamExperience,
  calculateTechMatch,
  getSeverityScore,
  buildRiskFromCatalog,
  enrichRiskWithCatalogMetadata
};
