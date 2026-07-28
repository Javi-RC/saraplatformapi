/**
 * Risk Controller
 * Handles HTTP requests for risk prediction and management
 */

const riskPredictionService = require('../services/risk/riskPrediction.service');
const postProjectService = require('../services/risk/postProject.service');
const seedCasesService = require('../services/risk/seedCases.service');
const manualRiskService = require('../services/risk/manualRisk.service');
const cbrService = require('../services/risk/cbr.service');
const { riskRepository, projectRepository, caseBaseRepository } = require('../repositories');
// Risk catalog data is now in i18n as single source of truth
const i18n = require('../i18n/i18n.service');

const { ROLES } = require('../config/roles');
const { handleErrorCatch } = require('../utils/errorHelper');

class RiskController {
  /**
   * Predict risks for a project
   * POST /api/projects/:id/risks/predict
   * Supports language selection via query param ?lang=en or user preference
   */
  async predictRisks(req, res) {
    try {
      const { id: projectId } = req.params;
      const lang = i18n.getLanguageFromRequest(req);
      
      const prediction = await riskPredictionService.predictProjectRisks(projectId, lang);
      
      return res.status(200).json({
        success: true,
        message: 'Risk prediction completed successfully',
        data: prediction,
        language: lang
      });
    } catch (error) {
      console.error('Error predicting risks:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get risk predictions for a project
   * GET /api/projects/:id/risks
   * Supports language selection via query param ?lang=en or user preference
   */
  async getProjectRisks(req, res) {
    try {
      const { id: projectId } = req.params;
      const { status, occurred } = req.query;
      const lang = i18n.getLanguageFromRequest(req);
      
      const options = {};
      if (status) options.status = status;
      if (occurred !== undefined) options.occurred = occurred === 'true';
      
      const result = await riskPredictionService.getProjectRiskPredictions(
        projectId,
        options
      );
      
      // Translate risks
      const translatedRisks = result.risks.map(risk => i18n.translateRiskObject(risk, lang));
      
      return res.status(200).json({
        success: true,
        data: {
          ...result,
          risks: translatedRisks
        },
        language: lang
      });
    } catch (error) {
      console.error('Error getting project risks:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get a specific risk by ID
   * GET /api/risks/:id
   * Supports language selection via query param ?lang=en or user preference
   */
  async getRiskById(req, res) {
    try {
      const { id } = req.params;
      const lang = i18n.getLanguageFromRequest(req);
      
      let risk = await riskRepository.findById(id, {
        populate: [
          { path: 'project', select: 'projectName' },
          { path: 'organization', select: 'name' },
          { path: 'basedOnCases.caseId' }
        ]
      });
      
      if (!risk) {
        return res.status(404).json({
          success: false,
          error: 'Risk not found'
        });
      }
      
      // Translate risk
      risk = i18n.translateRiskObject(risk.toObject(), lang);
      
      return res.status(200).json({
        success: true,
        data: risk,
        language: lang
      });
    } catch (error) {
      console.error('Error getting risk:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Add a manual risk to a project
   * POST /api/projects/:id/risks/manual
   * Allows PM to add new risks discovered during project execution
   */
  async addManualRisk(req, res) {
    try {
      const { id: projectId } = req.params;
      const userId = req.user.id;
      const lang = i18n.getLanguageFromRequest(req);
      const { type, title, description, severity, similarity, category, rootCause, indicators, recommendations } = req.body;

      // Validate required fields
      if (!type || !title || !description || !severity) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: type, title, description, severity'
        });
      }

      // Validate similarity if provided (optional field)
      if (similarity !== undefined && similarity !== null && (similarity < 0 || similarity > 1)) {
        return res.status(400).json({
          success: false,
          error: 'Similarity must be between 0 and 1'
        });
      }

      const risk = await manualRiskService.addManualRisk(
        projectId,
        {
          type,
          title,
          description,
          severity,
          similarity,
          category: category || 'team',
          rootCause: rootCause || '',
          indicators: indicators || [],
          recommendations: recommendations || []
        },
        userId
      );

      // Translate risk before returning
      const translatedRisk = i18n.translateRiskObject(risk.toObject ? risk.toObject() : risk, lang);

      return res.status(201).json({
        success: true,
        message: 'Manual risk added successfully',
        data: translatedRisk,
        language: lang
      });
    } catch (error) {
      console.error('Error adding manual risk:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Update a manual risk during project execution
   * PUT /api/projects/:id/risks/:riskId
   * Allows PM to update manually added risks
   */
  async updateManualRisk(req, res) {
    try {
      const { id: projectId, riskId } = req.params;
      const userId = req.user.id;
      const updates = req.body;
      const lang = i18n.getLanguageFromRequest(req);

      const risk = await manualRiskService.updateManualRisk(
        projectId,
        riskId,
        updates,
        userId
      );

      // Translate risk before returning
      const translatedRisk = i18n.translateRiskObject(risk.toObject ? risk.toObject() : risk, lang);

      return res.status(200).json({
        success: true,
        message: 'Risk updated successfully',
        data: translatedRisk,
        language: lang
      });
    } catch (error) {
      console.error('Error updating risk:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get manual risks for a project
   * GET /api/projects/:id/risks/manual
   */
  async getProjectManualRisks(req, res) {
    try {
      const { id: projectId } = req.params;
      const lang = i18n.getLanguageFromRequest(req);

      const risks = await manualRiskService.getProjectManualRisks(projectId);

      // Translate all risks
      const translatedRisks = risks.map(risk => 
        i18n.translateRiskObject(risk.toObject ? risk.toObject() : risk, lang)
      );

      return res.status(200).json({
        success: true,
        data: {
          count: translatedRisks.length,
          risks: translatedRisks
        },
        language: lang
      });
    } catch (error) {
      console.error('Error getting manual risks:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Delete a manual risk
   * DELETE /api/projects/:id/risks/:riskId
   */
  async deleteManualRisk(req, res) {
    try {
      const { id: projectId, riskId } = req.params;
      const userId = req.user.id;

      const result = await manualRiskService.deleteManualRisk(
        projectId,
        riskId,
        userId
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error deleting manual risk:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Update risk feedback
   * PUT /api/risks/:id/feedback
   */
  async updateRiskFeedback(req, res) {
    try {
      const { id } = req.params;
      const { usefulnessRating, accuracyRating, comments } = req.body;
      const userId = req.user.id;
      const lang = i18n.getLanguageFromRequest(req);
      
      const risk = await riskRepository.findById(id);
      
      if (!risk) {
        return res.status(404).json({
          success: false,
          error: 'Risk not found'
        });
      }
      
      const updatedRisk = await riskRepository.updateById(id, {
        feedback: {
          usefulnessRating,
          accuracyRating,
          comments,
          providedBy: userId,
          providedAt: new Date()
        }
      });
      
      // Translate risk before returning
      const translatedRisk = i18n.translateRiskObject(updatedRisk.toObject(), lang);
      
      return res.status(200).json({
        success: true,
        message: 'Feedback saved successfully',
        data: translatedRisk,
        language: lang
      });
    } catch (error) {
      console.error('Error updating risk feedback:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Capture project outcome
   * POST /api/projects/:id/outcome
   */
  async captureOutcome(req, res) {
    try {
      const { id: projectId } = req.params;
      const outcomeData = req.body;
      const userId = req.user.id;
      
      const result = await postProjectService.captureProjectOutcome(
        projectId,
        outcomeData,
        userId
      );
      
      return res.status(200).json({
        success: true,
        message: 'Project outcome captured successfully',
        data: result
      });
    } catch (error) {
      console.error('Error capturing outcome:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get post-project form
   * GET /api/projects/:id/outcome/form
   * Supports language selection via query param ?lang=en or user preference
   */
  async getOutcomeForm(req, res) {
    try {
      const { id: projectId } = req.params;
      const lang = i18n.getLanguageFromRequest(req);
      
      const form = await postProjectService.getPostProjectForm(projectId, lang);
      
      return res.status(200).json({
        success: true,
        data: form,
        language: lang
      });
    } catch (error) {
      console.error('Error getting outcome form:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get organization risk insights
   * GET /api/organizations/:id/risks/insights
   */
  async getOrganizationInsights(req, res) {
    try {
      const { id: organizationId } = req.params;
      
      const insights = await riskPredictionService.getOrganizationRiskInsights(
        organizationId
      );
      
      return res.status(200).json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Error getting organization insights:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get organization risk statistics
   * GET /api/organizations/:id/risks/stats
   */
  async getOrganizationStats(req, res) {
    try {
      const { id: organizationId } = req.params;
      
      const stats = await riskRepository.getOrganizationStats(organizationId);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting organization stats:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get prediction accuracy report
   * GET /api/organizations/:id/risks/accuracy
   */
  async getAccuracyReport(req, res) {
    try {
      const { id: organizationId } = req.params;
      
      const report = await riskRepository.getAccuracyReport(organizationId);
      
      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error getting accuracy report:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get case base statistics
   * GET /api/organizations/:id/case-base/stats
   */
  async getCaseBaseStats(req, res) {
    try {
      const { id: organizationId } = req.params;
      
      const stats = await caseBaseRepository.getCaseBaseStats(organizationId);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting case base stats:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get all cases for organization
   * GET /api/organizations/:id/case-base/cases
   */
  async getOrganizationCases(req, res) {
    try {
      const { id: organizationId } = req.params;
      const { type } = req.query;
      
      const options = {};
      if (type) options.type = type;
      
      const cases = await caseBaseRepository.getOrganizationCases(organizationId, options);
      
      return res.status(200).json({
        success: true,
        data: {
          total: cases.length,
          cases: cases.map(c => ({
            id: c._id,
            caseId: c.caseId,
            projectName: c.problem.projectName,
            type: c.type,
            completed: c.solution.completed,
            delayDays: c.solution.delayDays,
            budgetOverrun: c.solution.budgetOverrun,
            qualityScore: c.solution.qualityScore,
            timesReused: c.metadata.timesReused,
            usefulnessScore: c.metadata.usefulnessScore,
            completedAt: c.metadata.completedAt
          }))
        }
      });
    } catch (error) {
      console.error('Error getting organization cases:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get a specific case
   * GET /api/case-base/:id
   */
  async getCaseById(req, res) {
    try {
      const { id } = req.params;
      
      const caseDoc = await caseBaseRepository.findById(id, {
        populate: [
          { path: 'organization', select: 'name' },
          { path: 'caseId', select: 'projectName' }
        ]
      });
      
      if (!caseDoc) {
        return res.status(404).json({
          success: false,
          error: 'Case not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: caseDoc
      });
    } catch (error) {
      console.error('Error getting case:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Load seed cases (Admin only)
   * POST /api/case-base/seed
   */
  async loadSeedCases(req, res) {
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.ORG_ADMIN) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    try {
      const result = await seedCasesService.loadSeedCases();
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error loading seed cases:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Get all seed cases
   * GET /api/case-base/seed
   */
  async getSeedCases(req, res) {
    try {
      const seeds = await seedCasesService.getSeedCases();
      
      return res.status(200).json({
        success: true,
        data: {
          total: seeds.length,
          seeds
        }
      });
    } catch (error) {
      console.error('Error getting seed cases:', error);
      return handleErrorCatch(error, res);
    }
  }
  
  /**
   * Find similar cases to a project
   * GET /api/projects/:id/similar-cases
   */
  async findSimilarCases(req, res) {
    try {
      const { id: projectId } = req.params;
      const { limit = 5 } = req.query;
      
      const project = await projectRepository.findById(projectId, {
        populate: { path: 'organization' }
      });
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      // Ensure organization is populated
      if (!project.organization) {
        return res.status(400).json({
          success: false,
          error: 'Project organization not found'
        });
      }
      
      const organizationId = project.organization._id || project.organization;
      const projectFeatures = cbrService.extractProjectFeatures(project);
      const similarCases = await cbrService.retrieveSimilarCases(
        project,
        organizationId,
        parseInt(limit, 10)
      );
      
      return res.status(200).json({
        success: true,
        data: {
          projectId,
          projectName: project.projectName,
          similarCases: similarCases.map(sc => ({
            caseId: sc.case._id,
            projectName: sc.case.problem.projectName,
            similarity: sc.similarity,
            breakdown: sc.breakdown,
            outcome: {
              completed: sc.case.solution.completed,
              delayDays: sc.case.solution.delayDays,
              budgetOverrun: sc.case.solution.budgetOverrun,
              qualityScore: sc.case.solution.qualityScore
            },
            risks: sc.case.solution.actualRisks.map(r => ({
              type: r.type,
              severity: r.severity,
              description: r.description
            })),
            lessonsLearned: sc.case.result.lessonsLearned
          }))
        }
      });
    } catch (error) {
      console.error('Error finding similar cases:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get CBR risks filtered by minimum similarity threshold
   * NEW: PM interface to select which learned risks to monitor
   * GET /api/projects/:id/risks/cbr?minSimilarity=0.7
   */
  async getCBRRisks(req, res) {
    try {
      const { id: projectId } = req.params;
      const { minSimilarity = 0.5 } = req.query;
      
      const threshold = Math.max(0, Math.min(1, parseFloat(minSimilarity)));
      
      const project = await projectRepository.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      // Get stored CBR risks if available
      const cbrRisks = project._cbrRisks || [];
      
      // Filter by similarity threshold
      const filteredRisks = cbrRisks.filter(risk => {
        const similarity = risk.similarity || 0;
        return similarity >= threshold;
      });
      
      return res.status(200).json({
        success: true,
        data: {
          projectId,
          projectName: project.projectName,
          minSimilarity: threshold,
          totalCBRRisks: cbrRisks.length,
          filteredCount: filteredRisks.length,
          risks: filteredRisks.map(risk => ({
            type: risk.type,
            title: risk.title,
            description: risk.description,
            severity: risk.severity,
            similarity: risk.similarity,
            source: risk.source,
            reasoning: risk.reasoning,
            basedOnCases: risk.basedOnCases || [],
            recommendations: risk.recommendations,
            similarityBreakdown: risk.similarityBreakdown
          }))
        }
      });
    } catch (error) {
      console.error('Error getting CBR risks:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Accept/select specific CBR risks for monitoring
   * NEW: PM confirms which risks to monitor in the project
   * POST /api/projects/:id/risks/accept
   * Body: { riskIds: ['risk_type_1', 'risk_type_2'] }
   */
  async acceptRisks(req, res) {
    try {
      const { id: projectId } = req.params;
      const { riskIds = [] } = req.body;
      
      if (!Array.isArray(riskIds) || riskIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'riskIds must be a non-empty array'
        });
      }
      
      const project = await projectRepository.findById(projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      // Get CBR risks and filter by selected IDs
      const cbrRisks = project._cbrRisks || [];
      const acceptedRisks = cbrRisks.filter(risk => riskIds.includes(risk.type));
      
      // Mark risks as "monitored" in the project
      if (!project.monitoredRisks) {
        project.monitoredRisks = [];
      }
      
      // Merge with existing monitored risks (avoid duplicates)
      const monitoredTypes = new Set(project.monitoredRisks.map(r => r.type));
      acceptedRisks.forEach(risk => {
        if (!monitoredTypes.has(risk.type)) {
          project.monitoredRisks.push({
            type: risk.type,
            title: risk.title,
            severity: risk.severity,
            similarity: risk.similarity,
            acceptedAt: new Date(),
            source: 'cbr_selected'
          });
        }
      });
      
      await projectRepository.updateById(projectId, { monitoredRisks: project.monitoredRisks });
      
      return res.status(200).json({
        success: true,
        message: `Successfully accepted ${acceptedRisks.length} risks for monitoring`,
        data: {
          projectId,
          acceptedCount: acceptedRisks.length,
          monitoredRisks: project.monitoredRisks
        }
      });
    } catch (error) {
      console.error('Error accepting risks:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get DT indicators (early warning signs)
   * GET /api/projects/:id/risks/indicators
   */
  async getDTIndicators(req, res) {
    try {
      const { id: projectId } = req.params;
      
      const project = await projectRepository.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      const dtIndicators = project._dtIndicators || [];
      
      return res.status(200).json({
        success: true,
        data: {
          projectId,
          projectName: project.projectName,
          indicatorCount: dtIndicators.length,
          indicators: dtIndicators.map(risk => ({
            type: risk.type,
            title: risk.title,
            description: risk.description,
            severity: risk.severity,
            source: risk.source,
            indicators: risk.indicators,
            reasoning: risk.reasoning,
            earlyWarningSignals: risk.earlyWarningSignals,
            recommendations: risk.recommendations
          }))
        }
      });
    } catch (error) {
      console.error('Error getting DT indicators:', error);
      return handleErrorCatch(error, res);
    }
  }
}

module.exports = new RiskController();
