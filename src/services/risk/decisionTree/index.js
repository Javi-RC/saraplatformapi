const AppError = require('../../../utils/AppError');
const { getEffectiveDecisionTreeConfig, getSeverityScore, buildRiskFromCatalog, enrichRiskWithCatalogMetadata, calculateTeamExperience, calculateTechMatch } = require('./utils');
const { checkCommunicationRisk, checkToolFragmentation } = require('./rules/communication');
const { checkSocialIsolation, checkOnboardingIssues, checkTeamOverloadRisk, checkTeamAutonomyRisk, checkBurnoutSusceptibilityRisk } = require('./rules/team');
const { checkCulturalDistanceRisk, checkLinguisticDistanceRisk } = require('./rules/cultural');
const { checkDigitalFatigue, checkWorkLifeBoundaryBlur, checkMeetingFatigue, checkTechnostressOverload } = require('./rules/workload');
const { checkScopeCreepRisk, checkProcessRisk, checkDependencyRisk, checkSkillGapRisk, checkKnowledgeManagementRisk, checkRemoteWorkSupportRisk, checkRoleClarityRisk, checkTimezoneSchedulingRisk, checkChangeResistanceRisk, checkTravelAvailabilityRisk, checkScheduleFlexibilityRisk } = require('./rules/planning');
const { checkConflictEscalationRisk } = require('./rules/conflict');

/**
 * Main prediction function - applies all expert rules
 */
async function predictRisksWithRules(project, team, organization, otherProjects = []) {
  let risks = [];
  let enrichedRisks;
  
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
    throw new AppError('DECISION_TREE_PREDICTION_FAILED', 500, `Decision tree prediction failed: ${error.message}`);
  }
  
  return enrichedRisks;
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
