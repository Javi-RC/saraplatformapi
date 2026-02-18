/**
 * Decision Tree Service
 * Implements expert rules for risk prediction
 * Phase 1: 90% weight, Phase 4: 20-30% weight
 */

const Project = require('../models/project.model');
const User = require('../models/user.model');
const { RISK_CATALOG } = require('../config/riskCatalog');
const { getConfigSection } = require('../config/teamSelectionDefaults');

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
 * Hofstede's 6 Cultural Dimensions by Country
 * Dimensions: Power Distance (PDI), Individualism (IDV), Masculinity (MAS),
 * Uncertainty Avoidance (UAI), Long Term Orientation (LTO), Indulgence (IND)
 */
const HOFSTEDE_DIMENSIONS = {
  'spain': { PDI: 57, IDV: 51, MAS: 42, UAI: 86, LTO: 48, IND: 44 },
  'españa': { PDI: 57, IDV: 51, MAS: 42, UAI: 86, LTO: 48, IND: 44 },
  'united states': { PDI: 40, IDV: 91, MAS: 62, UAI: 46, LTO: 26, IND: 68 },
  'usa': { PDI: 40, IDV: 91, MAS: 62, UAI: 46, LTO: 26, IND: 68 },
  'germany': { PDI: 35, IDV: 67, MAS: 66, UAI: 65, LTO: 83, IND: 40 },
  'alemania': { PDI: 35, IDV: 67, MAS: 66, UAI: 65, LTO: 83, IND: 40 },
  'france': { PDI: 68, IDV: 71, MAS: 43, UAI: 86, LTO: 63, IND: 48 },
  'francia': { PDI: 68, IDV: 71, MAS: 43, UAI: 86, LTO: 63, IND: 48 },
  'united kingdom': { PDI: 35, IDV: 89, MAS: 66, UAI: 35, LTO: 51, IND: 69 },
  'uk': { PDI: 35, IDV: 89, MAS: 66, UAI: 35, LTO: 51, IND: 69 },
  'reino unido': { PDI: 35, IDV: 89, MAS: 66, UAI: 35, LTO: 51, IND: 69 },
  'china': { PDI: 80, IDV: 20, MAS: 66, UAI: 30, LTO: 87, IND: 24 },
  'india': { PDI: 77, IDV: 48, MAS: 56, UAI: 40, LTO: 51, IND: 26 },
  'japan': { PDI: 54, IDV: 46, MAS: 95, UAI: 92, LTO: 88, IND: 42 },
  'japón': { PDI: 54, IDV: 46, MAS: 95, UAI: 92, LTO: 88, IND: 42 },
  'brazil': { PDI: 69, IDV: 38, MAS: 49, UAI: 76, LTO: 44, IND: 59 },
  'brasil': { PDI: 69, IDV: 38, MAS: 49, UAI: 76, LTO: 44, IND: 59 },
  'mexico': { PDI: 81, IDV: 30, MAS: 69, UAI: 82, LTO: 24, IND: 97 },
  'méxico': { PDI: 81, IDV: 30, MAS: 69, UAI: 82, LTO: 24, IND: 97 },
  'canada': { PDI: 39, IDV: 80, MAS: 52, UAI: 48, LTO: 36, IND: 68 },
  'canadá': { PDI: 39, IDV: 80, MAS: 52, UAI: 48, LTO: 36, IND: 68 },
  'australia': { PDI: 38, IDV: 90, MAS: 61, UAI: 51, LTO: 21, IND: 71 },
  'italy': { PDI: 50, IDV: 76, MAS: 70, UAI: 75, LTO: 61, IND: 30 },
  'italia': { PDI: 50, IDV: 76, MAS: 70, UAI: 75, LTO: 61, IND: 30 },
  'netherlands': { PDI: 38, IDV: 80, MAS: 14, UAI: 53, LTO: 67, IND: 68 },
  'países bajos': { PDI: 38, IDV: 80, MAS: 14, UAI: 53, LTO: 67, IND: 68 },
  'sweden': { PDI: 31, IDV: 71, MAS: 5, UAI: 29, LTO: 53, IND: 78 },
  'suecia': { PDI: 31, IDV: 71, MAS: 5, UAI: 29, LTO: 53, IND: 78 },
  'poland': { PDI: 68, IDV: 60, MAS: 64, UAI: 93, LTO: 38, IND: 29 },
  'polonia': { PDI: 68, IDV: 60, MAS: 64, UAI: 93, LTO: 38, IND: 29 },
  'portugal': { PDI: 63, IDV: 27, MAS: 31, UAI: 104, LTO: 28, IND: 33 },
  'argentina': { PDI: 49, IDV: 46, MAS: 56, UAI: 86, LTO: 20, IND: 62 },
  'chile': { PDI: 63, IDV: 23, MAS: 28, UAI: 86, LTO: 31, IND: 68 },
  'colombia': { PDI: 67, IDV: 13, MAS: 64, UAI: 80, LTO: 13, IND: 83 },
  'peru': { PDI: 64, IDV: 16, MAS: 42, UAI: 87, LTO: 25, IND: 46 },
  'perú': { PDI: 64, IDV: 16, MAS: 42, UAI: 87, LTO: 25, IND: 46 },
  'south korea': { PDI: 60, IDV: 18, MAS: 39, UAI: 85, LTO: 100, IND: 29 },
  'corea del sur': { PDI: 60, IDV: 18, MAS: 39, UAI: 85, LTO: 100, IND: 29 },
  'russia': { PDI: 93, IDV: 39, MAS: 36, UAI: 95, LTO: 81, IND: 20 },
  'rusia': { PDI: 93, IDV: 39, MAS: 36, UAI: 95, LTO: 81, IND: 20 }
};

/**
 * Official languages by country
 */
const COUNTRY_LANGUAGES = {
  'spain': ['spanish', 'español', 'catalan', 'catalán', 'basque', 'vasco', 'galician', 'gallego'],
  'españa': ['spanish', 'español', 'catalan', 'catalán', 'basque', 'vasco', 'galician', 'gallego'],
  'united states': ['english', 'inglés'],
  'usa': ['english', 'inglés'],
  'germany': ['german', 'alemán'],
  'alemania': ['german', 'alemán'],
  'france': ['french', 'francés'],
  'francia': ['french', 'francés'],
  'united kingdom': ['english', 'inglés'],
  'uk': ['english', 'inglés'],
  'reino unido': ['english', 'inglés'],
  'china': ['chinese', 'chino', 'mandarin', 'mandarín'],
  'india': ['hindi', 'english', 'inglés'],
  'japan': ['japanese', 'japonés'],
  'japón': ['japanese', 'japonés'],
  'brazil': ['portuguese', 'portugués'],
  'brasil': ['portuguese', 'portugués'],
  'mexico': ['spanish', 'español'],
  'méxico': ['spanish', 'español'],
  'canada': ['english', 'inglés', 'french', 'francés'],
  'canadá': ['english', 'inglés', 'french', 'francés'],
  'australia': ['english', 'inglés'],
  'italy': ['italian', 'italiano'],
  'italia': ['italian', 'italiano'],
  'netherlands': ['dutch', 'holandés'],
  'países bajos': ['dutch', 'holandés'],
  'sweden': ['swedish', 'sueco'],
  'suecia': ['swedish', 'sueco'],
  'poland': ['polish', 'polaco'],
  'polonia': ['polish', 'polaco'],
  'portugal': ['portuguese', 'portugués'],
  'argentina': ['spanish', 'español'],
  'chile': ['spanish', 'español'],
  'colombia': ['spanish', 'español'],
  'peru': ['spanish', 'español'],
  'perú': ['spanish', 'español'],
  'south korea': ['korean', 'coreano'],
  'corea del sur': ['korean', 'coreano'],
  'russia': ['russian', 'ruso'],
  'rusia': ['russian', 'ruso']
};

/**
 * Standard timezone offsets by country/region (simplified, UTC hours)
 */
const TIMEZONE_OFFSETS = {
  'spain': 1, 'españa': 1,
  'united states': -5, 'usa': -5,  // Eastern (average)
  'germany': 1, 'alemania': 1,
  'france': 1, 'francia': 1,
  'united kingdom': 0, 'uk': 0, 'reino unido': 0,
  'china': 8,
  'india': 5.5,
  'japan': 9, 'japón': 9,
  'brazil': -3, 'brasil': -3,
  'mexico': -6, 'méxico': -6,
  'canada': -5, 'canadá': -5,
  'australia': 10,
  'italy': 1, 'italia': 1,
  'netherlands': 1, 'países bajos': 1,
  'sweden': 1, 'suecia': 1,
  'poland': 1, 'polonia': 1,
  'portugal': 0,
  'argentina': -3,
  'chile': -4,
  'colombia': -5,
  'peru': -5, 'perú': -5,
  'south korea': 9, 'corea del sur': 9,
  'russia': 3, 'rusia': 3
};

/**
 * Helper: Calculate time overlap in hours between two countries
 */
function calculateTimeOverlap(country1, country2) {
  const offset1 = TIMEZONE_OFFSETS[country1?.toLowerCase()] || 0;
  const offset2 = TIMEZONE_OFFSETS[country2?.toLowerCase()] || 0;
  const difference = Math.abs(offset1 - offset2);
  
  // Standard work hours are 8 hours (9am to 5pm)
  // Overlap = 8 - difference (but minimum 0, maximum 8)
  const overlap = Math.max(0, Math.min(8, 8 - difference));
  return overlap;
}

/**
 * Helper: Calculate cultural distance between two countries using Hofstede dimensions
 */
function calculateCulturalDistance(country1, country2) {
  const dims1 = HOFSTEDE_DIMENSIONS[country1?.toLowerCase()];
  const dims2 = HOFSTEDE_DIMENSIONS[country2?.toLowerCase()];
  
  if (!dims1 || !dims2) return null;
  
  // Calculate Euclidean distance across 6 dimensions
  const distance = Math.sqrt(
    Math.pow(dims1.PDI - dims2.PDI, 2) +
    Math.pow(dims1.IDV - dims2.IDV, 2) +
    Math.pow(dims1.MAS - dims2.MAS, 2) +
    Math.pow(dims1.UAI - dims2.UAI, 2) +
    Math.pow(dims1.LTO - dims2.LTO, 2) +
    Math.pow(dims1.IND - dims2.IND, 2)
  );
  
  return distance;
}

/**
 * Helper: Calculate binomial coefficient (nCr)
 */
function binomialCoefficient(n, r) {
  if (r > n) return 0;
  if (r === 0 || r === n) return 1;
  
  let result = 1;
  for (let i = 0; i < r; i++) {
    result *= (n - i);
    result /= (i + 1);
  }
  return Math.round(result);
}

/**
 * Helper: Classify value into 5 equal intervals
 * Returns: 'MUY ALTO', 'ALTO', 'NORMAL', 'BAJO', 'MUY BAJO'
 */
function classifyIntoFiveIntervals(value, min, max) {
  if (max === min) return 'NORMAL';
  
  const range = max - min;
  const intervalSize = range / 5;
  
  if (value <= min + intervalSize) return 'MUY ALTO';
  if (value <= min + 2 * intervalSize) return 'ALTO';
  if (value <= min + 3 * intervalSize) return 'NORMAL';
  if (value <= min + 4 * intervalSize) return 'BAJO';
  return 'MUY BAJO';
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
    'MUY ALTO': 'high',
    'ALTO': 'medium-high',
    'NORMAL': 'medium',
    'BAJO': 'low',
    'MUY BAJO': 'low'
  };
  return mapping[label] || 'medium';
}

/**
 * Main prediction function - applies all expert rules
 */
async function predictRisksWithRules(project, team, organization, otherProjects = []) {
  let risks = [];
  let enrichedRisks = [];
  
  try {
    // IMPORTANT: Expert rules read thresholds from project.decisionTree.*.
    // The PM-editable configuration is stored in project.teamSelectionConfig.decisionTree.
    // We inject an effective decisionTree config (defaults + overrides) for consistent reads.
    const projectForRules = Object.create(project || null);
    projectForRules.decisionTree = getEffectiveDecisionTreeConfig(project);

    const safeRunRule = (ruleName, fn) => {
      try {
        return fn();
      } catch (error) {
        console.warn(`[DecisionTree] Rule failed (${ruleName}): ${error.message}`);
        return null;
      }
    };

    // Apply all existing expert rules
    const communicationRisk = safeRunRule('checkCommunicationRisk', () => checkCommunicationRisk(projectForRules, team));
    if (communicationRisk) risks.push(communicationRisk);
    
    const skillGapRisk = safeRunRule('checkSkillGapRisk', () => checkSkillGapRisk(projectForRules, team));
    if (skillGapRisk) risks.push(skillGapRisk);
    
    const overloadRisk = await safeRunRule('checkTeamOverloadRisk', () => checkTeamOverloadRisk(projectForRules, team, otherProjects));
    if (overloadRisk) risks.push(overloadRisk);
    
    const dependencyRisk = safeRunRule('checkDependencyRisk', () => checkDependencyRisk(projectForRules));
    if (dependencyRisk) risks.push(dependencyRisk);
    
    const scopeRisk = safeRunRule('checkScopeCreepRisk', () => checkScopeCreepRisk(projectForRules));
    if (scopeRisk) risks.push(scopeRisk);
    
    const processRisk = safeRunRule('checkProcessRisk', () => checkProcessRisk(projectForRules, team));
    if (processRisk) risks.push(processRisk);

    // Apply NEW enhanced expert rules
    const kmRisk = safeRunRule('checkKnowledgeManagementRisk', () => checkKnowledgeManagementRisk(projectForRules, team, organization));
    if (kmRisk) risks.push(kmRisk);

    const remoteWorkRisk = safeRunRule('checkRemoteWorkSupportRisk', () => checkRemoteWorkSupportRisk(projectForRules, team, organization));
    if (remoteWorkRisk) risks.push(remoteWorkRisk);

    const roleClarityRisk = safeRunRule('checkRoleClarityRisk', () => checkRoleClarityRisk(projectForRules, team));
    if (roleClarityRisk) risks.push(roleClarityRisk);

    const timezoneSchedulingRisk = safeRunRule('checkTimezoneSchedulingRisk', () => checkTimezoneSchedulingRisk(projectForRules, team));
    if (timezoneSchedulingRisk) risks.push(timezoneSchedulingRisk);

    const conflictRisk = safeRunRule('checkConflictEscalationRisk', () => checkConflictEscalationRisk(projectForRules, team));
    if (conflictRisk) risks.push(conflictRisk);

    const changeResistanceRisk = safeRunRule('checkChangeResistanceRisk', () => checkChangeResistanceRisk(projectForRules, team));
    if (changeResistanceRisk) risks.push(changeResistanceRisk);

    const burnoutRisk = safeRunRule('checkBurnoutSusceptibilityRisk', () => checkBurnoutSusceptibilityRisk(projectForRules, team));
    if (burnoutRisk) risks.push(burnoutRisk);

    const onboardingRisk = safeRunRule('checkOnboardingIssues', () => checkOnboardingIssues(projectForRules, team, organization));
    if (onboardingRisk) risks.push(onboardingRisk);

    const socialIsolationRisk = safeRunRule('checkSocialIsolation', () => checkSocialIsolation(projectForRules, team, organization));
    if (socialIsolationRisk) risks.push(socialIsolationRisk);

    const digitalFatigueRisk = safeRunRule('checkDigitalFatigue', () => checkDigitalFatigue(projectForRules, team, organization));
    if (digitalFatigueRisk) risks.push(digitalFatigueRisk);

    const workLifeBlurRisk = safeRunRule('checkWorkLifeBoundaryBlur', () => checkWorkLifeBoundaryBlur(projectForRules, team, organization));
    if (workLifeBlurRisk) risks.push(workLifeBlurRisk);

    const meetingFatigueRisk = safeRunRule('checkMeetingFatigue', () => checkMeetingFatigue(projectForRules, team, organization));
    if (meetingFatigueRisk) risks.push(meetingFatigueRisk);

    const technostressRisk = safeRunRule('checkTechnostressOverload', () => checkTechnostressOverload(projectForRules, team, organization));
    if (technostressRisk) risks.push(technostressRisk);

    const toolFragmentationRisk = safeRunRule('checkToolFragmentation', () => checkToolFragmentation(projectForRules, team, organization));
    if (toolFragmentationRisk) risks.push(toolFragmentationRisk);
    
    // Apply NEW Hofstede-based expert rules
    const culturalDistanceRisk = safeRunRule('checkCulturalDistanceRisk', () => checkCulturalDistanceRisk(projectForRules, team));
    if (culturalDistanceRisk) risks.push(culturalDistanceRisk);
    
    const linguisticDistanceRisk = safeRunRule('checkLinguisticDistanceRisk', () => checkLinguisticDistanceRisk(projectForRules, team));
    if (linguisticDistanceRisk) risks.push(linguisticDistanceRisk);
    
    const autonomyRisk = safeRunRule('checkTeamAutonomyRisk', () => checkTeamAutonomyRisk(projectForRules, team));
    if (autonomyRisk) risks.push(autonomyRisk);
    
    const flexibilityRisk = safeRunRule('checkScheduleFlexibilityRisk', () => checkScheduleFlexibilityRisk(projectForRules, team));
    if (flexibilityRisk) risks.push(flexibilityRisk);
    
    const travelRisk = safeRunRule('checkTravelAvailabilityRisk', () => checkTravelAvailabilityRisk(projectForRules, team));
    if (travelRisk) risks.push(travelRisk);
    
    // Normalize all risks strictly from the catalog (single source of truth)
    // Important: this strips any extra fields that are not in the catalog.
    enrichedRisks = risks
      .map((risk) => {
        if (!risk?.type) return null;
        return buildRiskFromCatalog(risk.type, {
          severity: risk.severity,
          source: risk.source
        });
      })
      .filter(Boolean);
    
    // Sort by severity (DT indicators don't have similarity)
    enrichedRisks.sort((a, b) => {
      const scoreA = getSeverityScore(a.severity);
      const scoreB = getSeverityScore(b.severity);
      return scoreB - scoreA;
    });
    
  } catch (error) {
    console.error('Error applying expert rules:', error);
    throw new Error(`Decision tree prediction failed: ${error.message}`);
  }
  
  return enrichedRisks;
}

/**
 * NEW RULE: Conflict Escalation Risk (Personality-driven)
 * Detects elevated likelihood of interpersonal conflict affecting delivery.
 * Uses Big Five agreeableness (low average or high variance) as the core signal.
 */
function checkConflictEscalationRisk(project, teamAnalysis) {
  const personality = teamAnalysis?.personality;
  const traits = personality?.traits;
  const agreeableness = traits?.Agreeableness;

  if (!personality?.available || !agreeableness) return null;

  const personalityThresholds = project?.decisionTree?.personalityRiskThresholds || {};
  const agreeablenessLowThreshold = personalityThresholds.agreeablenessLow ?? 2.5;
  const agreeablenessVarianceHighThreshold = personalityThresholds.agreeablenessVarianceHigh ?? 1.5;

  const indicators = [];
  let riskScore = 0;
  let severity = 'low';

  const avg = Number(agreeableness.average);
  const variance = Number(agreeableness.variance);

  // Core personality signals
  if (Number.isFinite(avg) && avg < agreeablenessLowThreshold) {
    riskScore += 4;  }

  if (Number.isFinite(variance) && variance > agreeablenessVarianceHighThreshold) {
    riskScore += 3;  }

  // Context amplifiers (keep lightweight)
  const culturalDiversity = project?.culturalDiversityLevel || 'low';
  const involvedTeams = Array.isArray(project?.involvedTeams) ? project.involvedTeams.length : 0;
  const criticalDependencies = Array.isArray(project?.criticalDependencies) ? project.criticalDependencies.length : 0;

  if (culturalDiversity === 'high') {
    riskScore += 1;  }

  if (involvedTeams >= 3) {
    riskScore += 1;  }

  if (criticalDependencies >= 3) {
    riskScore += 1;  }

  if (riskScore >= 7) {
    severity = 'high';
  } else if (riskScore >= 5) {
    severity = 'medium-high';
  } else if (riskScore >= 3) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  indicators.push(`Agreeableness avg: ${Number.isFinite(avg) ? avg.toFixed(2) : 'N/A'}`);
  indicators.push(`Agreeableness variance: ${Number.isFinite(variance) ? variance.toFixed(2) : 'N/A'}`);
  indicators.push(`Cultural diversity: ${culturalDiversity}`);
  indicators.push(`Involved teams: ${involvedTeams}`);
  indicators.push(`Critical dependencies: ${criticalDependencies}`);

  return buildRiskFromCatalog('conflict_escalation_risk', {
    severity,
    source: 'expert_rules_big_five',
    indicators
  });
}

/**
 * NEW RULE: Change Resistance Risk (Personality-driven)
 * Detects likely resistance to adopting new tech/processes, increasing process mismatch and learning risks.
 */
/**
 * RULE: Change Resistance Risk (Risk 19)
 * Detects resistance to change from low openness and multiple new technologies
 * Thresholds:
 * - lowOpennessThreshold: Openness score below triggers risk (default 2.5)
 * - highComplexityRiskScore, specializedToolsRiskScore, missingTechRiskScore, experienceGapRiskScore
 * - changeResistanceRiskScoreHigh: HIGH severity threshold (default 7)
 */
function checkChangeResistanceRisk(project, teamAnalysis) {
  const complexity = project?.complexity || 'medium';
  const lowOpennessThreshold = project?.decisionTree?.riskThresholds?.lowOpennessThreshold ?? 2.5;
  const highComplexityRiskScore = project?.decisionTree?.riskThresholds?.highComplexityRiskScore ?? 1;
  const specializedToolsRiskScore = project?.decisionTree?.riskThresholds?.specializedToolsRiskScore ?? 1;
  const missingTechRiskScore = project?.decisionTree?.riskThresholds?.missingTechRiskScore ?? 1;
  const experienceGapRiskScore = project?.decisionTree?.riskThresholds?.experienceGapRiskScore ?? 1;
  const changeResistanceRiskScoreHigh = project?.decisionTree?.riskThresholds?.changeResistanceRiskScoreHigh ?? 7;

  const personality = teamAnalysis?.personality;
  const traits = personality?.traits;
  const openness = traits?.Openness;

  if (!personality?.available || !openness) return null;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 5;

  const avgOpenness = Number(openness.average);
  
  // Condition 1: Low openness
  if (Number.isFinite(avgOpenness) && avgOpenness < lowOpennessThreshold) {
    riskScore += 4;
    dataPoints++;
  } else if (Number.isFinite(avgOpenness)) {
    dataPoints++;
  }

  // Condition 2: Multiple new technologies
  const experienceLevel = project?.requiredExperienceLevel || 'mid';
  const requiresTools = project?.requiresSpecializedTools?.needed || false;
  const techMissing = teamAnalysis?.technicalMatch?.missing?.length || 0;
  
  if (experienceLevel === 'expert' || experienceLevel === 'senior') {
    riskScore += highComplexityRiskScore;  }
  dataPoints++;

  // Condition 3: Methodological changes (specialized tools)
  if (requiresTools) {
    riskScore += specializedToolsRiskScore;  }
  dataPoints++;

  if (techMissing > 0) {
    const points = techMissing * missingTechRiskScore;
    riskScore += points;  }
  dataPoints++;

  // Condition 4: Experience gap
  const experienceGap = Number(teamAnalysis?.experienceMatch?.gap || 0);
  if (Number.isFinite(experienceGap) && experienceGap > 0) {
    riskScore += experienceGapRiskScore;
  }

  // Determine severity
  if (riskScore >= changeResistanceRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 5) {
    severity = 'medium-high';
  } else if (riskScore >= 3) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  const recommendations = [];
  // Only user-specified recommendations
  recommendations.push('Limitar cambios simultáneos');

  const confidence = dataPoints / totalDataPoints;

  return {
    type: 'change_resistance_risk',
    title: 'Change Resistance Risk',
    description: `Openness: ${Number.isFinite(avgOpenness) ? avgOpenness.toFixed(2) : 'N/A'} (threshold: ${lowOpennessThreshold}). ${techMissing} missing technologies. ${requiresTools ? 'Specialized tools required.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_big_five',
    thresholdDetails: {
      riskScore,
      changeResistanceRiskScoreHigh,
      avgOpenness: Number.isFinite(avgOpenness) ? avgOpenness : null,
      lowOpennessThreshold,
      techMissing,
      missingTechRiskScore
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Openness: ${Number.isFinite(avgOpenness) ? avgOpenness.toFixed(2) : 'N/A'}`,
      `Risk score: ${riskScore}/${changeResistanceRiskScoreHigh}`,
      `Complexity: ${complexity}`,
      `Missing tech: ${techMissing}`,
      `Experience gap: ${experienceGap}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 5, max: 25, description: 'Delays from low adoption, process friction' },
      budgetOverrun: { min: 5, max: 20, description: 'Extra training and efficiency loss' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Rejection of agreed practices', threshold: '> 2 incidents / sprint', checkFrequency: 'per sprint' },
      { signal: 'Low tooling adoption', threshold: '< 70% usage', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE: Burnout Susceptibility Risk (Risk 20)
 * Detects burnout risk from high neuroticism, high workload, and no work-life balance
 * Thresholds:
 * - highNeuroticismThreshold: Neuroticism above triggers risk (default 3.5)
 * - overloadRiskScore, highWorkloadHoursThreshold, moderateWorkloadRiskScore, lowSyncOverlapRiskScore
 * - burnoutRiskScoreHigh: HIGH severity threshold (default 7)
 */
function checkBurnoutSusceptibilityRisk(project, teamAnalysis) {
  const highNeuroticismThreshold = project?.decisionTree?.riskThresholds?.highNeuroticismThreshold ?? 3.5;
  const overloadRiskScore = project?.decisionTree?.riskThresholds?.overloadRiskScore ?? 2;
  const highWorkloadHoursThreshold = project?.decisionTree?.riskThresholds?.highWorkloadHoursThreshold ?? 45;
  const moderateWorkloadRiskScore = project?.decisionTree?.riskThresholds?.moderateWorkloadRiskScore ?? 1;
  const lowSyncOverlapRiskScore = project?.decisionTree?.riskThresholds?.lowSyncOverlapRiskScore ?? 1;
  const burnoutRiskScoreHigh = project?.decisionTree?.riskThresholds?.burnoutRiskScoreHigh ?? 7;

  const personality = teamAnalysis?.personality;
  const traits = personality?.traits;
  const neuroticism = traits?.Neuroticism;

  if (!personality?.available || !neuroticism) return null;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 4;

  const avgNeuroticism = Number(neuroticism.average);
  
  // Condition 1: High neuroticism
  if (Number.isFinite(avgNeuroticism) && avgNeuroticism > highNeuroticismThreshold) {
    riskScore += 4;
    dataPoints++;
  } else if (Number.isFinite(avgNeuroticism)) {
    dataPoints++;
  }

  // Condition 2: High workload
  const workload = teamAnalysis?.workload;
  const avgHours = Number(workload?.avgHoursPerWeek ?? project?.weeklyHoursPerMember ?? 40);
  const overloaded = Boolean(workload?.isOverloaded);

  if (overloaded) {
    riskScore += overloadRiskScore;    dataPoints++;
  } else if (Number.isFinite(avgHours)) {
    if (avgHours > highWorkloadHoursThreshold) {
      riskScore += 2;
    } else if (avgHours > 40) {
      riskScore += moderateWorkloadRiskScore;
    }
    dataPoints++;
  }

  // Condition 3: No work-life balance (sync required with low overlap)
  const overlap = project?.expectedTimeOverlap?.value;
  const requiresSync = project?.requiresSynchronousCommunication;
  if (requiresSync === 'yes' && Number.isFinite(Number(overlap)) && Number(overlap) < 4) {
    riskScore += lowSyncOverlapRiskScore;    dataPoints++;
  } else if (requiresSync) {
    dataPoints++;
  }

  // Condition 4: Sustained pressure (long hours)
  if (Number.isFinite(avgHours) && avgHours > highWorkloadHoursThreshold) {
    dataPoints++;
  }

  // Determine severity
  if (riskScore >= burnoutRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 5) {
    severity = 'medium-high';
  } else if (riskScore >= 3) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  const recommendations = [];
  // Only user-specified recommendations
  recommendations.push('Definir límites claros de carga de trabajo');
  const confidence = dataPoints / totalDataPoints;

  return {
    type: 'burnout_susceptibility',
    title: 'Burnout Susceptibility',
    description: `Neuroticism: ${Number.isFinite(avgNeuroticism) ? avgNeuroticism.toFixed(2) : 'N/A'} (threshold: ${highNeuroticismThreshold}). Workload: ${Number.isFinite(avgHours) ? avgHours.toFixed(1) : 'N/A'}h/week. ${overloaded ? 'Team overloaded.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_big_five',
    thresholdDetails: {
      riskScore,
      burnoutRiskScoreHigh,
      avgNeuroticism: Number.isFinite(avgNeuroticism) ? avgNeuroticism : null,
      highNeuroticismThreshold,
      avgHours: Number.isFinite(avgHours) ? avgHours : null,
      highWorkloadHoursThreshold
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Neuroticism: ${Number.isFinite(avgNeuroticism) ? avgNeuroticism.toFixed(2) : 'N/A'}`,
      `Risk score: ${riskScore}/${burnoutRiskScoreHigh}`,
      `Hours/week: ${Number.isFinite(avgHours) ? avgHours.toFixed(1) : 'N/A'}`,
      `Overloaded: ${overloaded ? 'Yes' : 'No'}`,
      `Requires sync: ${requiresSync || 'unknown'}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 3, max: 25, description: 'Performance drop, absences, turnover' },
      budgetOverrun: { min: 5, max: 25, description: 'Turnover and replacement costs' },
      qualityImpact: 'high',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Increase in absences', threshold: '> 1 / month', checkFrequency: 'monthly' },
      { signal: 'Sustained overtime', threshold: '> 2 weeks', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE: Onboarding Issues (Risk 22)
 * Detects onboarding problems from high percentage of new members without support
 * Thresholds:
 * - newMembersPercentageThreshold: Percentage threshold for risk (default 0.3 = 30%)
 * - noMentoringRiskScore, noOnboardingDocsRiskScore, noIntroMeetingsRiskScore, remoteOnboardingRiskScore
 * - onboardingRiskScoreHigh: HIGH severity threshold (default 7)
 */
function checkOnboardingIssues(project, teamAnalysis, organization) {
  const newMembersPercentageThreshold = project?.decisionTree?.riskThresholds?.newMembersPercentageThreshold ?? 0.3;
  const noMentoringRiskScore = project?.decisionTree?.riskThresholds?.noMentoringRiskScore ?? 2;
  const noOnboardingDocsRiskScore = project?.decisionTree?.riskThresholds?.noOnboardingDocsRiskScore ?? 2;
  const noIntroMeetingsRiskScore = project?.decisionTree?.riskThresholds?.noIntroMeetingsRiskScore ?? 1;
  const remoteOnboardingRiskScore = project?.decisionTree?.riskThresholds?.remoteOnboardingRiskScore ?? 2;
  const onboardingRiskScoreHigh = project?.decisionTree?.riskThresholds?.onboardingRiskScoreHigh ?? 7;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 5;

  const team = teamAnalysis?.members || [];
  const newMembers = team.filter(m => {
    const experience = m.profile?.experience?.totalYears || 0;
    return experience < 2;
  });
  
  const newMembersCount = newMembers.length;
  const teamSize = project.teamSize || 0;
  const newMembersRatio = teamSize > 0 ? newMembersCount / teamSize : 0;
  
  // Condition 1: >30% new members
  if (!Number.isFinite(newMembersRatio) || newMembersRatio < newMembersPercentageThreshold) {
    return null;
  }
  dataPoints++;

  riskScore += Math.floor((newMembersRatio - newMembersPercentageThreshold) * 10);
  
  // Condition 2: Inadequate onboarding
  const hasMentoring = Boolean(project.hasMentoringProgram);
  const hasWelcomePack = Boolean(organization?.hasWelcomePack);
  const hasOnboardingDocs = Boolean(organization?.hasOnboardingDocumentation);
  const hasIntroMeetings = Boolean(project.hasIntroductoryMeetings);
  
  if (!hasMentoring) {
    riskScore += noMentoringRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }
  
  if (!hasWelcomePack && !hasOnboardingDocs) {
    riskScore += noOnboardingDocsRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }
  
  if (!hasIntroMeetings) {
    riskScore += noIntroMeetingsRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }
  
  // Condition 3: High complexity
  const complexity = project.complexity || 'medium';
  if ((complexity === 'high' || complexity === 'very-high') && !hasMentoring) {
    riskScore += 2;  }
  
  // Condition 4: Remote work
  const workMode = project.workMode;
  if (workMode === 'remote' || workMode === 'remote-first') {
    riskScore += remoteOnboardingRiskScore;    dataPoints++;
    
    if (!hasMentoring) {
      riskScore += 1;    }
  } else if (workMode) {
    dataPoints++;
  }
  
  // Determine severity
  if (riskScore >= onboardingRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 5) {
    severity = 'medium-high';
  } else if (riskScore >= 3) {
    severity = 'medium';
  }
  
  if (severity === 'low') return null;
  
  // Only user-specified recommendations  
  const confidence = dataPoints / totalDataPoints;
  
  return {
    type: 'onboarding_issues',
    title: 'Onboarding Issues',
    description: `${(newMembersRatio * 100).toFixed(0)}% new members (threshold: ${(newMembersPercentageThreshold * 100).toFixed(0)}%). ${!hasMentoring ? 'No mentoring.' : ''} ${workMode === 'remote' ? 'Remote mode.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore,
      onboardingRiskScoreHigh,
      newMembersRatio,
      newMembersPercentageThreshold,
      hasMentoring,
      hasOnboardingDocs: hasWelcomePack || hasOnboardingDocs
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `New members: ${newMembersCount}/${teamSize}`,
      `Risk score: ${riskScore}/${onboardingRiskScoreHigh}`,
      `Has mentoring: ${hasMentoring ? 'Yes' : 'No'}`,
      `Has docs: ${hasWelcomePack || hasOnboardingDocs ? 'Yes' : 'No'}`,
      `Work mode: ${workMode || 'unknown'}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 15, max: 40, description: 'Slow ramp-up and rework' },
      budgetOverrun: { min: 10, max: 30, description: 'Extra training time' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium-high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Onboarding time > 2 weeks', threshold: 'per member', checkFrequency: 'per new member' },
      { signal: 'Repeated basic questions', threshold: '> 5 per week', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE: Social Isolation (Risk 23)
 * Detects risk of team disconnection from remote work without social integration
 * Thresholds:
 * - remoteWorkPercentageForIsolation: Remote work % threshold (default 0.7 = 70%)
 * - fullRemoteIsolationRiskScore, noTeamBuildingRiskScore, noFaceToFaceMeetingRiskScore, noSocialChannelsRiskScore
 * - isolationRiskScoreHigh: HIGH severity threshold (default 8)
 */
function checkSocialIsolation(project, teamAnalysis, organization) {
  const remoteWorkPercentageForIsolation = project?.decisionTree?.riskThresholds?.remoteWorkPercentageForIsolation ?? 0.7;
  const fullRemoteIsolationRiskScore = project?.decisionTree?.riskThresholds?.fullRemoteIsolationRiskScore ?? 4;
  const noTeamBuildingRiskScore = project?.decisionTree?.riskThresholds?.noTeamBuildingRiskScore ?? 2;
  const noFaceToFaceMeetingRiskScore = project?.decisionTree?.riskThresholds?.noFaceToFaceMeetingRiskScore ?? 2;
  const noSocialChannelsRiskScore = project?.decisionTree?.riskThresholds?.noSocialChannelsRiskScore ?? 1;
  const isolationRiskScoreHigh = project?.decisionTree?.riskThresholds?.isolationRiskScoreHigh ?? 8;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 5;
  const recommendations = [];

  const workMode = getEffectiveWorkMode(project, organization);
  const remotePercentage = project.remoteWorkPercentage || 0;
  const hasTeamBuilding = Boolean(project.hasTeamBuildingActivities || organization?.hasTeamBuildingActivities);
  const hasAnnualMeeting = Boolean(organization?.hasAnnualFaceToFaceMeeting);
  const hasSocialChannels = Boolean(organization?.hasSocialCommunicationChannels);
  const hasPriorExperience = Boolean(project.teamHasPriorExperience);
  
  // Condition 1: >70% remote work or remote_mode/remote_first
  if (isRemotePredominant(workMode) || remotePercentage >= remoteWorkPercentageForIsolation) {
    riskScore += fullRemoteIsolationRiskScore;
    dataPoints++;
  } else if (workMode) {
    dataPoints++;
  }
  
  // Condition 2: No prior face-to-face communication
  if (!hasAnnualMeeting && (isRemotePredominant(workMode) || remotePercentage >= remoteWorkPercentageForIsolation)) {
    riskScore += noFaceToFaceMeetingRiskScore;
    dataPoints++;
  } else {
    dataPoints++;
  }
  
  // Condition 3: No prior experience working together
  if (!hasPriorExperience) {
    riskScore += 1;    dataPoints++;
  } else {
    dataPoints++;
  }
  
  // Condition 4: No team building activities
  if (!hasTeamBuilding) {
    riskScore += noTeamBuildingRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }
  
  if (!hasSocialChannels) {
    riskScore += noSocialChannelsRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }
  
  // Determine severity
  if (riskScore >= isolationRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 6) {
    severity = 'medium-high';
  } else if (riskScore >= 4) {
    severity = 'medium';
  }
  
  if (severity === 'low') return null;

  const confidence = dataPoints / totalDataPoints;
  
  return {
    type: 'social_isolation',
    title: 'Team Social Isolation',
    description: `${(remotePercentage * 100).toFixed(0)}% remote work (threshold: ${(remoteWorkPercentageForIsolation * 100).toFixed(0)}%). ${!hasTeamBuilding ? 'No team building.' : ''} ${!hasSocialChannels ? 'No social channels.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore,
      isolationRiskScoreHigh,
      remotePercentage,
      remoteWorkPercentageForIsolation,
      hasTeamBuilding,
      hasSocialChannels
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Remote work: ${(remotePercentage * 100).toFixed(0)}%`,
      `Risk score: ${riskScore}/${isolationRiskScoreHigh}`,
      `Team building: ${hasTeamBuilding ? 'Yes' : 'No'}`,
      `Social channels: ${hasSocialChannels ? 'Yes' : 'No'}`,
      `Prior experience: ${hasPriorExperience ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 5, max: 20, description: 'Low morale reduces productivity' },
      budgetOverrun: { min: 8, max: 25, description: 'Possible turnover costs' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Low social meeting participation', threshold: '< 50%', checkFrequency: 'per event' },
      { signal: 'Complaints about disconnection', threshold: '> 2 per month', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * RULE: Digital Fatigue (Risk 24)
 * Detects cognitive exhaustion from remote work, excessive video calls, and constant digital interaction
 * Thresholds:
 * - excessiveMeetingsThreshold: Weekly meetings threshold (default 15)
 * - longMeetingDurationThreshold: Meeting duration threshold in minutes (default 90)
 * - excessiveMeetingsRiskScore, longMeetingsRiskScore, noDisconnectionPolicyRiskScore
 * - digitalFatigueRiskScoreHigh: HIGH severity threshold (default 9)
 */
function checkDigitalFatigue(project, teamAnalysis, organization) {
  const excessiveMeetingsThreshold = project?.decisionTree?.riskThresholds?.excessiveMeetingsThreshold ?? 15;
  const longMeetingDurationThreshold = project?.decisionTree?.riskThresholds?.longMeetingDurationThreshold ?? 90;
  const excessiveMeetingsRiskScore = project?.decisionTree?.riskThresholds?.excessiveMeetingsRiskScore ?? 4;
  const longMeetingsRiskScore = project?.decisionTree?.riskThresholds?.longMeetingsRiskScore ?? 3;
  const noDisconnectionPolicyRiskScore = project?.decisionTree?.riskThresholds?.noDisconnectionPolicyRiskScore ?? 2;
  const digitalFatigueRiskScoreHigh = project?.decisionTree?.riskThresholds?.digitalFatigueRiskScoreHigh ?? 9;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 4;

  const weeklyMeetings = project.weeklyMeetingsCount || 0;
  const avgMeetingDuration = project.averageMeetingDuration || 60;
  const workMode = project.workMode;
  const hasDisconnectionPolicy = Boolean(organization?.hasDisconnectionPolicy);

  // Condition 1: 100% remote work
  if (workMode === 'remote') {
    riskScore += 2;    dataPoints++;
  } else if (workMode) {
    dataPoints++;
  }

  // Condition 2: Excessive video calls
  if (weeklyMeetings > excessiveMeetingsThreshold) {
    riskScore += excessiveMeetingsRiskScore;
    dataPoints++;
  } else if (weeklyMeetings > 0) {
    dataPoints++;
  }

  if (avgMeetingDuration > longMeetingDurationThreshold) {
    riskScore += longMeetingsRiskScore;
    dataPoints++;
  } else if (avgMeetingDuration > 0) {
    dataPoints++;
  }

  // Condition 3: Constant digital interaction (no disconnection policy)
  if (!hasDisconnectionPolicy) {
    riskScore += noDisconnectionPolicyRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }

  // Determine severity
  if (riskScore >= digitalFatigueRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 6) {
    severity = 'medium-high';
  } else if (riskScore >= 4) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  // Only user-specified recommendations
  const confidence = dataPoints / totalDataPoints;

  return {
    type: 'digital_fatigue',
    title: 'Digital Fatigue',
    description: `${weeklyMeetings} meetings/week (threshold: ${excessiveMeetingsThreshold}). ${workMode === 'remote' ? '100% remote.' : ''} ${!hasDisconnectionPolicy ? 'No disconnection policy.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore,
      digitalFatigueRiskScoreHigh,
      weeklyMeetings,
      excessiveMeetingsThreshold,
      avgMeetingDuration,
      longMeetingDurationThreshold
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Weekly meetings: ${weeklyMeetings}`,
      `Risk score: ${riskScore}/${digitalFatigueRiskScoreHigh}`,
      `Avg duration: ${avgMeetingDuration}min`,
      `Work mode: ${workMode || 'unknown'}`,
      `Disconnection policy: ${hasDisconnectionPolicy ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 8, max: 25, description: 'Fatigue reduces productivity' },
      budgetOverrun: { min: 5, max: 20, description: 'Efficiency loss from exhaustion' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Complaints about excess meetings', threshold: '> 3 per month', checkFrequency: 'monthly' },
      { signal: 'Low meeting participation', threshold: 'subjective', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE 1: Communication Risk
 * Implements the new communication risk calculation based on:
 * - Time overlap between countries
 * - Synchronous vs asynchronous communication tools
 * - Uses binomial coefficient formula for score calculation
 * CONFIGURABLE: PM can set minTimeOverlapHours and normalOverlapHours thresholds
 */
function checkCommunicationRisk(project, teamAnalysis) {  const indicators = [];
  let riskScore = 0;
  
  // Get configurable thresholds from project, with defaults as fallback
  const riskThresholds = project.decisionTree?.riskThresholds || {};
  const minTimeOverlapHours = (riskThresholds.minTimeOverlapHours ?? 2);     // ≤2h = async required
  const normalOverlapHours = (riskThresholds.normalOverlapHours ?? 6);       // ≥6h = sync preferred
  
  // Get countries involved
  const involvedCountries = project.involvedCountries || [];
  
  if (!involvedCountries || involvedCountries.length === 0) {
    return null; // No country data, cannot calculate
  }
  
  // Get communication tools
  const communicationTools = project.communicationTools || [];
  const numTools = communicationTools.length;
  
  if (numTools === 0) {    indicators.push('Communication tools: 0');
    
    return {
      type: 'communication_tools_missing',
      title: 'Communication Tools Not Defined',
      description: 'Project does not have defined communication tools',
      category: 'coordination',
      severity: 'medium',
      source: 'expert_rules_hofstede',
    indicators,
      recommendations,
      predictedImpact: {
        scheduleDelay: { min: 5, max: 15, description: 'Coordination delays' },
        budgetOverrun: { min: 5, max: 15, description: 'Communication inefficiency' },
        qualityImpact: 'medium',
        teamMoraleImpact: 'medium'
      },
      earlyWarningSignals: [
        { signal: 'Communication breakdowns', threshold: '> 2 per week', checkFrequency: 'weekly' }
      ]
    };
  }
  
  // Calculate scores for each pair of countries
  let totalScore = 0;
  const countryPairs = [];
  
  for (let i = 0; i < involvedCountries.length; i++) {
    for (let j = i + 1; j < involvedCountries.length; j++) {
      const country1 = involvedCountries[i];
      const country2 = involvedCountries[j];
      const overlap = calculateTimeOverlap(country1, country2);
      
      let pairScore = 0;
      
      // Count synchronous and asynchronous tools
      let syncCount = 0;
      let asyncCount = 0;
      
      communicationTools.forEach(tool => {
        const type = classifyTool(tool);
        if (type === 'synchronous') syncCount++;
        else if (type === 'asynchronous') asyncCount++;
      });
      
      // Apply scoring rules based on overlap (using configurable thresholds)
      if (overlap <= minTimeOverlapHours) {
        // Very limited overlap: favor asynchronous tools
        pairScore = asyncCount - syncCount;
      } else if (overlap < normalOverlapHours) {
        // Normal overlap: any tool is fine
        pairScore = syncCount + asyncCount;
      } else {
        // High overlap: favor synchronous tools
        pairScore = syncCount - asyncCount;
      }
      
      totalScore += pairScore;
      countryPairs.push({ country1, country2, overlap, pairScore });
    }
  }
  
  // Calculate max and min possible scores using binomial coefficient
  const n = involvedCountries.length;
  const r = 2; // pairs
  const numPairs = binomialCoefficient(n, r);
  const maxScore = numPairs * numTools;
  const minScore = -maxScore;
  
  indicators.push(`Countries: ${involvedCountries.join(', ')}`);
  indicators.push(`Communication tools: ${numTools}`);
  indicators.push(`Country pairs: ${numPairs}`);
  indicators.push(`Total score: ${totalScore}`);
  indicators.push(`Score range: [${minScore}, ${maxScore}]`);
  indicators.push(`Time overlap thresholds: ≤${minTimeOverlapHours}h (async), ≥${normalOverlapHours}h (sync)`);
  
  // Divide range into 5 equal intervals
  const riskLabel = classifyIntoFiveIntervals(totalScore, minScore, maxScore);
  const severity = labelToSeverity(riskLabel);
  
  indicators.push(`Risk label: ${riskLabel}`);
  
  // Standard recommendations (fixed as per requirements)  
  // Add language check from original implementation
  const teamLanguages = teamAnalysis?.languages;
  if (teamLanguages && !teamLanguages.hasAllRequired) {
    indicators.push(`Missing languages: ${teamLanguages.missingLanguages?.join(', ') || 'several'}`);
  }
  
  if (severity === 'low' && (!teamLanguages || teamLanguages.hasAllRequired)) {
    return null; // No significant risk
  }
  
  return {
    type: 'communication_breakdown',
    title: 'Communication Risk',
    description: `Communication tools ${riskLabel.toLowerCase()} aligned with time overlaps between ${involvedCountries.length} countries`,
    category: 'coordination',
    severity: severity,
    source: 'expert_rules_hofstede',
    indicators,
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 15 : severity === 'medium-high' ? 10 : 5,
        max: severity === 'high' ? 35 : severity === 'medium-high' ? 25 : 15,
        description: 'Delays from communication mismatch and coordination issues'
      },
      budgetOverrun: {
        min: severity === 'high' ? 12 : severity === 'medium-high' ? 8 : 5,
        max: severity === 'high' ? 30 : severity === 'medium-high' ? 20 : 12,
        description: 'Extra time in inefficient communication'
      },
      qualityImpact: severity === 'high' ? 'high' : severity === 'medium-high' ? 'medium' : 'low',
      teamMoraleImpact: severity === 'high' ? 'high' : 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Delayed responses', threshold: '> 24h average', checkFrequency: 'weekly' },
      { signal: 'Meeting attendance < 85%', threshold: '85%', checkFrequency: 'weekly' },
      { signal: 'Communication complaints', threshold: '> 3 per sprint', checkFrequency: 'per sprint' }
    ]
  };
}

/**
 * RULE 2: Skill Gap Risk
 * Detects mismatches between required skills and team capabilities
 * NOW USES: team.technicalMatch, team.experience, team.skills from curricula
 * CONFIGURABLE: PM can set riskThresholds in project.decisionTree
 */
function checkSkillGapRisk(project, teamAnalysis) {
  const requiredLevel = project.requiredExperienceLevel || 'mid';
  const complexity = project.complexity || 'medium';
  const mainTechs = project.mainTechnologies || [];
  const docLevel = project.documentationLevel || 'partial';
  
  // Get configurable thresholds from project, with defaults as fallback
  const riskThresholds = project.decisionTree?.riskThresholds || {};
  const skillGapCriticalThreshold = (riskThresholds.skillGapCritical ?? 0.5); // <50% = critical
  const skillGapMajorThreshold = (riskThresholds.skillGapMajor ?? 0.7);       // <70% = major
  const minTechnologiesThreshold = (riskThresholds.minTechnologiesThreshold ?? 3);
  const maxJuniorRatio = (riskThresholds.maxJuniorRatio ?? 0.6);
  const minProficiencyThreshold = (riskThresholds.minProficiencyThreshold ?? 2.0);  let severity = 'low';
  let riskScore = 0;
  const recommendations = [];
  const technicalMatch = teamAnalysis?.technicalMatch;
  const experienceMatch = teamAnalysis?.experienceMatch;
  const teamSkills = teamAnalysis?.skills;
  const teamExperience = teamAnalysis?.experience;
  
  // Factor 1: Missing critical technologies (from curricula)
  if (technicalMatch && technicalMatch.missing && technicalMatch.missing.length >= minTechnologiesThreshold) {
    riskScore += 4;
    severity = 'high';
  }
  
  // Factor 2: Low technology match percentage (uses configurable thresholds)
  if (technicalMatch && typeof technicalMatch.matchPercentage === 'number') {
    const matchRatio = technicalMatch.matchPercentage / 100;
    
    if (matchRatio < skillGapCriticalThreshold) {
      riskScore += 3;
      severity = 'high';    } else if (matchRatio < skillGapMajorThreshold) {
      riskScore += 2;
      severity = severity === 'high' ? 'high' : 'medium';
    }
  }
  
  // Factor 3: Experience level gap
  if (experienceMatch && experienceMatch.gap > 0) {
    riskScore += experienceMatch.gap >= 2 ? 3 : 2;
    severity = experienceMatch.gap >= 2 ? 'high' : 'medium-high';  }
  
  // Factor 4: Low proficiency (uses configurable threshold)
  if (technicalMatch && typeof technicalMatch.avgProficiency === 'number' && 
      technicalMatch.avgProficiency < minProficiencyThreshold && complexity === 'high') {
    riskScore += 3;  }
  
  // Factor 5: Team composition (too many juniors - uses configurable threshold)
  if (teamExperience && teamExperience.distribution) {
    const dist = teamExperience.distribution;
    const total = dist.junior + dist.mid + dist.senior + dist.expert;
    const juniorRatio = total > 0 ? dist.junior / total : 0;
    
    if (Number.isFinite(juniorRatio) && juniorRatio > maxJuniorRatio && complexity === 'high') {
      riskScore += 2;
    }
  }
  
  // Factor 6: Poor documentation
  if (docLevel === 'minimal' || docLevel === 'none') {
    riskScore += 1;  }
  
  // Determine final severity
  if (riskScore >= 8) {
    severity = 'high';
  } else if (riskScore >= 5) {
    severity = 'medium-high';
  } else if (riskScore >= 3) {
    severity = 'medium';
  }
  
  if (riskScore < 3) {
    return null;
  }
  
  const missingTechs = technicalMatch?.missing || [];
  const matchPercentage = typeof technicalMatch?.matchPercentage === 'number' ? technicalMatch.matchPercentage : 0;
  
  return {
    type: 'skill_gap',
    title: 'Technical Skills Gap',
    description: missingTechs.length > 0 
      ? `Team lacks experience in ${missingTechs.length} critical technolog(ies): ${missingTechs.slice(0, 3).join(', ')}. Technical match: ${matchPercentage.toFixed(0)}%`
      : `Team skills do not reach the required level (${requiredLevel}) for project complexity (${complexity})`,
    category: 'technical',
    severity,
    source: 'expert_rules_with_cv_data',
    indicators: [
      `Complexity: ${complexity}`,
      `Technology match: ${technicalMatch?.matchPercentage?.toFixed(0) || 'N/A'}%`,
      `Experience gap: ${experienceMatch?.gap || 'N/A'} levels`,
      `Missing technologies: ${technicalMatch?.missing?.length || 0}`,
      `Proficiency: ${technicalMatch?.avgProficiency?.toFixed(1) || 'N/A'}/5`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 20 : 10,
        max: severity === 'high' ? 60 : 30,
        description: 'Learning curve, rework, and training'
      },
      budgetOverrun: {
        min: severity === 'high' ? 25 : 12,
        max: severity === 'high' ? 50 : 30,
        description: 'Cost of training, hiring, and fixes'
      },
      qualityImpact: severity === 'high' ? 'high' : 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Bug rate > 0.15 per story point', threshold: '0.15', checkFrequency: 'weekly' },
      { signal: 'Estimation accuracy < 60%', threshold: '60%', checkFrequency: 'per sprint' },
      { signal: 'Code review time > 3 days', threshold: '3 days', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE 3: Team Overload Risk
 * Detects when team members are spread too thin across projects
 * NOW USES: team.workload, team.personality from BFI-44
 * CONFIGURABLE: PM can set overload thresholds in project.decisionTree
 */
async function checkTeamOverloadRisk(project, teamAnalysis, otherProjects) {  let severity = 'low';
  let riskScore = 0;
  
  // Get configurable thresholds from project, with defaults as fallback
  const riskThresholds = project.decisionTree?.riskThresholds || {};
  const overloadAverageHours = (riskThresholds.overloadAverageHours ?? 45);      // Default 45h/week
  const maxConcurrentProjectsThreshold = (riskThresholds.maxConcurrentProjectsThreshold ?? 2); // Default >2 = risk
  
  const workload = teamAnalysis?.workload;
  const personality = teamAnalysis?.personality;
  
  if (workload && workload.isOverloaded) {
    riskScore += 4;  }
  
  if (workload && workload.maxConcurrentProjects > maxConcurrentProjectsThreshold) {
    riskScore += 3;
    severity = severity === 'high' ? 'high' : 'medium-high';  }
  
  if (personality && personality.concerns) {
    const stressConcern = personality.concerns.find(c => 
      c.type === 'high_stress_tendency' || (typeof c === 'string' && c.includes('stress'))
    );
    
    if (stressConcern && workload?.avgHoursPerWeek > overloadAverageHours) {
      riskScore += 2;    }
  }
  
  // Factor 2: Team availability mismatch
  const availability = teamAnalysis?.availability;
  if (availability && availability.isStretched) {
    riskScore += 2;  }
  
  if (availability && availability.afterHoursRequired && workload?.avgHoursPerWeek > overloadAverageHours) {
    riskScore += 2;  }
  
  // Determine final severity
  if (riskScore >= 8) {
    severity = 'high';
  } else if (riskScore >= 5) {
    severity = 'medium-high';
  } else if (riskScore >= 3) {
    severity = 'medium';
  }
  
  if (riskScore < 3) {
    return null;
  }
  
  // Check for individual overloaded members
  if (workload && workload.overloadedMembers > 0) {
    if (riskScore < 5) {
      severity = 'medium';
    }  }
  
  if (severity === 'low') {
    return null; // No significant risk
  }
  
  return {
    type: 'team_overload',
    title: 'Team Overload',
    description: workload?.overloadedMembers > 0
      ? `Team members are overloaded with multiple concurrent projects`
      : `Team is working beyond sustainable capacity`,
    category: 'team',
    severity,
    source: 'expert_rules',
    indicators: [
      workload?.overloadedMembers ? `${workload.overloadedMembers} overloaded members` : 'Team overload detected',
      workload?.avgHoursPerWeek ? `Average ${workload.avgHoursPerWeek.toFixed(1)}h/week` : 'Hours data unavailable',
      workload?.maxConcurrentProjects ? `Up to ${workload.maxConcurrentProjects} concurrent projects` : 'Concurrent projects detected'
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 20 : 10,
        max: severity === 'high' ? 60 : 30,
        description: 'Burnout, turnover, and productivity loss'
      },
      budgetOverrun: {
        min: severity === 'high' ? 30 : 15,
        max: severity === 'high' ? 70 : 35,
        description: 'Inefficiency, errors, and rework from exhaustion'
      },
      qualityImpact: 'high',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Sick days increase > 50%', threshold: '50% increase', checkFrequency: 'monthly' },
      { signal: 'Meeting attendance < 85%', threshold: '85%', checkFrequency: 'weekly' },
      { signal: 'Quality of commits/PRs drops', threshold: 'subjective', checkFrequency: 'weekly' },
      { signal: 'Response time doubles', threshold: '2x normal', checkFrequency: 'daily' }
    ]
  };
}

/**
 * RULE 4: Dependency and Blockage Risk
 * Detects risks from external dependencies
 * CONFIGURABLE: PM can set dependency thresholds in project.decisionTree
 */
function checkDependencyRisk(project) {
  // Get configurable thresholds from project, with defaults as fallback
  const riskThresholds = project.decisionTree?.riskThresholds || {};
  const minCriticalDependencies = (riskThresholds.minCriticalDependencies ?? 3);
  const minInvolvedTeams = (riskThresholds.minInvolvedTeams ?? 2);
  const riskScoreThresholdHigh = (riskThresholds.riskScoreThresholdHigh ?? 6);
  const riskScoreThresholdMedium = (riskThresholds.riskScoreThresholdMedium ?? 4);
  const timelineBufferPercentage = (riskThresholds.timelineBufferPercentage ?? 30);
  
  const dependencies = project.dependencies || [];
  const involvedTeams = Array.isArray(project.involvedTeams) ? project.involvedTeams.length : 0;
  const criticalDeps = dependencies.filter(d => d.criticality === 'critical' || d.type === 'critical').length;
  const sharedInfra = project.sharedInfrastructureDependency;
  const infoFlow = project.informationFlowDirection || 'bidirectional';
  
  // Calculate risk score: teams + (critical deps * 0.5)
  const riskScore = involvedTeams + (criticalDeps * 0.5);  let severity = 'low';
  
  // Check if conditions are met
  const hasCriticalDeps = criticalDeps >= minCriticalDependencies;
  const hasMultipleTeams = involvedTeams >= minInvolvedTeams;
  const hasHighSharedInfra = sharedInfra === 'high';
  
  // Condition 1: ≥ minCriticalDependencies
  if (hasCriticalDeps) {
  }
  
  // Condition 2: ≥ minInvolvedTeams
  if (hasMultipleTeams) {
  }
  
  // Condition 3: High shared infrastructure
  if (hasHighSharedInfra) {  }
  
  // Determine severity based on score and infrastructure
  if (riskScore > riskScoreThresholdHigh || hasHighSharedInfra) {
    severity = 'high';
  } else if (riskScore > riskScoreThresholdMedium) {
    severity = 'medium';
  } else {
    return null; // No significant risk
  }
  
  // Standard recommendations (only what user specified)  
  return {
    type: 'dependency_blockage',
    title: 'Dependency Blockages',
    description: `Project has ${criticalDeps} critical dependencies involving ${involvedTeams} teams. High risk of coordination blockages`,
    category: 'organizational',
    severity,
    source: 'expert_rules',
    indicators: [
      `${involvedTeams} teams involved (threshold: ≥${minInvolvedTeams})`,
      `${criticalDeps} critical dependencies (threshold: ≥${minCriticalDependencies})`,
      `Shared infra: ${sharedInfra || 'unknown'}`,
      `Info flow: ${infoFlow}`,
      `Risk score: ${riskScore.toFixed(1)}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 14 : 7,
        max: severity === 'high' ? 42 : 21,
        description: 'Blockages waiting for other teams'
      },
      budgetOverrun: {
        min: severity === 'high' ? 15 : 10,
        max: severity === 'high' ? 30 : 20,
        description: 'Idle time and rework from changes'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Blockages > 2 per sprint', threshold: '2 blockers', checkFrequency: 'per sprint' },
      { signal: 'Dependency APIs change', threshold: '> 1 change', checkFrequency: 'weekly' },
      { signal: 'Integration tests fail', threshold: '> 20% failure', checkFrequency: 'daily' }
    ]
  };
}

/**
 * RULE 5: Scope Creep Risk
 * Detects lack of requirement clarity
 */
function checkScopeCreepRisk(project) {
  const descLength = project.briefDescription?.length || 0;
  const complexity = project.complexity || 'medium';
  const docLevel = project.documentationLevel || 'none';
  const rolesCount = project.rolesAndResponsibilities?.length || 0;
  const experienceLevel = project.requiredExperienceLevel || 'mid';
  const teamSize = project.teamSize || 0;
  
  // Get configurable thresholds with defaults
  const thresholds = project.decisionTree?.riskThresholds || {};
  const minDescLength = thresholds.minDescriptionLength || 500;
  const minKeyRoles = thresholds.minKeyRoles || 3;
  const clarityScoreCritical = thresholds.clarityScoreCritical || 1;
  const clarityScoreMajor = thresholds.clarityScoreMajor || 1.5;
  const clientTimeOverlapHours = thresholds.clientTimeOverlapHours || 4;
  const recommendations = [];
  
  // Calculate clarity score (0-3 possible)
  let clarityScore = 0;
  clarityScore += descLength >= minDescLength ? 1 : 0;
  clarityScore += docLevel === 'complete' ? 1 : (docLevel === 'partial' ? 0.5 : 0);
  clarityScore += rolesCount >= minKeyRoles ? 1 : (rolesCount >= 1 ? 0.5 : 0);
  
  // Check time overlap with stakeholders/client (condition from spec)
  const timeOverlapWithClient = project.clientTimeOverlapHours || 0;
  const hasLowTimeOverlap = timeOverlapWithClient < clientTimeOverlapHours;  let severity = 'low';
  
  // Determine severity based on thresholds and conditions
  if (clarityScore < clarityScoreCritical && complexity === 'high') {
    if (hasLowTimeOverlap) {
    }
  } else if (clarityScore < clarityScoreMajor || (hasLowTimeOverlap && docLevel !== 'complete')) {
    if (hasLowTimeOverlap) {
    }  } else if (docLevel === 'none' || rolesCount === 0) {
    severity = 'medium';  } else {
    return null;
  }
  
  return {
    type: 'scope_creep',
    title: 'Unstable Scope (Scope Creep)',
    description: `Unclear requirements with ${docLevel} documentation and ${rolesCount} defined roles from ${teamSize} members. High risk of uncontrolled scope changes`,
    category: 'management',
    severity,
    source: 'expert_rules',
    thresholdDetails: {
      minDescriptionLength: minDescLength,
      minKeyRoles: minKeyRoles,
      clarityScoreCritical: clarityScoreCritical,
      clarityScoreMajor: clarityScoreMajor,
      clientTimeOverlapHours: clientTimeOverlapHours,
      currentValues: {
        descriptionLength: descLength,
        clarityScore: clarityScore,
        rolesCount: rolesCount,
        documentationLevel: docLevel,
        clientTimeOverlap: timeOverlapWithClient
      }
    },
    indicators: [
      `Description: ${descLength} chars (required: ≥${minDescLength})`,
      `Documentation: ${docLevel}`,
      `Defined roles: ${rolesCount} (required: ≥${minKeyRoles})`,
      `Complexity: ${complexity}`,
      `Client/Stakeholder overlap: ${timeOverlapWithClient}h (required: ≥${clientTimeOverlapHours}h)`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 20 : 10,
        max: severity === 'high' ? 60 : 30,
        description: 'Constant scope changes'
      },
      budgetOverrun: {
        min: severity === 'high' ? 30 : 15,
        max: severity === 'high' ? 60 : 35,
        description: 'Unplanned additional features'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'New features requested', threshold: '> 1 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Priorities change', threshold: '> 2 changes', checkFrequency: 'per sprint' },
      { signal: 'Stakeholders not aligned', threshold: 'subjective', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE 6: Process Mismatch Risk
 * Detects maturity and tooling issues
 * NOW USES: organization context from teamAnalysis
 */
function checkProcessRisk(project, teamAnalysis) {
  const hasOnboarding = project.hasOnboardingProcesses === 'yes';
  const hasCICD = project.hasVersionControlAndCICD === 'yes';
  const toolsFragmentation = project.internalToolsFragmentation || 'medium';
  const distributedExp = project.distributedWorkExperienceLevel || 'low';
  const methodology = project.mainMethodology || 'agile';
  const orgContext = teamAnalysis?.organizationContext;
  const actualOnboarding = orgContext?.hasOnboarding !== undefined ? orgContext.hasOnboarding : hasOnboarding;
  const actualVersionControl = orgContext?.hasVersionControl !== undefined ? orgContext.hasVersionControl : hasCICD;
  const actualMaturity = orgContext?.maturity;
  
  // Get configurable thresholds
  const thresholds = project.decisionTree?.riskThresholds || {};
  const maturityScoreLow = thresholds.maturityScoreLow || 1.5;
  const maturityScoreMedium = thresholds.maturityScoreMedium || 2.5;
  const recommendations = [];
  
  // Calculate maturity score
  let maturityScore = 0;
  maturityScore += actualOnboarding ? 1 : 0;
  maturityScore += actualVersionControl ? 1 : 0;
  maturityScore += toolsFragmentation === 'low' ? 1 : (toolsFragmentation === 'medium' ? 0.5 : 0);
  maturityScore += distributedExp === 'high' ? 1 : (distributedExp === 'medium' ? 0.5 : 0);  let severity = 'low';
  
  if (maturityScore < maturityScoreLow) {
    severity = 'high';  } else if (maturityScore < maturityScoreMedium) {
    severity = 'medium';  } else {
    return null;
  }
  
  return {
    type: 'process_mismatch',
    title: 'Inadequate Processes',
    description: `Low organizational maturity (${maturityScore.toFixed(1)}/4) with fragmented tools and inconsistent processes. Risk of inefficiencies`,
    category: 'management',
    severity,
    source: 'expert_rules',
    thresholdDetails: {
      maturityScoreLow: maturityScoreLow,
      maturityScoreMedium: maturityScoreMedium,
      currentMaturityScore: maturityScore
    },
    indicators: [
      `Maturity score: ${maturityScore.toFixed(1)}/4 (High severity if < ${maturityScoreLow}, Medium if < ${maturityScoreMedium})`,
      `Onboarding: ${hasOnboarding ? 'Yes' : 'No'}`,
      `CI/CD: ${hasCICD ? 'Yes' : 'No'}`,
      `Tools fragmentation: ${toolsFragmentation}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 30 : 20,
        description: 'Inefficiencies from processes'
      },
      budgetOverrun: {
        min: severity === 'high' ? 15 : 10,
        max: severity === 'high' ? 35 : 25,
        description: 'Administrative overhead'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Meeting time > 30% of time', threshold: '30%', checkFrequency: 'weekly' },
      { signal: 'Frequent tool-switching', threshold: '> 5 tools', checkFrequency: 'monthly' },
      { signal: 'Onboarding > 2 weeks', threshold: '2 weeks', checkFrequency: 'per hire' }
    ]
  };
}
// Helper Functions

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
 * NEW RULE 9: Knowledge Management Gap
 * Detects lack of adequate tools/methodologies for knowledge management
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
function checkKnowledgeManagementRisk(project, team, organization) {
  const hasKMTools = (project?.knowledgeManagementTools?.length > 0) || !!project?.knowledgeManagementSystem;
  const docLevel = project?.documentationLevel || 'unknown';
  const hasStandardization = project?.documentationProcesses?.hasStandardization;
  const orgHasKB = organization?.knowledgeManagement?.hasKnowledgeBase;
  const teamSize = project?.teamSize || team?.length || 0;
  
  // Get configurable thresholds
  const thresholds = project.decisionTree?.riskThresholds || {};
  const maxTeamSize = thresholds.maxTeamSizeForKM || 5;
  const kmToolsScore = thresholds.kmToolsRiskScore || 3;
  const kmDocScore = thresholds.kmDocRiskScore || 2;
  const kmScoreHigh = thresholds.kmRiskScoreHigh || 6;
  const kmScoreMediumHigh = thresholds.kmRiskScoreMediumHigh || 4;  let severity = 'low';
  const recommendations = [];
  let riskScore = 0;
  let dataPoints = 0;
  let totalDataPoints = 4;
  
  // Factor 1: Team too large (PRIMARY CONDITION FROM SPEC)
  if (teamSize > maxTeamSize) {
    riskScore += 2;    dataPoints++;
  }
  
  // Factor 2: No KM tools
  if (hasKMTools === false && orgHasKB === false) {
    riskScore += kmToolsScore;
    severity = 'medium-high';
    dataPoints += 2;
  } else if (hasKMTools === true || orgHasKB === true) {
    dataPoints += 2;
  } else if (hasKMTools === undefined && orgHasKB === undefined) {
    riskScore += 1;
  } else {
    dataPoints += 1;
  }
  
  // Factor 3: Minimal documentation
  if (docLevel === 'minimal' || docLevel === 'none') {
    riskScore += kmDocScore;    dataPoints++;
  } else if (docLevel !== 'unknown') {
    dataPoints++;
  }
  
  // Factor 4: Standardization
  if (hasStandardization === false) {
    riskScore += 1;    dataPoints++;
  } else if (hasStandardization === true) {
    dataPoints++;
  }
  
  // Determine final severity
  if (riskScore >= kmScoreHigh) {
    severity = 'high';
  } else if (riskScore >= kmScoreMediumHigh) {
    severity = 'medium-high';
  } else if (riskScore >= 2) {
    severity = 'medium';
  }
  
  // Add wiki recommendation if risk exists
  if (riskScore > 0) {  }
  
  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.30, baseConfidence * 0.85);
  
  if (riskScore < 1) {
    return null;
  }
  
  return {
    type: 'knowledge_management_gap',
    title: 'Knowledge Management Gap',
    description: teamSize > maxTeamSize
      ? `Equipo demasiado grande (${teamSize} > ${maxTeamSize}). Sin herramientas de gestión del conocimiento. Risk of information loss`
      : `No knowledge management tools for ${project.requiredExperienceLevel || 'mid'} experience level project. Risk of fragmented information`,
    category: 'organizational',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore: riskScore,
      kmScoreHigh: kmScoreHigh,
      kmScoreMediumHigh: kmScoreMediumHigh,
      maxTeamSize: maxTeamSize,
      currentTeamSize: teamSize,
      kmToolsScore: kmToolsScore,
      kmDocScore: kmDocScore
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Team size: ${teamSize} (risk if > ${maxTeamSize})`,
      `Risk score: ${riskScore}/${kmScoreHigh}`,
      `KM Tools: ${hasKMTools ? 'Yes' : 'No'}`,
      `Documentation: ${docLevel}`,
      `Standardization: ${hasStandardization ? 'Yes' : 'No'}`,
      `Org KM: ${orgHasKB ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 30 : 15,
        description: 'Information loss, communication overload'
      },
      budgetOverrun: {
        min: severity === 'high' ? 12 : 8,
        max: severity === 'high' ? 25 : 15,
        description: 'Rework from lost information'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Information lost/recreated > 2 times', threshold: '2 instances', checkFrequency: 'per sprint' },
      { signal: 'Repetitive questions in communications', threshold: 'subjective', checkFrequency: 'weekly' },
      { signal: 'Time searching for information > 2h/day', threshold: '2 hours', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * NEW RULE 10: Remote Work Support Gap
 * Detects inadequate support for remote work
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
/**
 * RULE: Remote Work Support Gap
 * Detects inadequate support for remote work
 * Thresholds:
 * - remoteWorkPercentageThreshold: >50% remote work (default 0.5)
 * - noPolicyRiskScore: Risk score for missing policies (default 3)
 * - noToolsRiskScore: Risk score for missing tools (default 2)
 * - noTechSupportRiskScore: Risk score for missing support (default 2)
 * - remoteRiskScoreHigh: HIGH severity threshold (default 6)
 */
function checkRemoteWorkSupportRisk(project, team, organization) {
  const remoteWorkPercentageThreshold = project?.decisionTree?.riskThresholds?.remoteWorkPercentageThreshold ?? 0.5;
  const noPolicyRiskScore = project?.decisionTree?.riskThresholds?.noPolicyRiskScore ?? 3;
  const noToolsRiskScore = project?.decisionTree?.riskThresholds?.noToolsRiskScore ?? 2;
  const noTechSupportRiskScore = project?.decisionTree?.riskThresholds?.noTechSupportRiskScore ?? 2;
  const remoteRiskScoreHigh = project?.decisionTree?.riskThresholds?.remoteRiskScoreHigh ?? 6;

  const workMode = getEffectiveWorkMode(project, organization);
  const remoteWorkPercentage = project?.remoteWorkPercentage ?? 0;
  const hasRemotePolicy = organization?.remoteWorkConfiguration?.hasRemoteWorkPolicy;
  const hasCollaborativeTools = organization?.remoteWorkConfiguration?.hasCollaborativeTools;
  const providesTechSupport = organization?.remoteWorkConfiguration?.providesTechSupport;

  console.log('[DEBUG] checkRemoteWorkSupportRisk:', {
    workMode,
    remoteWorkPercentage,
    remoteWorkPercentageThreshold,
    hasRemotePolicy,
    hasCollaborativeTools,
    providesTechSupport
  });

  let severity = 'low';
  let riskScore = 0;
  let dataPoints = 0;
  const totalDataPoints = 4;
  const localRecommendations = [];

  // Only applicable if remote work is involved (not office_mode)
  if (workMode === 'office_mode' && remoteWorkPercentage === 0) {
    return null;
  }
  
  // Skip if work model is fully office and no remote work detected
  if (isOfficePredominant(workMode) && remoteWorkPercentage < remoteWorkPercentageThreshold) {
    return null;
  }

  // Factor 1: No remote work policy
  if (hasRemotePolicy === false) {
    riskScore += noPolicyRiskScore;    dataPoints++;
  } else if (hasRemotePolicy === true) {
    dataPoints++;
  }

  // Factor 2: No collaborative tools
  if (hasCollaborativeTools === false) {
    riskScore += noToolsRiskScore;    dataPoints++;
  } else if (hasCollaborativeTools === true) {
    dataPoints++;
  }

  // Factor 3: No tech support
  if (providesTechSupport === false) {
    riskScore += noTechSupportRiskScore;    dataPoints++;
  } else if (providesTechSupport === true) {
    dataPoints++;
  }

  // Factor 4: Remote percentage level (informational)
  if (remoteWorkPercentage >= remoteWorkPercentageThreshold) {
    dataPoints++;
  } else if (workMode !== 'office_mode') {
    dataPoints++;
  }

  // Determine final severity
  if (riskScore >= remoteRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 4) {
    severity = 'medium-high';
  } else if (riskScore >= 2) {
    severity = 'medium';
  }

  // Recommendations are resolved from the catalog.

  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.30, baseConfidence * 0.85);

  if (riskScore < 1) {
    return null;
  }

  return {
    type: 'remote_work_support_gap',
    title: 'Remote Work Support Gap',
    description: `Remote work: ${(remoteWorkPercentage * 100).toFixed(0)}% (threshold: ${(remoteWorkPercentageThreshold * 100).toFixed(0)}%). ${!hasRemotePolicy ? 'No policies' : ''} ${!hasCollaborativeTools ? 'No tools' : ''} ${!providesTechSupport ? 'No tech support' : ''}`.trim(),
    category: 'organizational',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore: riskScore,
      remoteRiskScoreHigh: remoteRiskScoreHigh,
      remoteWorkPercentage: (remoteWorkPercentage * 100).toFixed(0) + '%',
      remoteWorkPercentageThreshold: (remoteWorkPercentageThreshold * 100).toFixed(0) + '%',
      noPolicyRiskScore: noPolicyRiskScore,
      noToolsRiskScore: noToolsRiskScore,
      noTechSupportRiskScore: noTechSupportRiskScore
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Remote work percentage: ${(remoteWorkPercentage * 100).toFixed(0)}%`,
      `Risk score: ${riskScore}/${remoteRiskScoreHigh}`,
      `Policies: ${hasRemotePolicy ? 'Yes' : 'No'}`,
      `Collaborative tools: ${hasCollaborativeTools ? 'Yes' : 'No'}`,
      `Tech support: ${providesTechSupport ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 25 : 15,
        description: 'Isolation, communication delays, technical problems'
      },
      budgetOverrun: {
        min: severity === 'high' ? 12 : 8,
        max: severity === 'high' ? 25 : 15,
        description: 'Low productivity from lack of support'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations: localRecommendations,
    earlyWarningSignals: [
      { signal: 'Complaints about isolation', threshold: '> 2 per month', checkFrequency: 'monthly' },
      { signal: 'Recurring technical issues', threshold: '> 3 per week', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE: Role Clarity Gap
 * Detects lack of clarity in roles and responsibilities
 * Thresholds:
 * - minTeamSizeForRoleClarity: Minimum team size (default 8)
 * - noRolesRiskScore: Risk score for undefined roles (default 3)
 * - noOrgChartRiskScore: Risk score for missing org chart (default 2)
 * - roleRiskScoreHigh: HIGH severity threshold (default 6)
 * - roleRiskScoreMediumHigh: MEDIUM-HIGH severity threshold (default 4)
 */
function checkRoleClarityRisk(project, team) {
  const minTeamSizeForRoleClarity = project?.decisionTree?.riskThresholds?.minTeamSizeForRoleClarity ?? 8;
  const noRolesRiskScore = project?.decisionTree?.riskThresholds?.noRolesRiskScore ?? 3;
  const noOrgChartRiskScore = project?.decisionTree?.riskThresholds?.noOrgChartRiskScore ?? 2;
  const roleRiskScoreHigh = project?.decisionTree?.riskThresholds?.roleRiskScoreHigh ?? 6;
  const roleRiskScoreMediumHigh = project?.decisionTree?.riskThresholds?.roleRiskScoreMediumHigh ?? 4;

  const teamSize = project?.teamSize || team?.size || team?.members?.length || 0;
  const rolesCount = project?.rolesAndResponsibilities?.length || 0;
  const hasOrgChart = project?.hasOrganizationalChart;
  const multipleTeams = project?.multipleTeams || false;

  console.log('[DEBUG] checkRoleClarityRisk:', {
    teamSize,
    minTeamSizeForRoleClarity,
    rolesCount,
    hasOrgChart,
    multipleTeams
  });  let severity = 'low';
  let riskScore = 0;
  let dataPoints = 0;
  const totalDataPoints = 3;

  // Only applicable for teams > minTeamSizeForRoleClarity
  if (teamSize <= minTeamSizeForRoleClarity) {
    return null;
  }
  
  // Early return if no data available
  if (teamSize === 0 && rolesCount === 0 && hasOrgChart === undefined && multipleTeams === false) {
    return null;
  }

  // Factor 1: Roles not defined
  if (rolesCount === 0 || rolesCount < teamSize * 0.8) {
    riskScore += noRolesRiskScore;
    dataPoints++;
  } else if (rolesCount > 0) {
    dataPoints++;
  }

  // Factor 2: No organizational chart
  if (hasOrgChart === false) {
    riskScore += noOrgChartRiskScore;    dataPoints++;
  } else if (hasOrgChart === true) {
    dataPoints++;
  }

  // Factor 3: Multiple teams without clarity
  if (multipleTeams === true) {
    riskScore += 1;    dataPoints++;
  } else if (multipleTeams === false) {
    dataPoints++;
  }

  // Determine final severity
  if (riskScore >= roleRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= roleRiskScoreMediumHigh) {
    severity = 'medium-high';
  } else if (riskScore >= 2) {
    severity = 'medium';
  }

  // Add only user-specified recommendations
  if (riskScore > 0) {  }

  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.35, baseConfidence * 0.80);

  if (riskScore < 1) {
    return null;
  }

  return {
    type: 'role_clarity_gap',
    title: 'Role Clarity Gap',
    description: `Team size: ${teamSize} > ${minTeamSizeForRoleClarity}. Roles defined: ${rolesCount}/${teamSize}. ${!hasOrgChart ? 'No org chart.' : ''} ${multipleTeams ? 'Multiple teams involved.' : ''}`.trim(),
    category: 'management',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore: riskScore,
      roleRiskScoreHigh: roleRiskScoreHigh,
      roleRiskScoreMediumHigh: roleRiskScoreMediumHigh,
      minTeamSizeForRoleClarity: minTeamSizeForRoleClarity,
      noRolesRiskScore: noRolesRiskScore,
      noOrgChartRiskScore: noOrgChartRiskScore,
      rolesCount: rolesCount,
      teamSize: teamSize,
      multipleTeams: multipleTeams
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Team size: ${teamSize} (critical if > ${minTeamSizeForRoleClarity})`,
      `Risk score: ${riskScore}/${roleRiskScoreHigh}`,
      `Roles defined: ${rolesCount}/${teamSize}`,
      `Org chart: ${hasOrgChart ? 'Yes' : 'No'}`,
      `Multiple teams: ${multipleTeams ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 30 : 15,
        description: 'Role conflicts, lack of coordination, duplicate efforts'
      },
      budgetOverrun: {
        min: severity === 'high' ? 15 : 10,
        max: severity === 'high' ? 30 : 20,
        description: 'Duplicated work, inefficient coordination'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Unassigned tasks > 15%', threshold: '15%', checkFrequency: 'weekly' },
      { signal: 'Conflicts about responsibilities', threshold: '> 1 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Duplicate work detected', threshold: '> 1 instance', checkFrequency: 'per sprint' }
    ]
  };
}

/**
 * NEW RULE 13: Timezone Scheduling Gap (More Specific)
 * Detects planning issues due to timezone differences
 * WORKS WITH PARTIAL DATA - adjusts confidence based on available information
 */
/**
 * RULE: Timezone Scheduling Gap
 * Detects coordination problems from timezone differences
 * Thresholds:
 * - minTimeOverlapHoursThreshold: Minimum overlap hours (default 3)
 * - minTimezonesForRisk: Minimum timezones for risk (default 3)
 * - lowOverlapRiskScore: Risk score for low overlap (default 3)
 * - multipleTimezonesRiskScore: Risk score for multiple timezones (default 2)
 * - frequentMeetingsRiskScore: Risk score for frequent meetings (default 2)
 * - timezoneRiskScoreHigh: HIGH severity threshold (default 6)
 */
function checkTimezoneSchedulingRisk(project, team) {
  const minTimeOverlapHoursThreshold = project?.decisionTree?.riskThresholds?.minTimeOverlapHoursThreshold ?? 3;
  const minTimezonesForRisk = project?.decisionTree?.riskThresholds?.minTimezonesForRisk ?? 3;
  const lowOverlapRiskScore = project?.decisionTree?.riskThresholds?.lowOverlapRiskScore ?? 3;
  const multipleTimezonesRiskScore = project?.decisionTree?.riskThresholds?.multipleTimezonesRiskScore ?? 2;
  const frequentMeetingsRiskScore = project?.decisionTree?.riskThresholds?.frequentMeetingsRiskScore ?? 2;
  const timezoneRiskScoreHigh = project?.decisionTree?.riskThresholds?.timezoneRiskScoreHigh ?? 6;

  const timeOverlapHours = project?.timeOverlapHours ?? 0;
  const requiresFrequentMeetings = project?.requiresFrequentMeetings;
  const involvedCountries = project?.involvedCountries || [];
  const uniqueTimezones = new Set(involvedCountries).size;

  console.log('[DEBUG] checkTimezoneSchedulingRisk:', {
    timeOverlapHours,
    minTimeOverlapHoursThreshold,
    uniqueTimezones,
    minTimezonesForRisk,
    requiresFrequentMeetings
  });  let severity = 'low';
  let riskScore = 0;
  let dataPoints = 0;
  const totalDataPoints = 3;
  const recommendations = [];

  // Only applicable if there are multiple timezones or low overlap
  if (uniqueTimezones < 2 && timeOverlapHours >= minTimeOverlapHoursThreshold) {
    return null;
  }

  // Factor 1: Low time overlap (<3h default)
  if (timeOverlapHours < minTimeOverlapHoursThreshold && timeOverlapHours >= 0) {
    riskScore += lowOverlapRiskScore;
    dataPoints++;
  } else if (timeOverlapHours >= minTimeOverlapHoursThreshold) {
    dataPoints++;
  }

  // Factor 2: Multiple timezones (>=3 default)
  if (uniqueTimezones >= minTimezonesForRisk) {
    riskScore += multipleTimezonesRiskScore;
    dataPoints++;
  } else if (uniqueTimezones > 0) {
    dataPoints++;
  }

  // Factor 3: Frequent meetings required
  if (requiresFrequentMeetings === true) {
    riskScore += frequentMeetingsRiskScore;    dataPoints++;
  } else if (requiresFrequentMeetings === false) {
    dataPoints++;
  }

  // Determine final severity
  if (riskScore >= timezoneRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 4) {
    severity = 'medium-high';
  } else if (riskScore >= 2) {
    severity = 'medium';
  }

  // Add only user-specified recommendations
  if (riskScore > 0) {  }

  // Calculate confidence based on available data
  const baseConfidence = dataPoints / totalDataPoints;
  const adjustedConfidence = Math.max(0.35, baseConfidence * 0.85);

  if (riskScore < 1) {
    return null;
  }

  return {
    type: 'timezone_scheduling_gap',
    title: 'Timezone Scheduling Gap',
    description: `Time overlap: ${timeOverlapHours}h (threshold: ${minTimeOverlapHoursThreshold}h). ${uniqueTimezones} timezones. ${requiresFrequentMeetings ? 'Frequent meetings required.' : ''}`.trim(),
    category: 'coordination',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore: riskScore,
      timezoneRiskScoreHigh: timezoneRiskScoreHigh,
      timeOverlapHours: timeOverlapHours,
      minTimeOverlapHoursThreshold: minTimeOverlapHoursThreshold,
      uniqueTimezones: uniqueTimezones,
      minTimezonesForRisk: minTimezonesForRisk,
      lowOverlapRiskScore: lowOverlapRiskScore,
      multipleTimezonesRiskScore: multipleTimezonesRiskScore,
      frequentMeetingsRiskScore: frequentMeetingsRiskScore
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Time overlap: ${timeOverlapHours}h (risk if < ${minTimeOverlapHoursThreshold}h)`,
      `Risk score: ${riskScore}/${timezoneRiskScoreHigh}`,
      `Timezones: ${uniqueTimezones} (risk if >= ${minTimezonesForRisk})`,
      `Frequent meetings: ${requiresFrequentMeetings ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 15 : 8,
        max: severity === 'high' ? 40 : 20,
        description: 'Coordination delays, meeting conflicts, async communication overhead'
      },
      budgetOverrun: {
        min: severity === 'high' ? 18 : 10,
        max: severity === 'high' ? 35 : 20,
        description: 'Inefficiency from poor temporal coordination, overtime for meetings'
      },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Missed meetings > 15%', threshold: '15%', checkFrequency: 'monthly' },
      { signal: 'Complaints about meeting times', threshold: '> 2 per month', checkFrequency: 'monthly' },
      { signal: 'Delayed responses > 24h', threshold: '> 30%', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * RULE: Work-Life Boundary Blur (Risk 25)
 * Detects burnout risk from remote work without policies, no defined hours, and 24/7 culture
 * Thresholds:
 * - fullyRemoteBoundaryRiskScore, noTimeOffPolicyRiskScore, longProjectDurationThreshold, strictDeadlineRiskScore
 * - boundaryBlurRiskScoreHigh: HIGH severity threshold (default 8)
 */
function checkWorkLifeBoundaryBlur(project, teamAnalysis, organization) {
  const fullyRemoteBoundaryRiskScore = project?.decisionTree?.riskThresholds?.fullyRemoteBoundaryRiskScore ?? 3;
  const noTimeOffPolicyRiskScore = project?.decisionTree?.riskThresholds?.noTimeOffPolicyRiskScore ?? 3;
  const longProjectDurationThreshold = project?.decisionTree?.riskThresholds?.longProjectDurationThreshold ?? 6;
  const strictDeadlineRiskScore = project?.decisionTree?.riskThresholds?.strictDeadlineRiskScore ?? 2;
  const boundaryBlurRiskScoreHigh = project?.decisionTree?.riskThresholds?.boundaryBlurRiskScoreHigh ?? 8;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 4;

  const workMode = getEffectiveWorkMode(project, organization);
  const hasTimeOffPolicy = Boolean(organization?.timeOffRespectPolicy || organization?.hasDisconnectionPolicy);
  const projectDuration = project?.estimatedDuration || 0;
  const hasDeadline = Boolean(project?.hasStrictDeadline);
  const hasDefinedHours = Boolean(organization?.hasCoreHours || project?.hasCoreHours);

  // Condition 1: Remote without clear policies
  if (isRemotePredominant(workMode)) {
    riskScore += fullyRemoteBoundaryRiskScore;
    dataPoints++;
  } else if (workMode) {
    dataPoints++;
  }

  // Condition 2: No defined hours
  if (!hasTimeOffPolicy) {
    riskScore += noTimeOffPolicyRiskScore;
    dataPoints++;
  } else {
    dataPoints++;
  }

  if (!hasDefinedHours && isRemotePredominant(workMode)) {
    riskScore += 1;
  }

  // Condition 3: 24/7 culture (strict deadline + long project)
  if (hasDeadline) {
    riskScore += strictDeadlineRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }

  if (projectDuration > longProjectDurationThreshold) {
    riskScore += 2;
    dataPoints++;
  } else if (projectDuration > 0) {
    dataPoints++;
  }

  // Determine severity
  if (riskScore >= boundaryBlurRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 6) {
    severity = 'medium-high';
  } else if (riskScore >= 4) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  // Only user-specified recommendations  recommendations.push('Respetar los horarios fuera de trabajo');

  const confidence = dataPoints / totalDataPoints;

  return {
    type: 'work_life_boundary_blur',
    title: 'Work-Life Boundary Blur',
    description: `${workMode} mode. ${!hasTimeOffPolicy ? 'No disconnection policy.' : ''} ${hasDeadline ? 'Strict deadline.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore,
      boundaryBlurRiskScoreHigh,
      hasTimeOffPolicy,
      projectDuration,
      longProjectDurationThreshold
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Work mode: ${workMode}`,
      `Risk score: ${riskScore}/${boundaryBlurRiskScoreHigh}`,
      `Time-off policy: ${hasTimeOffPolicy ? 'Yes' : 'No'}`,
      `Project duration: ${projectDuration} months`,
      `Strict deadline: ${hasDeadline ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 5, max: 20, description: 'Reduced productivity from exhaustion' },
      budgetOverrun: { min: 5, max: 15, description: 'Turnover and absenteeism' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'high'
    },
    earlyWarningSignals: [
      { signal: 'Messages outside hours', threshold: '> 5 per week', checkFrequency: 'weekly' },
      { signal: 'Health absences', threshold: '> 2 per month', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * RULE: Meeting Fatigue (Risk 26)
 * Detects cognitive overload from excessive meetings, distributed teams, and long unproductive meetings
 * Thresholds:
 * - meetingFatigueThreshold: Weekly meetings threshold (default 15)
 * - excessiveMeetingsWithRemoteRiskScore, multipleTeamsRiskScore, noAsyncPolicyRiskScore
 * - meetingFatigueRiskScoreHigh: HIGH severity threshold (default 8)
 */
function checkMeetingFatigue(project, teamAnalysis, organization) {
  const meetingFatigueThreshold = project?.decisionTree?.riskThresholds?.meetingFatigueThreshold ?? 15;
  const excessiveMeetingsWithRemoteRiskScore = project?.decisionTree?.riskThresholds?.excessiveMeetingsWithRemoteRiskScore ?? 4;
  const multipleTeamsRiskScore = project?.decisionTree?.riskThresholds?.multipleTeamsRiskScore ?? 2;
  const noAsyncPolicyRiskScore = project?.decisionTree?.riskThresholds?.noAsyncPolicyRiskScore ?? 3;
  const meetingFatigueRiskScoreHigh = project?.decisionTree?.riskThresholds?.meetingFatigueRiskScoreHigh ?? 8;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 4;

  const workMode = getEffectiveWorkMode(project, organization);
  const meetingsPerWeek = project?.estimatedMeetingsPerWeek || project?.weeklyMeetingsCount || 0;
  const avgMeetingDuration = project?.averageMeetingDuration || 60;
  const involvedTeams = Array.isArray(project?.involvedTeams) ? project.involvedTeams.length : 0;
  const hasAsyncPolicy = Boolean(organization?.asyncFirstPolicy);

  // Condition 1: >15 meetings/week
  if (meetingsPerWeek > meetingFatigueThreshold) {
    riskScore += excessiveMeetingsWithRemoteRiskScore;
    dataPoints++;
  } else if (meetingsPerWeek > 0) {
    dataPoints++;
  }

  // Condition 2: Distributed teams (multiple teams involved)
  if (involvedTeams >= 3) {
    riskScore += multipleTeamsRiskScore;
    dataPoints++;
  } else if (involvedTeams > 0) {
    dataPoints++;
  }

  // Condition 3: Long and unproductive meetings (no async policy)
  if (!hasAsyncPolicy && meetingsPerWeek > 12) {
    riskScore += noAsyncPolicyRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }

  if (avgMeetingDuration > 90) {
    riskScore += 2;
    dataPoints++;
  } else if (avgMeetingDuration > 0) {
    dataPoints++;
  }

  // Determine severity
  if (riskScore >= meetingFatigueRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 6) {
    severity = 'medium-high';
  } else if (riskScore >= 4) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  // Only user-specified recommendations
  const confidence = dataPoints / totalDataPoints;

  return {
    type: 'meeting_fatigue',
    title: 'Meeting Fatigue',
    description: `${meetingsPerWeek} meetings/week (threshold: ${meetingFatigueThreshold}). ${involvedTeams} teams involved. ${!hasAsyncPolicy ? 'No async policy.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore,
      meetingFatigueRiskScoreHigh,
      meetingsPerWeek,
      meetingFatigueThreshold,
      involvedTeams
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Meetings/week: ${meetingsPerWeek}`,
      `Risk score: ${riskScore}/${meetingFatigueRiskScoreHigh}`,
      `Involved teams: ${involvedTeams}`,
      `Async policy: ${hasAsyncPolicy ? 'Yes' : 'No'}`,
      `Work mode: ${workMode}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 10, max: 25, description: 'Loss of deep work time' },
      budgetOverrun: { min: 8, max: 20, description: 'Reduced productivity' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Attendance declining', threshold: '< 80%', checkFrequency: 'weekly' },
      { signal: 'Complaints about calendars', threshold: '> 3 per month', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * RULE: Technostress Overload (Risk 27)
 * Detects stress from multiple tools, frequent tech changes, and lack of training
 * Thresholds:
 * - highToolCountThreshold: Number of tools threshold (default 5)
 * - excessiveToolsRiskScore, noToolTrainingRiskScore, frequentTechChangesRiskScore
 * - technostressRiskScoreHigh: HIGH severity threshold (default 9)
 */
function checkTechnostressOverload(project, teamAnalysis, organization) {
  const highToolCountThreshold = project?.decisionTree?.riskThresholds?.highToolCountThreshold ?? 5;
  const excessiveToolsRiskScore = project?.decisionTree?.riskThresholds?.excessiveToolsRiskScore ?? 4;
  const noToolTrainingRiskScore = project?.decisionTree?.riskThresholds?.noToolTrainingRiskScore ?? 3;
  const frequentTechChangesRiskScore = project?.decisionTree?.riskThresholds?.frequentTechChangesRiskScore ?? 2;
  const technostressRiskScoreHigh = project?.decisionTree?.riskThresholds?.technostressRiskScoreHigh ?? 9;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 3;

  const toolCount = organization?.digitalToolsCount || 0;
  const hasToolTraining = Boolean(organization?.providesToolTraining);
  const techComplexity = project?.technicalComplexity || 'medium';
  const hasFrequentChanges = Boolean(project?.hasFrequentTechChanges);

  // Condition 1: Multiple tools (>5)
  if (toolCount > 10) {
    riskScore += excessiveToolsRiskScore;
    dataPoints++;
  } else if (toolCount > highToolCountThreshold) {
    riskScore += 2;
    dataPoints++;
  } else if (toolCount > 0) {
    dataPoints++;
  }

  // Condition 2: Frequent tech changes
  if (hasFrequentChanges || techComplexity === 'high' || techComplexity === 'very_high') {
    riskScore += frequentTechChangesRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }

  // Condition 3: Lack of training
  if (!hasToolTraining && toolCount > highToolCountThreshold) {
    riskScore += noToolTrainingRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }

  // Determine severity
  if (riskScore >= technostressRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 6) {
    severity = 'medium-high';
  } else if (riskScore >= 4) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  // Only user-specified recommendations
  const confidence = dataPoints / totalDataPoints;

  return {
    type: 'technostress_overload',
    title: 'Technostress Overload',
    description: `${toolCount} tools (threshold: ${highToolCountThreshold}). ${!hasToolTraining ? 'No training.' : ''} ${hasFrequentChanges ? 'Frequent changes.' : ''}`,
    category: 'team',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore,
      technostressRiskScoreHigh,
      toolCount,
      highToolCountThreshold,
      hasToolTraining
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Digital tools: ${toolCount}`,
      `Risk score: ${riskScore}/${technostressRiskScoreHigh}`,
      `Tool training: ${hasToolTraining ? 'Yes' : 'No'}`,
      `Tech complexity: ${techComplexity}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 8, max: 18, description: 'Time wasted in context switching' },
      budgetOverrun: { min: 5, max: 15, description: 'Operational inefficiency' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Tool errors', threshold: '> 5 per week', checkFrequency: 'weekly' },
      { signal: 'Complaints about tools', threshold: '> 2 per month', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * NEW RULE: Innovation Decline in Remote Settings
 * Literature: Yang et al. (2021) Nature, Bloom et al. (2022)
 * Detects reduced creativity and innovation in distributed teams
 */
/**
 * RULE: Tool Fragmentation (Risk 31)
 * Detects information silos and context loss from too many disconnected tools
 * Thresholds:
 * - toolFragmentationThreshold: Number of main tools threshold (default 5)
 * - manyToolsFragmentationRiskScore, noToolIntegrationRiskScore, noSingleSourceOfTruthRiskScore
 * - fragmentationRiskScoreHigh: HIGH severity threshold (default 9)
 */
function checkToolFragmentation(project, teamAnalysis, organization) {
  const toolFragmentationThreshold = project?.decisionTree?.riskThresholds?.toolFragmentationThreshold ?? 5;
  const manyToolsFragmentationRiskScore = project?.decisionTree?.riskThresholds?.manyToolsFragmentationRiskScore ?? 4;
  const noToolIntegrationRiskScore = project?.decisionTree?.riskThresholds?.noToolIntegrationRiskScore ?? 3;
  const noSingleSourceOfTruthRiskScore = project?.decisionTree?.riskThresholds?.noSingleSourceOfTruthRiskScore ?? 3;
  const fragmentationRiskScoreHigh = project?.decisionTree?.riskThresholds?.fragmentationRiskScoreHigh ?? 9;  let riskScore = 0;
  let severity = 'low';
  let dataPoints = 0;
  const totalDataPoints = 3;

  const toolCount = organization?.digitalToolsCount || 0;
  const hasIntegration = Boolean(organization?.toolsAreIntegrated);
  const hasSingleSourceOfTruth = Boolean(organization?.hasSingleSourceOfTruth);

  // Condition: >5 main tools
  if (toolCount > 12) {
    riskScore += manyToolsFragmentationRiskScore;
    dataPoints++;
  } else if (toolCount > toolFragmentationThreshold) {
    riskScore += 2;
    dataPoints++;
  } else if (toolCount > 0) {
    dataPoints++;
  }

  if (!hasIntegration && toolCount > toolFragmentationThreshold) {
    riskScore += noToolIntegrationRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }

  if (!hasSingleSourceOfTruth) {
    riskScore += noSingleSourceOfTruthRiskScore;    dataPoints++;
  } else {
    dataPoints++;
  }

  // Determine severity
  if (riskScore >= fragmentationRiskScoreHigh) {
    severity = 'high';
  } else if (riskScore >= 6) {
    severity = 'medium-high';
  } else if (riskScore >= 4) {
    severity = 'medium';
  }

  if (severity === 'low') return null;

  // Only user-specified recommendation
  const confidence = dataPoints / totalDataPoints;

  return {
    type: 'tool_fragmentation',
    title: 'Tool Fragmentation',
    description: `${toolCount} tools (threshold: ${toolFragmentationThreshold}). ${!hasIntegration ? 'Not integrated.' : ''} ${!hasSingleSourceOfTruth ? 'No single source of truth.' : ''}`,
    category: 'management',
    severity,
    source: 'expert_rules_enhanced',
    thresholdDetails: {
      riskScore,
      fragmentationRiskScoreHigh,
      toolCount,
      toolFragmentationThreshold,
      hasIntegration
    },
    dataAvailability: `${dataPoints}/${totalDataPoints} data points available`,
    indicators: [
      `Tool count: ${toolCount}`,
      `Risk score: ${riskScore}/${fragmentationRiskScoreHigh}`,
      `Tools integrated: ${hasIntegration ? 'Yes' : 'No'}`,
      `Single source: ${hasSingleSourceOfTruth ? 'Yes' : 'No'}`
    ],
    predictedImpact: {
      scheduleDelay: { min: 10, max: 20, description: 'Time searching for information' },
      budgetOverrun: { min: 8, max: 18, description: 'Redundant licenses' },
      qualityImpact: 'medium',
      teamMoraleImpact: 'low'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Complaints "can\'t find X"', threshold: '> 5 per week', checkFrequency: 'weekly' },
      { signal: 'Duplicate documents', threshold: '> 3 per month', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * NEW RULE: Cultural Distance Risk (Hofstede)
 * Calculates cultural distance between involved countries using Hofstede's 6 dimensions
 */
function checkCulturalDistanceRisk(project, teamAnalysis) {  const indicators = [];
  
  const involvedCountries = project.involvedCountries || [];
  
  if (!involvedCountries || involvedCountries.length < 2) {
    return null; // Need at least 2 countries
  }
  
  // Calculate cultural distance for each pair of countries
  let totalDistance = 0;
  let maxPossibleDistance = 0;
  let minPossibleDistance = Number.MAX_VALUE;
  let validPairs = 0;
  
  // Find min and max distances in our database
  const allCountries = Object.keys(HOFSTEDE_DIMENSIONS);
  for (let i = 0; i < allCountries.length; i++) {
    for (let j = i + 1; j < allCountries.length; j++) {
      const distance = calculateCulturalDistance(allCountries[i], allCountries[j]);
      if (distance !== null) {
        if (distance > maxPossibleDistance) maxPossibleDistance = distance;
        if (distance < minPossibleDistance) minPossibleDistance = distance;
      }
    }
  }
  
  // Calculate actual distances for project countries
  for (let i = 0; i < involvedCountries.length; i++) {
    for (let j = i + 1; j < involvedCountries.length; j++) {
      const distance = calculateCulturalDistance(involvedCountries[i], involvedCountries[j]);
      if (distance !== null) {
        totalDistance += distance;
        validPairs++;
      } else {      }
    }
  }
  
  if (validPairs === 0) {
    return null; // No valid cultural distance data
  }
  
  indicators.push(`Countries: ${involvedCountries.join(', ')}`);
  indicators.push(`Total cultural distance: ${totalDistance.toFixed(2)}`);
  indicators.push(`Valid country pairs: ${validPairs}`);
  indicators.push(`Min possible distance: ${minPossibleDistance.toFixed(2)}`);
  indicators.push(`Max possible distance: ${maxPossibleDistance.toFixed(2)}`);
  
  // Classify into 5 intervals
  const riskLabel = classifyIntoFiveIntervals(totalDistance, minPossibleDistance * validPairs, maxPossibleDistance * validPairs);
  const severity = labelToSeverity(riskLabel);
  
  indicators.push(`Risk label: ${riskLabel}`);
  
  // Generate recommendations
  if (severity === 'high' || severity === 'medium-high') {  } else if (severity === 'medium') {  } else {  }
  
  if (severity === 'low') return null;
  
  return {
    type: 'cultural_distance_risk',
    title: 'Cultural Distance Risk',
    description: `Cultural distance between ${involvedCountries.length} countries is ${riskLabel.toLowerCase()}`,
    category: 'team',
    severity,
    source: 'expert_rules_hofstede',
    indicators,
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 25 : 15,
        description: 'Delays from cultural misunderstandings and conflicts'
      },
      budgetOverrun: {
        min: severity === 'high' ? 8 : 4,
        max: severity === 'high' ? 20 : 12,
        description: 'Extra time in conflict resolution and clarifications'
      },
      qualityImpact: severity === 'high' ? 'medium' : 'low',
      teamMoraleImpact: severity === 'high' ? 'high' : 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Cultural conflicts', threshold: '> 2 per month', checkFrequency: 'monthly' },
      { signal: 'Misunderstandings in communication', threshold: '> 3 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Team member isolation', threshold: 'subjective', checkFrequency: 'weekly' }
    ]
  };
}

/**
 * NEW RULE: Linguistic Distance Risk
 * Calculates linguistic distance based on official languages of countries vs project common language
 */
function checkLinguisticDistanceRisk(project, teamAnalysis) {  const indicators = [];
  const recommendations = [];
  
  const involvedCountries = project.involvedCountries || [];
  const commonLanguage = project.requiredLanguages?.[0];
  
  if (!involvedCountries || involvedCountries.length === 0) {
    return null;
  }
  
  if (!commonLanguage) {    return {
      type: 'linguistic_distance_no_common_language',
      title: 'No Common Language Defined',
      description: 'Project does not have a defined common language',
      category: 'coordination',
      severity: 'medium',
      source: 'expert_rules_linguistic',
    indicators,
      recommendations,
      predictedImpact: {
        scheduleDelay: { min: 5, max: 15, description: 'Communication delays' },
        budgetOverrun: { min: 5, max: 15, description: 'Translation and clarification costs' },
        qualityImpact: 'medium',
        teamMoraleImpact: 'medium'
      },
      earlyWarningSignals: [
        { signal: 'Language barriers', threshold: '> 2 per week', checkFrequency: 'weekly' }
      ]
    };
  }
  
  // Count countries where common language is spoken
  let score = 0;
  const N = involvedCountries.length;
  const normalizedLang = commonLanguage.toLowerCase();
  
  involvedCountries.forEach(country => {
    const languages = COUNTRY_LANGUAGES[country?.toLowerCase()] || [];
    const speaksCommonLang = languages.some(lang => 
      lang.toLowerCase().includes(normalizedLang) || normalizedLang.includes(lang.toLowerCase())
    );
    
    if (speaksCommonLang) {
      score += 1;
    } else {
    }
  });
  
  indicators.push(`Countries: ${involvedCountries.join(', ')}`);
  indicators.push(`Common language: ${commonLanguage}`);
  indicators.push(`Score: ${score} / ${N}`);
  
  // Classify based on intervals: 0-0.2N, 0.2N-0.4N, 0.4N-0.6N, 0.6N-0.8N, 0.8N-N
  let riskLabel;
  if (score <= 0.2 * N) {
    riskLabel = 'MUY ALTO';
  } else if (score <= 0.4 * N) {
    riskLabel = 'ALTO';
  } else if (score <= 0.6 * N) {
    riskLabel = 'NORMAL';
  } else if (score <= 0.8 * N) {
    riskLabel = 'BAJO';
  } else {
    riskLabel = 'MUY BAJO';
  }
  
  const severity = labelToSeverity(riskLabel);
  indicators.push(`Risk label: ${riskLabel}`);
  
  // Generate recommendations
  if (severity === 'high' || severity === 'medium-high') {  } else if (severity === 'medium') {  } else {  }
  
  // Check team language proficiency from team analysis
  const teamLanguages = teamAnalysis?.languages;
  if (teamLanguages && !teamLanguages.hasAllRequired) {  }
  
  if (severity === 'low') return null;
  
  return {
    type: 'linguistic_distance_risk',
    title: 'Linguistic Distance Risk',
    description: `Language alignment is ${riskLabel.toLowerCase()} (${score}/${N} countries speak ${commonLanguage})`,
    category: 'coordination',
    severity,
    source: 'expert_rules_linguistic',
    indicators,
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 15 : severity === 'medium-high' ? 10 : 5,
        max: severity === 'high' ? 30 : severity === 'medium-high' ? 20 : 12,
        description: 'Delays from translation and language barriers'
      },
      budgetOverrun: {
        min: severity === 'high' ? 10 : severity === 'medium-high' ? 6 : 3,
        max: severity === 'high' ? 25 : severity === 'medium-high' ? 15 : 10,
        description: 'Translation services and rework costs'
      },
      qualityImpact: severity === 'high' ? 'high' : severity === 'medium-high' ? 'medium' : 'low',
      teamMoraleImpact: severity === 'high' ? 'high' : 'medium'
    },
    recommendations,
    earlyWarningSignals: [
      { signal: 'Misunderstood requirements', threshold: '> 3 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Translation delays', threshold: '> 24h', checkFrequency: 'weekly' },
      { signal: 'Language complaints', threshold: '> 2 per month', checkFrequency: 'monthly' }
    ]
  };
}

/**
 * NEW RULE: Team Autonomy Risk
 * Evaluates risk based on required autonomy level (1-5 scale, inverse relationship)
 */
function checkTeamAutonomyRisk(project, teamAnalysis) {
  const autonomyLevel = project.requiredAutonomyLevel || project.autonomyRequirement;
  
  if (!autonomyLevel || typeof autonomyLevel !== 'number') {
    return null; // No autonomy data
  }  const indicators = [];
  const recommendations = [];
  
  // Convert 1-5 scale to risk label (inverse: 5=MUY ALTO risk, 1=MUY BAJO risk)
  let riskLabel;
  if (autonomyLevel === 5) {
    riskLabel = 'MUY ALTO';
  } else if (autonomyLevel === 4) {
    riskLabel = 'ALTO';
  } else if (autonomyLevel === 3) {
    riskLabel = 'NORMAL';
  } else if (autonomyLevel === 2) {
    riskLabel = 'BAJO';
  } else {
    riskLabel = 'MUY BAJO';
  }
  
  const severity = labelToSeverity(riskLabel);
  
  const labels = ['Nada necesario', 'Algo necesario', 'Moderadamente necesario', 'Bastante necesario', 'Completamente necesario'];
  const labelText = labels[autonomyLevel - 1] || 'Unknown';
  
  indicators.push(`Autonomy level: ${autonomyLevel}/5`);
  indicators.push(`Label: ${labelText}`);
  indicators.push(`Risk label: ${riskLabel}`);
  
  if (severity === 'high' || severity === 'medium-high') {  } else if (severity === 'medium') {  }
  
  if (severity === 'low') return null;
  
  return buildRiskFromCatalog('team_autonomy_risk', {
    severity,
    source: 'expert_rules_project_requirements',
    indicators,
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 10 : 5,
        max: severity === 'high' ? 25 : 15,
        description: 'Delays from insufficient self-direction'
      },
      budgetOverrun: {
        min: severity === 'high' ? 8 : 4,
        max: severity === 'high' ? 20 : 12,
        description: 'Extra oversight and course corrections'
      },
      qualityImpact: severity === 'high' ? 'medium' : 'low',
      teamMoraleImpact: 'medium'
    },
    earlyWarningSignals: [
      { signal: 'Delayed decisions', threshold: '> 48h for routine decisions', checkFrequency: 'weekly' },
      { signal: 'Escalations to management', threshold: '> 3 per sprint', checkFrequency: 'per sprint' },
      { signal: 'Direction requests', threshold: '> 5 per week', checkFrequency: 'weekly' }
    ]
  });
}

/**
 * NEW RULE: Schedule Flexibility Risk
 * Evaluates risk based on required schedule flexibility (1-5 scale, inverse relationship)
 */
function checkScheduleFlexibilityRisk(project, teamAnalysis) {
  const flexibilityLevel = project.requiredScheduleFlexibility || project.scheduleFlexibilityRequirement;
  
  if (!flexibilityLevel || typeof flexibilityLevel !== 'number') {
    return null;
  }  const indicators = [];
  const recommendations = [];
  
  // Convert 1-5 scale to risk label (inverse)
  let riskLabel;
  if (flexibilityLevel === 5) {
    riskLabel = 'MUY ALTO';
  } else if (flexibilityLevel === 4) {
    riskLabel = 'ALTO';
  } else if (flexibilityLevel === 3) {
    riskLabel = 'NORMAL';
  } else if (flexibilityLevel === 2) {
    riskLabel = 'BAJO';
  } else {
    riskLabel = 'MUY BAJO';
  }
  
  const severity = labelToSeverity(riskLabel);
  
  const labels = ['Nada necesario', 'Algo necesario', 'Moderadamente necesario', 'Bastante necesario', 'Completamente necesario'];
  const labelText = labels[flexibilityLevel - 1] || 'Unknown';
  
  indicators.push(`Flexibility level: ${flexibilityLevel}/5`);
  indicators.push(`Label: ${labelText}`);
  indicators.push(`Risk label: ${riskLabel}`);
  
  if (severity === 'high' || severity === 'medium-high') {  } else if (severity === 'medium') {  }
  
  if (severity === 'low') return null;
  
  return buildRiskFromCatalog('schedule_flexibility_risk', {
    severity,
    source: 'expert_rules_project_requirements',
    indicators,
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 8 : 4,
        max: severity === 'high' ? 20 : 12,
        description: 'Delays from availability mismatches'
      },
      budgetOverrun: {
        min: severity === 'high' ? 6 : 3,
        max: severity === 'high' ? 15 : 10,
        description: 'Overtime and coordination costs'
      },
      qualityImpact: 'low',
      teamMoraleImpact: severity === 'high' ? 'high' : 'medium'
    },
    earlyWarningSignals: [
      { signal: 'Schedule conflicts', threshold: '> 2 per week', checkFrequency: 'weekly' },
      { signal: 'Burnout indicators', threshold: '> 1 team member', checkFrequency: 'monthly' },
      { signal: 'Availability complaints', threshold: '> 3 per month', checkFrequency: 'monthly' }
    ]
  });
}

/**
 * NEW RULE: Travel Availability Risk
 * Evaluates risk based on required travel availability (1-5 scale, inverse relationship)
 */
function checkTravelAvailabilityRisk(project, teamAnalysis) {
  const travelLevel = project.requiredTravelAvailability || project.travelRequirement;
  
  if (!travelLevel || typeof travelLevel !== 'number') {
    return null;
  }  const indicators = [];
  const recommendations = [];
  
  // Convert 1-5 scale to risk label (inverse)
  let riskLabel;
  if (travelLevel === 5) {
    riskLabel = 'MUY ALTO';
  } else if (travelLevel === 4) {
    riskLabel = 'ALTO';
  } else if (travelLevel === 3) {
    riskLabel = 'NORMAL';
  } else if (travelLevel === 2) {
    riskLabel = 'BAJO';
  } else {
    riskLabel = 'MUY BAJO';
  }
  
  const severity = labelToSeverity(riskLabel);
  
  const labels = ['Nada necesario', 'Algo necesario', 'Moderadamente necesario', 'Bastante necesario', 'Completamente necesario'];
  const labelText = labels[travelLevel - 1] || 'Unknown';
  
  indicators.push(`Travel level: ${travelLevel}/5`);
  indicators.push(`Label: ${labelText}`);
  indicators.push(`Risk label: ${riskLabel}`);
  
  if (severity === 'high' || severity === 'medium-high') {  } else if (severity === 'medium') {  }
  
  if (severity === 'low') return null;
  
  return buildRiskFromCatalog('travel_availability_risk', {
    severity,
    source: 'expert_rules_project_requirements',
    indicators,
    predictedImpact: {
      scheduleDelay: {
        min: severity === 'high' ? 5 : 3,
        max: severity === 'high' ? 15 : 10,
        description: 'Delays from travel logistics'
      },
      budgetOverrun: {
        min: severity === 'high' ? 8 : 5,
        max: severity === 'high' ? 20 : 12,
        description: 'Travel costs and productivity loss'
      },
      qualityImpact: 'low',
      teamMoraleImpact: severity === 'high' ? 'high' : 'medium'
    },
    earlyWarningSignals: [
      { signal: 'Travel cancellations', threshold: '> 1 per month', checkFrequency: 'monthly' },
      { signal: 'Travel-related absences', threshold: '> 2 days per trip', checkFrequency: 'per trip' },
      { signal: 'Travel complaints', threshold: '> 2 per quarter', checkFrequency: 'quarterly' }
    ]
  });
}

/**
 * Helper function to build risks directly from the centralized catalog
 * Returns ONLY the minimal risk reference (type + severity + source).
 * @param {string} riskType - The type of risk from the catalog
 * @param {object} dynamicData - Dynamic runtime data (severity, source)
 * @returns {object|null} Minimal risk reference or null if not found in catalog
 */
function buildRiskFromCatalog(riskType, dynamicData = {}) {
  const catalogEntry = RISK_CATALOG[riskType];
  
  if (!catalogEntry) {
    console.warn(`Risk type '${riskType}' not found in catalog`);
    return null;
  }
  
  // Return ONLY the minimal risk reference.
  // Descriptions, recommendations, and any other metadata must be resolved from the catalog elsewhere.
  return {
    type: catalogEntry.type,
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
  
  const catalogMetadata = RISK_CATALOG[risk.type];
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
  predictRisksWithRules,
  checkCommunicationRisk,
  checkSkillGapRisk,
  checkTeamOverloadRisk,
  checkDependencyRisk,
  checkScopeCreepRisk,
  checkProcessRisk,
  checkKnowledgeManagementRisk,
  checkRemoteWorkSupportRisk,
  checkRoleClarityRisk,
  checkTimezoneSchedulingRisk,
  checkConflictEscalationRisk,
  checkChangeResistanceRisk,
  checkBurnoutSusceptibilityRisk,
  checkOnboardingIssues,
  checkSocialIsolation,
  checkDigitalFatigue,
  checkWorkLifeBoundaryBlur,
  checkMeetingFatigue,
  checkTechnostressOverload,
  checkToolFragmentation,
  buildRiskFromCatalog,
  enrichRiskWithCatalogMetadata,
  checkCulturalDistanceRisk,
  checkLinguisticDistanceRisk,
  checkTeamAutonomyRisk,
  checkScheduleFlexibilityRisk,
  checkTravelAvailabilityRisk,
  calculateTeamExperience,
  calculateTechMatch
};
