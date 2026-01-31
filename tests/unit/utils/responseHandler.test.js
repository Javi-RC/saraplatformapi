const responseHandler = require('../../../src/utils/responseHandler');
const AppError = require('../../../src/utils/AppError');

describe('ResponseHandler', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn()
    };
    
    // Clear console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('success', () => {
    it('should send success response with default status 200', () => {
      const data = { user: { id: '123', name: 'John' } };
      
      responseHandler.success(mockRes, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        user: { id: '123', name: 'John' }
      });
    });

    it('should send success response with custom status code', () => {
      const data = { message: 'Created' };
      
      responseHandler.success(mockRes, data, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created'
      });
    });

    it('should spread data object properties', () => {
      const data = {
        message: 'Success',
        data: { id: '123' },
        count: 5
      };
      
      responseHandler.success(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: '123' },
        count: 5
      });
    });
  });

  describe('error', () => {
    it('should send error response with default status 400', () => {
      responseHandler.error(mockRes, 'Invalid input');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input'
      });
    });

    it('should send error response with custom status code', () => {
      responseHandler.error(mockRes, 'Not found', 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not found'
      });
    });

    it('should handle empty error message', () => {
      responseHandler.error(mockRes, '');

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: ''
      });
    });
  });

  describe('handleError', () => {
    it('should handle AppError instances', () => {
      const appError = AppError.notFound('USER_NOT_FOUND', 'User not found', { id: '123' });
      
      responseHandler.handleError(appError, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
        details: { id: '123' }
      });
    });

    it('should handle errors with code property', () => {
      const error = {
        code: 'VALIDATION_ERROR',
        status: 400,
        message: 'Invalid data'
      };
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          code: 'VALIDATION_ERROR'
        })
      );
    });

    it('should handle known error messages from errorMap', () => {
      const error = new Error('USER_ALREADY_EXISTS');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'This email is already registered'
      });
    });

    it('should handle INVALID_CREDENTIALS error', () => {
      const error = new Error('INVALID_CREDENTIALS');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      });
    });

    it('should handle unknown errors with 500 status', () => {
      const error = new Error('Unknown error');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should use error statusCode if available', () => {
      const error = new Error('Custom error');
      error.statusCode = 422;
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(422);
    });

    it('should handle Project not found error', () => {
      const error = new Error('Project not found');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Project not found'
      });
    });

    it('should handle Organization not found error', () => {
      const error = new Error('Organization not found');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should log error to console', () => {
      const error = new Error('Test error');
      
      responseHandler.handleError(error, mockRes);

      expect(console.error).toHaveBeenCalledWith('Controller Error:', error);
    });

    it('should handle BFI44 validation errors', () => {
      const error = new Error('BFI44_INVALID_RESPONSES_FORMAT');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid responses format'
      });
    });

    it('should handle CV processing errors', () => {
      const error = new Error('ERROR_PROCESSING_CV');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error processing the CV. Check the Gemini API configuration.'
      });
    });

    it('should handle TOO_MANY_ATTEMPTS error', () => {
      const error = new Error('TOO_MANY_ATTEMPTS');
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many registration attempts. Please wait 24 hours or contact support.'
      });
    });
  });

  describe('redirect', () => {
    it('should redirect to specified URL', () => {
      responseHandler.redirect(mockRes, '/dashboard');

      expect(mockRes.redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle external URLs', () => {
      responseHandler.redirect(mockRes, 'https://example.com');

      expect(mockRes.redirect).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error', () => {
      responseHandler.handleError(null, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle error without message', () => {
      const error = {};
      
      responseHandler.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should handle empty data in success', () => {
      responseHandler.success(mockRes, {});

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true
      });
    });

    it('should handle nested data structures', () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            address: {
              city: 'NYC'
            }
          }
        }
      };
      
      responseHandler.success(mockRes, data);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        user: expect.objectContaining({
          profile: expect.any(Object)
        })
      });
    });
  });
});
