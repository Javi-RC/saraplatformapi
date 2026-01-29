const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de dependencias
jest.mock('bcryptjs');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/services/email.service');
jest.mock('../../../src/services/authNotificationHelper');
jest.mock('../../../src/services/bfi44NotificationHelper');
jest.mock('../../../src/repositories', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    updateLastLogin: jest.fn(),
    findByIdAndSelect: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    lockAccount: jest.fn(),
    resetLoginAttempts: jest.fn()
  },
  bfi44Repository: {
    hasProfile: jest.fn()
  }
}));

describe('AuthService - Unit Tests', () => {
  let authService;
  let userRepository;
  let generateToken;

  beforeEach(() => {
    jest.resetModules();
    authService = require('../../../src/services/auth.service');
    userRepository = require('../../../src/repositories').userRepository;
    generateToken = require('../../../src/utils/jwt').generateToken;
    jest.clearAllMocks();
    
    // Configurar mocks por defecto
    process.env.BREVO_API_KEY = 'test-api-key';
    process.env.JWT_SECRET = 'test-secret';
    
    // Configurar mock de authNotificationHelper
    const authNotificationHelper = require('../../../src/services/authNotificationHelper');
    authNotificationHelper.notifyAccountCreated = jest.fn().mockResolvedValue(undefined);
    authNotificationHelper.notifyAccountConfirmed = jest.fn().mockResolvedValue(undefined);
  });

  describe('register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      
      const newUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      userRepository.create.mockResolvedValue(newUser);

      const emailService = require('../../../src/services/email.service');
      emailService.sendConfirmationEmail.mockResolvedValue({ messageId: '123' });
      
      const result = await authService.register(userData);
      
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.user.email).toBe('test@example.com');
    });

    it('debería lanzar error si el usuario ya existe', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'password123'
      };

      userRepository.findByEmail.mockResolvedValue({
        email: 'existing@example.com',
        isConfirmed: true 
      });

      await expect(authService.register(userData))
        .rejects
        .toThrow(expect.objectContaining({ code: 'USER_ALREADY_EXISTS' }));
    });
  });

  describe('login', () => {
    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee',
        isConfirmed: true,
        loginAttempts: 0,
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        lastLogin: null
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.updateLastLogin.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('fake-jwt-token');
      
      const result = await authService.login(credentials);
      
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(result.token).toBe('fake-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('debería rechazar login con credenciales incorrectas', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        isConfirmed: true,
        loginAttempts: 0,
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.incrementLoginAttempts.mockResolvedValue(mockUser);

      await expect(authService.login(credentials))
        .rejects
        .toThrow(expect.objectContaining({ code: 'INVALID_CREDENTIALS' }));
      
      expect(userRepository.incrementLoginAttempts).toHaveBeenCalledWith(mockUser._id);
    });

    it('debería bloquear cuenta después de 3 intentos fallidos', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        isConfirmed: true,
        loginAttempts: 2, // Already 2 failed attempts
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.lockAccount.mockResolvedValue(mockUser);

      await expect(authService.login(credentials))
        .rejects
        .toThrow(expect.objectContaining({ code: 'ACCOUNT_LOCKED' }));
      
      expect(userRepository.lockAccount).toHaveBeenCalled();
    });

    it('debería rechazar login si la cuenta está bloqueada', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        isConfirmed: true,
        loginAttempts: 0,
        lockUntil: new Date(Date.now() + 10 * 60 * 1000), // Locked for 10 more minutes
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.login(credentials))
        .rejects
        .toThrow(expect.objectContaining({ code: 'ACCOUNT_LOCKED' }));
    });

    it('debería resetear intentos después de login exitoso', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee',
        isConfirmed: true,
        loginAttempts: 2, // Had previous failed attempts
        lockUntil: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        lastLogin: null
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.resetLoginAttempts.mockResolvedValue(mockUser);
      userRepository.updateLastLogin.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('fake-jwt-token');
      
      const result = await authService.login(credentials);
      
      expect(userRepository.resetLoginAttempts).toHaveBeenCalledWith(mockUser._id);
      expect(result.token).toBe('fake-jwt-token');
    });
  });
});