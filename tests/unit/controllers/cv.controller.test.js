jest.mock('../../../src/utils/pdfParser', () => ({
  parsePdf: jest.fn()
}));
jest.mock('../../../src/services/cv/aiExtractor.service');
jest.mock('../../../src/services/cv/cv.service');
jest.mock('../../../src/utils/responseHandler');
jest.mock('../../../src/repositories', () => ({
  cvRepository: {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    countDocuments: jest.fn()
  },
  userRepository: {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    updateById: jest.fn()
  },
  organizationRepository: { findById: jest.fn() },
  projectRepository: { findById: jest.fn(), find: jest.fn() }
}));
jest.mock('../../../src/services/notification/helpers/cv.helper', () => ({
  notifyCVUploaded: jest.fn().mockReturnValue({
    catch: jest.fn()
  })
}));
jest.mock('../../../src/services/cv/cvCompletenessValidator.service');
jest.mock('../../../src/services/cv/cvQuestionsGenerator.service', () => ({
  generateQuestionsForMissingFields: jest.fn(),
  generateConditionalQuestions: jest.fn(),
  getQuestionsByCategory: jest.fn()
}));
jest.mock('../../../src/services/cv/cvInteractiveQuestionnaire.service');

const cvController = require('../../../src/controllers/cv.controller');
const aiExtractorService = require('../../../src/services/cv/aiExtractor.service');
const cvService = require('../../../src/services/cv/cv.service');
const responseHandler = require('../../../src/utils/responseHandler');
const { cvRepository, userRepository } = require('../../../src/repositories');
const { parsePdf } = require('../../../src/utils/pdfParser');

describe('Curriculum Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user123',
        role: 'employee'
      },
      file: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });

  describe('uploadCV', () => {
    it('should return error when no file is provided', async () => {
      req.file = null;

      await cvController.uploadCV(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'No file provided', 400);
    });

    it('should return error when unsupported file format', async () => {
      req.file = {
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        originalname: 'test.jpg'
      };

      await cvController.uploadCV(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Unsupported file format. Use PDF or TXT',
        400
      );
    });

    it('should return error when user has no curriculum processing consent', async () => {
      req.file = {
        mimetype: 'application/pdf',
        buffer: Buffer.from('test pdf content'),
        originalname: 'cv.pdf'
      };

      parsePdf.mockResolvedValue({ text: 'CV content here' });
      userRepository.findById.mockResolvedValue({
        name: 'Test User',
        hasCVProcessingConsent: jest.fn().mockReturnValue(false)
      });

      await cvController.uploadCV(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        expect.stringContaining('You must accept consent'),
        403
      );
    });

    it('should process PDF curriculum successfully', async () => {
      req.file = {
        mimetype: 'application/pdf',
        buffer: Buffer.from('test pdf content'),
        originalname: 'cv.pdf'
      };

      const mockUser = {
        name: 'Test User',
        preferredLanguage: 'en',
        hasCVProcessingConsent: jest.fn().mockReturnValue(true)
      };

      const mockCV = {
        _id: 'cv123',
        getSummary: jest.fn().mockReturnValue({
          id: 'cv123',
          skills: ['JavaScript', 'Node.js']
        })
      };

      parsePdf.mockResolvedValue({ text: 'CV content here with skills' });
      userRepository.findById.mockResolvedValue(mockUser);
      aiExtractorService.processCV.mockResolvedValue(mockCV);

      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({
        isComplete: true,
        completenessScore: 100,
        missingFields: [],
        missingByPriority: {}
      });

      await cvController.uploadCV(req, res);

      expect(parsePdf).toHaveBeenCalled();
      expect(aiExtractorService.processCV).toHaveBeenCalledWith(
        'user123',
        expect.any(String),
        'cv.pdf'
      );
      expect(responseHandler.success).toHaveBeenCalled();
    });

    it('should process TXT curriculum successfully', async () => {
      req.file = {
        mimetype: 'text/plain',
        buffer: Buffer.from('CV text content'),
        originalname: 'cv.txt'
      };

      const mockUser = {
        name: 'Test User',
        preferredLanguage: 'en',
        hasCVProcessingConsent: jest.fn().mockReturnValue(true)
      };

      const mockCV = {
        getSummary: jest.fn().mockReturnValue({ id: 'cv123' })
      };

      userRepository.findById.mockResolvedValue(mockUser);
      aiExtractorService.processCV.mockResolvedValue(mockCV);

      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({
        isComplete: true,
        completenessScore: 100,
        missingFields: []
      });

      await cvController.uploadCV(req, res);

      expect(aiExtractorService.processCV).toHaveBeenCalledWith(
        'user123',
        expect.any(String),
        'cv.txt'
      );
    });

    it('should handle empty text content', async () => {
      req.file = {
        mimetype: 'text/plain',
        buffer: Buffer.from(''),
        originalname: 'cv.txt'
      };

      await cvController.uploadCV(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Could not extract text from file',
        400
      );
    });

    it('should handle errors', async () => {
      req.file = {
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
        originalname: 'cv.pdf'
      };

      const error = new Error('Processing error');
      parsePdf.mockRejectedValue(error);

      await cvController.uploadCV(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('getMyCV', () => {
    it('should return user curriculum successfully', async () => {
      const mockCV = {
        id: 'cv123',
        skills: ['JavaScript'],
        experience: []
      };
      aiExtractorService.getUserCV.mockResolvedValue(mockCV);

      await cvController.getMyCV(req, res);

      expect(aiExtractorService.getUserCV).toHaveBeenCalledWith('user123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, { cv: mockCV });
    });

    it('should handle errors', async () => {
      const error = new Error('Curriculum not found');
      aiExtractorService.getUserCV.mockRejectedValue(error);

      await cvController.getMyCV(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('getCVById', () => {
    it('should return own curriculum by ID', async () => {
      req.params.cvId = 'cv123';
      const mockCV = {
        _id: 'cv123',
        skills: ['JavaScript']
      };
      aiExtractorService.getUserCV.mockResolvedValue(mockCV);

      await cvController.getCVById(req, res);

      expect(aiExtractorService.getUserCV).toHaveBeenCalledWith('user123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, { cv: mockCV });
    });

    it('should deny access to other user curriculum', async () => {
      req.params.cvId = 'otherCV123';
      req.user.role = 'employee';
      const mockCV = {
        _id: 'cv123',
        skills: []
      };
      aiExtractorService.getUserCV.mockResolvedValue(mockCV);

      await cvController.getCVById(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'You do not have permission to view this curriculum',
        403
      );
    });

    it('should allow org_admin to access any curriculum', async () => {
      req.params.cvId = 'otherCV123';
      req.user.role = 'org_admin';
      const mockCV = {
        _id: 'otherCV123',
        skills: []
      };
      aiExtractorService.getUserCV.mockResolvedValue(mockCV);

      await cvController.getCVById(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(res, { cv: mockCV });
    });
  });

  describe('getAllCVs', () => {
    it('should return all curricula with filters', async () => {
      req.query.skills = 'JavaScript,Node.js';
      req.query.languages = 'English,Spanish';
      
      const mockCVs = [
        { id: 'cv1', skills: ['JavaScript'] },
        { id: 'cv2', skills: ['Node.js'] }
      ];
      aiExtractorService.getAllCVs.mockResolvedValue(mockCVs);

      await cvController.getAllCVs(req, res);

      expect(aiExtractorService.getAllCVs).toHaveBeenCalledWith({
        skills: ['JavaScript', 'Node.js'],
        languages: ['English', 'Spanish']
      }, req.user);
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        count: 2,
        cvs: mockCVs
      });
    });

    it('should return all curricula without filters', async () => {
      const mockCVs = [{ id: 'cv1' }];
      aiExtractorService.getAllCVs.mockResolvedValue(mockCVs);

      await cvController.getAllCVs(req, res);

      expect(aiExtractorService.getAllCVs).toHaveBeenCalledWith({
        skills: undefined,
        languages: undefined
      }, req.user);
    });

    it('should pass org_admin user to service for organization filtering', async () => {
      req.user = {
        id: 'orgAdmin123',
        role: 'org_admin',
        organization: 'org456'
      };
      
      const mockCVs = [
        { id: 'cv1', organization: 'org456' },
        { id: 'cv2', organization: 'org456' }
      ];
      aiExtractorService.getAllCVs.mockResolvedValue(mockCVs);

      await cvController.getAllCVs(req, res);

      expect(aiExtractorService.getAllCVs).toHaveBeenCalledWith({
        skills: undefined,
        languages: undefined
      }, req.user);
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        count: 2,
        cvs: mockCVs
      });
    });
  });

  describe('searchCVs', () => {
    it('should search curricula by criteria', async () => {
      req.body = {
        skills: ['JavaScript', 'React'],
        languages: ['English'],
        minExperience: 3
      };

      const mockCVs = [{ id: 'cv1' }];
      aiExtractorService.searchCVs.mockResolvedValue(mockCVs);

      await cvController.searchCVs(req, res);

      expect(aiExtractorService.searchCVs).toHaveBeenCalledWith({
        skills: ['JavaScript', 'React'],
        languages: ['English'],
        minExperience: 3
      }, req.user);
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        count: 1,
        cvs: mockCVs
      });
    });

    it('should use default values for missing criteria', async () => {
      req.body = {};
      aiExtractorService.searchCVs.mockResolvedValue([]);

      await cvController.searchCVs(req, res);

      expect(aiExtractorService.searchCVs).toHaveBeenCalledWith({
        skills: [],
        languages: [],
        minExperience: null
      }, req.user);
    });

    it('should pass org_admin user to service for organization filtering', async () => {
      req.user = {
        id: 'orgAdmin123',
        role: 'org_admin',
        organization: 'org456'
      };
      req.body = {
        skills: ['JavaScript'],
        languages: ['English'],
        minExperience: 2
      };

      const mockCVs = [
        { id: 'cv1', organization: 'org456' }
      ];
      aiExtractorService.searchCVs.mockResolvedValue(mockCVs);

      await cvController.searchCVs(req, res);

      expect(aiExtractorService.searchCVs).toHaveBeenCalledWith({
        skills: ['JavaScript'],
        languages: ['English'],
        minExperience: 2
      }, req.user);
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        count: 1,
        cvs: mockCVs
      });
    });
  });

  describe('updateCV', () => {
    it('should update curriculum successfully', async () => {
      req.params.cvId = 'cv123';
      req.body = {
        skills: { technical: ['JavaScript', 'TypeScript'] }
      };

      const mockCV = {
        id: 'cv123',
        skills: { technical: ['JavaScript', 'TypeScript'] }
      };
      aiExtractorService.updateCV.mockResolvedValue(mockCV);

      await cvController.updateCV(req, res);

      expect(aiExtractorService.updateCV).toHaveBeenCalledWith(
        'user123',
        'cv123',
        req.body
      );
      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        message: 'Curriculum updated successfully',
        cv: mockCV
      });
    });

    it('should handle errors', async () => {
      req.params.cvId = 'cv123';
      req.body = { skills: [] };
      const error = new Error('Update failed');
      aiExtractorService.updateCV.mockRejectedValue(error);

      await cvController.updateCV(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('deleteCV', () => {
    it('should delete curriculum successfully', async () => {
      req.params.cvId = 'cv123';
      const mockResult = { message: 'Currículo eliminado exitosamente' };
      aiExtractorService.deleteCV.mockResolvedValue(mockResult);

      await cvController.deleteCV(req, res);

      expect(aiExtractorService.deleteCV).toHaveBeenCalledWith('user123', 'cv123');
      expect(responseHandler.success).toHaveBeenCalledWith(res, mockResult);
    });

    it('should handle errors', async () => {
      req.params.cvId = 'cv123';
      const error = new Error('Delete failed');
      aiExtractorService.deleteCV.mockRejectedValue(error);

      await cvController.deleteCV(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });

  describe('getCVStats', () => {
    it('should return curriculum statistics', async () => {
      const mockCV = {
        skills: { technical: ['JavaScript', 'Node.js', 'React'] },
        experience: [{ title: 'Developer' }],
        education: [{ degree: 'Bachelor' }],
        projects: [{ name: 'Project 1' }],
        certifications: [{ name: 'AWS' }],
        languages: [{ name: 'English' }],
        lastUpdated: new Date('2024-01-01')
      };
      aiExtractorService.getUserCV.mockResolvedValue(mockCV);

      await cvController.getCVStats(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(res, expect.objectContaining({
        stats: expect.objectContaining({
          totalExperience: 1,
          totalEducation: 1,
          totalProjects: 1,
          totalCertifications: 1,
          totalLanguages: 1
        })
      }));
    });

    it('should handle curriculum with no data', async () => {
      const mockCV = {};
      aiExtractorService.getUserCV.mockResolvedValue(mockCV);

      await cvController.getCVStats(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(res, {
        stats: {
          totalSkills: 0,
          totalExperience: 0,
          totalEducation: 0,
          totalProjects: 0,
          totalCertifications: 0,
          totalLanguages: 0,
          topSkills: [],
          lastUpdated: undefined
        }
      });
    });
  });

  describe('submitToOrganization', () => {
    it('should submit curriculum to organization successfully', async () => {
      req.body.organizationId = 'org123';
      const mockCV = {
        id: 'cv123',
        submittedTo: ['org123']
      };
      cvService.submitCVToOrganization.mockResolvedValue(mockCV);

      await cvController.submitToOrganization(req, res);

      expect(cvService.submitCVToOrganization).toHaveBeenCalledWith('user123', 'org123');
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        {
          message: 'Curriculum sent successfully to the organization',
          cv: mockCV
        },
        201
      );
    });

    it('should return error when organizationId is missing', async () => {
      req.body = {};

      await cvController.submitToOrganization(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Organization ID is required',
        400
      );
    });

    it('should handle ORGANIZATION_NOT_FOUND error', async () => {
      req.body.organizationId = 'org123';
      const error = new Error('ORGANIZATION_NOT_FOUND');
      cvService.submitCVToOrganization.mockRejectedValue(error);

      await cvController.submitToOrganization(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Organization not found',
        404
      );
    });

    it('should handle CV_ALREADY_SUBMITTED error', async () => {
      req.body.organizationId = 'org123';
      const error = new Error('CV_ALREADY_SUBMITTED');
      cvService.submitCVToOrganization.mockRejectedValue(error);

      await cvController.submitToOrganization(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'You have already submitted your curriculum to this organization',
        409
      );
    });
  });

  describe('getCompleteness', () => {
    it('should return 404 when curriculum not found', async () => {
      cvRepository.findOne.mockResolvedValue(null);

      await cvController.getCompleteness(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Curriculum not found. Please upload your curriculum first.',
        404
      );
    });

    it('should return completeness information', async () => {
      const cv = { _id: 'cv1', lastUpdated: new Date('2024-01-01') };
      cvRepository.findOne.mockResolvedValue(cv);

      const { validateCVCompleteness, getCategoryCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({
        isComplete: false,
        completenessScore: 60,
        totalMissingCount: 2,
        criticalMissingCount: 1,
        highMissingCount: 0,
        mediumMissingCount: 1,
        missingFields: ['availability.immediate'],
        missingByPriority: { critical: ['availability.immediate'] }
      });
      getCategoryCompleteness.mockReturnValue({ basics: { score: 50 } });

      await cvController.getCompleteness(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          cv: expect.objectContaining({ id: 'cv1' }),
          completeness: expect.objectContaining({ score: 60 }),
          categories: { basics: { score: 50 } }
        }),
        'Curriculum completeness retrieved successfully'
      );
    });
  });

  describe('getMissingFieldsQuestions', () => {
    it('should return 404 when curriculum not found', async () => {
      cvRepository.findOne.mockResolvedValue(null);

      await cvController.getMissingFieldsQuestions(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Curriculum not found. Please upload your curriculum first.',
        404
      );
    });

    it('should return isComplete when completeness is complete', async () => {
      cvRepository.findOne.mockResolvedValue({});
      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({ isComplete: true });

      await cvController.getMissingFieldsQuestions(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        {
          isComplete: true,
          questions: [],
          message: 'Your curriculum is complete! No additional information needed.'
        },
        'Curriculum is complete'
      );
    });

    it('should generate questions grouped by category', async () => {
      req.query = { groupByCategory: 'true', language: 'en' };
      cvRepository.findOne.mockResolvedValue({ toObject: jest.fn().mockReturnValue({}) });

      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({
        isComplete: false,
        completenessScore: 50,
        missingFields: ['availability.immediate'],
        missingByPriority: { critical: ['availability.immediate'] }
      });

      const { getQuestionsByCategory } = require('../../../src/services/cv/cvQuestionsGenerator.service');
      getQuestionsByCategory.mockReturnValue({ basics: [{ id: 'q1' }] });

      await cvController.getMissingFieldsQuestions(req, res);

      expect(getQuestionsByCategory).toHaveBeenCalledWith(['availability.immediate'], 'en');
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          isComplete: false,
          totalQuestions: 1,
          questions: { basics: [{ id: 'q1' }] }
        }),
        'Questions generated successfully'
      );
    });

    it('should generate conditional questions (flat list)', async () => {
      req.query = { language: 'en' };
      const cvObj = { a: 1 };
      cvRepository.findOne.mockResolvedValue({ toObject: jest.fn().mockReturnValue(cvObj) });

      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({
        isComplete: false,
        completenessScore: 50,
        missingFields: ['availability.immediate'],
        missingByPriority: {}
      });

      const { generateConditionalQuestions } = require('../../../src/services/cv/cvQuestionsGenerator.service');
      generateConditionalQuestions.mockReturnValue([{ id: 'q1' }, { id: 'q2' }]);

      await cvController.getMissingFieldsQuestions(req, res);

      expect(generateConditionalQuestions).toHaveBeenCalledWith(['availability.immediate'], cvObj, 'en');
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({ totalQuestions: 2 }),
        'Questions generated successfully'
      );
    });
  });

  describe('completeFields', () => {
    it('should validate updates', async () => {
      req.body = {};

      await cvController.completeFields(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'No updates provided', 400);
    });

    it('should return 404 when curriculum not found', async () => {
      req.body = { 'availability.immediate': true };
      cvRepository.findOne.mockResolvedValue(null);

      await cvController.completeFields(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Curriculum not found. Please upload your curriculum first.',
        404
      );
    });

    it('should apply nested updates and return improvement', async () => {
      req.body = { 'availability.immediate': true };
      const cv = { _id: 'cv1', lastUpdated: new Date('2024-01-01') };
      cvRepository.findOne.mockResolvedValue(cv);
      cvRepository.updateById.mockResolvedValue({});
      cvRepository.findById.mockResolvedValue({ _id: 'cv1', lastUpdated: new Date('2024-01-01') });

      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness
        .mockReturnValueOnce({ completenessScore: 40, isComplete: false, missingFields: ['x'] })
        .mockReturnValueOnce({ completenessScore: 60, isComplete: false, missingFields: ['y'] });

      await cvController.completeFields(req, res);

      expect(cvRepository.updateById).toHaveBeenCalledWith('cv1', { 'availability.immediate': true });
      expect(cvRepository.findById).toHaveBeenCalledWith('cv1');
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          completeness: expect.objectContaining({ before: 40, after: 60, improvement: 20 }),
          updatedFields: ['availability.immediate']
        }),
        'Fields updated successfully'
      );
    });
  });

  describe('startQuestionnaire', () => {
    it('should return 404 when curriculum not found', async () => {
      cvRepository.findOne.mockResolvedValue(null);

      await cvController.startQuestionnaire(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Curriculum not found. Please upload your curriculum first.',
        404
      );
    });

    it('should return isComplete when curriculum is already complete', async () => {
      cvRepository.findOne.mockResolvedValue({});
      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({ isComplete: true });

      await cvController.startQuestionnaire(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          isComplete: true,
          completenessScore: 100
        }),
        'Curriculum is complete'
      );
    });

    it('should create session and return initial questions', async () => {
      cvRepository.findOne.mockResolvedValue({});
      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness.mockReturnValue({ isComplete: false });

      const questionnaireService = require('../../../src/services/cv/cvInteractiveQuestionnaire.service');
      questionnaireService.createQuestionnaireSession.mockReturnValue({ sessionId: 's1', language: 'en', startedAt: 't' });
      questionnaireService.getInitialQuestions.mockReturnValue({ phase: { id: 'p1' }, questions: [{ id: 'q1' }] });

      await cvController.startQuestionnaire(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          session: expect.objectContaining({ sessionId: 's1' }),
          phase: { id: 'p1' },
          questions: [{ id: 'q1' }]
        }),
        'Questionnaire started'
      );
    });
  });

  describe('getNextQuestions', () => {
    it('should validate responses format', async () => {
      req.body = { responses: 'bad', currentPhase: 'p1' };

      await cvController.getNextQuestions(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'Invalid responses format', 400);
    });

    it('should validate current phase', async () => {
      req.body = { responses: {}, currentPhase: '' };

      await cvController.getNextQuestions(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'Current phase is required', 400);
    });

    it('should return 404 when curriculum not found', async () => {
      req.body = { responses: {}, currentPhase: 'p1' };
      cvRepository.findOne.mockResolvedValue(null);

      await cvController.getNextQuestions(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Curriculum not found. Please upload your curriculum first.',
        404
      );
    });

    it('should return next questions successfully', async () => {
      req.body = { responses: { a: 1 }, currentPhase: 'p1' };
      cvRepository.findOne.mockResolvedValue({});

      const questionnaireService = require('../../../src/services/cv/cvInteractiveQuestionnaire.service');
      questionnaireService.processResponsesAndGetNext.mockReturnValue({
        phase: { id: 'p2' },
        questions: [{ id: 'q2' }]
      });

      await cvController.getNextQuestions(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          phase: { id: 'p2' },
          questions: [{ id: 'q2' }],
          sessionInfo: expect.objectContaining({ currentPhase: 'p2', language: 'en' })
        }),
        'Next questions retrieved'
      );
    });
  });

  describe('getQuestionnairePhases', () => {
    it('should return phases list', async () => {
      req.query.language = 'en';
      const questionnaireService = require('../../../src/services/cv/cvInteractiveQuestionnaire.service');
      questionnaireService.getAllPhases.mockReturnValue({
        p1: { title: { en: 'P1' }, description: { en: 'D1' }, fields: ['a'] },
        p2: { title: { en: 'P2' }, description: { en: 'D2' }, fields: ['b'] }
      });

      await cvController.getQuestionnairePhases(req, res);

      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        {
          phases: [
            { id: 'p1', title: 'P1', description: 'D1', fields: ['a'] },
            { id: 'p2', title: 'P2', description: 'D2', fields: ['b'] }
          ],
          totalPhases: 2
        },
        'Questionnaire phases retrieved'
      );
    });
  });

  describe('submitPhaseResponses', () => {
    it('should validate required fields', async () => {
      req.body = {};

      await cvController.submitPhaseResponses(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Missing required fields: sessionId, currentPhase, responses',
        400
      );
    });

    it('should return 404 when curriculum not found', async () => {
      req.body = { sessionId: 's1', currentPhase: 'p1', responses: { a: 1 } };
      cvRepository.findOne.mockResolvedValue(null);

      await cvController.submitPhaseResponses(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'Curriculum not found', 404);
    });

    it('should return completion when questionnaire becomes complete', async () => {
      req.body = { sessionId: 's1', currentPhase: 'p1', responses: { 'availability.immediate': true } };
      const cv = { _id: 'cv1' };
      cvRepository.findOne.mockResolvedValue(cv);
      cvRepository.updateById.mockResolvedValue({});
      cvRepository.findById.mockResolvedValue({ _id: 'cv1' });

      const questionnaireService = require('../../../src/services/cv/cvInteractiveQuestionnaire.service');
      questionnaireService.processResponsesAndGetNext.mockReturnValue({
        isComplete: true,
        completenessScore: 100,
        message: 'done'
      });

      await cvController.submitPhaseResponses(req, res);

      expect(cvRepository.updateById).toHaveBeenCalled();
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        {
          isComplete: true,
          completenessScore: 100,
          message: 'done'
        }
      );
    });

    it('should normalize contact.phones string before persisting', async () => {
      req.body = {
        sessionId: 's1',
        currentPhase: 'phase-1-basic',
        responses: { 'contact.phones': '678820014' }
      };
      const cv = { _id: 'cv1' };
      cvRepository.findOne.mockResolvedValue(cv);
      cvRepository.updateById.mockResolvedValue({ _id: 'cv1' });
      cvRepository.findById.mockResolvedValue({ _id: 'cv1' });

      const questionnaireService = require('../../../src/services/cv/cvInteractiveQuestionnaire.service');
      questionnaireService.processResponsesAndGetNext.mockReturnValue({
        isComplete: true,
        completenessScore: 100,
        message: 'done'
      });

      await cvController.submitPhaseResponses(req, res);

      expect(cvRepository.updateById).toHaveBeenCalledWith(
        'cv1',
        { 'contact.phones': [{ number: '678820014', type: 'mobile' }] }
      );
    });
  });

  describe('submitQuestionnaire (final)', () => {
    it('should validate required fields', async () => {
      req.body = {};

      await cvController.submitQuestionnaire(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(
        res,
        'Missing required fields: sessionId, finalResponses',
        400
      );
    });

    it('should return 404 when curriculum not found', async () => {
      req.body = { sessionId: 's1', finalResponses: { a: 1 } };
      cvRepository.findOne.mockResolvedValue(null);

      await cvController.submitQuestionnaire(req, res);

      expect(responseHandler.error).toHaveBeenCalledWith(res, 'Curriculum not found', 404);
    });

    it('should save final responses and return improvement', async () => {
      req.body = { sessionId: 's1', finalResponses: { 'availability.immediate': true } };
      const cv = { _id: 'cv1' };
      cvRepository.findOne.mockResolvedValue(cv);
      cvRepository.updateById.mockResolvedValue({});
      cvRepository.findById.mockResolvedValue({ _id: 'cv1' });

      const { validateCVCompleteness } = require('../../../src/services/cv/cvCompletenessValidator.service');
      validateCVCompleteness
        .mockReturnValueOnce({ completenessScore: 40, isComplete: false, missingFields: ['x'] })
        .mockReturnValueOnce({ completenessScore: 70, isComplete: false, missingFields: ['y'] });

      await cvController.submitQuestionnaire(req, res);

      expect(cvRepository.updateById).toHaveBeenCalled();
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        expect.objectContaining({
          session: expect.objectContaining({ sessionId: 's1' }),
          result: expect.objectContaining({
            previousScore: 40,
            completenessScore: 70,
            improvementPoints: 30,
            fieldsUpdated: 1
          })
        })
      );
    });
  });
});
