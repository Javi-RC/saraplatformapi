const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app'); // ✅ Ruta corregida
const User = require('../../src/models/user.model');

// Mock del servicio de email para evitar llamadas reales a Brevo
jest.mock('../../src/services/email.service', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'test-123' })
}));

let mongoServer;

describe('Auth - Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Act
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user).not.toHaveProperty('passwordHash');

      // Verificar en base de datos
      const userInDb = await User.findOne({ email: 'test@example.com' });
      expect(userInDb).toBeTruthy();
      expect(userInDb.isConfirmed).toBe(false);
      expect(userInDb.confirmationToken).toBeDefined();
      expect(userInDb.confirmationTokenExpiry).toBeDefined();
    });

    it('debería rechazar registro con email duplicado', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        password: 'password123'
      };

      // Crear usuario primero
      await request(app).post('/auth/register').send(userData);

      // Intentar crear otro con mismo email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ya está registrado');
    });

    it('debería rechazar datos inválidos', async () => {
      const testCases = [
        { 
          data: { email: 'invalid-email', name: 'Test', password: '123' },
          expectedError: 'Formato de email inválido'
        },
        { 
          data: { email: '', name: 'Test', password: 'password123' },
          expectedError: 'Todos los campos son requeridos'
        },
        { 
          data: { email: 'test@example.com', name: '', password: 'password123' },
          expectedError: 'Todos los campos son requeridos'
        }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/auth/register')
          .send(testCase.data)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain(testCase.expectedError);
      }
    });
  });

  describe('POST /auth/login', () => {
    it('debería hacer login exitosamente con usuario confirmado', async () => {
      // Arrange - Crear usuario confirmado directamente
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$12$hashedPassword', // Hash simulado
        isConfirmed: true
      });
      await user.save();

      // Mock de bcrypt.compare
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');

      // Restaurar mocks
      bcrypt.compare.mockRestore();
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      // Arrange
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$12$hashedPassword',
        isConfirmed: true
      });
      await user.save();

      // Mock de bcrypt.compare para devolver false
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      // Act & Assert
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Credenciales inválidas');

      // Restaurar mocks
      bcrypt.compare.mockRestore();
    });
  });

  describe('GET /auth/confirm', () => {
    it('debería confirmar cuenta con token válido', async () => {
      // Arrange - Crear usuario con token
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword',
        confirmationToken: 'valid-token',
        confirmationTokenExpiry: new Date(Date.now() + 3600000),
        isConfirmed: false
      });
      await user.save();

      // Act
      const response = await request(app)
        .get('/auth/confirm?token=valid-token')
        .expect(302); // Redirección

      // Assert
      expect(response.header.location).toContain('/login?confirmed=true');

      // Verificar que el usuario está confirmado
      const updatedUser = await User.findOne({ email: 'test@example.com' });
      expect(updatedUser.isConfirmed).toBe(true);
      expect(updatedUser.confirmationToken).toBeUndefined();
    });

    it('debería rechazar token inválido con redirección', async () => {
      // Act & Assert
      const response = await request(app)
        .get('/auth/confirm?token=invalid-token')
        .expect(302);

      // Verificar que redirige a página de error
      expect(response.header.location).toContain('/error?message=Error%20confirmando%20cuenta');
    });
  });

  describe('POST /auth/send-confirmation', () => {
    it('debería reenviar email de confirmación exitosamente', async () => {
      // Arrange - Crear usuario no confirmado
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword',
        isConfirmed: false
      });
      await user.save();

      // Act
      const response = await request(app)
        .post('/auth/send-confirmation')
        .send({
          email: 'test@example.com',
          name: 'Test User'
        })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('enviado');
    });
  });
});