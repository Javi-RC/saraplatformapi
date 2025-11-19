const express = require('express');
const app = express();

// Middlewares
app.use(express.json());

// Rutas
const indexRoutes = require('./routes/index.routes');
app.use('/', indexRoutes);

module.exports = app;
