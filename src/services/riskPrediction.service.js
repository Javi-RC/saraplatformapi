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
 */
async function predictProjectRisks(projectId) {
  try {
    // 1. Get complete team analysis (includes CVs, BFI-44, org context, workload)
    const teamAnalysis = await teamAnalysisService.getTeamAnalysis(projectId);
    
    const { project, team, organization, otherProjects } = teamAnalysis;
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // 2. Get case base statistics
    const organizationId = getOrganizationId(project.organization);
    const caseBaseStats = await CaseBase.getCaseBaseStats(organizationId);
    
    // 3. Calculate adaptive weights based on case base maturity
    const weights = calculateAdaptiveWeights(caseBaseStats);
    
    // 4. Predict with Decision Tree (now using full team analysis)
    const treeRisks = await decisionTreeService.predictRisksWithRules(
      project,
      team, // Complete team analysis with CVs, BFI-44, skills, experience
      organization, // Organization context with maturity, practices
      otherProjects
    );
    
    // 5. Predict with CBR (if case base has data)
    let cbrResult = { risks: [], confidence: 0, similarCases: [] };
    if (caseBaseStats.total > 0) {
      cbrResult = await cbrService.predictRisksWithCBR(
        project,
        organizationId,
        5, // top 5 similar cases
        team // Pass team analysis for better similarity calculation
      );
    }
    
    // 6. Combine predictions
    const combinedRisks = combineRisks(
      treeRisks,
      cbrResult.risks,
      weights.treeWeight,
      weights.cbrWeight
    );
    
    // 7. Revise with both systems
    let finalRisks = cbrService.reviseWithTreeRules(combinedRisks, treeRisks);
    
    // 7.5. Add team insufficiency risks if applicable
    finalRisks = await addTeamInsufficientRisks(finalRisks, project);
    
    // 8. Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(
      weights,
      cbrResult.confidence,
      caseBaseStats
    );
    
    // 9. Add team analysis insights to metadata
    const teamInsights = generateTeamInsights(team, organization);
    
    // 10. Save predictions to database
    await saveRiskPredictions(project, finalRisks, {
      caseBaseSize: caseBaseStats.total,
      confidence: overallConfidence,
      similarCasesCount: cbrResult.similarCases?.length || 0,
      treeWeight: weights.treeWeight,
      cbrWeight: weights.cbrWeight
    });
    
    // 12. Return comprehensive result
    return {
      projectId: project._id,
      projectName: project.projectName,
      risks: finalRisks,
      metadata: {
        overallConfidence,
        caseBaseSize: caseBaseStats.total,
        weights: {
          decisionTree: weights.treeWeight,
          cbr: weights.cbrWeight
        },
        sources: {
          decisionTree: treeRisks.length,
          cbr: cbrResult.risks.length,
          combined: finalRisks.length
        },
        similarCases: cbrResult.similarCases || [],
        systemPhase: getSystemPhase(caseBaseStats.total),
        caseBaseStats: {
          total: caseBaseStats.total,
          avgQuality: caseBaseStats.avgQualityScore,
          diversityIndex: caseBaseStats.diversityIndex
        },
        teamInsights
      },
      message: generateMessage(caseBaseStats.total, overallConfidence)
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
 * @returns {Array} Risks with team insufficiency added
 */
async function addTeamInsufficientRisks(existingRisks, project) {
  try {
    const teamSelectionService = require('./teamSelection.service');
    
    // Si no hay equipo asignado, intentar generar uno para análisis
    if (!project.assignedEmployees || project.assignedEmployees.length === 0) {
      console.log('No team assigned, skipping team insufficiency check');
      return existingRisks;
    }

    // Analizar el equipo actual
    const teamSize = project.estimatedTeamSize || 5;
    const organizationId = getOrganizationId(project.organization);
    const { team, metadata } = await teamSelectionService.selectOptimalTeam(
      project,
      organizationId,
      teamSize
    );

    const summary = teamSelectionService.getTeamSummary(team, metadata);
    const teamRisks = teamSelectionService.generateTeamRisks(metadata, summary, project);

    // Combinar riesgos existentes con riesgos de equipo
    // Evitar duplicados por tipo
    const riskMap = new Map();
    
    // Agregar riesgos existentes
    existingRisks.forEach(risk => {
      const key = `${risk.type}_${risk.title}`;
      riskMap.set(key, risk);
    });

    // Agregar o actualizar con riesgos de equipo
    teamRisks.forEach(teamRisk => {
      const key = `${teamRisk.type}_${teamRisk.title}`;
      
      if (riskMap.has(key)) {
        // Si ya existe, aumentar la probabilidad y confianza
        const existing = riskMap.get(key);
        existing.probability = Math.min(existing.probability + 0.2, 1.0);
        existing.confidence = Math.min(existing.confidence + 0.1, 1.0);
        
        // Agregar reasoning de equipo insuficiente
        if (!existing.reasoning) existing.reasoning = [];
        existing.reasoning.push(`Team selection analysis: ${teamRisk.description}`);
        
        // Combinar recomendaciones
        if (teamRisk.recommendations) {
          existing.recommendations = [
            ...new Set([...existing.recommendations, ...teamRisk.recommendations])
          ];
        }
      } else {
        // Normalizar estructura del riesgo de team selection para que coincida con el schema
        const normalizedRisk = {
          type: teamRisk.type,
          title: teamRisk.title,
          description: teamRisk.description,
          category: 'team', // Los riesgos de team selection son de categoría 'team'
          severity: teamRisk.severity,
          probability: teamRisk.probability,
          confidence: teamRisk.confidence,
          source: 'expert_rules',
          reasoning: [teamRisk.description],
          indicators: [],
          // Convertir impact a predictedImpact
          predictedImpact: {
            scheduleDelay: {
              min: 5,
              max: 20,
              description: teamRisk.impact?.schedule || 'Impact on schedule'
            },
            budgetOverrun: {
              min: 5,
              max: 15,
              description: teamRisk.impact?.cost || 'Impact on budget'
            },
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
 * Calculate adaptive weights based on case base maturity
 */
function calculateAdaptiveWeights(caseBaseStats) {
  const caseCount = caseBaseStats.total;
  const avgQuality = caseBaseStats.avgQualityScore || 0.5;
  const diversity = caseBaseStats.diversityIndex || 0.5;
  
  let treeWeight, cbrWeight;
  
  if (caseCount < 5) {
    // PHASE 1: Very few cases - rely heavily on tree
    treeWeight = 0.90;
    cbrWeight = 0.10;
  } else if (caseCount < 15) {
    // PHASE 2: Cases growing - gradual transition
    treeWeight = 0.70;
    cbrWeight = 0.30;
  } else if (caseCount < 30) {
    // PHASE 3: Reasonable base - balanced approach
    treeWeight = 0.50;
    cbrWeight = 0.50;
  } else {
    // PHASE 4: Mature base - CBR dominates if quality is good
    if (avgQuality > 0.7 && diversity > 0.6) {
      treeWeight = 0.25;
      cbrWeight = 0.75;
    } else if (avgQuality > 0.6) {
      treeWeight = 0.35;
      cbrWeight = 0.65;
    } else {
      // Quality not great - revert to more balanced
      treeWeight = 0.50;
      cbrWeight = 0.50;
    }
  }
  
  return { treeWeight, cbrWeight };
}

/**
 * Combine risks from Decision Tree and CBR
 */
function combineRisks(treeRisks, cbrRisks, treeWeight, cbrWeight) {
  const riskMap = new Map();
  
  // Add tree risks with their weight
  treeRisks.forEach(risk => {
    const key = risk.type;
    riskMap.set(key, {
      ...risk,
      sources: ['expert_rules'],
      treeData: { ...risk },
      weightedProbability: risk.probability * treeWeight,
      weightedConfidence: risk.confidence * treeWeight
    });
  });
  
  // Add or merge CBR risks
  cbrRisks.forEach(risk => {
    const key = risk.type;
    
    if (riskMap.has(key)) {
      // Risk detected by both - combine
      const existing = riskMap.get(key);
      
      riskMap.set(key, {
        ...existing,
        sources: ['expert_rules', 'cbr'],
        cbrData: { ...risk },
        weightedProbability: existing.weightedProbability + (risk.probability * cbrWeight),
        weightedConfidence: existing.weightedConfidence + (risk.confidence * cbrWeight),
        
        // Merge data intelligently
        basedOnCases: risk.basedOnCases || [],
        reasoning: [
          ...(existing.reasoning || []),
          ...(risk.reasoning || [])
        ].slice(0, 5), // Keep top 5
        recommendations: mergeRecommendations(
          existing.recommendations,
          risk.recommendations
        ),
        
        // Take higher severity
        severity: compareSeverity(existing.severity, risk.severity) > 0 
          ? existing.severity 
          : risk.severity
      });
    } else {
      // Only CBR detected this risk
      riskMap.set(key, {
        ...risk,
        sources: ['cbr'],
        cbrData: { ...risk },
        weightedProbability: risk.probability * cbrWeight,
        weightedConfidence: risk.confidence * cbrWeight
      });
    }
  });
  
  // Convert back to array and normalize probabilities/confidence
  const combinedRisks = Array.from(riskMap.values()).map(risk => {
    const totalWeight = risk.sources.length === 2 
      ? treeWeight + cbrWeight 
      : (risk.sources[0] === 'expert_rules' ? treeWeight : cbrWeight);
    
    // Get title and description from the original risk data
    const title = risk.title || risk.treeData?.title || risk.cbrData?.title || 'Unknown Risk';
    const description = risk.description || risk.treeData?.description || risk.cbrData?.description || 'No description available';
    
    return {
      type: risk.type,
      title: title,
      description: description,
      category: risk.category,
      severity: risk.severity,
      probability: risk.weightedProbability, // Already weighted
      confidence: risk.weightedConfidence,   // Already weighted
      source: risk.sources.length > 1 ? 'combined' : risk.sources[0],
      sources: risk.sources,
      reasoning: risk.reasoning,
      indicators: risk.indicators,
      predictedImpact: risk.predictedImpact,
      recommendations: risk.recommendations,
      basedOnCases: risk.basedOnCases || [],
      earlyWarningSignals: risk.earlyWarningSignals || [],
      similarityBreakdown: risk.similarityBreakdown
    };
  });
  
  // Sort by priority (probability * severity score)
  return combinedRisks.sort((a, b) => {
    const scoreA = a.probability * getSeverityScore(a.severity);
    const scoreB = b.probability * getSeverityScore(b.severity);
    return scoreB - scoreA;
  });
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
 * Calculate overall system confidence
 */
function calculateOverallConfidence(weights, cbrConfidence, caseBaseStats) {
  const treeConfidence = 0.70; // Decision tree has fixed moderate confidence
  
  // Weighted combination
  let confidence = (treeConfidence * weights.treeWeight) + 
                   (cbrConfidence * weights.cbrWeight);
  
  // Apply quality multipliers
  if (caseBaseStats.total > 0) {
    // Boost if case base is mature and high quality
    if (caseBaseStats.total > 30 && caseBaseStats.avgQualityScore > 0.75) {
      confidence *= 1.1;
    }
    
    // Penalize if diversity is low
    if (caseBaseStats.diversityIndex < 0.4) {
      confidence *= 0.9;
    }
  } else {
    // No case base - lower confidence
    confidence *= 0.85;
  }
  
  return Math.min(Math.max(confidence, 0.3), 0.95); // Clamp to [0.3, 0.95]
}

/**
 * Save risk predictions to database
 */
async function saveRiskPredictions(project, risks, metadata) {
  const organizationId = getOrganizationId(project.organization);
  
  // Delete old predictions for this project
  await Risk.deleteMany({ project: project._id, occurred: null });
  
  // Create new risk documents
  const riskDocs = risks.map(risk => ({
    project: project._id,
    organization: organizationId,
    type: risk.type,
    title: risk.title || 'Unknown Risk',
    description: risk.description || 'No description available',
    category: risk.category,
    severity: risk.severity,
    probability: risk.probability,
    confidence: risk.confidence,
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
  }));
  
  const savedRisks = await Risk.insertMany(riskDocs);
  
  // Update project with prediction metadata
  await Project.findByIdAndUpdate(project._id, {
    $set: {
      'riskPredictionMetadata': {
        predictedAt: new Date(),
        caseBaseSize: metadata.caseBaseSize,
        confidence: metadata.confidence,
        similarCasesCount: metadata.similarCasesCount,
        treeWeight: metadata.treeWeight,
        cbrWeight: metadata.cbrWeight
      },
      riskPredictions: savedRisks.map(r => r._id)
    }
  });
  
  return savedRisks;
}

/**
 * Get system phase based on case base size
 */
function getSystemPhase(caseCount) {
  if (caseCount < 5) return 'Phase 1: Bootstrapping (Expert Rules Dominant)';
  if (caseCount < 15) return 'Phase 2: Early Learning (Transitioning to CBR)';
  if (caseCount < 30) return 'Phase 3: Balanced (CBR Growing)';
  if (caseCount < 50) return 'Phase 4: Maturing (CBR Dominant)';
  return 'Phase 5: Mature System (High Confidence CBR)';
}

/**
 * Generate user-friendly message
 */
function generateMessage(caseCount, confidence) {
  if (caseCount === 0) {
    return 'Primera predicción: basada en reglas expertas y mejores prácticas de gestión de proyectos. ' +
           'El sistema aprenderá de proyectos completados para mejorar las predicciones.';
  }
  
  if (caseCount < 5) {
    return `Predicción basada principalmente en reglas expertas (${caseCount} proyectos en base de conocimiento). ` +
           'Confianza moderada. El sistema mejorará con más proyectos completados.';
  }
  
  if (caseCount < 15) {
    return `Sistema en fase de aprendizaje con ${caseCount} proyectos históricos. ` +
           'Combinando reglas expertas con casos reales. Confianza: ${(confidence * 100).toFixed(0)}%';
  }
  
  if (caseCount < 30) {
    return `Sistema balanceado con ${caseCount} proyectos en base de conocimiento. ` +
           `Predicción basada en experiencia de tu organización. Confianza: ${(confidence * 100).toFixed(0)}%`;
  }
  
  return `Sistema maduro con ${caseCount} proyectos analizados. ` +
         `Alta confianza basada en experiencia histórica de tu organización (${(confidence * 100).toFixed(0)}%).`;
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
    avgProbability: 0,
    avgConfidence: 0
  };
  
  risks.forEach(risk => {
    // Count by severity
    summary.bySeverity[risk.severity]++;
    
    // Count by category
    summary.byCategory[risk.category] = (summary.byCategory[risk.category] || 0) + 1;
    
    // High priority (high/critical severity with > 70% probability)
    if (['high', 'critical'].includes(risk.severity) && risk.probability > 0.7) {
      summary.highPriority.push({
        type: risk.type,
        severity: risk.severity,
        probability: risk.probability
      });
    }
    
    // Averages
    summary.avgProbability += risk.probability;
    summary.avgConfidence += risk.confidence;
  });
  
  if (risks.length > 0) {
    summary.avgProbability /= risks.length;
    summary.avgConfidence /= risks.length;
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
      avgAccuracy: accuracyReport.avgAccuracy,
      avgConfidence: riskStats.avgConfidence
    },
    caseBase: {
      totalCases: caseBaseStats.total,
      avgQuality: caseBaseStats.avgQualityScore,
      diversityIndex: caseBaseStats.diversityIndex,
      totalReuses: caseBaseStats.totalReuses,
      systemPhase: getSystemPhase(caseBaseStats.total)
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

  // Technical skills insights
  if (team.technicalMatch) {
    if (team.technicalMatch.missing && team.technicalMatch.missing.length > 0) {
      insights.push({
        type: 'skill_gap',
        severity: 'high',
        message: `Equipo carece de: ${team.technicalMatch.missing.join(', ')}`,
        recommendation: 'Contratar especialistas o plan de formación urgente'
      });
    }
    
    if (team.technicalMatch.matchPercentage !== undefined && team.technicalMatch.matchPercentage < 70) {
      insights.push({
        type: 'low_match',
        severity: 'medium',
        message: `Coincidencia técnica solo ${team.technicalMatch.matchPercentage.toFixed(1)}%`,
        recommendation: 'Revisar asignación de equipo o simplificar requisitos técnicos'
      });
    }
  }
  
  // Experience insights
  if (team.experienceMatch && team.experienceMatch.gap > 0) {
    insights.push({
      type: 'experience_gap',
      severity: 'high',
      message: `Se requiere nivel ${team.experienceMatch.required}, equipo tiene ${team.experienceMatch.actual}`,
      recommendation: 'Añadir mentores senior o reducir complejidad'
    });
  }
  
  // Language insights
  if (team.languages && !team.languages.hasAllRequired) {
    insights.push({
      type: 'language_barrier',
      severity: 'high',
      message: `Idiomas faltantes: ${team.languages.missingLanguages?.join(', ') || 'varios'}`,
      recommendation: 'Contratar miembros con idiomas requeridos o proveer traducción'
    });
  }
  
  // Workload insights
  if (team.workload && team.workload.isOverloaded) {
    insights.push({
      type: 'team_overload',
      severity: 'high',
      message: `${team.workload.overloadedMembers || 0} miembros sobrecargados`,
      recommendation: 'Redistribuir carga o añadir recursos'
    });
  }
  
  // Personality insights
  if (team.personality && team.personality.concerns && Array.isArray(team.personality.concerns) && team.personality.concerns.length > 0) {
    team.personality.concerns.forEach(concern => {
      insights.push({
        type: 'personality_concern',
        severity: 'medium',
        message: concern.description || concern,
        recommendation: 'Considerar dinámicas de equipo y gestión de conflictos'
      });
    });
  }
  
  // Organization insights
  if (organization) {
    if (organization.maturity === 'low' || organization.maturity === 'ad_hoc') {
      insights.push({
        type: 'org_maturity',
        severity: 'medium',
        message: 'Organización con baja madurez de procesos',
        recommendation: 'Establecer procesos básicos y herramientas estándar'
      });
    }
    
    if (!organization.hasVersionControl) {
      insights.push({
        type: 'no_version_control',
        severity: 'high',
        message: 'Organización sin control de versiones',
        recommendation: 'Implementar Git inmediatamente'
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
      message: 'Complete más proyectos y capture sus resultados para mejorar las predicciones',
      action: 'Asegúrate de reportar outcomes de proyectos completados'
    });
  }
  
  if (caseBaseStats.diversityIndex < 0.5) {
    recommendations.push({
      type: 'diversity',
      priority: 'medium',
      message: 'La base de casos tiene baja diversidad - considera proyectos de diferentes tipos',
      action: 'Varía tecnologías, tamaños de equipo y complejidades'
    });
  }
  
  if (accuracyReport.avgAccuracy < 0.7 && accuracyReport.totalEvaluated > 5) {
    recommendations.push({
      type: 'accuracy',
      priority: 'high',
      message: 'Precisión de predicciones por debajo de 70%',
      action: 'Revisa calidad de datos de proyectos y outcomes reportados'
    });
  }
  
  if (accuracyReport.falsePositives > accuracyReport.correctPredictions * 0.5) {
    recommendations.push({
      type: 'false_positives',
      priority: 'medium',
      message: 'Alta tasa de falsos positivos - sistema puede ser demasiado conservador',
      action: 'Considera ajustar umbrales de probabilidad'
    });
  }
  
  if (caseBaseStats.total > 20 && caseBaseStats.avgQualityScore > 0.7) {
    recommendations.push({
      type: 'success',
      priority: 'info',
      message: '¡Sistema funcionando bien! Base de casos madura y de buena calidad',
      action: 'Continúa reportando outcomes de proyectos'
    });
  }
  
  return recommendations;
}

module.exports = {
  predictProjectRisks,
  getProjectRiskPredictions,
  getOrganizationRiskInsights,
  calculateAdaptiveWeights,
  combineRisks
};
