// Load environment-specific configuration
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

require('dotenv').config({
  path: path.resolve(process.cwd(), envFile)
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss');
const app = express();
const passport = require('passport');
require('./config/passport');
// Inicializar passport (necesario para que passport.authenticate funcione)
app.use(passport.initialize());
// Middlewares

app.disable('x-powered-by');

app.use(helmet());

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!isProduction) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: origin not allowed'));
    }
  })
);

app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    limit: Number(process.env.RATE_LIMIT_MAX || 300),
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(
  '/auth',
  rateLimit({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 50),
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use(mongoSanitize());
app.use(hpp());

const sanitizeXss = (value) => {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(sanitizeXss);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = sanitizeXss(value[key]);
    }
  }
  return value;
};

app.use((req, res, next) => {
  req.body = sanitizeXss(req.body);
  req.query = sanitizeXss(req.query);
  req.params = sanitizeXss(req.params);
  next();
});

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '1mb' }));

// Rutas
const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');
const cvRoutes = require('./routes/cv.routes');
const notificationRoutes = require('./routes/notification.routes');
const organizationRoutes = require('./routes/organization.routes');
const bfi44Routes = require('./routes/bfi44.routes');
const projectRoutes = require('./routes/project.routes');
const riskRoutes = require('./routes/risk.routes');
const legalRoutes = require('./routes/legal.routes');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/api', protectedRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/bfi-44', bfi44Routes);
app.use('/api/projects', projectRoutes);
app.use('/api', riskRoutes);
app.use('/api/legal', legalRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  const responseHandler = require('./utils/responseHandler');
  return responseHandler.handleError(error, res);
});

module.exports = app;