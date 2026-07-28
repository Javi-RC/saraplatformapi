/**
 * Helper para gestionar conexión a MongoDB para tests usando MongoMemoryServer
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let isConnected = false;

/**
 * Conecta a una base de datos in-memory
 */
async function connect() {
  try {
    if (isConnected && mongoose.connection.readyState === 1) {
      return;
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB Helper - Failed to connect:', error.message);
    throw error;
  }
}

/**
 * Desconecta de MongoDB y detiene el servidor in-memory
 */
async function disconnect() {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
    }
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
  } catch (error) {
    console.error('MongoDB Helper - Failed to disconnect:', error.message);
  }
}

/**
 * Cierra la conexión (alias de disconnect para compatibilidad)
 */
async function closeServer() {
  await disconnect();
}

/**
 * Limpia todas las colecciones de la base de datos
 * Útil para beforeEach en tests
 */
async function clearDatabase() {
  try {
    if (!isConnected) {
      return;
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('MongoDB Helper - Failed to clear database:', error.message);
  }
}

module.exports = {
  connect,
  disconnect,
  closeServer,
  clearDatabase
};
