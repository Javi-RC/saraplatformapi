const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('../../../src/utils/jwt');

// Mock de jwt
jest.mock('jsonwebtoken');

describe('JWT Utils - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32-chars';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  describe('generateToken', () => {
    it('debería generar token JWT correctamente', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee'
      };

      jwt.sign.mockReturnValue('fake-jwt-token');
      const token = generateToken(user);
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        'test-jwt-secret-for-testing-only-32-chars', // ✅ Usar el mismo secret
        { expiresIn: '7d' } // ✅ Usar el mismo expiresIn
      );
      expect(token).toBe('fake-jwt-token');
    });
  });

  describe('verifyToken', () => {
    it('debería verificar token válido', () => {
      const validToken = 'valid-token';
      const decodedPayload = {
        userId: '507f1f77bcf86cd799439011',
        email: 'test@example.com'
      };

      jwt.verify.mockReturnValue(decodedPayload);
      const result = verifyToken(validToken);
      expect(result).toEqual(decodedPayload);
    });

    it('debería lanzar error para token expirado', () => {
      const expiredToken = 'expired-token';
      
      const tokenExpiredError = new Error('Token expired');
      tokenExpiredError.name = 'TokenExpiredError';
      
      jwt.verify.mockImplementation(() => {
        throw tokenExpiredError;
      });

      expect(() => verifyToken(expiredToken))
        .toThrow('Token expired');
    });

    it('debería lanzar error para token inválido', () => {
      const invalidToken = 'invalid-token';
      
      const jsonWebTokenError = new Error('Invalid token');
      jsonWebTokenError.name = 'JsonWebTokenError';
      
      jwt.verify.mockImplementation(() => {
        throw jsonWebTokenError;
      });

      expect(() => verifyToken(invalidToken))
        .toThrow('Invalid token');
    });
  });
});