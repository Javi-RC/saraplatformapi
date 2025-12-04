// Configuración global para tests
process.env.NODE_ENV = 'test';

// Variables de entorno para testing
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32-chars';
process.env.JWT_EXPIRES_IN = '7d'; //
process.env.BACKEND_URL = 'http://localhost:3000';
process.env.FRONTEND_URL = 'http://localhost:3001';
process.env.EMAIL_SENDER_NAME = 'Test App';
process.env.EMAIL_SENDER_EMAIL = 'test@example.com';
process.env.BREVO_API_KEY = 'test-brevo-api-key';
process.env.MONGODB_URI = 'mongodb+srv://javirodriguezcastellano_db_user:a896zX5g26clumAh@cluster0.pv5oin6.mongodb.net/test?appName=Cluster0';

// Mock global de fetch para evitar llamadas reales a Brevo
global.fetch = jest.fn();

// Silenciar logs de MongoDB y otros en tests
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('MongoDB')) {
    return;
  }
  originalConsole.log(...args);
};

console.error = (...args) => {
  if (typeof args[0] === 'string' && 
      (args[0].includes('MongoDB') || 
       args[0].includes('Warning') ||
       args[0].includes('Brevo API error'))) {
    return;
  }
  originalConsole.error(...args);
};

// Timeout global para tests
jest.setTimeout(30000);