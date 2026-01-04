require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const passport = require('passport');
require('./config/passport');
// Inicializar passport (necesario para que passport.authenticate funcione)
app.use(passport.initialize());
// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    timestamp: new Date().toISOString(), 
    environment: process.env.NODE_ENV || 'development' 
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
  console.error('Error global:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

module.exports = app;