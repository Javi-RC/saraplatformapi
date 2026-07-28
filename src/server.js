const app = require('./app');
const connectDB = require('./config/db');
const CleanupUnverifiedUsersJob = require('./jobs/cleanupUnverifiedUsers');
const emailQueueService = require('./services/auth/emailQueue.service');

const PORT = process.env.PORT || 3000;
const UNVERIFIED_USERS_EXPIRY_HOURS = 48;
const UNVERIFIED_USERS_CLEANUP_INTERVAL_HOURS = 6;

function setupGracefulShutdown(cleanupJob) {
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    emailQueueService.stop();
    cleanupJob.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
      const cleanupJob = new CleanupUnverifiedUsersJob(UNVERIFIED_USERS_EXPIRY_HOURS);
      cleanupJob.start(UNVERIFIED_USERS_CLEANUP_INTERVAL_HOURS);

      emailQueueService.start();

      setupGracefulShutdown(cleanupJob);
    });
  })
  .catch((err) => {
    console.error('Could not start server:', err);
    process.exit(1);
  });
