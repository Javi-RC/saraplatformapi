const User = require('../models/user.model');

/**
 * Job to clean up unverified users older than a specified threshold
 * Follows SRP - single responsibility: user cleanup
 */
class CleanupUnverifiedUsersJob {
  constructor(expiryHours = 48) {
    this.expiryHours = expiryHours;
    this.intervalId = null;
  }

  /**
   * Execute cleanup once
   * @returns {Promise<number>} Number of users deleted
   */
  async execute() {
    try {
      const expiryDate = new Date(Date.now() - this.expiryHours * 60 * 60 * 1000);
      const result = await User.deleteMany({
        isConfirmed: false,
        createdAt: { $lt: expiryDate }
      });
      
      if (result.deletedCount > 0) {
        console.log(`Cleanup: ${result.deletedCount} unverified user(s) deleted`);
      }
      
      return result.deletedCount;
    } catch (error) {
      console.error('Error in unverified users cleanup:', error);
      return 0;
    }
  }

  /**
   * Start periodic cleanup
   * @param {number} intervalHours - Hours between executions
   */
  start(intervalHours = 6) {
    // Run immediately on start
    this.execute();

    // Schedule periodic execution
    this.intervalId = setInterval(
      () => this.execute(), 
      intervalHours * 60 * 60 * 1000
    );

    console.log(`Unverified users cleanup job started (every ${intervalHours} hours)`);
  }

  /**
   * Stop periodic cleanup
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Unverified users cleanup job stopped');
    }
  }
}

module.exports = CleanupUnverifiedUsersJob;
