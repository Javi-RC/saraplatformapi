/**
 * Helper para gestionar conexión a MongoDB para tests
 * Usa base de datos real en lugar de MongoMemoryServer para mayor estabilidad
 */
const mongoose = require('mongoose');

let isConnected = false;

// URI base de base de datos de test desde variables de entorno o por defecto
const MONGODB_TEST_URI = process.env.MONGODB_URI || 'mongodb+srv://javirodriguezcastellano_db_user:a896zX5g26clumAh@cluster0.pv5oin6.mongodb.net/test?appName=Cluster0';

function getWorkerScopedMongoUri() {
  const dbOverride = process.env.MONGODB_TEST_DB;
  const workerId = process.env.JEST_WORKER_ID;
  const processScope = workerId && workerId.trim() !== '' ? workerId : String(process.pid);
  const databaseName = dbOverride || `jest_test_${processScope}`;

  try {
    const url = new URL(MONGODB_TEST_URI);
    url.pathname = `/${databaseName}`;
    return url.toString();
  } catch {
    // Fallback conservador si el parseo falla
    return MONGODB_TEST_URI;
  }
}

/**
 * Conecta a la base de datos de test
 */
async function connect() {
  try {
    // Si ya hay conexión activa, no hacer nada
    if (isConnected && mongoose.connection.readyState === 1) {
      return;
    }

    // Si mongoose ya está conectado a otra DB, desconectar primero
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    const uri = getWorkerScopedMongoUri();
    await mongoose.connect(uri);
    isConnected = true;

    // Evita interferencias entre suites y problemas de índices obsoletos.
    // Cada worker usa su propia DB, y la limpiamos al conectar.
    if (process.env.NODE_ENV === 'test') {
      await mongoose.connection.db.dropDatabase();
    }
  } catch (error) {
    console.error('MongoDB Helper - Failed to connect:', error.message);
    throw error;
  }
}

/**
 * Desconecta de MongoDB
 */
async function disconnect() {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
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
