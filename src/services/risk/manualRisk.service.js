/**
 * Manual Risk Service
 * Handles manually added risks by project managers during project execution
 * 
 * IMPORTANT: Manual risks are NOT marked as "occurred" here.
 * They are only registered. The PM will evaluate which risks actually occurred
 * during the post-project retrospective (captureProjectOutcome).
 * These risks are included in CBR learning when the project is completed.
 */

const { projectRepository, riskRepository } = require('../../repositories');
const AppError = require('../../utils/AppError');

/**
 * Add a manual risk to a project (discovered during execution)
 * These risks will be included in CBR learning when project is completed
 * 
 * @param {String} projectId - Project ID
 * @param {Object} riskData - Risk data {type, title, description, severity, similarity, category, rootCause}
 * @param {String} userId - User ID (must be project manager)
 * @returns {Object} Created risk document
 */
async function addManualRisk(projectId, riskData, userId) {
  try {
    const project = await projectRepository.findById(projectId, {
      populate: [{ path: 'organization' }, { path: 'projectManager' }]
    });

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify user is project manager
    const isProjectManager = project.projectManager && 
      project.projectManager._id.toString() === userId.toString();
    
    if (!isProjectManager) {
      throw AppError.forbidden('NOT_PROJECT_MANAGER', 'Not authorized: only project manager can add risks');
    }

    // Validate risk data
    if (!riskData.type || !riskData.title || !riskData.description) {
      throw AppError.badRequest('MISSING_REQUIRED_FIELDS', 'Missing required fields: type, title, description');
    }

    if (riskData.similarity !== undefined && riskData.similarity !== null) {
      if (riskData.similarity < 0 || riskData.similarity > 1) {
        throw AppError.badRequest('INVALID_SIMILARITY', 'Similarity must be between 0 and 1');
      }
    }

    // Create risk document
    const newRisk = await riskRepository.create({
      project: projectId,
      organization: project.organization._id,
      type: riskData.type,
      title: riskData.title,
      description: riskData.description,
      category: riskData.category || 'other',
      severity: riskData.severity || 'medium',
      similarity: riskData.similarity,  // Optional - PM can provide if they want
      confidence: 0.85, // High confidence for manually identified risks by PM
      source: 'manual',  // Mark as manually added
      status: 'predicted',  // Predicted until marked as occurred/not occurred in retrospective
      rootCause: riskData.rootCause || '',
      reasoning: [`Manually identified by Project Manager on ${new Date().toLocaleDateString()}`],
      indicators: riskData.indicators || [],
      recommendations: riskData.recommendations || [],
      createdAt: new Date()
    });

    // Add to project's riskPredictions array if not already there
    if (!project.riskPredictions.includes(newRisk._id)) {
      await projectRepository.updateById(project._id, { $push: { riskPredictions: newRisk._id } });
    }

    return newRisk;
  } catch (error) {
    console.error('Error adding manual risk:', error);
    throw AppError.badRequest('ADD_MANUAL_RISK_FAILED', `Failed to add manual risk: ${error.message}`);
  }
}

/**
 * Update a risk (manual or predicted)
 * 
 * During ACTIVE project: Can update basic fields (title, description, severity, etc.)
 * During COMPLETED project: Can also update occurrence fields (occurred, detectedAt, actualSeverity, etc.)
 * 
 * @param {String} projectId - Project ID
 * @param {String} riskId - Risk ID to update
 * @param {Object} updates - Fields to update
 * @param {String} userId - User ID (must be project manager)
 * @returns {Object} Updated risk document
 */
async function updateRisk(projectId, riskId, updates, userId) {
  try {
    const project = await projectRepository.findById(projectId, {
      populate: [{ path: 'projectManager' }]
    });

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify user is project manager
    const isProjectManager = project.projectManager && 
      project.projectManager._id.toString() === userId.toString();
    
    if (!isProjectManager) {
      throw AppError.forbidden('NOT_PROJECT_MANAGER', 'Not authorized: only project manager can update risks');
    }

    const risk = await riskRepository.findById(riskId);
    
    if (!risk) {
      throw AppError.notFound('RISK_NOT_FOUND', 'Risk not found');
    }

    if (risk.project.toString() !== projectId.toString()) {
      throw AppError.forbidden('RISK_NOT_IN_PROJECT', 'Risk does not belong to this project');
    }

    // Fields that can be updated during active project
    const baseFields = ['title', 'description', 'severity', 'rootCause', 'recommendations', 'indicators'];
    
    // Determine which fields are allowed based on project status
    let allowedFields = [...baseFields];
    
    // When project is completed, also allow marking if risk occurred
    if (project.status === 'completed') {
      allowedFields.push('occurred');
    }
    
    // Build update data from allowed fields
    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Mark risk as user-edited to preserve content from translation overwrites
    // This applies to ALL risks (manual, cbr, decision_tree, etc.)
    if (updates.title || updates.description || updates.indicators || updates.recommendations) {
      updateData.userEdited = true;
    }

    // Auto-update status based on occurred field when project is completed
    if (project.status === 'completed' && updates.occurred !== undefined) {
      updateData.status = updates.occurred ? 'occurred' : 'avoided';
    }

    updateData.updatedAt = new Date();
    const updatedRisk = await riskRepository.updateById(riskId, updateData);

    return updatedRisk;
  } catch (error) {
    console.error('Error updating manual risk:', error);
    throw AppError.badRequest('UPDATE_RISK_FAILED', `Failed to update manual risk: ${error.message}`);
  }
}

/**
 * Get all manual risks for a project
 * 
 * @param {String} projectId - Project ID
 * @returns {Array} Array of manual risks
 */
async function getProjectManualRisks(projectId) {
  try {
    const risks = await riskRepository.find({
      project: projectId,
      source: 'manual'
    }, { sort: { createdAt: -1 } });

    return risks;
  } catch (error) {
    console.error('Error getting manual risks:', error);
    throw AppError.badRequest('GET_RISKS_FAILED', `Failed to get manual risks: ${error.message}`);
  }
}

/**
 * Delete a manual risk (only if project not completed)
 * 
 * @param {String} projectId - Project ID
 * @param {String} riskId - Risk ID to delete
 * @param {String} userId - User ID (must be project manager)
 * @returns {Object} Deletion result
 */
async function deleteManualRisk(projectId, riskId, userId) {
  try {
    const project = await projectRepository.findById(projectId, {
      populate: [{ path: 'projectManager' }]
    });

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify user is project manager
    const isProjectManager = project.projectManager && 
      project.projectManager._id.toString() === userId.toString();
    
    if (!isProjectManager) {
      throw AppError.forbidden('NOT_PROJECT_MANAGER', 'Not authorized: only project manager can delete risks');
    }

    // Don't allow deletion if project is completed
    if (project.status === 'completed') {
      throw AppError.badRequest('CANNOT_DELETE_COMPLETED', 'Cannot delete risks from completed projects');
    }

    const risk = await riskRepository.findById(riskId);
    
    if (!risk) {
      throw AppError.notFound('RISK_NOT_FOUND', 'Risk not found');
    }

    if (risk.project.toString() !== projectId.toString()) {
      throw AppError.forbidden('RISK_NOT_IN_PROJECT', 'Risk does not belong to this project');
    }

    if (risk.source !== 'manual') {
      throw AppError.badRequest('NOT_MANUAL_RISK', 'Can only delete manually added risks');
    }

    // Remove from project's riskPredictions array
    const updatedPredictions = project.riskPredictions.filter(
      rp => rp.toString() !== riskId.toString()
    );
    await projectRepository.updateById(project._id, { riskPredictions: updatedPredictions });

    // Delete the risk
    await riskRepository.deleteById(riskId);

    return { success: true, message: 'Risk deleted successfully' };
  } catch (error) {
    console.error('Error deleting manual risk:', error);
    throw AppError.badRequest('DELETE_RISK_FAILED', `Failed to delete manual risk: ${error.message}`);
  }
}

module.exports = {
  addManualRisk,
  updateRisk,
  updateManualRisk: updateRisk, // Alias for backwards compatibility
  getProjectManualRisks,
  deleteManualRisk
};
