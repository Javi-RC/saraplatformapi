const { getEffectiveWorkMode, isOfficePredominant, labelToSeverity, buildRiskFromCatalog, recommendations } = require('../utils');

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
  maturityScore += distributedExp === 'high' ? 1 : (distributedExp === 'medium' ? 0.5 : 0);  let severity;
  
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
  const riskScore = involvedTeams + (criticalDeps * 0.5);  let severity;
  
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

  let severity = 'low';
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

  let severity = 'low';
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
  recommendations.push('Limit simultaneous changes');

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

module.exports = {
  checkScopeCreepRisk,
  checkProcessRisk,
  checkDependencyRisk,
  checkSkillGapRisk,
  checkKnowledgeManagementRisk,
  checkRemoteWorkSupportRisk,
  checkRoleClarityRisk,
  checkTimezoneSchedulingRisk,
  checkChangeResistanceRisk,
  checkTravelAvailabilityRisk,
  checkScheduleFlexibilityRisk
};
