const { getErrorStatusCode, handleErrorCatch } = require('../../../src/utils/errorHelper');

describe('errorHelper', () => {
  describe('getErrorStatusCode', () => {
    it('should return statusCode from error if present', () => {
      const error = { statusCode: 418, message: "I'm a teapot" };
      expect(getErrorStatusCode(error)).toBe(418);
    });

    it('should return 404 for not found messages', () => {
      expect(getErrorStatusCode(new Error('User not found'))).toBe(404);
      expect(getErrorStatusCode(new Error('Usuario no encontrado'))).toBe(404);
    });

    it('should return 403 for permission messages', () => {
      expect(getErrorStatusCode(new Error('Permission denied'))).toBe(403);
      expect(getErrorStatusCode(new Error('No autorizado'))).toBe(403);
      expect(getErrorStatusCode(new Error('Forbidden'))).toBe(403);
    });

    it('should return 409 for conflict messages', () => {
      expect(getErrorStatusCode(new Error('Email already exists'))).toBe(409);
      expect(getErrorStatusCode(new Error('Email ya existe'))).toBe(409);
    });

    it('should return 400 for invalid/required messages', () => {
      expect(getErrorStatusCode(new Error('Invalid email'))).toBe(400);
      expect(getErrorStatusCode(new Error('Email inválido'))).toBe(400);
      expect(getErrorStatusCode(new Error('Required field'))).toBe(400);
      expect(getErrorStatusCode(new Error('Campo requerido'))).toBe(400);
      expect(getErrorStatusCode(new Error('Missing data'))).toBe(400);
    });

    it('should return 403 for unauthorized messages', () => {
      expect(getErrorStatusCode(new Error('Unauthorized'))).toBe(403);
    });

    it('should return 401 for credential/password messages', () => {
      expect(getErrorStatusCode(new Error('Wrong password'))).toBe(401);
      expect(getErrorStatusCode(new Error('Contraseña incorrecta'))).toBe(401);
    });

    it('should return default 500 for unknown messages', () => {
      expect(getErrorStatusCode(new Error('Something broke'))).toBe(500);
    });

    it('should respect custom defaultStatus', () => {
      expect(getErrorStatusCode(new Error('Unknown error'), 502)).toBe(502);
    });

    it('should handle errors with no message', () => {
      expect(getErrorStatusCode({})).toBe(500);
    });

    it('should handle null/undefined gracefully', () => {
      expect(getErrorStatusCode(null)).toBe(500);
      expect(getErrorStatusCode(undefined)).toBe(500);
    });
  });

  describe('handleErrorCatch', () => {
    it('should send error with correct status code', () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const error = new Error('Not found');
      const result = handleErrorCatch(error, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.any(String),
      });
    });

    it('should send generic error in production', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      handleErrorCatch(new Error('secret details'), res);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
      process.env.NODE_ENV = original;
    });

    it('should send original error message in development', () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      handleErrorCatch(new Error('specific error'), res);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'specific error',
      });
      process.env.NODE_ENV = original;
    });
  });
});
