/**
 * Post-Project Service
 * Captures project outcomes and converts them to CBR cases
 * Essential for system learning and continuous improvement
 * 
 * IMPORTANT: This is the ONLY place where risks are marked as occurred/not occurred.
 * During project execution, PMs can only add/edit/delete manual risks.
 * The retrospective evaluation happens here when the project is completed.
 */

const Project = require('../models/project.model');
const CaseBase = require('../models/caseBase.model');
const Risk = require('../models/risk.model');
const User = require('../models/user.model');
const cbrService = require('./cbr.service');
const i18n = require('../i18n/i18n.service');

/**
 * Update collaboration history for all team members
 * Called automatically when a project is completed
 * @param {Array} assignedEmployees - Array of assigned employees from project
 */
async function updateCollaborationHistory(assignedEmployees) {
  try {
    // Extract user IDs
    const userIds = assignedEmployees
      .map(emp => emp.user?._id || emp.user)
      .filter(id => id != null);

    if (userIds.length < 2) {
      // No pairs to update
      return;
    }

    // For each pair of employees, update their collaboration history
    for (let i = 0; i < userIds.length; i++) {
      for (let j = i + 1; j < userIds.length; j++) {
        const userId1 = userIds[i].toString();
        const userId2 = userIds[j].toString();

        // Update user1's history with user2
        await User.findOneAndUpdate(
          {
            _id: userId1,
            'collaborationHistory.userId': userId2
          },
          {
            $inc: { 'collaborationHistory.$.projectCount': 1 },
            $set: { 'collaborationHistory.$.lastCollaboration': new Date() }
          }
        );

        // If the collaboration doesn't exist, create it
        await User.findOneAndUpdate(
          {
            _id: userId1,
            'collaborationHistory.userId': { $ne: userId2 }
          },
          {
            $push: {
              collaborationHistory: {
                userId: userId2,
                projectCount: 1,
                lastCollaboration: new Date()
              }
            }
          }
        );

        // Update user2's history with user1 (symmetric)
        await User.findOneAndUpdate(
          {
            _id: userId2,
            'collaborationHistory.userId': userId1
          },
          {
            $inc: { 'collaborationHistory.$.projectCount': 1 },
            $set: { 'collaborationHistory.$.lastCollaboration': new Date() }
          }
        );

        await User.findOneAndUpdate(
          {
            _id: userId2,
            'collaborationHistory.userId': { $ne: userId1 }
          },
          {
            $push: {
              collaborationHistory: {
                userId: userId1,
                projectCount: 1,
                lastCollaboration: new Date()
              }
            }
          }
        );
      }
    }

    console.log(`✅ Updated collaboration history for ${userIds.length} team members`);
  } catch (error) {
    console.error('Error updating collaboration history:', error);
    // Don't throw - this is not critical for project completion
  }
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
 * Capture project outcome after completion
 * This is where ALL risks (predicted + manual) are marked as occurred/not occurred
 * during the project retrospective
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
    
    // Validate user has permission (project manager or org admin)
    if (!canUpdateOutcome(project, userId)) {
      throw new Error('Not authorized to update project outcome');
    }
    
    // Update collaboration history for team members
    await updateCollaborationHistory(project.assignedEmployees || []);
    
    // Validate outcome data
    validateOutcomeData(outcomeData);
    
    // Calculate derived metrics
    const derivedData = calculateDerivedMetrics(project, outcomeData);
    
    // Update project with outcome
    project.projectOutcome = {
      completed: outcomeData.completed,
      actualCompletedDate: outcomeData.actualCompletedDate || new Date(),
      onTime: derivedData.onTime,
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
    
    // Update ALL risk predictions with actual outcomes from retrospective
    // This is the ONLY moment where risks are evaluated as occurred/not occurred
    if (project.riskPredictions && project.riskPredictions.length > 0) {
      await updateRiskPredictions(
        project.riskPredictions,
        outcomeData.actualizedRisks || outcomeData.actualRisks || []
      );
    }

    // Get all risks (predicted + manual) for this project
    // The PM will specify in actualizedRisks which ones occurred and which didn't
    const Risk = require('../models/risk.model');
    const allProjectRisks = await Risk.find({
      project: projectId
    });

    const allActualizedRisks = outcomeData.actualizedRisks || outcomeData.actualRisks || [];
    
    console.log(`[PostProject] Processing ${allActualizedRisks.length} actualized risks from retrospective`);
    console.log(`[PostProject] Total risks in project: ${allProjectRisks.length} (predicted + manual)`);
    allActualizedRisks.forEach(ar => {
      console.log(`[PostProject]   - ${ar.type}: occurred=${ar.occurred}`);
    });
    
    // Convert project to case for CBR learning
    const newCase = await cbrService.retainCase(
      project,
      {
        completed: outcomeData.completed,
        onTime: derivedData.onTime,
        qualityScore: outcomeData.qualityScore,
        clientSatisfaction: outcomeData.clientSatisfaction,
        teamMorale: outcomeData.teamMorale,
        actualRisks: transformActualizedRisks(allActualizedRisks),
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
  if (project.projectManager && project.projectManager._id && 
      project.projectManager._id.toString() === userId.toString()) {
    return true;
  }
  
  // Organization admin can update
  if (project.organization.isAdmin && project.organization.isAdmin(userId)) {
    return true;
  }
  
  return false;
}

/**
 * Update risk predictions with actual outcomes from retrospective
 * Updates BOTH predicted and manual risks based on what the PM reported
 */
async function updateRiskPredictions(allRisks, actualizedRisks) {
  for (const risk of allRisks) {
    // Find if this risk was mentioned in the retrospective
    const actualRisk = actualizedRisks.find(ar => ar.type === risk.type);
    
    if (actualRisk && actualRisk.occurred) {
      // Risk occurred - update it regardless of source (predicted or manual)
      risk.occurred = true;
      risk.detectedAt = actualRisk.detectedAt ? new Date(actualRisk.detectedAt) : new Date();
      risk.actualSeverity = actualRisk.severity || risk.severity;
      risk.rootCause = actualRisk.rootCause || '';
      risk.status = actualRisk.mitigatedAt ? 'mitigated' : 'occurred';
      
      if (actualRisk.mitigatedAt) {
        risk.mitigatedAt = new Date(actualRisk.mitigatedAt);
      }
      
      risk.actualImpact = {
        scheduleDelayDays: actualRisk.scheduleDelayDays || 0,
        budgetOverrunPercent: actualRisk.budgetOverrunPercent || 0,
        qualityScore: actualRisk.qualityImpact || 'medium',
        description: actualRisk.description || ''
      };
      
      await risk.save();
    } else if (actualRisk && actualRisk.occurred === false) {
      // Risk explicitly marked as NOT occurred
      risk.occurred = false;
      risk.status = 'avoided';
      risk.avoidanceReason = actualRisk.avoidanceReason || 'Risk did not materialize';
      await risk.save();
    } else {
      // Risk not mentioned in retrospective - mark as avoided
      risk.occurred = false;
      risk.status = 'avoided';
      risk.avoidanceReason = 'Risk not mentioned in project retrospective';
      await risk.save();
    }
  }
  
  // Check for risks in retrospective that weren't in predictions
  const unpredictedRisks = actualizedRisks.filter(ar => 
    ar.occurred && !allRisks.some(r => r.type === ar.type)
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
      title: ar.title || '',
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
        budgetOverrun: newCase.solution.budgetOverrun,
        qualityScore: newCase.solution.qualityScore
      },
      similarPastCases: similarPastCases.map(c => ({
        projectName: c.problem.projectName,
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
 * Calculate prediction accuracy - simplified version
 * Only returns the number of correct predictions
 */
function calculatePredictionAccuracy(predictedRisks, actualizedRisks) {
  if (predictedRisks.length === 0) {
    return 0;
  }
  
  let correctPredictions = 0;
  
  // Ensure actualizedRisks is an array
  const safeActualizedRisks = actualizedRisks || [];
  
  // Check predicted risks
  predictedRisks.forEach(predicted => {
    const actual = safeActualizedRisks.find(ar => ar.type === predicted.type);
    
    if (actual && actual.occurred) {
      correctPredictions++;
    }
  });
  
  return correctPredictions;
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
      insight: 'Project completed on time',
      action: 'Analyze which factors contributed to success to replicate in future projects'
    });
  } else if (!outcome.onTime && outcome.delayDays > 0) {
    learnings.push({
      type: 'delay_factors',
      insight: `Project delayed ${outcome.delayDays} days`,
      action: 'Identify root causes of delay to improve future predictions'
    });
  }
  
  // Learning 2: Risk prediction effectiveness
  const accurateRisks = predictedRisks.filter(pr => pr.occurred === true);
  if (accurateRisks.length > 0) {
    learnings.push({
      type: 'prediction_success',
      insight: `${accurateRisks.length} risks predicted correctly`,
      action: 'These risk patterns are reliable for similar projects'
    });
  }
  
  // Learning 3: False positives
  const falsePositives = predictedRisks.filter(pr => pr.occurred === false);
  if (falsePositives.length > 2) {
    learnings.push({
      type: 'false_positives',
      insight: `${falsePositives.length} risks did not materialize`,
      action: 'Review conditions that allowed avoiding these risks'
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
      insight: `${unpredicted.length} risks were not predicted: ${unpredicted.map(u => u.type).join(', ')}`,
      action: 'New patterns detected - the system will learn to identify them in the future'
    });
  }
  
  // Learning 5: Quality outcomes
  if (outcome.qualityScore) {
    if (outcome.qualityScore >= 4) {
      learnings.push({
        type: 'quality_success',
        insight: `High final quality (${outcome.qualityScore}/5)`,
        action: 'Successful practices identified for replication'
      });
    } else if (outcome.qualityScore < 3) {
      learnings.push({
        type: 'quality_issues',
        insight: `Quality below expectations (${outcome.qualityScore}/5)`,
        action: 'Identify factors that affected quality'
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
 * @param {string} projectId - Project ID
 * @param {string} lang - Language code (es, en)
 */
async function getPostProjectForm(projectId, lang = 'es') {
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
    predictedRisks: project.riskPredictions?.map(risk => {
      // Use translateRiskObject to respect userEdited flag and get translated labels
      const translatedRisk = i18n.translateRiskObject(risk.toObject ? risk.toObject() : risk, lang);
      return {
        id: risk._id,
        type: risk.type,
        title: translatedRisk.title || risk.title || risk.type,
        severity: risk.severity,
        severityLabel: translatedRisk.severityLabel,
        similarity: risk.similarity,
        description: translatedRisk.description || risk.description || getRiskTypeDescription(risk.type, lang),
        source: risk.source || 'system',
        sourceLabel: translatedRisk.sourceLabel,
        status: risk.status,
        statusLabel: translatedRisk.statusLabel,
        category: risk.category,
        categoryLabel: translatedRisk.categoryLabel,
        userEdited: risk.userEdited || false,
        indicators: translatedRisk.indicators || risk.indicators || [],
        recommendations: translatedRisk.recommendations || risk.recommendations || []
      };
    }) || [],
    form: {
      sections: [
        {
          title: i18n.translate(lang, 'postProject.sections.generalOutcome'),
          fields: [
            { name: 'completed', type: 'boolean', required: true, label: i18n.translate(lang, 'postProject.fields.completed') },
            { name: 'actualCompletedDate', type: 'date', required: true, label: i18n.translate(lang, 'postProject.fields.actualCompletedDate') },
            { name: 'qualityScore', type: 'number', min: 1, max: 5, label: i18n.translate(lang, 'postProject.fields.qualityScore') },
            { name: 'clientSatisfaction', type: 'number', min: 1, max: 5, label: i18n.translate(lang, 'postProject.fields.clientSatisfaction') },
            { name: 'teamMorale', type: 'number', min: 1, max: 5, label: i18n.translate(lang, 'postProject.fields.teamMorale') },
            { name: 'budgetOverrun', type: 'number', min: 0, label: i18n.translate(lang, 'postProject.fields.budgetOverrun') }
          ]
        },
        {
          title: i18n.translate(lang, 'postProject.sections.predictedRisks'),
          fields: [
            { name: 'actualizedRisks', type: 'array', label: i18n.translate(lang, 'postProject.fields.actualizedRisks') }
          ]
        },
        {
          title: i18n.translate(lang, 'postProject.sections.lessonsLearned'),
          fields: [
            { name: 'lessonsLearned', type: 'text-array', label: i18n.translate(lang, 'postProject.fields.lessonsLearned') },
            { name: 'successfulPractices', type: 'text-array', label: i18n.translate(lang, 'postProject.fields.successfulPractices') },
            { name: 'unsuccessfulPractices', type: 'text-array', label: i18n.translate(lang, 'postProject.fields.unsuccessfulPractices') },
            { name: 'recommendations', type: 'text-array', label: i18n.translate(lang, 'postProject.fields.recommendations') }
          ]
        }
      ]
    }
  };
}

/**
 * Get risk type description
 * @param {string} type - Risk type
 * @param {string} lang - Language code (es, en)
 */
function getRiskTypeDescription(type, lang = 'es') {
  const description = i18n.translate(lang, `postProject.riskDescriptions.${type}`);
  // If translation not found, return the type as fallback
  return description !== `postProject.riskDescriptions.${type}` ? description : type;
}

module.exports = {
  captureProjectOutcome,
  getPostProjectForm,
  calculatePredictionAccuracy,
  generateLearningReport
};
