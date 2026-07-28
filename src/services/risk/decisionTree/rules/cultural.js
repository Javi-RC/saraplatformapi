const { HOFSTEDE_DIMENSIONS, COUNTRY_LANGUAGES, calculateCulturalDistance } = require('../hofstede');
const { classifyIntoFiveIntervals, labelToSeverity, recommendations } = require('../utils');

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

module.exports = {
  checkCulturalDistanceRisk,
  checkLinguisticDistanceRisk
};
