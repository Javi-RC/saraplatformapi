const AppError = require('../../../src/utils/AppError');

describe('AppError', () => {
  describe('Constructor', () => {
    it('should create an AppError with all parameters', () => {
      const error = new AppError('USER_NOT_FOUND', 404, 'User not found', { userId: '123' });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.message).toBe('User not found');
      expect(error.details).toEqual({ userId: '123' });
    });

    it('should use code as message when message not provided', () => {
      const error = new AppError('USER_NOT_FOUND', 404);

      expect(error.message).toBe('USER_NOT_FOUND');
      expect(error.code).toBe('USER_NOT_FOUND');
    });

    it('should work without details parameter', () => {
      const error = new AppError('INVALID_INPUT', 400, 'Invalid input');

      expect(error.code).toBe('INVALID_INPUT');
      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toBeUndefined();
    });

    it('should have a stack trace', () => {
      const error = new AppError('TEST_ERROR', 500);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('badRequest', () => {
    it('should create a 400 Bad Request error', () => {
      const error = AppError.badRequest('INVALID_DATA', 'The data is invalid');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('INVALID_DATA');
      expect(error.status).toBe(400);
      expect(error.message).toBe('The data is invalid');
    });

    it('should work with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = AppError.badRequest('INVALID_EMAIL', 'Invalid email', details);

      expect(error.status).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('unauthorized', () => {
    it('should create a 401 Unauthorized error', () => {
      const error = AppError.unauthorized('INVALID_TOKEN', 'Token is invalid');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('INVALID_TOKEN');
      expect(error.status).toBe(401);
      expect(error.message).toBe('Token is invalid');
    });

    it('should work without message', () => {
      const error = AppError.unauthorized('AUTH_REQUIRED');

      expect(error.status).toBe(401);
      expect(error.message).toBe('AUTH_REQUIRED');
    });
  });

  describe('forbidden', () => {
    it('should create a 403 Forbidden error', () => {
      const error = AppError.forbidden('ACCESS_DENIED', 'Access denied');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('ACCESS_DENIED');
      expect(error.status).toBe(403);
      expect(error.message).toBe('Access denied');
    });

    it('should include details', () => {
      const details = { resource: 'admin_panel', requiredRole: 'admin' };
      const error = AppError.forbidden('INSUFFICIENT_PERMISSIONS', 'Not enough permissions', details);

      expect(error.status).toBe(403);
      expect(error.details).toEqual(details);
    });
  });

  describe('notFound', () => {
    it('should create a 404 Not Found error', () => {
      const error = AppError.notFound('USER_NOT_FOUND', 'User not found');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should work with entity ID in details', () => {
      const details = { id: '12345' };
      const error = AppError.notFound('PROJECT_NOT_FOUND', 'Project not found', details);

      expect(error.status).toBe(404);
      expect(error.details).toEqual(details);
    });
  });

  describe('conflict', () => {
    it('should create a 409 Conflict error', () => {
      const error = AppError.conflict('USER_EXISTS', 'User already exists');

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('USER_EXISTS');
      expect(error.status).toBe(409);
      expect(error.message).toBe('User already exists');
    });

    it('should work with conflict details', () => {
      const details = { email: 'test@example.com' };
      const error = AppError.conflict('DUPLICATE_EMAIL', 'Email already in use', details);

      expect(error.status).toBe(409);
      expect(error.details).toEqual(details);
    });
  });

  describe('Error Inheritance', () => {
    it('should be catchable as Error', () => {
      try {
        throw AppError.badRequest('TEST', 'Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Test error');
      }
    });

    it('should be distinguishable from generic Error', () => {
      const appError = AppError.notFound('NOT_FOUND', 'Not found');
      const genericError = new Error('Generic error');

      expect(appError).toBeInstanceOf(AppError);
      expect(genericError).not.toBeInstanceOf(AppError);
    });
  });

  describe('Code and Message Combinations', () => {
    it('should handle same code with different messages', () => {
      const error1 = AppError.badRequest('VALIDATION_ERROR', 'Email is invalid');
      const error2 = AppError.badRequest('VALIDATION_ERROR', 'Password is too short');

      expect(error1.code).toBe(error2.code);
      expect(error1.message).not.toBe(error2.message);
    });

    it('should handle empty strings', () => {
      const error = AppError.badRequest('', '');

      expect(error.code).toBe('');
      expect(error.message).toBe('');
      expect(error.status).toBe(400);
    });
  });

  describe('Details Parameter', () => {
    it('should accept complex objects in details', () => {
      const details = {
        errors: [
          { field: 'email', message: 'invalid' },
          { field: 'password', message: 'too short' }
        ],
        timestamp: new Date(),
        requestId: 'req-123'
      };

      const error = AppError.badRequest('VALIDATION_FAILED', 'Validation failed', details);

      expect(error.details).toEqual(details);
      expect(error.details.errors).toHaveLength(2);
    });

    it('should accept arrays in details', () => {
      const details = ['error1', 'error2', 'error3'];
      const error = AppError.badRequest('MULTIPLE_ERRORS', 'Multiple errors', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('toString and JSON', () => {
    it('should convert to string properly', () => {
      const error = AppError.notFound('USER_NOT_FOUND', 'User not found');
      const errorString = error.toString();

      expect(errorString).toContain('AppError');
      expect(errorString).toContain('User not found');
    });

    it('should serialize to JSON', () => {
      const error = AppError.badRequest('INVALID_INPUT', 'Invalid input', { field: 'email' });
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);

      expect(parsed.code).toBe('INVALID_INPUT');
      expect(parsed.status).toBe(400);
      expect(parsed.details).toEqual({ field: 'email' });
    });
  });
});
