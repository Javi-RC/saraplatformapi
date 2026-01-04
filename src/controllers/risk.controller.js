/**
 * Risk Controller
 * Handles HTTP requests for risk prediction and management
 */

const riskPredictionService = require('../services/riskPrediction.service');
const postProjectService = require('../services/postProject.service');
const seedCasesService = require('../services/seedCases.service');
const Risk = require('../models/risk.model');
const CaseBase = require('../models/caseBase.model');

class RiskController {
  /**
   * Predict risks for a project
   * POST /api/projects/:id/risks/predict
   */
  async predictRisks(req, res) {
    try {
      const { id: projectId } = req.params;
      
      const prediction = await riskPredictionService.predictProjectRisks(projectId);
      
      return res.status(200).json({
        success: true,
        message: 'Risk prediction completed successfully',
        data: prediction
      });
    } catch (error) {
      console.error('Error predicting risks:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get risk predictions for a project
   * GET /api/projects/:id/risks
   */
  async getProjectRisks(req, res) {
    try {
      const { id: projectId } = req.params;
      const { status, occurred } = req.query;
      
      const options = {};
      if (status) options.status = status;
      if (occurred !== undefined) options.occurred = occurred === 'true';
      
      const risks = await riskPredictionService.getProjectRiskPredictions(
        projectId,
        options
      );
      
      return res.status(200).json({
        success: true,
        data: risks
      });
    } catch (error) {
      console.error('Error getting project risks:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get a specific risk by ID
   * GET /api/risks/:id
   */
  async getRiskById(req, res) {
    try {
      const { id } = req.params;
      
      const risk = await Risk.findById(id)
        .populate('project', 'projectName')
        .populate('organization', 'name')
        .populate('basedOnCases.caseId');
      
      if (!risk) {
        return res.status(404).json({
          success: false,
          error: 'Risk not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: risk
      });
    } catch (error) {
      console.error('Error getting risk:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      
      const risk = await Risk.findById(id);
      
      if (!risk) {
        return res.status(404).json({
          success: false,
          error: 'Risk not found'
        });
      }
      
      risk.feedback = {
        usefulnessRating,
        accuracyRating,
        comments,
        providedBy: userId,
        providedAt: new Date()
      };
      
      await risk.save();
      
      return res.status(200).json({
        success: true,
        message: 'Feedback saved successfully',
        data: risk
      });
    } catch (error) {
      console.error('Error updating risk feedback:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('Not authorized')) statusCode = 403;
      if (error.message.includes('required')) statusCode = 400;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get post-project form
   * GET /api/projects/:id/outcome/form
   */
  async getOutcomeForm(req, res) {
    try {
      const { id: projectId } = req.params;
      
      const form = await postProjectService.getPostProjectForm(projectId);
      
      return res.status(200).json({
        success: true,
        data: form
      });
    } catch (error) {
      console.error('Error getting outcome form:', error);
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get organization risk statistics
   * GET /api/organizations/:id/risks/stats
   */
  async getOrganizationStats(req, res) {
    try {
      const { id: organizationId } = req.params;
      
      const stats = await Risk.getOrganizationStats(organizationId);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting organization stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get prediction accuracy report
   * GET /api/organizations/:id/risks/accuracy
   */
  async getAccuracyReport(req, res) {
    try {
      const { id: organizationId } = req.params;
      
      const report = await Risk.getAccuracyReport(organizationId);
      
      return res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error getting accuracy report:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get case base statistics
   * GET /api/organizations/:id/case-base/stats
   */
  async getCaseBaseStats(req, res) {
    try {
      const { id: organizationId } = req.params;
      
      const stats = await CaseBase.getCaseBaseStats(organizationId);
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting case base stats:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      
      const cases = await CaseBase.getOrganizationCases(organizationId, options);
      
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Get a specific case
   * GET /api/case-base/:id
   */
  async getCaseById(req, res) {
    try {
      const { id } = req.params;
      
      const caseDoc = await CaseBase.findById(id)
        .populate('organization', 'name')
        .populate('caseId', 'projectName');
      
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Load seed cases (Admin only)
   * POST /api/case-base/seed
   */
  async loadSeedCases(req, res) {
    try {
      // This should be restricted to admins
      const result = await seedCasesService.loadSeedCases();
      
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error loading seed cases:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      
      const Project = require('../models/project.model');
      const cbrService = require('../services/cbr.service');
      
      const project = await Project.findById(projectId).populate('organization');
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      const organizationId = project.organization._id || project.organization;
      const projectFeatures = cbrService.extractProjectFeatures(project);
      const similarCases = await cbrService.retrieveSimilarCases(
        project,
        organizationId,
        parseInt(limit)
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new RiskController();
