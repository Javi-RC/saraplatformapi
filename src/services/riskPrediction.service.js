/**
 * Risk Prediction Service (Orchestrator)
 * Combines Decision Tree + CBR with adaptive weights
 * Main entry point for risk prediction system
 */

const Risk = require('../models/risk.model');
const CaseBase = require('../models/caseBase.model');
const Project = require('../models/project.model');
const User = require('../models/user.model');
const decisionTreeService = require('./decisionTree.service');
const cbrService = require('./cbr.service');
const teamAnalysisService = require('./teamAnalysis.service');
const { getRiskMetadata, getAllRiskTypes } = require('../config/riskCatalog');
const { getConfigSection } = require('../config/teamSelectionDefaults');
const i18n = require('../i18n/i18n.service');

const CATALOG_TYPES = new Set(getAllRiskTypes());
const ALLOWED_CATEGORIES = new Set([
  'coordination',
  'technical',
  'team',
  'management',
  'organizational',
  'other'
]);

function isCatalogRiskType(type) {
  return CATALOG_TYPES.has(type);
}

function normalizeRiskFromCatalog(risk, lang = 'es') {
  console.log(`[RiskPrediction] Normalizing risk ${risk?.type} with lang: ${lang}`);
  
  const metadata = getRiskMetadata(risk?.type);
  const translated = i18n.translateRisk(risk?.type, lang);
  
  console.log(`[RiskPrediction] Translated title for ${risk?.type}:`, translated?.title);

  // Get translated recommendations from i18n, not from catalog (which is in Spanish)
  const translatedRecommendations = i18n.translateRecommendations(risk?.type, lang);
  const recommendations = Array.isArray(translatedRecommendations) && translatedRecommendations.length > 0
    ? translatedRecommendations
    : [];

  return {
    ...risk,
    title: translated?.title || risk?.title,
    description: translated?.description || risk?.description,
    category: metadata?.category || risk?.category || 'management',
    recommendations
  };
}

/**
 * Helper function to extract organization ID
 * Handles both populated and non-populated organization fields
 */
function getOrganizationId(organization) {
  if (!organization) return null;
  return organization._id || organization;
}

/**
 * Main prediction function - orchestrates Decision Tree + CBR
 * Now includes full team analysis (CVs, BFI-44, organization context)
 * @param {string} projectId - Project ID
 * @param {string} lang - Language code for translations (es, en)
 */
async function predictProjectRisks(projectId, lang = 'es') {
  try {
    console.log(`[RiskPrediction] Starting prediction with language: ${lang}`);
    
    const teamAnalysis = await teamAnalysisService.getTeamAnalysis(projectId);
    
    const { project, team, organization, otherProjects } = teamAnalysis;
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const organizationId = getOrganizationId(project.organization);
    const caseBaseStats = await CaseBase.getCaseBaseStats(organizationId);
    
    const treeRisks = await decisionTreeService.predictRisksWithRules(
      project,
      team,
      organization,
      otherProjects,
      lang
    );
    
    let cbrResult = { risks: [], confidence: 0, similarCases: [] };
    console.log(`[RiskPrediction] Case base size: ${caseBaseStats.total}`);
    
    // Only execute CBR if we have at least 10 cases (Phase 2+)
    if (caseBaseStats.total >= 10) {
      cbrResult = await cbrService.predictRisksWithCBR(
        project,
        organizationId,
        5,  // k parameter (will be overridden by config if present)
        team,
        lang
      );
      console.log(`[RiskPrediction] CBR returned ${cbrResult.risks.length} risks`);
    } else {
      console.log('[RiskPrediction] Skipping CBR - Phase 1 (fewer than 10 cases)');
    }
    
    const riskAnalysis = combineRisks(
      treeRisks,
      cbrResult.risks,
      lang
    );
    
    const normalizedCbrRisks = riskAnalysis.cbrRisks.map(r => normalizeRiskFromCatalog(r, lang));
    const normalizedDtRisks = riskAnalysis.dtRisks.map(r => normalizeRiskFromCatalog(r, lang));
    
    console.log(`[RiskPrediction] Normalized risks: CBR=${normalizedCbrRisks.length}, DT=${normalizedDtRisks.length}`);

    // Apply phase-based strategy to combine risks
    const phaseResult = applyPhaseStrategy(
      normalizedDtRisks, 
      normalizedCbrRisks, 
      caseBaseStats.total,
      project
    );
    
    let finalRisks = phaseResult.finalRisks;
    console.log(`[RiskPrediction] Phase ${phaseResult.phase} (${phaseResult.strategy}): ${finalRisks.length} risks after strategy`);
    
    // Store DT risks separately for PM selection interface
    project._dtIndicators = normalizedDtRisks;
    project._cbrRisks = normalizedCbrRisks;

    console.log(`[RiskPrediction] Final risks: ${finalRisks.length}`);

    
    finalRisks = await addTeamInsufficientRisks(finalRisks, project, lang);

    // Ensure recommendations always come from the catalog (typicalRecommendations)
    // before persisting and returning results.
    finalRisks = finalRisks.map(r => normalizeRiskFromCatalog(r, lang));
    
    const teamInsights = generateTeamInsights(team, organization);
    
    await saveRiskPredictions(project, finalRisks, {
      caseBaseSize: caseBaseStats.total,
      similarCasesCount: cbrResult.similarCases?.length || 0,
      similarCases: cbrResult.similarCases || [],
      phase: phaseResult.phase,
      strategy: phaseResult.strategy
    });
    
    return {
      projectId: project._id,
      projectName: project.projectName,
      risks: finalRisks,
      cbrRisks: normalizedCbrRisks,
      dtRisks: normalizedDtRisks,
      metadata: {
        caseBaseSize: caseBaseStats.total,
        phase: phaseResult.phase,
        strategy: phaseResult.strategy,
        phaseDescription: getPhaseDescription(phaseResult.phase, caseBaseStats.total, lang),
        sources: {
          decisionTree: treeRisks.length,
          cbr: cbrResult.risks.length,
          final: finalRisks.length
        },
        similarCases: cbrResult.similarCases || [],
        caseBaseStats: {
          total: caseBaseStats.total,
          byType: caseBaseStats.byType
        },
        teamInsights
      },
      message: generateMessage(caseBaseStats.total, phaseResult.phase, phaseResult.strategy, lang)
    };
    
  } catch (error) {
    console.error('Error in risk prediction:', error);
    throw new Error(`Risk prediction failed: ${error.message}`);
  }
}

/**
 * Add team insufficiency risks to the prediction
 * @param {Array} existingRisks - Current risks from DT and CBR
 * @param {Object} project - Project data
 * @param {string} lang - Language code for translations
 * @returns {Array} Risks with team insufficiency added
 */
async function addTeamInsufficientRisks(existingRisks, project, lang = 'es') {
  try {
    const teamSelectionService = require('./teamSelection.service');
    
    if (!project.assignedEmployees || project.assignedEmployees.length === 0) {
      return existingRisks;
    }

    // Use team size defined by PM when creating the project
    const teamSize = project.teamSize || 5;
    const organizationId = getOrganizationId(project.organization);
    const { team, metadata } = await teamSelectionService.selectOptimalTeam(
      project,
      organizationId,
      teamSize
    );

    const summary = teamSelectionService.getTeamSummary(team, metadata);
    const teamRisks = teamSelectionService.generateTeamRisks(metadata, summary, project);

    const riskMap = new Map();
    
    existingRisks.forEach(risk => {
      const key = `${risk.type}_${risk.title}`;
      riskMap.set(key, risk);
    });

    teamRisks.forEach(teamRisk => {
      const key = `${teamRisk.type}_${teamRisk.title}`;
      
      if (riskMap.has(key)) {
        const existing = riskMap.get(key);
        // Don't modify similarity - only CBR has similarity
        
        if (!existing.reasoning) existing.reasoning = [];
        existing.reasoning.push(`Team selection analysis: ${teamRisk.description}`);
        
        if (teamRisk.recommendations) {
          const existingRecommendations = Array.isArray(existing.recommendations) ? existing.recommendations : [];
          const incomingRecommendations = Array.isArray(teamRisk.recommendations) ? teamRisk.recommendations : [];

          existing.recommendations = [
            ...new Set([...existingRecommendations, ...incomingRecommendations])
          ];
        }
      } else {
        // Translate the new team risk
        const translated = i18n.translateRisk(teamRisk.type, lang);
        const normalizedRisk = {
          type: teamRisk.type,
          title: translated?.title || teamRisk.title,
          description: translated?.description || teamRisk.description,
          category: 'team',
          severity: teamRisk.severity,
          source: 'expert_rules',
          reasoning: [teamRisk.description],
          indicators: [],
          predictedImpact: {
            qualityImpact: 'medium',
            teamMoraleImpact: 'medium'
          },
          recommendations: teamRisk.recommendations || [],
          earlyWarningSignals: [],
          basedOnCases: []
        };
        riskMap.set(key, normalizedRisk);
      }
    });

    return Array.from(riskMap.values());
  } catch (error) {
    console.error('Error adding team insufficient risks:', error);
    return existingRisks;
  }
}

/**
 * Apply phase-based strategy to combine DT and CBR risks
 * 4 Phases based on case base maturity
 */
function applyPhaseStrategy(dtRisks, cbrRisks, caseCount, project) {
  const cbrConfig = getConfigSection(project, 'cbr');
  const minSimilarity = cbrConfig.minSimilarityThreshold || 0.3;
  
  // Filter CBR risks by similarity threshold
  const filteredCBR = cbrRisks.filter(r => r.similarity >= minSimilarity);
  
  if (caseCount < 10) {
    // Phase 1: DT only (insufficient cases for CBR)
    return {
      finalRisks: dtRisks,
      phase: 1,
      strategy: 'dt_only'
    };
  }
  
  if (caseCount < 20) {
    // Phase 2: DT + CBR (DT wins duplicates)
    let combined = [...dtRisks];
    filteredCBR.forEach(cbr => {
      if (!dtRisks.some(dt => dt.type === cbr.type)) {
        combined.push(cbr);
      }
    });
    return {
      finalRisks: combined,
      phase: 2,
      strategy: 'dt_priority'
    };
  }
  
  if (caseCount < 40) {
    // Phase 3: CBR + DT (CBR wins duplicates)
    let combined = [...filteredCBR];
    dtRisks.forEach(dt => {
      if (!filteredCBR.some(cbr => cbr.type === dt.type)) {
        combined.push(dt);
      }
    });
    return {
      finalRisks: combined,
      phase: 3,
      strategy: 'cbr_priority'
    };
  }
  
  // Phase 4: CBR only (mature case base)
  return {
    finalRisks: filteredCBR,
    phase: 4,
    strategy: 'cbr_only'
  };
}

/**
 * Get human-readable description for current phase
 * @param {number} phase - Phase number (1-4)
 * @param {number} caseCount - Number of cases
 * @param {string} lang - Language code
 */
function getPhaseDescription(phase, caseCount, lang = 'es') {
  return i18n.translatePhaseDescription(phase, caseCount, lang);
}

/**
 * Combine risks from Decision Tree and CBR
 * Now only formats and separates - actual combination is done by applyPhaseStrategy
 * @param {Array} treeRisks - Risks from decision tree
 * @param {Array} cbrRisks - Risks from CBR
 * @param {string} lang - Language code for translations
 */
function combineRisks(treeRisks, cbrRisks, lang = 'es') {
  // NEW ARCHITECTURE: Separate DT indicators from CBR similarities
  // - DT provides detection indicators (what CAN happen based on patterns)
  // - CBR provides similarity (what DID happen in similar cases)
  // - PM selection layer filters by similarity threshold
  
  // Format DT risks: Sort by severity (confidence-based indicators)
  const dtRisks = treeRisks.map(risk => {
    const translated = i18n.translateRisk(risk.type, lang);
    return {
      type: risk.type,
      title: translated?.title || risk.title,
      description: translated?.description || risk.description,
      category: risk.category,
      severity: risk.severity,  // No similarity - just severity
      source: 'expert_rules',
      reasoning: risk.reasoning,
      type: risk.type,
      title: translated?.title || risk.title,
      description: translated?.description || risk.description,
      category: risk.category,
      severity: risk.severity,  // No similarity - just severity
      source: 'expert_rules',
      reasoning: risk.reasoning,
      indicators: risk.indicators,  // What indicators triggered this
      predictedImpact: risk.predictedImpact,
      recommendations: risk.recommendations,
      earlyWarningSignals: risk.earlyWarningSignals || []
    };
  }).sort((a, b) => {
    const scoreA = getSeverityScore(a.severity);
    const scoreB = getSeverityScore(b.severity);
    return scoreB - scoreA;
  });
  
  // Format CBR risks: Sort by similarity
  const cbrRisksFormatted = cbrRisks.map(risk => {
    const translated = i18n.translateRisk(risk.type, lang);
    return {
      type: risk.type,
      title: translated?.title || risk.title,
      description: translated?.description || risk.description,
      category: risk.category,
      severity: risk.severity,
      similarity: risk.similarity,  // CBR similarity = avg(similarityScores)
      source: 'cbr',
      reasoning: risk.reasoning,
      recommendations: risk.recommendations,
      basedOnCases: risk.basedOnCases || [],
      similarityBreakdown: risk.similarityBreakdown,
      predictedImpact: risk.predictedImpact
    };
  }).sort((a, b) => b.similarity - a.similarity);
  
  // Return separate structures - not merged
  // Frontend can filter/combine as needed
  return {
    dtRisks: dtRisks,          // DT detections (no similarity)
    cbrRisks: cbrRisksFormatted,  // CBR learned risks (similarity score)
    detectionSummary: {
      dtCount: dtRisks.length,
      cbrCount: cbrRisksFormatted.length,
      commonTypes: getCommonRiskTypes(dtRisks, cbrRisksFormatted)
    }
  };
}

/**
 * Get risk types detected by both DT and CBR
 */
function getCommonRiskTypes(dtRisks, cbrRisks) {
  const dtTypes = new Set(dtRisks.map(r => r.type));
  const cbrTypes = new Set(cbrRisks.map(r => r.type));
  return Array.from(new Set(
    [...dtRisks, ...cbrRisks]
      .filter(r => dtTypes.has(r.type) && cbrTypes.has(r.type))
      .map(r => r.type)
  ));
}

/**
 * Merge recommendations from different sources
 */
function mergeRecommendations(recs1 = [], recs2 = []) {
  const uniqueRecs = new Set([...recs1, ...recs2]);
  return Array.from(uniqueRecs).slice(0, 7); // Max 7 recommendations
}

/**
 * Compare severity levels
 */
function compareSeverity(sev1, sev2) {
  const severityOrder = ['low', 'medium', 'medium-high', 'high', 'critical'];
  const idx1 = severityOrder.indexOf(sev1);
  const idx2 = severityOrder.indexOf(sev2);
  return idx1 - idx2;
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
 * Save risk predictions to database
 */
async function saveRiskPredictions(project, risks, metadata) {
  const organizationId = getOrganizationId(project.organization);
  
  await Risk.deleteMany({ project: project._id, occurred: null });

  const riskDocs = risks.map(risk => {
    if (!isCatalogRiskType(risk.type)) {
      console.warn(`[RiskPrediction] Saving custom risk type: ${risk.type}`);
    }

    const category = ALLOWED_CATEGORIES.has(risk.category)
      ? risk.category
      : 'other';

    return {
    project: project._id,
    organization: organizationId,
    type: risk.type || 'other',
    title: risk.title || 'Unknown Risk',
    description: risk.description || 'No description available',
    category,
    severity: risk.severity,
    similarity: risk.similarity,
    source: risk.source,
    reasoning: risk.reasoning || [],
    indicators: risk.indicators || [],
    basedOnCases: risk.basedOnCases?.map(bc => ({
      caseId: bc.caseId,
      similarity: bc.similarity,
      description: bc.description
    })) || [],
    similarityBreakdown: risk.similarityBreakdown,
    predictedImpact: risk.predictedImpact,
    recommendations: risk.recommendations || [],
    earlyWarningSignals: risk.earlyWarningSignals || [],
    status: 'predicted'
  };
  });
  
  const savedRisks = await Risk.insertMany(riskDocs);
  console.log(`[RiskPrediction] Saved ${savedRisks.length} risks to database`);
  
  await Project.findByIdAndUpdate(project._id, {
    $set: {
      'riskPredictionMetadata': {
        predictedAt: new Date(),
        caseBaseSize: metadata.caseBaseSize,
        similarCasesCount: metadata.similarCasesCount,
        similarCases: metadata.similarCases || [],  // Save similar cases for GET endpoint
        treeWeight: metadata.treeWeight,
        cbrWeight: metadata.cbrWeight
      },
      riskPredictions: savedRisks.map(r => r._id)
    }
  });
  
  return savedRisks;
}

/**
 * Generate user-friendly message based on phase strategy
 */
function generateMessage(caseCount, phase, strategy, lang = 'es') {
  const messages = {
    es: {
      dt_only: `Sistema en fase inicial: ${caseCount} casos guardados. Predicción basada en reglas expertas.`,
      dt_priority: `Sistema en desarrollo: ${caseCount} casos guardados. Combinando reglas expertas (prioritarias) con experiencia histórica.`,
      cbr_priority: `Sistema maduro: ${caseCount} casos guardados. Priorizando experiencia de proyectos similares.`,
      cbr_only: `Sistema experto: ${caseCount} casos guardados. Predicción basada en experiencia histórica.`
    },
    en: {
      dt_only: `System in initial phase: ${caseCount} cases stored. Prediction based on expert rules.`,
      dt_priority: `System in development: ${caseCount} cases stored. Combining expert rules (priority) with historical experience.`,
      cbr_priority: `Mature system: ${caseCount} cases stored. Prioritizing experience from similar projects.`,
      cbr_only: `Expert system: ${caseCount} cases stored. Prediction based on historical experience.`
    }
  };
  
  const langMessages = messages[lang] || messages.es;
  return langMessages[strategy] || `${caseCount} cases stored in the system.`;
}

/**
 * Get risk predictions for a project
 */
async function getProjectRiskPredictions(projectId, options = {}) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  
  const risks = await Risk.getProjectRisks(projectId, options);
  
  return {
    projectId,
    projectName: project.projectName,
    risks,
    metadata: project.riskPredictionMetadata || {},
    summary: generateRiskSummary(risks)
  };
}

/**
 * Generate risk summary statistics
 */
function generateRiskSummary(risks) {
  const summary = {
    total: risks.length,
    bySeverity: {
      critical: 0,
      high: 0,
      'medium-high': 0,
      medium: 0,
      low: 0
    },
    byCategory: {},
    highPriority: [],
    avgSimilarity: 0
  };
  
  let similarityCount = 0;
  
  risks.forEach(risk => {
    summary.bySeverity[risk.severity]++;
    
    summary.byCategory[risk.category] = (summary.byCategory[risk.category] || 0) + 1;
    
    // High priority: high severity and high similarity
    if (['high', 'critical'].includes(risk.severity)) {
      const hasHighSimilarity = risk.similarity && risk.similarity > 0.7;
      
      if (hasHighSimilarity) {
        summary.highPriority.push({
          type: risk.type,
          severity: risk.severity,
          similarity: risk.similarity
        });
      }
    }
    
    // Only add similarity if it exists (CBR risks)
    if (risk.similarity !== undefined && risk.similarity !== null) {
      summary.avgSimilarity += risk.similarity;
      similarityCount++;
    }
  });
  
  if (similarityCount > 0) {
    summary.avgSimilarity /= similarityCount;
  }
  
  return summary;
}

/**
 * Get organization risk insights
 */
async function getOrganizationRiskInsights(organizationId) {
  const [riskStats, caseBaseStats] = await Promise.all([
    Risk.getOrganizationStats(organizationId),
    CaseBase.getCaseBaseStats(organizationId)
  ]);
  
  const accuracyReport = await Risk.getAccuracyReport(organizationId);
  
  return {
    overview: {
      totalPredictions: riskStats.total,
      predictionsEvaluated: accuracyReport.totalEvaluated,
      avgAccuracy: accuracyReport.avgAccuracy
    },
    caseBase: {
      totalCases: caseBaseStats.total,
      byType: caseBaseStats.byType,
      totalReuses: caseBaseStats.totalReuses
    },
    riskDistribution: {
      bySeverity: riskStats.bySeverity,
      byType: riskStats.byType
    },
    accuracy: accuracyReport,
    recommendations: generateSystemRecommendations(caseBaseStats, accuracyReport)
  };
}

/**
 * Generate team analysis insights for report
 */
function generateTeamInsights(team, organization) {
  const insights = [];
  
  // Validar que team existe y tiene estructura válida
  if (!team) {
    return insights;
  }

  if (team.technicalMatch) {
    if (team.technicalMatch.missing && team.technicalMatch.missing.length > 0) {
      insights.push({
        type: 'skill_gap',
        severity: 'high',
        message: `Team lacks: ${team.technicalMatch.missing.join(', ')}`,
        recommendation: 'Hire specialists or urgent training plan'
      });
    }
    
    const matchPercentage = Number(team.technicalMatch.matchPercentage);
    if (Number.isFinite(matchPercentage) && matchPercentage < 70) {
      insights.push({
        type: 'low_match',
        severity: 'medium',
        message: `Technical match only ${matchPercentage.toFixed(1)}%`,
        recommendation: 'Review team assignment or simplify technical requirements'
      });
    }
  }
  
  // Experience insights
  if (team.experienceMatch && team.experienceMatch.gap > 0) {
    insights.push({
      type: 'experience_gap',
      severity: 'high',
      message: `Required level ${team.experienceMatch.required}, team has ${team.experienceMatch.actual}`,
      recommendation: 'Add senior mentors or reduce complexity'
    });
  }
  
  // Language insights
  if (team.languages && !team.languages.hasAllRequired) {
    insights.push({
      type: 'language_barrier',
      severity: 'high',
      message: `Missing languages: ${team.languages.missingLanguages?.join(', ') || 'several'}`,
      recommendation: 'Hire members with required languages or provide translation'
    });
  }
  
  // Workload insights
  if (team.workload && team.workload.isOverloaded) {
    insights.push({
      type: 'team_overload',
      severity: 'high',
      message: `${team.workload.overloadedMembers || 0} overloaded members`,
      recommendation: 'Redistribute workload or add resources'
    });
  }
  
  // Personality insights
  if (team.personality && team.personality.concerns && Array.isArray(team.personality.concerns) && team.personality.concerns.length > 0) {
    team.personality.concerns.forEach(concern => {
      insights.push({
        type: 'personality_concern',
        severity: 'medium',
        message: concern.description || concern,
        recommendation: 'Consider team dynamics and conflict management'
      });
    });
  }
  
  // Organization insights
  if (organization) {
    if (organization.maturity === 'low' || organization.maturity === 'ad_hoc') {
      insights.push({
        type: 'org_maturity',
        severity: 'medium',
        message: 'Organization with low process maturity',
        recommendation: 'Establish basic processes and standard tools'
      });
    }
    
    if (!organization.hasVersionControl) {
      insights.push({
        type: 'no_version_control',
        severity: 'high',
        message: 'Organization without version control',
        recommendation: 'Implement Git immediately'
      });
    }
  }
  
  return insights;
}

/**
 * Generate system improvement recommendations
 */
function generateSystemRecommendations(caseBaseStats, accuracyReport) {
  const recommendations = [];
  
  if (caseBaseStats.total < 10) {
    recommendations.push({
      type: 'data_collection',
      priority: 'high',
      message: 'Complete more projects and capture their results to improve predictions',
      action: 'Make sure to report outcomes of completed projects'
    });
  }
  
  if (accuracyReport.avgAccuracy < 0.7 && accuracyReport.totalEvaluated > 5) {
    recommendations.push({
      type: 'accuracy',
      priority: 'high',
      message: 'Prediction accuracy below 70%',
      action: 'Review quality of project data and reported outcomes'
    });
  }
  
  if (accuracyReport.falsePositives > accuracyReport.correctPredictions * 0.5) {
    recommendations.push({
      type: 'false_positives',
      priority: 'medium',
      message: 'High false positive rate - system may be too conservative',
      action: 'Consider adjusting similarity thresholds'
    });
  }
  
  if (caseBaseStats.total > 30) {
    recommendations.push({
      type: 'success',
      priority: 'info',
      message: 'System has a mature case base - predictions based on proven experience',
      action: 'Continue reporting project outcomes'
    });
  }
  
  return recommendations;
}

module.exports = {
  predictProjectRisks,
  getProjectRiskPredictions,
  getOrganizationRiskInsights,
  combineRisks
};
