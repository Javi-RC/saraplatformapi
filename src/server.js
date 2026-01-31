const app = require('./app');
const connectDB = require('./config/db');
const CleanupUnverifiedUsersJob = require('./jobs/cleanupUnverifiedUsers');

const PORT = process.env.PORT || 3000;
const UNVERIFIED_USERS_EXPIRY_HOURS = 48;
const UNVERIFIED_USERS_CLEANUP_INTERVAL_HOURS = 6;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      const cleanupJob = new CleanupUnverifiedUsersJob(UNVERIFIED_USERS_EXPIRY_HOURS);
      cleanupJob.start(UNVERIFIED_USERS_CLEANUP_INTERVAL_HOURS);
    });
  })
  .catch((err) => {
    console.error('Could not start server:', err);
    process.exit(1);
  });