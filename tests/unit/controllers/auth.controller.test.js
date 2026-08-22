const authController = require('../../../src/controllers/auth.controller');
const authService = require('../../../src/services/auth/auth.service');
const validators = require('../../../src/utils/validators');
const responseHandler = require('../../../src/utils/responseHandler');

// Mock de dependencias
jest.mock('../../../src/services/auth/auth.service');
jest.mock('../../../src/utils/validators');
jest.mock('../../../src/utils/responseHandler');
jest.mock('../../../src/utils/cookie');

describe('Auth Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Setup de objetos request y response
    req = {
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn()
    };
    
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      req.body = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'employee'
      };

      const mockResult = {
        user: { id: '123', email: 'test@example.com', name: 'Test User' },
        message: 'Usuario registrado'
      };

      authService.register.mockResolvedValue(mockResult);

      await authController.register(req, res);

      expect(validators.validateRegistrationData).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
        'password123'
      );
      expect(authService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'employee'
      });
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        {
          message: mockResult.message,
          user: mockResult.user
        },
        201
      );
    });

    it('debería manejar errores de validación', async () => {
      req.body = {
        email: 'invalid-email',
        name: 'Test',
        password: 'short'
      };

      const validationError = new Error('Invalid data');
      validators.validateRegistrationData.mockImplementation(() => {
        throw validationError;
      });

      await authController.register(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(validationError, res);
    });

    it('debería manejar errores del servicio', async () => {
      req.body = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      const serviceError = new Error('Service error');
      validators.validateRegistrationData.mockImplementation(() => {}); // No lanzar error
      authService.register.mockRejectedValue(serviceError);

      await authController.register(req, res);

      expect(responseHandler.handleError).toHaveBeenCalled();
      expect(authService.register).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('debería hacer login exitosamente', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockResult = {
        token: 'fake-jwt-token',
        user: { id: '123', email: 'test@example.com' }
      };

      authService.login.mockResolvedValue(mockResult);

      await authController.login(req, res);

      expect(validators.validateLoginData).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        {
          message: 'Login successful',
          user: mockResult.user
        }
      );
    });

    it('debería manejar credenciales inválidas', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const authError = new Error('Invalid credentials');
      authService.login.mockRejectedValue(authError);

      await authController.login(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(authError, res);
    });
  });

  describe('confirmAccount', () => {
    it('debería confirmar cuenta con token válido', async () => {
      req.query = { token: 'valid-token' };
      process.env.FRONTEND_URL = 'http://localhost:3001';

      authService.confirmAccount.mockResolvedValue();

      await authController.confirmAccount(req, res);

      expect(authService.confirmAccount).toHaveBeenCalledWith('valid-token');
      expect(responseHandler.redirect).toHaveBeenCalledWith(
        res,
        'http://localhost:3001/login?confirmed=true'
      );
    });

    it('debería usar URL por defecto si FRONTEND_URL no está definida', async () => {
      req.query = { token: 'valid-token' };
      delete process.env.FRONTEND_URL;

      authService.confirmAccount.mockResolvedValue();

      await authController.confirmAccount(req, res);

      expect(responseHandler.redirect).toHaveBeenCalledWith(
        res,
        'http://localhost:3001/login?confirmed=true'
      );
    });

    it('debería redirigir a error si falta el token', async () => {
      req.query = {};

      await authController.confirmAccount(req, res);

      expect(responseHandler.redirect).toHaveBeenCalledWith(
        res,
        expect.stringContaining('/login?error=confirmation_failed')
      );
    });

    it('debería redirigir a error si falla la confirmación', async () => {
      req.query = { token: 'invalid-token' };
      process.env.FRONTEND_URL = 'http://localhost:3001';

      authService.confirmAccount.mockRejectedValue(new Error('Invalid token'));

      await authController.confirmAccount(req, res);

      expect(responseHandler.redirect).toHaveBeenCalledWith(
        res,
        expect.stringContaining('/login?error=confirmation_failed')
      );
    });
  });

  describe('sendConfirmation', () => {
    it('debería reenviar email de confirmación', async () => {
      req.body = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockResult = { message: 'Email enviado' };
      authService.resendConfirmationEmail.mockResolvedValue(mockResult);

      await authController.sendConfirmation(req, res);

      expect(validators.validateConfirmationRequest).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      );
      expect(authService.resendConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      );
      expect(responseHandler.success).toHaveBeenCalledWith(
        res,
        { message: mockResult.message }
      );
    });

    it('debería manejar errores al reenviar', async () => {
      req.body = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const error = new Error('Send error');
      authService.resendConfirmationEmail.mockRejectedValue(error);

      await authController.sendConfirmation(req, res);

      expect(responseHandler.handleError).toHaveBeenCalledWith(error, res);
    });
  });
});
