const request = require('supertest');
const mongoose = require('mongoose');
const mongodbHelper = require('../setup/mongodb-helper');
const app = require('../../src/app');
const User = require('../../src/models/user.model');
const CV = require('../../src/models/cv.model');
const { generateToken } = require('../../src/utils/jwt');

describe('CV Questionnaire - contact.phones normalization', () => {
  let user;
  let authToken;
  let cv;

  beforeAll(async () => {
    await mongodbHelper.connect();
  }, 60000);

  beforeEach(async () => {
    await CV.deleteMany({});
    await User.deleteMany({});

    user = await User.create({
      email: 'cv-user@example.com',
      name: 'CV User',
      passwordHash: 'hashed_password',
      role: 'employee',
      isConfirmed: true
    });

    authToken = generateToken(user);
    cv = await CV.create({ userId: user._id });
  });

  afterAll(async () => {
    await CV.deleteMany({});
    await User.deleteMany({});
    await mongodbHelper.disconnect();
  });

  it('debería normalizar contact.phones como string en /questionnaire/next', async () => {
    const response = await request(app)
      .post('/api/cv/questionnaire/next')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: 'session-1',
        currentPhase: 'phase-1-basic',
        responses: { 'contact.phones': '678820014' }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedCV = await CV.findById(cv._id).lean();
    expect(updatedCV.contact.phones.map(({ number, type }) => ({ number, type }))).toEqual([
      { number: '678820014', type: 'mobile' }
    ]);
  });

  it('debería normalizar contact.phones como array de strings en /questionnaire/submit', async () => {
    const response = await request(app)
      .post('/api/cv/questionnaire/submit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: 'session-2',
        finalResponses: { 'contact.phones': ['678820014', '+34 600 123 456'] }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedCV = await CV.findById(cv._id).lean();
    expect(updatedCV.contact.phones.map(({ number, type }) => ({ number, type }))).toEqual([
      { number: '678820014', type: 'mobile' },
      { number: '+34 600 123 456', type: 'mobile' }
    ]);
  });

  it('debería conservar contact.phones como array de objetos intacto', async () => {
    const response = await request(app)
      .post('/api/cv/questionnaire/submit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sessionId: 'session-3',
        finalResponses: {
          'contact.phones': [{ number: '+34600123456', type: 'work' }]
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const updatedCV = await CV.findById(cv._id).lean();
    expect(updatedCV.contact.phones.map(({ number, type }) => ({ number, type }))).toEqual([
      { number: '+34600123456', type: 'work' }
    ]);
  });
});