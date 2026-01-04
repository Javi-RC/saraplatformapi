/**
 * Post-Project Service
 * Captures project outcomes and converts them to CBR cases
 * Essential for system learning and continuous improvement
 */

const Project = require('../models/project.model');
const CaseBase = require('../models/caseBase.model');
const Risk = require('../models/risk.model');
const cbrService = require('./cbr.service');

/**
 * Helper function to extract organization ID
 * Handles both populated and non-populated organization fields
 */
function getOrganizationId(organization) {
  if (!organization) return null;
  return organization._id || organization;
}

/**
 * Capture project outcome after completion
 */
async function captureProjectOutcome(projectId, outcomeData, userId) {
  try {
    const project = await Project.findById(projectId)
      .populate('organization')
      .populate('projectManager')
      .populate('riskPredictions');
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    if (!project.organization) {
      throw new Error('Project must have an associated organization');
    }
    
    // Validate project is completed
    if (project.status !== 'completed') {
      throw new Error(
        `Project must be marked as completed before capturing outcome. Current status: ${project.status}. Please use PATCH /api/projects/${projectId}/complete first.`
      );
    }
    
    // Verify user has permission (project manager or org admin)
    if (!canUpdateOutcome(project, userId)) {
      throw new Error('Not authorized to update project outcome');
    }
    
    // Validate outcome data
    validateOutcomeData(outcomeData);
    
    // Calculate derived metrics
    const derivedData = calculateDerivedMetrics(project, outcomeData);
    
    // Update project with outcome
    project.projectOutcome = {
      completed: outcomeData.completed,
      actualCompletedDate: outcomeData.actualCompletedDate || new Date(),
      onTime: derivedData.onTime,
      delayDays: derivedData.delayDays,
      budgetOverrun: outcomeData.budgetOverrun || 0,
      actualHours: outcomeData.actualHours,
      qualityScore: outcomeData.qualityScore,
      clientSatisfaction: outcomeData.clientSatisfaction,
      teamMorale: outcomeData.teamMorale,
      actualRisks: outcomeData.actualizedRisks || outcomeData.actualRisks || [],
      lessonsLearned: outcomeData.lessonsLearned || [],
      successfulPractices: outcomeData.successfulPractices || [],
      unsuccessfulPractices: outcomeData.unsuccessfulPractices || [],
      recommendations: outcomeData.recommendations || [],
      metrics: outcomeData.metrics || {}
    };
    
    await project.save();
    
    // Update risk predictions with actual outcomes
    if (project.riskPredictions && project.riskPredictions.length > 0) {
      await updateRiskPredictions(
        project.riskPredictions,
        outcomeData.actualizedRisks || outcomeData.actualRisks || []
      );
    }
    
    // Convert project to case for CBR learning
    const newCase = await cbrService.retainCase(
      project,
      {
        completed: outcomeData.completed,
        onTime: derivedData.onTime,
        delayDays: derivedData.delayDays,
        budgetOverrun: outcomeData.budgetOverrun || 0,
        qualityScore: outcomeData.qualityScore,
        clientSatisfaction: outcomeData.clientSatisfaction,
        teamMorale: outcomeData.teamMorale,
        actualRisks: transformActualizedRisks(outcomeData.actualizedRisks || []),
        metrics: outcomeData.metrics || {},
        completedAt: outcomeData.actualCompletedDate || new Date(),
        lessonsLearned: outcomeData.lessonsLearned || [],
        successfulPractices: outcomeData.successfulPractices || [],
        unsuccessfulPractices: outcomeData.unsuccessfulPractices || [],
        recommendations: outcomeData.recommendations || []
      },
      project.organization
    );
    
    // Generate learning report
    const learningReport = await generateLearningReport(project, newCase);
    
    return {
      project: {
        id: project._id,
        name: project.projectName,
        outcome: project.projectOutcome
      },
      case: {
        id: newCase._id,
        caseId: newCase.caseId,
        addedToKnowledgeBase: true
      },
      predictionAccuracy: learningReport.accuracy,
      learningReport,
      message: 'Outcome captured successfully. System has learned from this project.'
    };
    
  } catch (error) {
    console.error('Error capturing project outcome:', error);
    throw new Error(`Failed to capture outcome: ${error.message}`);
  }
}

/**
 * Validate outcome data
 */
function validateOutcomeData(data) {
  if (data.completed === undefined) {
    throw new Error('completed field is required');
  }
  
  if (data.qualityScore && (data.qualityScore < 1 || data.qualityScore > 5)) {
    throw new Error('qualityScore must be between 1 and 5');
  }
  
  if (data.clientSatisfaction && (data.clientSatisfaction < 1 || data.clientSatisfaction > 5)) {
    throw new Error('clientSatisfaction must be between 1 and 5');
  }
  
  if (data.teamMorale && (data.teamMorale < 1 || data.teamMorale > 5)) {
    throw new Error('teamMorale must be between 1 and 5');
  }
  
  if (data.budgetOverrun && data.budgetOverrun < 0) {
    throw new Error('budgetOverrun cannot be negative');
  }
}

/**
 * Calculate derived metrics
 */
function calculateDerivedMetrics(project, outcomeData) {
  const estimatedEnd = new Date(project.estimatedEndDate);
  const actualEnd = outcomeData.actualCompletedDate 
    ? new Date(outcomeData.actualCompletedDate)
    : new Date();
  
  // Calculate delay in days
  const delayMs = actualEnd - estimatedEnd;
  const delayDays = Math.ceil(delayMs / (1000 * 60 * 60 * 24));
  
  return {
    onTime: delayDays <= 0,
    delayDays: Math.max(0, delayDays),
    durationDays: Math.ceil((actualEnd - new Date(project.estimatedStartDate)) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Check if user can update outcome
 */
function canUpdateOutcome(project, userId) {
  // Project manager can always update
  if (project.projectManager._id.toString() === userId.toString()) {
    return true;
  }
  
  // Organization admin can update
  if (project.organization.isAdmin && project.organization.isAdmin(userId)) {
    return true;
  }
  
  return false;
}

/**
 * Update risk predictions with actual outcomes
 */
async function updateRiskPredictions(predictedRisks, actualizedRisks) {
  for (const predictedRisk of predictedRisks) {
    const actualRisk = actualizedRisks.find(ar => ar.type === predictedRisk.type);
    
    if (actualRisk && actualRisk.occurred) {
      // Risk occurred as predicted
      await predictedRisk.markAsOccurred({
        severity: actualRisk.severity,
        detectedAt: actualRisk.detectedAt,
        impact: {
          scheduleDelayDays: actualRisk.scheduleDelayDays,
          budgetOverrunPercent: actualRisk.budgetOverrunPercent,
          qualityImpact: actualRisk.qualityImpact,
          description: actualRisk.description
        },
        rootCause: actualRisk.rootCause
      });
    } else {
      // Risk did not occur (avoided or false positive)
      await predictedRisk.markAsAvoided(
        actualRisk ? actualRisk.avoidanceReason : 'Risk did not materialize'
      );
    }
  }
  
  // Check for unpredicted risks that occurred
  const unpredictedRisks = actualizedRisks.filter(ar => 
    ar.occurred && !predictedRisks.some(pr => pr.type === ar.type)
  );
  
  return { unpredictedRisks };
}

/**
 * Transform actualized risks to case format
 */
function transformActualizedRisks(actualizedRisks) {
  return actualizedRisks
    .filter(ar => ar.occurred)
    .map(ar => ({
      type: ar.type,
      severity: ar.severity,
      description: ar.description || '',
      impact: ar.impact || 'unknown',
      detectedAt: ar.detectedAt,
      mitigatedAt: ar.mitigatedAt,
      rootCause: ar.rootCause || '',
      actualImpact: {
        scheduleDelayDays: ar.scheduleDelayDays || 0,
        budgetOverrunPercent: ar.budgetOverrunPercent || 0,
        qualityImpact: ar.qualityImpact || 'medium'
      }
    }));
}

/**
 * Generate learning report
 */
async function generateLearningReport(project, newCase) {
  const predictedRisks = await Risk.find({
    project: project._id
  });
  
  // Calculate prediction accuracy
  const accuracy = calculatePredictionAccuracy(
    predictedRisks,
    project.projectOutcome.actualRisks || []
  );
  
  // Identify what the system learned
  const learnings = identifyLearnings(
    project,
    predictedRisks,
    project.projectOutcome
  );
  
  const organizationId = getOrganizationId(project.organization);
  
  // Get similar past cases for comparison
  const similarPastCases = await CaseBase.findSimilar(
    cbrService.extractProjectFeatures(project),
    organizationId,
    3
  );
  
  return {
    accuracy,
    learnings,
    caseComparison: {
      newCase: {
        delayDays: newCase.solution.delayDays,
        budgetOverrun: newCase.solution.budgetOverrun,
        qualityScore: newCase.solution.qualityScore
      },
      similarPastCases: similarPastCases.map(c => ({
        projectName: c.problem.projectName,
        delayDays: c.solution.delayDays,
        budgetOverrun: c.solution.budgetOverrun,
        quality: c.getQualityScore()
      }))
    },
    systemImpact: {
      caseBaseSize: (await CaseBase.getCaseBaseStats(organizationId)).total,
      expectedConfidenceIncrease: calculateConfidenceIncrease(newCase, similarPastCases)
    }
  };
}

/**
 * Calculate prediction accuracy
 */
function calculatePredictionAccuracy(predictedRisks, actualizedRisks) {
  if (predictedRisks.length === 0) {
    return {
      overall: 0,
      correctPredictions: 0,
      falsePositives: 0,
      falseNegatives: 0,
      message: 'No predictions were made for this project'
    };
  }
  
  let correctPredictions = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  
  // Ensure actualizedRisks is an array
  const safeActualizedRisks = actualizedRisks || [];
  
  // Check predicted risks
  predictedRisks.forEach(predicted => {
    const actual = safeActualizedRisks.find(ar => ar.type === predicted.type);
    
    if (actual && actual.occurred) {
      correctPredictions++;
    } else {
      falsePositives++;
    }
  });
  
  // Check for unpredicted risks (false negatives)
  safeActualizedRisks.forEach(actual => {
    if (actual.occurred && !predictedRisks.some(pr => pr.type === actual.type)) {
      falseNegatives++;
    }
  });
  
  const total = predictedRisks.length + falseNegatives;
  const overall = total > 0 ? correctPredictions / total : 0;
  
  return {
    overall,
    correctPredictions,
    falsePositives,
    falseNegatives,
    precision: predictedRisks.length > 0 
      ? correctPredictions / predictedRisks.length 
      : 0,
    recall: (correctPredictions + falseNegatives) > 0
      ? correctPredictions / (correctPredictions + falseNegatives)
      : 0,
    message: generateAccuracyMessage(overall, correctPredictions, falsePositives, falseNegatives)
  };
}

/**
 * Generate accuracy message
 */
function generateAccuracyMessage(overall, correct, falsePos, falseNeg) {
  const percentage = (overall * 100).toFixed(0);
  
  if (overall > 0.8) {
    return `Excelente precisión (${percentage}%): ${correct} predicciones correctas.`;
  } else if (overall > 0.6) {
    return `Buena precisión (${percentage}%): ${correct} correctas, ${falsePos} falsos positivos, ${falseNeg} no predichos.`;
  } else if (overall > 0.4) {
    return `Precisión moderada (${percentage}%): El sistema está aprendiendo. ${correct} correctas, ${falsePos} falsos positivos, ${falseNeg} no predichos.`;
  } else {
    return `Precisión baja (${percentage}%): ${falsePos} falsos positivos y ${falseNeg} riesgos no predichos. El sistema mejorará con más datos.`;
  }
}

/**
 * Identify what the system learned
 */
function identifyLearnings(project, predictedRisks, outcome) {
  const learnings = [];
  
  // Learning 1: Outcome vs prediction
  if (outcome.completed && outcome.onTime) {
    learnings.push({
      type: 'success_factors',
      insight: 'Proyecto completado a tiempo',
      action: 'Analizar qué factores contribuyeron al éxito para replicar en futuros proyectos'
    });
  } else if (!outcome.onTime && outcome.delayDays > 0) {
    learnings.push({
      type: 'delay_factors',
      insight: `Proyecto retrasado ${outcome.delayDays} días`,
      action: 'Identificar causas raíz del retraso para mejorar predicciones futuras'
    });
  }
  
  // Learning 2: Risk prediction effectiveness
  const accurateRisks = predictedRisks.filter(pr => pr.occurred === true);
  if (accurateRisks.length > 0) {
    learnings.push({
      type: 'prediction_success',
      insight: `${accurateRisks.length} riesgos predichos correctamente`,
      action: 'Estos patrones de riesgo son confiables para proyectos similares'
    });
  }
  
  // Learning 3: False positives
  const falsePositives = predictedRisks.filter(pr => pr.occurred === false);
  if (falsePositives.length > 2) {
    learnings.push({
      type: 'false_positives',
      insight: `${falsePositives.length} riesgos no se materializaron`,
      action: 'Revisar condiciones que permitieron evitar estos riesgos'
    });
  }
  
  // Learning 4: Unpredicted issues
  const actualRisks = outcome.actualRisks || outcome.actualizedRisks || [];
  const unpredicted = actualRisks.filter(ar => 
    ar.occurred && !predictedRisks.some(pr => pr.type === ar.type)
  );
  if (unpredicted.length > 0) {
    learnings.push({
      type: 'new_patterns',
      insight: `${unpredicted.length} riesgos no fueron predichos: ${unpredicted.map(u => u.type).join(', ')}`,
      action: 'Nuevos patrones detectados - el sistema aprenderá a identificarlos en el futuro'
    });
  }
  
  // Learning 5: Quality outcomes
  if (outcome.qualityScore) {
    if (outcome.qualityScore >= 4) {
      learnings.push({
        type: 'quality_success',
        insight: `Alta calidad final (${outcome.qualityScore}/5)`,
        action: 'Prácticas exitosas identificadas para replicar'
      });
    } else if (outcome.qualityScore < 3) {
      learnings.push({
        type: 'quality_issues',
        insight: `Calidad por debajo de expectativas (${outcome.qualityScore}/5)`,
        action: 'Identificar factores que afectaron la calidad'
      });
    }
  }
  
  return learnings;
}

/**
 * Calculate expected confidence increase
 */
function calculateConfidenceIncrease(newCase, similarPastCases) {
  // High quality new case with similar past cases = good confidence increase
  const newCaseQuality = newCase.getQualityScore();
  
  if (similarPastCases.length === 0) {
    return {
      expected: 'moderate',
      percentage: 5,
      reason: 'First case of this type in knowledge base'
    };
  }
  
  if (newCaseQuality > 0.7 && similarPastCases.length >= 2) {
    return {
      expected: 'high',
      percentage: 10,
      reason: 'High quality case reinforcing existing patterns'
    };
  }
  
  if (newCaseQuality > 0.5) {
    return {
      expected: 'moderate',
      percentage: 7,
      reason: 'Good quality case adding to knowledge base'
    };
  }
  
  return {
    expected: 'low',
    percentage: 3,
    reason: 'Case added but quality could be improved with more detail'
  };
}

/**
 * Get post-project feedback form data
 */
async function getPostProjectForm(projectId) {
  const project = await Project.findById(projectId)
    .populate('riskPredictions');
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  // Validate project is completed before capturing outcome
  if (project.status !== 'completed') {
    throw new Error(
      `Project must be marked as completed before capturing outcome. Current status: ${project.status}`
    );
  }
  
  return {
    project: {
      id: project._id,
      name: project.projectName,
      estimatedEndDate: project.estimatedEndDate,
      estimatedDuration: project.expectedDuration
    },
    predictedRisks: project.riskPredictions?.map(risk => ({
      id: risk._id,
      type: risk.type,
      severity: risk.severity,
      probability: risk.probability,
      description: getRiskTypeDescription(risk.type)
    })) || [],
    form: {
      sections: [
        {
          title: 'Outcome General',
          fields: [
            { name: 'completed', type: 'boolean', required: true, label: '¿Se completó el proyecto?' },
            { name: 'actualCompletedDate', type: 'date', required: true, label: 'Fecha real de finalización' },
            { name: 'qualityScore', type: 'number', min: 1, max: 5, label: 'Calidad final (1-5)' },
            { name: 'clientSatisfaction', type: 'number', min: 1, max: 5, label: 'Satisfacción del cliente (1-5)' },
            { name: 'teamMorale', type: 'number', min: 1, max: 5, label: 'Moral del equipo (1-5)' },
            { name: 'budgetOverrun', type: 'number', min: 0, label: 'Sobrecosto (%)' }
          ]
        },
        {
          title: 'Riesgos Predichos',
          fields: [
            { name: 'actualizedRisks', type: 'array', label: 'Para cada riesgo predicho, indica si ocurrió' }
          ]
        },
        {
          title: 'Lecciones Aprendidas',
          fields: [
            { name: 'lessonsLearned', type: 'text-array', label: '¿Qué aprendiste?' },
            { name: 'successfulPractices', type: 'text-array', label: '¿Qué funcionó bien?' },
            { name: 'unsuccessfulPractices', type: 'text-array', label: '¿Qué no funcionó?' },
            { name: 'recommendations', type: 'text-array', label: 'Recomendaciones para proyectos futuros' }
          ]
        }
      ]
    }
  };
}

/**
 * Get risk type description
 */
function getRiskTypeDescription(type) {
  const descriptions = {
    'communication_breakdown': 'Problemas de comunicación y coordinación',
    'skill_gap': 'Brecha de habilidades técnicas',
    'team_overload': 'Sobrecarga del equipo',
    'dependency_blockage': 'Bloqueos por dependencias',
    'scope_creep': 'Crecimiento no controlado del alcance',
    'process_mismatch': 'Procesos inadecuados',
    'technical_infrastructure': 'Problemas de infraestructura técnica',
    'quality_degradation': 'Degradación de la calidad'
  };
  return descriptions[type] || type;
}

module.exports = {
  captureProjectOutcome,
  getPostProjectForm,
  calculatePredictionAccuracy,
  generateLearningReport
};
