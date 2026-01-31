const request = require('supertest');
const mongoose = require('mongoose');
const mongodbHelper = require('../setup/mongodb-helper');
const app = require('../../src/app'); // ✅ Ruta corregida
const User = require('../../src/models/user.model');
const { generateToken } = require('../../src/utils/jwt');

describe('Protected Routes - Integration Tests', () => {
  beforeAll(async () => {
    await mongodbHelper.connect();
  }, 60000);

  afterAll(async () => {
    await mongodbHelper.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/profile', () => {
    it('debería permitir acceso con token válido', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed_password',
        role: 'employee',
        isConfirmed: true
      });

      const token = generateToken(user);
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('debería rechazar acceso sin token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access token is required');
    });

    it('debería rechazar acceso con token inválido', async () => {

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });
  });

  describe('Rutas de Health Check', () => {
    it('debería responder en la ruta de health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
    });

    it('debería responder en la ruta raíz', async () => {
      // Act & Assert
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });
  });
});