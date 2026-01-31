const CleanupUnverifiedUsersJob = require('../../../src/jobs/cleanupUnverifiedUsers');
const User = require('../../../src/models/user.model');
const mongoose = require('mongoose');

jest.mock('../../../src/models/user.model');

describe('CleanupUnverifiedUsersJob - Unit Tests', () => {
  let job;

  beforeEach(() => {
    job = new CleanupUnverifiedUsersJob(48, 3);
    jest.clearAllMocks();
    
    // Mock mongoose connection state
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      writable: true,
      configurable: true
    });
  });

  describe('constructor', () => {
    it('debería inicializar con valores por defecto', () => {
      const defaultJob = new CleanupUnverifiedUsersJob();
      expect(defaultJob.expiryHours).toBe(48);
      expect(defaultJob.maxRetries).toBe(3);
      expect(defaultJob.intervalId).toBeNull();
    });

    it('debería inicializar con valores personalizados', () => {
      const customJob = new CleanupUnverifiedUsersJob(24, 5);
      expect(customJob.expiryHours).toBe(24);
      expect(customJob.maxRetries).toBe(5);
    });
  });

  describe('execute', () => {
    it('debería eliminar usuarios no verificados exitosamente', async () => {
      User.deleteMany.mockResolvedValue({ deletedCount: 5 });

      const result = await job.execute();

      expect(result).toBe(5);
      expect(User.deleteMany).toHaveBeenCalledWith({
        isConfirmed: false,
        createdAt: { $lt: expect.any(Date) }
      });
    });

    it('debería retornar 0 si no hay usuarios para eliminar', async () => {
      User.deleteMany.mockResolvedValue({ deletedCount: 0 });

      const result = await job.execute();

      expect(result).toBe(0);
    });

    it('debería retornar 0 si MongoDB no está conectado', async () => {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        writable: true,
        configurable: true
      });

      const result = await job.execute();

      expect(result).toBe(0);
      expect(User.deleteMany).not.toHaveBeenCalled();
    });

    it('debería manejar errores de red con reintentos', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'MongoNetworkError';
      
      User.deleteMany
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ deletedCount: 3 });

      const result = await job.execute();

      expect(result).toBe(3);
      expect(User.deleteMany).toHaveBeenCalledTimes(2);
    });

    it('debería fallar después de todos los reintentos', async () => {
      const error = new Error('Database error');
      User.deleteMany.mockRejectedValue(error);

      const result = await job.execute();

      expect(result).toBe(0);
    });
  });

  describe('start', () => {
    it('debería iniciar el trabajo programado', () => {
      jest.useFakeTimers();
      
      job.start(1000);

      expect(job.intervalId).not.toBeNull();
      
      job.stop();
      jest.useRealTimers();
    });
  });

  describe('stop', () => {
    it('debería detener el trabajo programado', () => {
      jest.useFakeTimers();
      
      job.start(1000);
      job.stop();

      expect(job.intervalId).toBeNull();
      
      jest.useRealTimers();
    });

    it('debería manejar stop cuando no está iniciado', () => {
      expect(() => job.stop()).not.toThrow();
    });
  });

  describe('delay', () => {
    it('debería esperar el tiempo especificado', async () => {
      jest.useFakeTimers();
      
      const delayPromise = job.delay(1000);
      
      jest.advanceTimersByTime(1000);
      
      await delayPromise;
      
      jest.useRealTimers();
    });
  });
});
