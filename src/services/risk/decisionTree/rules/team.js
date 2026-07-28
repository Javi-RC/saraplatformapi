const { labelToSeverity, buildRiskFromCatalog, getEffectiveWorkMode, isRemotePredominant, recommendations } = require('../utils');

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
  recommendations.push('Define clear workload limits');
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

module.exports = {
  checkSocialIsolation,
  checkOnboardingIssues,
  checkTeamOverloadRisk,
  checkTeamAutonomyRisk,
  checkBurnoutSusceptibilityRisk
};
