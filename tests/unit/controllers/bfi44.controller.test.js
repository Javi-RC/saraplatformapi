const BFI44Controller = require('../../../src/controllers/bfi44.controller');
const BFI44Service = require('../../../src/services/bfi44.service');
const responseHandler = require('../../../src/utils/responseHandler');
const Organization = require('../../../src/models/organization.model');
const User = require('../../../src/models/user.model');

jest.mock('../../../src/services/bfi44.service');
jest.mock('../../../src/utils/responseHandler');
jest.mock('../../../src/models/organization.model');
jest.mock('../../../src/models/user.model');

describe('BFI44 Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user123',
        role: 'employee'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });

  describe('getQuestions', () => {
    it('should return questionnaire successfully', () => {
      const mockQuestionnaire = {
        questions: [{ id: 1, text: 'Test question' }],
        total: 44
      };
      BFI44Service.getQuestionnaire.mockReturnValue(mockQuestionnaire);

      BFI44Controller.getQuestions(req, res);

      expect(BFI44Service.getQuestionnaire).toHaveBeenCalled();
      expect(responseHandler.success).toHaveBeenCalledWith(res, mockQuestionnaire);
    });

    it('should handle errors', () => {
      const error = new Error('Service error');
      BFI44Service.getQuestionnaire.mockImplementation(() => {
        throw error;
      });

      BFI44Controller.getQuestions(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('submitResponses', () => {
    it('should submit responses successfully', async () => {
      req.body.responses = [1, 2, 3, 4, 5];
      const mockResult = {
        profile: { openness: 3.5, conscientiousness: 4.0 }
      };
      BFI44Service.submitResponses.mockResolvedValue(mockResult);

      await BFI44Controller.submitResponses(req, res);

      expect(BFI44Service.submitResponses).toHaveBeenCalledWith('user123', [1, 2, 3, 4, 5]);
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        {
          message: 'Questionnaire completed successfully',
          ...mockResult
        },
        201
      );
    });

    it('should return error when responses are missing', async () => {
      req.body = {};

      await BFI44Controller.submitResponses(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Las respuestas son requeridas',
        400
      );
    });

    it('should handle service errors', async () => {
      req.body.responses = [1, 2, 3];
      const error = new Error('Invalid responses');
      BFI44Service.submitResponses.mockRejectedValue(error);

      await BFI44Controller.submitResponses(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('getProfile', () => {
    it('should return own profile successfully', async () => {
      req.params.userId = 'user123';
      const mockProfile = { openness: 3.5, conscientiousness: 4.0 };
      BFI44Service.getUserProfile.mockResolvedValue(mockProfile);

      await BFI44Controller.getProfile(req, res);

      expect(BFI44Service.getUserProfile).toHaveBeenCalledWith('user123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, mockProfile);
    });

    it('should return profile for org_admin', async () => {
      req.user.role = 'org_admin';
      req.params.userId = 'otherUser123';
      const mockProfile = { openness: 3.5 };
      BFI44Service.getUserProfile.mockResolvedValue(mockProfile);

      await BFI44Controller.getProfile(req, res);

      expect(BFI44Service.getUserProfile).toHaveBeenCalledWith('otherUser123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, mockProfile);
    });

    it('should deny access for unauthorized user', async () => {
      req.params.userId = 'otherUser123';
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ organization: null })
      });

      await BFI44Controller.getProfile(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'No autorizado para ver este perfil',
        403
      );
    });

    it('should allow organization admin to view employee profile', async () => {
      req.params.userId = 'employee123';
      req.user.role = 'employee';
      
      const mockOrganization = {
        _id: 'org123',
        isAdmin: jest.fn().mockReturnValue(true),
        isProjectManager: jest.fn().mockReturnValue(false)
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ organization: 'org123' })
      });
      Organization.findById.mockResolvedValue(mockOrganization);
      
      const mockProfile = { openness: 3.5 };
      BFI44Service.getUserProfile.mockResolvedValue(mockProfile);

      await BFI44Controller.getProfile(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(res, mockProfile);
    });

    it('should return 404 when profile not found', async () => {
      req.params.userId = 'user123';
      BFI44Service.getUserProfile.mockResolvedValue(null);

      await BFI44Controller.getProfile(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'BFI-44 profile not found',
        404
      );
    });

    it('should handle errors', async () => {
      req.params.userId = 'user123';
      const error = new Error('Database error');
      BFI44Service.getUserProfile.mockRejectedValue(error);

      await BFI44Controller.getProfile(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('getMyProfile', () => {
    it('should return user profile successfully', async () => {
      const mockProfile = { openness: 4.0, conscientiousness: 3.5 };
      BFI44Service.getUserProfile.mockResolvedValue(mockProfile);

      await BFI44Controller.getMyProfile(req, res);

      expect(BFI44Service.getUserProfile).toHaveBeenCalledWith('user123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, mockProfile);
    });

    it('should return 404 when profile not found', async () => {
      BFI44Service.getUserProfile.mockResolvedValue(null);

      await BFI44Controller.getMyProfile(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'No has completado el cuestionario BFI-44',
        404
      );
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      BFI44Service.getUserProfile.mockRejectedValue(error);

      await BFI44Controller.getMyProfile(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('recalculateProfile', () => {
    it('should recalculate profile successfully as org_admin', async () => {
      req.user.role = 'org_admin';
      req.params.responseId = 'response123';
      const mockResult = { profile: { openness: 3.5 } };
      BFI44Service.recalculateProfile.mockResolvedValue(mockResult);

      await BFI44Controller.recalculateProfile(req, res);

      expect(BFI44Service.recalculateProfile).toHaveBeenCalledWith('response123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        message: 'Profile recalculated successfully',
        ...mockResult
      });
    });

    it('should deny access for non-admin', async () => {
      req.user.role = 'employee';
      req.params.responseId = 'response123';

      await BFI44Controller.recalculateProfile(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'No autorizado', 403);
      expect(BFI44Service.recalculateProfile).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      req.user.role = 'org_admin';
      req.params.responseId = 'response123';
      const error = new Error('Service error');
      BFI44Service.recalculateProfile.mockRejectedValue(error);

      await BFI44Controller.recalculateProfile(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('hasProfile', () => {
    it('should return true when user has profile', async () => {
      BFI44Service.hasProfile.mockResolvedValue(true);

      await BFI44Controller.hasProfile(req, res);

      expect(BFI44Service.hasProfile).toHaveBeenCalledWith('user123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, { hasProfile: true });
    });

    it('should return false when user has no profile', async () => {
      BFI44Service.hasProfile.mockResolvedValue(false);

      await BFI44Controller.hasProfile(req, res);

      expect(BFI44Service.hasProfile).toHaveBeenCalledWith('user123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, { hasProfile: false });
    });

    it('should handle errors', async () => {
      const error = new Error('Service error');
      BFI44Service.hasProfile.mockRejectedValue(error);

      await BFI44Controller.hasProfile(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('notifyPendingEmployees', () => {
    it('should notify pending employees successfully', async () => {
      req.user.role = 'org_admin';
      req.user.organization = 'org123';
      req.isProjectManager = false;
      const mockResult = { notified: 5, total: 10 };
      BFI44Service.notifyEmployeesWithoutTest.mockResolvedValue(mockResult);

      await BFI44Controller.notifyPendingEmployees(req, res);

      expect(BFI44Service.notifyEmployeesWithoutTest).toHaveBeenCalledWith('org123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        message: '5 empleado(s) notificado(s)',
        ...mockResult
      });
    });

    it('should notify pending employees as project manager', async () => {
      req.user.role = 'employee';
      req.user.organization = 'org123';
      req.isProjectManager = true;
      const mockResult = { notified: 3, total: 8 };
      BFI44Service.notifyEmployeesWithoutTest.mockResolvedValue(mockResult);

      await BFI44Controller.notifyPendingEmployees(req, res);

      expect(BFI44Service.notifyEmployeesWithoutTest).toHaveBeenCalledWith('org123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        message: '3 empleado(s) notificado(s)',
        ...mockResult
      });
    });

    it('should deny access for non-admin', async () => {
      req.user.role = 'employee';
      req.isProjectManager = false;

      await BFI44Controller.notifyPendingEmployees(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'No autorizado', 403);
    });

    it('should return error when user has no organization', async () => {
      req.user.role = 'org_admin';
      req.user.organization = null;

      await BFI44Controller.notifyPendingEmployees(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'No perteneces a ninguna organización',
        400
      );
    });

    it('should handle errors', async () => {
      req.user.role = 'org_admin';
      req.user.organization = 'org123';
      const error = new Error('Service error');
      BFI44Service.notifyEmployeesWithoutTest.mockRejectedValue(error);

      await BFI44Controller.notifyPendingEmployees(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('getEmployeesWithoutTest', () => {
    it('should return employees without test as org_admin', async () => {
      req.user.role = 'org_admin';
      req.user.organization = 'org123';
      const mockEmployees = [
        { _id: 'emp1', name: 'John Doe', email: 'john@example.com' },
        { _id: 'emp2', name: 'Jane Smith', email: 'jane@example.com' }
      ];
      BFI44Service.getEmployeesWithoutTest.mockResolvedValue(mockEmployees);

      await BFI44Controller.getEmployeesWithoutTest(req, res);

      expect(BFI44Service.getEmployeesWithoutTest).toHaveBeenCalledWith('org123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        count: 2,
        employees: [
          { id: 'emp1', name: 'John Doe', email: 'john@example.com' },
          { id: 'emp2', name: 'Jane Smith', email: 'jane@example.com' }
        ]
      });
    });

    it('should return employees without test as project manager', async () => {
      req.user.role = 'employee';
      req.user.organization = 'org123';
      req.isProjectManager = true;
      const mockEmployees = [
        { _id: 'emp1', name: 'John Doe', email: 'john@example.com' }
      ];
      BFI44Service.getEmployeesWithoutTest.mockResolvedValue(mockEmployees);

      await BFI44Controller.getEmployeesWithoutTest(req, res);

      expect(BFI44Service.getEmployeesWithoutTest).toHaveBeenCalledWith('org123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        count: 1,
        employees: [
          { id: 'emp1', name: 'John Doe', email: 'john@example.com' }
        ]
      });
    });

    it('should deny access for regular employee', async () => {
      req.user.role = 'employee';
      req.isProjectManager = false;

      await BFI44Controller.getEmployeesWithoutTest(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'No autorizado', 403);
    });

    it('should return error when user has no organization', async () => {
      req.user.role = 'org_admin';
      req.user.organization = null;

      await BFI44Controller.getEmployeesWithoutTest(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'No perteneces a ninguna organización',
        400
      );
    });
  });

  describe('getConsentStatus', () => {
    it('should return consent status when user has consent', async () => {
      const mockConsent = {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0',
        details: { personalityProfiling: true, dataRetention: true }
      };
      const mockUser = {
        personalityDataConsent: mockConsent,
        hasPersonalityDataConsent: jest.fn().mockReturnValue(true)
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await BFI44Controller.getConsentStatus(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        hasConsent: true,
        consent: mockConsent
      });
    });

    it('should return false when user has no consent', async () => {
      const mockConsent = { accepted: false, version: '1.0' };
      const mockUser = {
        personalityDataConsent: mockConsent,
        hasPersonalityDataConsent: jest.fn().mockReturnValue(false)
      };
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await BFI44Controller.getConsentStatus(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        hasConsent: false,
        consent: mockConsent
      });
    });

    it('should return 404 when user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await BFI44Controller.getConsentStatus(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'Usuario no encontrado', 404);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(error)
      });

      await BFI44Controller.getConsentStatus(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('getOrganizationStats', () => {
    it('should return organization stats', async () => {
      req.user.role = 'org_admin';
      req.user.organization = 'org123';
      const mockStats = {
        totalEmployees: 50,
        completedTests: 35,
        pendingTests: 15,
        completionRate: 70
      };
      BFI44Service.getOrganizationStats.mockResolvedValue(mockStats);

      await BFI44Controller.getOrganizationStats(req, res);

      expect(BFI44Service.getOrganizationStats).toHaveBeenCalledWith('org123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, mockStats);
    });

    it('should deny access for non-admin', async () => {
      req.user.role = 'employee';

      await BFI44Controller.getOrganizationStats(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'No autorizado', 403);
    });

    it('should return error when user has no organization', async () => {
      req.user.role = 'org_admin';
      req.user.organization = null;

      await BFI44Controller.getOrganizationStats(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'No perteneces a ninguna organización',
        400
      );
    });

    it('should handle errors', async () => {
      req.user.role = 'org_admin';
      req.user.organization = 'org123';
      const error = new Error('Service error');
      BFI44Service.getOrganizationStats.mockRejectedValue(error);

      await BFI44Controller.getOrganizationStats(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });
});
