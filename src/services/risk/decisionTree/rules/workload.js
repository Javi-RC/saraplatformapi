const { getEffectiveWorkMode, isRemotePredominant, recommendations } = require('../utils');

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

module.exports = {
  checkDigitalFatigue,
  checkWorkLifeBoundaryBlur,
  checkMeetingFatigue,
  checkTechnostressOverload
};
