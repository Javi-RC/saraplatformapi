const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const { generateToken } = require('../../src/utils/jwt');

describe('Profile API Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/tfg-test');
    }
  });

  beforeEach(async () => {
    // Limpiar usuarios
    await User.deleteMany({});

    // Crear usuario de prueba
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashed_password',
      role: 'employee',
      isConfirmed: true,
      country: 'España',
      timezone: 'Europe/Madrid',
      flexibleSchedule: false,
      preferredWorkingHours: {
        start: '09:00',
        end: '18:00'
      },
      notificationPreferences: {
        email: true,
        inApp: true,
        push: false
      }
    });

    // Generar token de autenticación
    authToken = generateToken({ userId: testUser._id.toString() });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/profile', () => {
    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.country).toBe('España');
      expect(response.body.user.timezone).toBe('Europe/Madrid');
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/profile');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/profile', () => {
    it('should update user name', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Perfil actualizado correctamente');
      expect(response.body.user.name).toBe('Updated Name');

      // Verificar en la base de datos
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe('Updated Name');
    });

    it('should update country and timezone', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          country: 'México',
          timezone: 'America/Mexico_City'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.country).toBe('México');
      expect(response.body.user.timezone).toBe('America/Mexico_City');
    });

    it('should update flexible schedule', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          flexibleSchedule: true
        });

      expect(response.status).toBe(200);
      expect(response.body.user.flexibleSchedule).toBe(true);
    });

    it('should update preferred working hours', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredWorkingHours: {
            start: '10:00',
            end: '19:00'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.preferredWorkingHours.start).toBe('10:00');
      expect(response.body.user.preferredWorkingHours.end).toBe('19:00');
    });

    it('should update notification preferences', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notificationPreferences: {
            email: false,
            inApp: true,
            push: true
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.notificationPreferences.email).toBe(false);
      expect(response.body.user.notificationPreferences.inApp).toBe(true);
      expect(response.body.user.notificationPreferences.push).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
          country: 'Argentina',
          timezone: 'America/Argentina/Buenos_Aires',
          flexibleSchedule: true,
          preferredWorkingHours: {
            start: '11:00',
            end: '20:00'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('New Name');
      expect(response.body.user.country).toBe('Argentina');
      expect(response.body.user.timezone).toBe('America/Argentina/Buenos_Aires');
      expect(response.body.user.flexibleSchedule).toBe(true);
      expect(response.body.user.preferredWorkingHours.start).toBe('11:00');
    });

    it('should reject name that is too short', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('nombre');
    });

    it('should reject invalid working hours format', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferredWorkingHours: {
            start: '25:00',
            end: '18:00'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid flexible schedule type', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          flexibleSchedule: 'yes'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return error when no valid fields provided', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invalidField: 'value'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('campos válidos');
    });

    it('should not allow updating email', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'newemail@example.com'
        });

      // Email no debe cambiar
      const user = await User.findById(testUser._id);
      expect(user.email).toBe('test@example.com');
    });

    it('should not allow updating role', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'org_admin'
        });

      // Role no debe cambiar
      const user = await User.findById(testUser._id);
      expect(user.role).toBe('employee');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .send({
          name: 'New Name'
        });

      expect(response.status).toBe(401);
    });
  });
});
