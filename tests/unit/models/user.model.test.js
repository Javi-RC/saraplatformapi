const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../../../src/models/user.model');
const bcrypt = require('bcryptjs');

let mongoServer;

describe('User Model - Unit Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    // Ensure model indexes (unique constraints) are created before tests
    await User.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Creación de Usuario', () => {
    it('debería crear un usuario correctamente', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };

      // Act
      const user = new User(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.passwordHash).toBe(userData.passwordHash);
      expect(savedUser.isConfirmed).toBe(false);
      expect(savedUser.role).toBe('unassigned');
      expect(savedUser.createdAt).toBeDefined();
    });

    it('debería rechazar email duplicado', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };

      // Crear primer usuario
      await User.create(userData);

      // Intentar crear segundo usuario con mismo email
      const secondUser = new User(userData);

      // Act & Assert
      await expect(secondUser.save()).rejects.toThrow();
    }, 10000); 

    it('debería rechazar email inválido', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };

      const user = new User(userData);

      // Act & Assert
      await expect(user.save()).rejects.toThrow();
    });

    it('debería convertir email a minúsculas automáticamente', async () => {
      // Arrange
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
        passwordHash: 'hashedPassword123'
      };

      // Act
      const user = new User(userData);
      const savedUser = await user.save();

      // Assert
      expect(savedUser.email).toBe('test@example.com');
    });

    it('debería eliminar campos sensibles al convertir a JSON', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123',
        confirmationToken: 'token123',
        confirmationTokenExpiry: new Date()
      };

      const user = new User(userData);
      const savedUser = await user.save();

      // Act
      const userJson = savedUser.toJSON();

      // Assert
      expect(userJson.passwordHash).toBeUndefined();
      expect(userJson.confirmationToken).toBeUndefined();
      expect(userJson.confirmationTokenExpiry).toBeUndefined();
      expect(userJson.email).toBe('test@example.com');
      expect(userJson.name).toBe('Test User');
    });
  });

  describe('Métodos de Instancia', () => {
    it('debería comparar contraseñas correctamente', async () => {
      // Arrange
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);
      
      const user = new User({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: hashedPassword
      });

      // Act
      const isMatch = await user.comparePassword(plainPassword);
      const isNotMatch = await user.comparePassword('wrongpassword');

      // Assert
      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });
});