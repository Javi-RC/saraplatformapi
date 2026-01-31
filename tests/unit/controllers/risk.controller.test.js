const riskController = require('../../../src/controllers/risk.controller');
const riskPredictionService = require('../../../src/services/riskPrediction.service');
const postProjectService = require('../../../src/services/postProject.service');
const seedCasesService = require('../../../src/services/seedCases.service');
const Risk = require('../../../src/models/risk.model');
const CaseBase = require('../../../src/models/caseBase.model');
const i18n = require('../../../src/i18n/i18n.service');

jest.mock('../../../src/services/riskPrediction.service');
jest.mock('../../../src/services/postProject.service');
jest.mock('../../../src/services/seedCases.service');
jest.mock('../../../src/models/risk.model');
jest.mock('../../../src/models/caseBase.model');
jest.mock('../../../src/i18n/i18n.service');

describe('Risk Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user123',
        role: 'project_manager',
        preferredLanguage: 'es'
      },
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Default i18n mock
    i18n.getLanguageFromRequest.mockReturnValue('es');
    i18n.translateRiskObject.mockImplementation((risk) => risk);
    
    jest.clearAllMocks();
  });

  describe('predictRisks', () => {
    it('should predict risks successfully', async () => {
      req.params.id = 'project123';
      const mockPrediction = {
        projectId: 'project123',
        risks: [
          { type: 'schedule', severity: 'high', probability: 0.8 }
        ]
      };
      riskPredictionService.predictProjectRisks.mockResolvedValue(mockPrediction);

      await riskController.predictRisks(req, res);

      expect(riskPredictionService.predictProjectRisks).toHaveBeenCalledWith('project123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Risk prediction completed successfully',
        data: mockPrediction
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      const error = new Error('Project not found');
      riskPredictionService.predictProjectRisks.mockRejectedValue(error);

      await riskController.predictRisks(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 for other errors', async () => {
      req.params.id = 'project123';
      const error = new Error('Service error');
      riskPredictionService.predictProjectRisks.mockRejectedValue(error);

      await riskController.predictRisks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getProjectRisks', () => {
    it('should get project risks successfully', async () => {
      req.params.id = 'project123';
      const mockRisks = [
        { _id: 'risk1', type: 'schedule', severity: 'high' },
        { _id: 'risk2', type: 'budget', severity: 'medium' }
      ];
      riskPredictionService.getProjectRiskPredictions.mockResolvedValue(mockRisks);

      await riskController.getProjectRisks(req, res);

      expect(riskPredictionService.getProjectRiskPredictions).toHaveBeenCalledWith(
        'project123',
        {}
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRisks
      });
    });

    it('should filter by status', async () => {
      req.params.id = 'project123';
      req.query.status = 'active';
      riskPredictionService.getProjectRiskPredictions.mockResolvedValue([]);

      await riskController.getProjectRisks(req, res);

      expect(riskPredictionService.getProjectRiskPredictions).toHaveBeenCalledWith(
        'project123',
        { status: 'active' }
      );
    });

    it('should filter by occurred', async () => {
      req.params.id = 'project123';
      req.query.occurred = 'true';
      riskPredictionService.getProjectRiskPredictions.mockResolvedValue([]);

      await riskController.getProjectRisks(req, res);

      expect(riskPredictionService.getProjectRiskPredictions).toHaveBeenCalledWith(
        'project123',
        { occurred: true }
      );
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      const error = new Error('Project not found');
      riskPredictionService.getProjectRiskPredictions.mockRejectedValue(error);

      await riskController.getProjectRisks(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getRiskById', () => {
    it('should get risk by id successfully', async () => {
      req.params.id = 'risk123';
      const mockRisk = {
        _id: 'risk123',
        type: 'schedule',
        severity: 'high',
        populate: jest.fn().mockReturnThis()
      };
      Risk.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockRisk)
          })
        })
      });

      await riskController.getRiskById(req, res);

      expect(Risk.findById).toHaveBeenCalledWith('risk123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRisk
      });
    });

    it('should return 404 when risk not found', async () => {
      req.params.id = 'risk123';
      Risk.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
          })
        })
      });

      await riskController.getRiskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params.id = 'risk123';
      const error = new Error('Database error');
      Risk.findById.mockImplementation(() => {
        throw error;
      });

      await riskController.getRiskById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateRiskFeedback', () => {
    it('should update risk feedback successfully', async () => {
      req.params.id = 'risk123';
      req.body = {
        usefulnessRating: 4,
        accuracyRating: 5,
        comments: 'Very helpful'
      };
      const mockRisk = {
        _id: 'risk123',
        feedback: {},
        save: jest.fn().mockResolvedValue(true)
      };
      Risk.findById.mockResolvedValue(mockRisk);

      await riskController.updateRiskFeedback(req, res);

      expect(Risk.findById).toHaveBeenCalledWith('risk123');
      expect(mockRisk.feedback).toEqual({
        usefulnessRating: 4,
        accuracyRating: 5,
        comments: 'Very helpful',
        providedBy: 'user123',
        providedAt: expect.any(Date)
      });
      expect(mockRisk.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when risk not found', async () => {
      req.params.id = 'risk123';
      req.body = { usefulnessRating: 4 };
      Risk.findById.mockResolvedValue(null);

      await riskController.updateRiskFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle errors', async () => {
      req.params.id = 'risk123';
      req.body = { usefulnessRating: 4 };
      const error = new Error('Database error');
      Risk.findById.mockRejectedValue(error);

      await riskController.updateRiskFeedback(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('captureOutcome', () => {
    it('should capture outcome successfully', async () => {
      req.params.id = 'project123';
      req.body = {
        completed: true,
        delayDays: 0,
        budgetOverrun: 0,
        qualityScore: 9
      };
      const mockResult = {
        projectId: 'project123',
        outcome: req.body
      };
      postProjectService.captureProjectOutcome.mockResolvedValue(mockResult);

      await riskController.captureOutcome(req, res);

      expect(postProjectService.captureProjectOutcome).toHaveBeenCalledWith(
        'project123',
        req.body,
        'user123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project outcome captured successfully',
        data: mockResult
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      req.body = { completed: true };
      const error = new Error('Project not found');
      postProjectService.captureProjectOutcome.mockRejectedValue(error);

      await riskController.captureOutcome(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when not authorized', async () => {
      req.params.id = 'project123';
      req.body = { completed: true };
      const error = new Error('Not authorized');
      postProjectService.captureProjectOutcome.mockRejectedValue(error);

      await riskController.captureOutcome(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 when required fields missing', async () => {
      req.params.id = 'project123';
      req.body = {};
      const error = new Error('Field is required');
      postProjectService.captureProjectOutcome.mockRejectedValue(error);

      await riskController.captureOutcome(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getOutcomeForm', () => {
    it('should get outcome form successfully with language support', async () => {
      req.params.id = 'project123';
      i18n.getLanguageFromRequest.mockReturnValue('es');
      const mockForm = {
        project: { id: 'project123', name: 'Test Project' },
        predictedRisks: [
          { id: 'risk1', type: 'communication_breakdown', title: 'Fallo de Comunicación', severity: 'high' }
        ],
        form: {
          sections: [
            { 
              title: 'Resultado General del Proyecto',
              fields: [
                { name: 'completed', type: 'boolean', required: true, label: '¿Proyecto completado?' }
              ]
            }
          ]
        }
      };
      postProjectService.getPostProjectForm.mockResolvedValue(mockForm);

      await riskController.getOutcomeForm(req, res);

      expect(i18n.getLanguageFromRequest).toHaveBeenCalledWith(req);
      expect(postProjectService.getPostProjectForm).toHaveBeenCalledWith('project123', 'es');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockForm,
        language: 'es'
      });
    });

    it('should get outcome form in English when lang=en', async () => {
      req.params.id = 'project123';
      req.query.lang = 'en';
      i18n.getLanguageFromRequest.mockReturnValue('en');
      const mockForm = {
        project: { id: 'project123', name: 'Test Project' },
        predictedRisks: [
          { id: 'risk1', type: 'communication_breakdown', title: 'Communication Breakdown', severity: 'high' }
        ],
        form: {
          sections: [
            { 
              title: 'General Project Outcome',
              fields: [
                { name: 'completed', type: 'boolean', required: true, label: 'Project completed?' }
              ]
            }
          ]
        }
      };
      postProjectService.getPostProjectForm.mockResolvedValue(mockForm);

      await riskController.getOutcomeForm(req, res);

      expect(i18n.getLanguageFromRequest).toHaveBeenCalledWith(req);
      expect(postProjectService.getPostProjectForm).toHaveBeenCalledWith('project123', 'en');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockForm,
        language: 'en'
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      i18n.getLanguageFromRequest.mockReturnValue('es');
      const error = new Error('Project not found');
      postProjectService.getPostProjectForm.mockRejectedValue(error);

      await riskController.getOutcomeForm(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getOrganizationInsights', () => {
    it('should get organization insights successfully', async () => {
      req.params.id = 'org123';
      const mockInsights = {
        totalRisks: 100,
        risksByType: { schedule: 40, budget: 30, quality: 30 },
        averageSeverity: 'medium'
      };
      riskPredictionService.getOrganizationRiskInsights.mockResolvedValue(mockInsights);

      await riskController.getOrganizationInsights(req, res);

      expect(riskPredictionService.getOrganizationRiskInsights).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockInsights
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Service error');
      riskPredictionService.getOrganizationRiskInsights.mockRejectedValue(error);

      await riskController.getOrganizationInsights(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getOrganizationStats', () => {
    it('should get organization stats successfully', async () => {
      req.params.id = 'org123';
      const mockStats = {
        totalRisks: 50,
        activeRisks: 10,
        resolvedRisks: 40
      };
      Risk.getOrganizationStats.mockResolvedValue(mockStats);

      await riskController.getOrganizationStats(req, res);

      expect(Risk.getOrganizationStats).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Database error');
      Risk.getOrganizationStats.mockRejectedValue(error);

      await riskController.getOrganizationStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAccuracyReport', () => {
    it('should get accuracy report successfully', async () => {
      req.params.id = 'org123';
      const mockReport = {
        totalPredictions: 100,
        accuracy: 0.85,
        byType: {
          schedule: 0.9,
          budget: 0.8
        }
      };
      Risk.getAccuracyReport.mockResolvedValue(mockReport);

      await riskController.getAccuracyReport(req, res);

      expect(Risk.getAccuracyReport).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockReport
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Service error');
      Risk.getAccuracyReport.mockRejectedValue(error);

      await riskController.getAccuracyReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCaseBaseStats', () => {
    it('should get case base stats successfully', async () => {
      req.params.id = 'org123';
      const mockStats = {
        totalCases: 50,
        casesByType: { success: 30, failure: 20 }
      };
      CaseBase.getCaseBaseStats.mockResolvedValue(mockStats);

      await riskController.getCaseBaseStats(req, res);

      expect(CaseBase.getCaseBaseStats).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Database error');
      CaseBase.getCaseBaseStats.mockRejectedValue(error);

      await riskController.getCaseBaseStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getOrganizationCases', () => {
    it('should get organization cases successfully', async () => {
      req.params.id = 'org123';
      const mockCases = [
        {
          _id: 'case1',
          caseId: 'c1',
          problem: { projectName: 'Project 1' },
          type: 'success',
          solution: {
            completed: true,
            delayDays: 0,
            budgetOverrun: 0,
            qualityScore: 9
          },
          metadata: {
            timesReused: 5,
            usefulnessScore: 4.5,
            completedAt: new Date()
          }
        }
      ];
      CaseBase.getOrganizationCases.mockResolvedValue(mockCases);

      await riskController.getOrganizationCases(req, res);

      expect(CaseBase.getOrganizationCases).toHaveBeenCalledWith('org123', {});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 1,
          cases: expect.any(Array)
        }
      });
    });

    it('should filter by type', async () => {
      req.params.id = 'org123';
      req.query.type = 'success';
      CaseBase.getOrganizationCases.mockResolvedValue([]);

      await riskController.getOrganizationCases(req, res);

      expect(CaseBase.getOrganizationCases).toHaveBeenCalledWith('org123', { type: 'success' });
    });
  });

  describe('getCaseById', () => {
    it('should get case by id successfully', async () => {
      req.params.id = 'case123';
      const mockCase = {
        _id: 'case123',
        caseId: 'c1',
        problem: { projectName: 'Test Project' }
      };
      CaseBase.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCase)
        })
      });

      await riskController.getCaseById(req, res);

      expect(CaseBase.findById).toHaveBeenCalledWith('case123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when case not found', async () => {
      req.params.id = 'case123';
      CaseBase.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await riskController.getCaseById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('loadSeedCases', () => {
    it('should load seed cases successfully', async () => {
      const mockResult = {
        message: 'Seed cases loaded',
        count: 10
      };
      seedCasesService.loadSeedCases.mockResolvedValue(mockResult);

      await riskController.loadSeedCases(req, res);

      expect(seedCasesService.loadSeedCases).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
        data: mockResult
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      seedCasesService.loadSeedCases.mockRejectedValue(error);

      await riskController.loadSeedCases(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getSeedCases', () => {
    it('should get seed cases successfully', async () => {
      const mockSeeds = [
        { _id: 'seed1', name: 'Seed Case 1' },
        { _id: 'seed2', name: 'Seed Case 2' }
      ];
      seedCasesService.getSeedCases.mockResolvedValue(mockSeeds);

      await riskController.getSeedCases(req, res);

      expect(seedCasesService.getSeedCases).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          total: 2,
          seeds: mockSeeds
        }
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      seedCasesService.getSeedCases.mockRejectedValue(error);

      await riskController.getSeedCases(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
