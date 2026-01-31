const mongoose = require('mongoose');
const mongodbHelper = require('../../setup/mongodb-helper');
const User = require('../../../src/models/user.model');
const bcrypt = require('bcryptjs');

describe('User Model - Unit Tests', () => {
  beforeAll(async () => {
    await mongodbHelper.connect();
    // Ensure model indexes (unique constraints) are created before tests
    await User.init();
  }, 60000);

  afterAll(async () => {
    await mongodbHelper.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Creación de Usuario', () => {
    it('debería crear un usuario correctamente', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };
      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.passwordHash).toBe(userData.passwordHash);
      expect(savedUser.isConfirmed).toBe(false);
      expect(savedUser.role).toBe('unassigned');
      expect(savedUser.createdAt).toBeDefined();
    });

    it('debería rechazar email duplicado', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };

      await User.create(userData);

      const secondUser = new User(userData);

      await expect(secondUser.save()).rejects.toThrow();
    }, 10000); 

    it('debería rechazar email inválido', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };

      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    it('debería convertir email a minúsculas automáticamente', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };
      const user = new User(userData);
      const savedUser = await user.save();
      expect(savedUser.email).toBe('test@example.com');
    });

    it('debería eliminar campos sensibles al convertir a JSON', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123',
        confirmationToken: 'token123',
        confirmationTokenExpiry: new Date()
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const userJson = savedUser.toJSON();
      expect(userJson.passwordHash).toBeUndefined();
      expect(userJson.confirmationToken).toBeUndefined();
      expect(userJson.confirmationTokenExpiry).toBeUndefined();
      expect(userJson.email).toBe('test@example.com');
      expect(userJson.name).toBe('Test User');
    });
  });

  describe('Métodos de Instancia', () => {
    it('debería comparar contraseñas correctamente', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: hashedPassword
      });
      const isMatch = await user.comparePassword(plainPassword);
      const isNotMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });
});