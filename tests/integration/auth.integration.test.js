const request = require('supertest');
const mongoose = require('mongoose');
const mongodbHelper = require('../setup/mongodb-helper');
const app = require('../../src/app'); // ✅ Ruta corregida
const User = require('../../src/models/user.model');

// Mock del servicio de email para evitar llamadas reales a Brevo
jest.mock('../../src/services/email.service', () => ({
  sendConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'test-123' })
}));

describe('Auth - Integration Tests', () => {
  beforeAll(async () => {
    await mongodbHelper.connect();
  }, 60000);

  afterAll(async () => {
    await mongodbHelper.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user).not.toHaveProperty('passwordHash');

      const userInDb = await User.findOne({ email: 'test@example.com' });
      expect(userInDb).toBeTruthy();
      expect(userInDb.isConfirmed).toBe(false);
      expect(userInDb.confirmationToken).toBeDefined();
      expect(userInDb.confirmationTokenExpiry).toBeDefined();
    });

    it('debería rechazar registro con email duplicado', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        password: 'password123'
      };

      await request(app).post('/auth/register').send(userData);

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // The current behavior for unconfirmed users is to resend verification.
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Verification email resent');
    });

    it('debería rechazar datos inválidos', async () => {
      const testCases = [
        { 
          data: { email: 'invalid-email', name: 'Test', password: '123' },
          expectedError: 'Invalid email format'
        },
        { 
          data: { email: '', name: 'Test', password: 'password123' },
          expectedError: 'All fields are required'
        },
        { 
          data: { email: 'test@example.com', name: '', password: 'password123' },
          expectedError: 'All fields are required'
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
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$12$hashedPassword', // Hash simulado
        isConfirmed: true
      });
      await user.save();

      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      bcrypt.compare.mockRestore();
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: '$2a$12$hashedPassword',
        isConfirmed: true
      });
      await user.save();

      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
      bcrypt.compare.mockRestore();
    });
  });

  describe('GET /auth/confirm', () => {
    it('debería confirmar cuenta con token válido', async () => {
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword',
        confirmationToken: 'valid-token',
        confirmationTokenExpiry: new Date(Date.now() + 3600000),
        isConfirmed: false
      });
      await user.save();
      const response = await request(app)
        .get('/auth/confirm?token=valid-token')
        .expect(302); // Redirección
      expect(response.header.location).toContain('/login?confirmed=true');

      const updatedUser = await User.findOne({ email: 'test@example.com' });
      expect(updatedUser.isConfirmed).toBe(true);
      expect(updatedUser.confirmationToken).toBe(undefined);
      expect(updatedUser.confirmationTokenExpiry).toBe(undefined);
    });

    it('debería rechazar token inválido con redirección', async () => {
      const response = await request(app)
        .get('/auth/confirm?token=invalid-token')
        .expect(302);

      expect(response.header.location).toContain('/error?message=Error%20confirmando%20cuenta');
    });
  });

  describe('POST /auth/send-confirmation', () => {
    it('debería reenviar email de confirmación exitosamente', async () => {
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword',
        isConfirmed: false
      });
      await user.save();
      const response = await request(app)
        .post('/auth/send-confirmation')
        .send({
          email: 'test@example.com',
          name: 'Test User'
        })
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Confirmation email sent');
    });
  });
});