const { calculateTimeOverlap, binomialCoefficient } = require('../hofstede');
const { classifyTool, classifyIntoFiveIntervals, labelToSeverity, recommendations } = require('../utils');

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
      
      let pairScore;
      
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

module.exports = {
  checkCommunicationRisk,
  checkToolFragmentation
};
