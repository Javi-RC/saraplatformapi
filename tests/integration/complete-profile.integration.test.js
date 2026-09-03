const request = require('supertest');
const mongoose = require('mongoose');
const mongodbHelper = require('../setup/mongodb-helper');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const { generateToken, verifyToken } = require('../../src/utils/jwt');

describe('PUT /auth/complete-profile', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await mongodbHelper.connect();
  }, 60000);

  beforeEach(async () => {
    await User.deleteMany({});

    testUser = await User.create({
      email: 'oauth-user@example.com',
      name: 'OAuth User',
      oauthProvider: 'google',
      oauthId: 'google-123',
      role: 'unassigned',
      isConfirmed: true
    });

    authToken = generateToken(testUser);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongodbHelper.disconnect();
  });

  it('debería asignar org_admin cuando el role viene en el body', async () => {
    const response = await request(app)
      .put('/auth/complete-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ role: 'org_admin' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.role).toBe('org_admin');
  });

  it('debería devolver el token rotado con el rol nuevo', async () => {
    const response = await request(app)
      .put('/auth/complete-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ role: 'org_admin' });

    expect(response.status).toBe(200);
    // Sin esto, un cliente que no puede usar la cookie sigue mandando el token
    // viejo (role: unassigned) y recibe 403 en todo lo protegido por rol.
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token).not.toBe(authToken);
    expect(verifyToken(response.body.token).role).toBe('org_admin');
  });

  it('debería asignar employee cuando el role viene en el body', async () => {
    const response = await request(app)
      .put('/auth/complete-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ role: 'employee' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.role).toBe('employee');
  });

  it('debería mantener employee como fallback si no se envía role', async () => {
    const response = await request(app)
      .put('/auth/complete-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(response.status).toBe(200);

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.role).toBe('employee');
  });

  it('debería mantener employee como fallback si el role es inválido', async () => {
    const response = await request(app)
      .put('/auth/complete-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ role: 'admin' });

    expect(response.status).toBe(200);

    const updatedUser = await User.findById(testUser._id);
    expect(updatedUser.role).toBe('employee');
  });

  it('debería devolver 400 si el perfil ya está completado', async () => {
    await User.findByIdAndUpdate(testUser._id, { role: 'employee' });

    const response = await request(app)
      .put('/auth/complete-profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ role: 'org_admin' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('already completed');
  });

  it('debería devolver 401 sin token', async () => {
    const response = await request(app)
      .put('/auth/complete-profile')
      .send({ role: 'org_admin' });

    expect(response.status).toBe(401);
  });

  it('debería devolver 404 si el usuario no existe', async () => {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET;
    const orphanId = new mongoose.Types.ObjectId();
    const orphanToken = jwt.sign(
      { userId: orphanId.toString(), email: 'gone@example.com', name: 'Ghost', role: 'unassigned' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const response = await request(app)
      .put('/auth/complete-profile')
      .set('Authorization', `Bearer ${orphanToken}`)
      .send({ role: 'org_admin' });

    expect(response.status).toBe(404);
  });
});