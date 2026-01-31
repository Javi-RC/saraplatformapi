const legalController = require('../../../src/controllers/legal.controller');
const legalService = require('../../../src/legal/terms');

jest.mock('../../../src/legal/terms');

describe('Legal Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });

  describe('getTerms', () => {
    const mockDocument = {
      type: 'terms',
      version: '1.0',
      locale: 'en',
      lastUpdated: '2024-01-01',
      content: '# Terms and Conditions\n\nTest content'
    };

    it('should return terms in JSON format by default', () => {
      legalService.getTermsAndConditions.mockReturnValue(mockDocument);

      legalController.getTerms(req, res);

      expect(legalService.getTermsAndConditions).toHaveBeenCalledWith('en');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        document: {
          type: 'terms',
          version: '1.0',
          locale: 'en',
          lastUpdated: '2024-01-01',
          format: 'markdown',
          content: '# Terms and Conditions\n\nTest content'
        }
      });
    });

    it('should return terms in text format when requested', () => {
      req.query.format = 'text';
      legalService.getTermsAndConditions.mockReturnValue(mockDocument);

      legalController.getTerms(req, res);

      expect(legalService.getTermsAndConditions).toHaveBeenCalledWith('en');
      expect(res.type).toHaveBeenCalledWith('text/plain');
      expect(res.send).toHaveBeenCalledWith(mockDocument.content);
    });

    it('should return terms in markdown format when requested', () => {
      req.query.format = 'markdown';
      legalService.getTermsAndConditions.mockReturnValue(mockDocument);

      legalController.getTerms(req, res);

      expect(legalService.getTermsAndConditions).toHaveBeenCalledWith('en');
      expect(res.type).toHaveBeenCalledWith('text/markdown');
      expect(res.send).toHaveBeenCalledWith(mockDocument.content);
    });

    it('should handle different locales', () => {
      req.query.locale = 'es';
      const mockDocumentEs = { ...mockDocument, locale: 'es' };
      legalService.getTermsAndConditions.mockReturnValue(mockDocumentEs);

      legalController.getTerms(req, res);

      expect(legalService.getTermsAndConditions).toHaveBeenCalledWith('es');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        document: {
          type: 'terms',
          version: '1.0',
          locale: 'es',
          lastUpdated: '2024-01-01',
          format: 'markdown',
          content: '# Terms and Conditions\n\nTest content'
        }
      });
    });

    it('should normalize locale to lowercase', () => {
      req.query.locale = 'ES';
      legalService.getTermsAndConditions.mockReturnValue(mockDocument);

      legalController.getTerms(req, res);

      expect(legalService.getTermsAndConditions).toHaveBeenCalledWith('es');
    });

    it('should handle uppercase format parameter', () => {
      req.query.format = 'TEXT';
      legalService.getTermsAndConditions.mockReturnValue(mockDocument);

      legalController.getTerms(req, res);

      expect(res.type).toHaveBeenCalledWith('text/plain');
      expect(res.send).toHaveBeenCalledWith(mockDocument.content);
    });
  });
});
