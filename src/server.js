const app = require('./app');
const connectDB = require('./config/db');
const CleanupUnverifiedUsersJob = require('./jobs/cleanupUnverifiedUsers');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Start cleanup job for unverified users
      const cleanupJob = new CleanupUnverifiedUsersJob(48); // 48 hours expiry
      cleanupJob.start(6); // Run every 6 hours
    });
  })
  .catch((err) => {
    console.error('No se pudo iniciar el servidor:', err);
    process.exit(1);
  });