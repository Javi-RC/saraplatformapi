/**
 * Global teardown - se ejecuta después de todos los tests
 * Cierra el servidor compartido de MongoMemoryServer
 */
const mongodbHelper = require('./mongodb-helper');

module.exports = async () => {
  try {
    await mongodbHelper.closeServer();
    console.log('✓ MongoDB test server closed successfully');
  } catch (error) {
    console.error('✗ Failed to close MongoDB test server:', error);
  }
};
