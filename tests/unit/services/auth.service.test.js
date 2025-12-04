const AuthService = require('../../../src/services/auth.service');
const User = require('../../../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock de dependencias
jest.mock('../../../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/services/email.service');

describe('AuthService - Unit Tests', () => {
  let authService;

  beforeEach(() => {
    authService = require('../../../src/services/auth.service');
    jest.clearAllMocks();
    
    // Configurar mocks por defecto
    process.env.BREVO_API_KEY = 'test-api-key';
  });

  describe('register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      
const mockSave = jest.fn().mockResolvedValue(true);

      User.mockImplementation((data) => ({
        ...data,
        _id: '507f1f77bcf86cd799439011',
        save: mockSave
      }));

      const emailService = require('../../../src/services/email.service');
      emailService.sendConfirmationEmail.mockResolvedValue({ messageId: '123' });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      console.log(result);
      expect(result.user.email).toBe('test@example.com');
    });

    it('debería lanzar error si el usuario ya existe', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'password123'
      };

      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      // Act & Assert
      await expect(authService.register(userData))
        .rejects
        .toThrow('USER_ALREADY_EXISTS');
    });
  });

  describe('login', () => {
    it('debería hacer login exitosamente con credenciales válidas', async () => {
      // Arrange
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
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      jwt.sign.mockReturnValue('fake-jwt-token');

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(result.token).toBe('fake-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('debería rechazar login con credenciales incorrectas', async () => {
      // Arrange
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const mockUser = {
        isConfirmed: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      // Act & Assert
      await expect(authService.login(credentials))
        .rejects
        .toThrow('INVALID_CREDENTIALS');
    });
  });
});