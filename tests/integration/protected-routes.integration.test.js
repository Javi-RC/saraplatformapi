const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../src/app'); // ✅ Ruta corregida
const User = require('../../src/models/user.model');
const { generateToken } = require('../../src/utils/jwt');

let mongoServer;

describe('Protected Routes - Integration Tests', () => {
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
  });

  describe('GET /api/profile', () => {
    it('debería permitir acceso con token válido', async () => {
      // Arrange
      const user = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee'
      };

      const token = generateToken(user);

      // Act
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Access to protected route granted');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('debería rechazar acceso sin token', async () => {
      // Act & Assert
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token de acceso requerido');
    });

    it('debería rechazar acceso con token inválido', async () => {
      // Act & Assert
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token inválido');
    });
  });

  describe('Rutas de Health Check', () => {
    it('debería responder en la ruta de health check', async () => {
      // Act & Assert
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