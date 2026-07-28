const { buildRiskFromCatalog } = require('../utils');

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

module.exports = {
  checkConflictEscalationRisk
};
