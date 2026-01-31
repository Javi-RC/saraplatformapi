/**
 * Manual Risk Service
 * Handles manually added risks by project managers during project execution
 * 
 * IMPORTANT: Manual risks are NOT marked as "occurred" here.
 * They are only registered. The PM will evaluate which risks actually occurred
 * during the post-project retrospective (captureProjectOutcome).
 * These risks are included in CBR learning when the project is completed.
 */

const Project = require('../models/project.model');
const Risk = require('../models/risk.model');

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
    const project = await Project.findById(projectId)
      .populate('organization')
      .populate('projectManager');

    if (!project) {
      throw new Error('Project not found');
    }

    // Verify user is project manager
    const isProjectManager = project.projectManager && 
      project.projectManager._id.toString() === userId.toString();
    
    if (!isProjectManager) {
      throw new Error('Not authorized: only project manager can add risks');
    }

    // Validate risk data
    if (!riskData.type || !riskData.title || !riskData.description) {
      throw new Error('Missing required fields: type, title, description');
    }

    if (riskData.similarity !== undefined && riskData.similarity !== null) {
      if (riskData.similarity < 0 || riskData.similarity > 1) {
        throw new Error('Similarity must be between 0 and 1');
      }
    }

    // Create risk document
    const newRisk = new Risk({
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

    await newRisk.save();

    // Add to project's riskPredictions array if not already there
    if (!project.riskPredictions.includes(newRisk._id)) {
      project.riskPredictions.push(newRisk._id);
      await project.save();
    }

    return newRisk;
  } catch (error) {
    console.error('Error adding manual risk:', error);
    throw new Error(`Failed to add manual risk: ${error.message}`);
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
    const project = await Project.findById(projectId)
      .populate('projectManager');

    if (!project) {
      throw new Error('Project not found');
    }

    // Verify user is project manager
    const isProjectManager = project.projectManager && 
      project.projectManager._id.toString() === userId.toString();
    
    if (!isProjectManager) {
      throw new Error('Not authorized: only project manager can update risks');
    }

    const risk = await Risk.findById(riskId);
    
    if (!risk) {
      throw new Error('Risk not found');
    }

    if (risk.project.toString() !== projectId.toString()) {
      throw new Error('Risk does not belong to this project');
    }

    // Fields that can be updated during active project
    const baseFields = ['title', 'description', 'severity', 'rootCause', 'recommendations', 'indicators'];
    
    // Determine which fields are allowed based on project status
    let allowedFields = [...baseFields];
    
    // When project is completed, also allow marking if risk occurred
    if (project.status === 'completed') {
      allowedFields.push('occurred');
    }
    
    // Update allowed fields
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        risk[field] = updates[field];
      }
    });

    // Mark risk as user-edited to preserve content from translation overwrites
    // This applies to ALL risks (manual, cbr, decision_tree, etc.)
    if (updates.title || updates.description || updates.indicators || updates.recommendations) {
      risk.userEdited = true;
    }

    // Auto-update status based on occurred field when project is completed
    if (project.status === 'completed' && updates.occurred !== undefined) {
      risk.status = updates.occurred ? 'occurred' : 'avoided';
    }

    risk.updatedAt = new Date();
    await risk.save();

    return risk;
  } catch (error) {
    console.error('Error updating manual risk:', error);
    throw new Error(`Failed to update manual risk: ${error.message}`);
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
    const risks = await Risk.find({
      project: projectId,
      source: 'manual'
    }).sort({ createdAt: -1 });

    return risks;
  } catch (error) {
    console.error('Error getting manual risks:', error);
    throw new Error(`Failed to get manual risks: ${error.message}`);
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
    const project = await Project.findById(projectId)
      .populate('projectManager');

    if (!project) {
      throw new Error('Project not found');
    }

    // Verify user is project manager
    const isProjectManager = project.projectManager && 
      project.projectManager._id.toString() === userId.toString();
    
    if (!isProjectManager) {
      throw new Error('Not authorized: only project manager can delete risks');
    }

    // Don't allow deletion if project is completed
    if (project.status === 'completed') {
      throw new Error('Cannot delete risks from completed projects');
    }

    const risk = await Risk.findById(riskId);
    
    if (!risk) {
      throw new Error('Risk not found');
    }

    if (risk.project.toString() !== projectId.toString()) {
      throw new Error('Risk does not belong to this project');
    }

    if (risk.source !== 'manual') {
      throw new Error('Can only delete manually added risks');
    }

    // Remove from project's riskPredictions array
    project.riskPredictions = project.riskPredictions.filter(
      rp => rp.toString() !== riskId.toString()
    );
    await project.save();

    // Delete the risk
    await Risk.findByIdAndDelete(riskId);

    return { success: true, message: 'Risk deleted successfully' };
  } catch (error) {
    console.error('Error deleting manual risk:', error);
    throw new Error(`Failed to delete manual risk: ${error.message}`);
  }
}

module.exports = {
  addManualRisk,
  updateRisk,
  updateManualRisk: updateRisk, // Alias for backwards compatibility
  getProjectManualRisks,
  deleteManualRisk
};
