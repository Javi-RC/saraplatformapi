/**
 * Risk Controller
 * Handles HTTP requests for risk prediction and management
 */

const riskPredictionService = require('../services/riskPrediction.service');
const postProjectService = require('../services/postProject.service');
const seedCasesService = require('../services/seedCases.service');
const manualRiskService = require('../services/manualRisk.service');
const Risk = require('../models/risk.model');
const CaseBase = require('../models/caseBase.model');
const i18n = require('../i18n/i18n.service');

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
      
      console.log(`[RiskController] Predicting risks with language: ${lang}`);
      console.log(`[RiskController] Query params:`, req.query);
      console.log(`[RiskController] User preferred language:`, req.user?.preferredLanguage);
      
      const prediction = await riskPredictionService.predictProjectRisks(projectId, lang);
      
      console.log(`[RiskController] First risk title:`, prediction.risks[0]?.title);
      console.log(`[RiskController] Response language:`, lang);
      
      return res.status(200).json({
        success: true,
        message: 'Risk prediction completed successfully',
        data: prediction,
        language: lang
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
   * Supports language selection via query param ?lang=en or user preference
   */
  async getRiskById(req, res) {
    try {
      const { id } = req.params;
      const lang = i18n.getLanguageFromRequest(req);
      
      let risk = await Risk.findById(id)
        .populate('project', 'projectName')
        .populate('organization', 'name')
        .populate('basedOnCases.caseId');
      
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('not authorized')) statusCode = 403;
      if (error.message.includes('required')) statusCode = 400;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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

      console.log(`[UpdateManualRisk] Project: ${projectId}, Risk: ${riskId}, Lang: ${lang}`);
      console.log(`[UpdateManualRisk] Updates:`, JSON.stringify(updates));

      const risk = await manualRiskService.updateManualRisk(
        projectId,
        riskId,
        updates,
        userId
      );

      console.log(`[UpdateManualRisk] Risk after update:`, risk.type, risk.title);

      // Translate risk before returning
      const translatedRisk = i18n.translateRiskObject(risk.toObject ? risk.toObject() : risk, lang);

      console.log(`[UpdateManualRisk] Translated title:`, translatedRisk.title);

      return res.status(200).json({
        success: true,
        message: 'Risk updated successfully',
        data: translatedRisk,
        language: lang
      });
    } catch (error) {
      console.error('Error updating risk:', error);
      
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('not authorized')) statusCode = 403;
      
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      const statusCode = error.message.includes('not found') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('not authorized')) statusCode = 403;
      if (error.message.includes('Cannot delete')) statusCode = 400;
      
      return res.status(statusCode).json({
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
      const lang = i18n.getLanguageFromRequest(req);
      
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
      
      // Translate risk before returning
      const translatedRisk = i18n.translateRiskObject(risk.toObject(), lang);
      
      return res.status(200).json({
        success: true,
        message: 'Feedback saved successfully',
        data: translatedRisk,
        language: lang
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
      
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
      
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
      
      await project.save();
      
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get DT indicators (early warning signs)
   * GET /api/projects/:id/risks/indicators
   */
  async getDTIndicators(req, res) {
    try {
      const { id: projectId } = req.params;
      
      const Project = require('../models/project.model');
      const project = await Project.findById(projectId);
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DEBUG ENDPOINT: Get complete catalog of all possible risk types with full metadata
   * GET /api/risks/debug/all?lang=en or ?lang=es
   * Returns all risk types the system can generate with detailed information
   * Supports language selection via query param
   */
  async debugGetAllRisks(req, res) {
    try {
      const Risk = require('../models/risk.model');
      const { RISK_CATALOG, getHofstedeRisks, getTraditionalRisks, getAllRiskTypes } = require('../config/riskCatalog');
      const riskTypes = getAllRiskTypes();
      const lang = i18n.getLanguageFromRequest(req);
      
      // Build response from centralized catalog with translations
      const catalog = riskTypes.map(type => {
        const catalogEntry = RISK_CATALOG[type];
        const translated = i18n.translateRisk(type, lang);
        const indicators = i18n.translateIndicators(type, lang);
        const recommendations = i18n.translateRecommendations(type, lang);
        
        return {
          type,
          title: translated?.title || catalogEntry?.title || type.replace(/_/g, ' '),
          description: translated?.description || catalogEntry?.description || 'No description available',
          category: catalogEntry?.category || 'management',
          typicalSeverities: catalogEntry?.typicalSeverities || ['medium'],
          possibleSources: catalogEntry?.possibleSources || ['expert_rules'],
          isHofstedeRelated: catalogEntry?.isHofstedeRelated || false,
          triggerConditions: catalogEntry?.triggerConditions || 'Unknown',
          typicalIndicators: indicators || [],
          typicalRecommendations: recommendations || []
        };
      });

      const hofstedeRisks = getHofstedeRisks();
      const traditionalRisks = getTraditionalRisks();

      return res.status(200).json({
        success: true,
        language: lang,
        summary: {
          totalPossibleRiskTypes: catalog.length,
          hofstedeRisksCount: hofstedeRisks.length,
          traditionalRisksCount: traditionalRisks.length,
          categories: [...new Set(catalog.map(r => r.category))],
          allSources: [...new Set(catalog.flatMap(r => r.possibleSources))]
        },
        hofstedeRisks: hofstedeRisks.map(r => {
          const translated = i18n.translateRisk(r.type, lang);
          return {
            type: r.type,
            title: translated?.title || r.title,
            algorithm: r.algorithm,
            formula: r.formula
          };
        }),
        data: catalog,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in debug endpoint:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

   /**
   * DEBUG ENDPOINT: Validate if a risk type exists in the system
   * GET /api/risks/debug/by-type/:type?lang=en or ?lang=es
   * Returns information about a specific risk type possibility
   * Supports language selection via query param
   */
  async debugGetRisksByType(req, res) {
    try {
      const { type } = req.params;
      const Risk = require('../models/risk.model');
      const { getAllRiskTypes, RISK_CATALOG } = require('../config/riskCatalog');
      const riskTypeEnum = getAllRiskTypes();
      const lang = i18n.getLanguageFromRequest(req);
      
      if (!riskTypeEnum.includes(type)) {
        return res.status(404).json({
          success: false,
          message: `Risk type '${type}' does not exist in the system`,
          validTypes: riskTypeEnum,
          timestamp: new Date().toISOString()
        });
      }

      const isHofstede = [
        'communication_tools_missing',
        'cultural_distance_risk',
        'linguistic_distance_risk',
        'linguistic_distance_no_common_language',
        'team_autonomy_risk',
        'schedule_flexibility_risk',
        'travel_availability_risk'
      ].includes(type);

      const translated = i18n.translateRisk(type, lang);
      const catalogEntry = RISK_CATALOG[type];

      return res.status(200).json({
        success: true,
        language: lang,
        data: {
          type,
          title: translated?.title || type.replace(/_/g, ' '),
          description: translated?.description || catalogEntry?.description || 'No description available',
          exists: true,
          isHofstedeRelated: isHofstede,
          indicators: translated?.indicators || {},
          recommendations: translated?.recommendations || {},
          possibleSeverities: ['low', 'medium', 'medium-high', 'high', 'critical', 'emerging'],
          possibleCategories: ['coordination', 'technical', 'team', 'management', 'organizational'],
          possibleSources: Risk.schema.path('source').enumValues,
          algorithm: catalogEntry?.algorithm,
          formula: catalogEntry?.formula,
          triggerConditions: catalogEntry?.triggerConditions
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in debug endpoint:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * DEBUG ENDPOINT: Get complete risk system metadata
   * GET /api/risks/debug/types-summary
   * Returns system configuration: types, categories, severities, sources, algorithms
   */
  async debugGetRiskTypesSummary(req, res) {
    try {
      const Risk = require('../models/risk.model');
      const { getAllRiskTypes } = require('../config/riskCatalog');
      
      const riskTypes = getAllRiskTypes();
      const categories = Risk.schema.path('category').enumValues;
      const severities = Risk.schema.path('severity').enumValues;
      const sources = Risk.schema.path('source').enumValues;

      const hofstedeRisks = [
        'communication_tools_missing',
        'cultural_distance_risk',
        'linguistic_distance_risk',
        'linguistic_distance_no_common_language',
        'team_autonomy_risk',
        'schedule_flexibility_risk',
        'travel_availability_risk'
      ];

      const summary = {
        system: {
          totalRiskTypes: riskTypes.length,
          totalCategories: categories.length,
          totalSeverityLevels: severities.length,
          totalSources: sources.length
        },
        riskTypes: {
          all: riskTypes,
          hofstedeRelated: hofstedeRisks,
          traditional: riskTypes.filter(type => !hofstedeRisks.includes(type))
        },
        categories: {
          all: categories,
          descriptions: {
            coordination: 'Coordination and communication risks',
            technical: 'Technical skills and infrastructure risks',
            team: 'Team dynamics and wellbeing risks',
            management: 'Project management and planning risks',
            organizational: 'Organizational culture and policy risks'
          }
        },
        severities: {
          all: severities,
          numericMapping: {
            low: 1,
            medium: 2,
            'medium-high': 3,
            high: 4,
            critical: 5,
            emerging: 2
          }
        },
        sources: {
          all: sources,
          descriptions: {
            expert_rules: 'Traditional decision tree expert rules',
            expert_rules_enhanced: 'Enhanced rules with time overlap + binomial coefficient',
            expert_rules_hofstede: 'Hofstede cultural dimensions (6D Euclidean distance)',
            expert_rules_linguistic: 'Linguistic distance analysis',
            expert_rules_project_requirements: 'Project requirements mismatch (1-5 inverse scale)',
            expert_rules_early_warning: 'Early warning indicators',
            cbr: 'Case-based reasoning from historical projects',
            combined: 'Combined DT + CBR weighted prediction',
            seed_cases: 'From seed case database',
            emerging_pattern: 'Detected emerging patterns',
            manual: 'Manually entered by PM'
          }
        },
        algorithms: {
          hofstedeCulturalDistance: {
            formula: 'sqrt(sum((dim1-dim2)^2)) for 6 dimensions',
            dimensions: ['PDI', 'IDV', 'MAS', 'UAI', 'LTO', 'IND'],
            supportedCountries: 32,
            classification: '5 equal intervals (MUY BAJO to MUY ALTO)'
          },
          communicationTools: {
            formula: 'Max = C(n,2) × Z where n=countries, Z=tool count',
            timeRules: 'S≤2h (async+1,sync-1) | 2h<S<6h (all+1) | S≥6h (sync+1,async-1)'
          },
          linguisticDistance: {
            formula: 'Score +1 per country speaking commonLanguage',
            intervals: '5 equal intervals from 0 to N (countries)'
          },
          projectRequirements: {
            formula: '6 - requiredLevel (inverse 1-5 scale)',
            types: ['autonomy', 'scheduleFlexibility', 'travelAvailability']
          }
        }
      };

      return res.status(200).json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in debug endpoint:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new RiskController();
