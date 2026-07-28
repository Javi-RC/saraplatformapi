const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * Job to clean up unverified users older than a specified threshold
 * Follows SRP - single responsibility: user cleanup
 */
class CleanupUnverifiedUsersJob {
  constructor(expiryHours = 48, maxRetries = 3) {
    this.expiryHours = expiryHours;
    this.maxRetries = maxRetries;
    this.intervalId = null;
  }

  /**
   * Execute cleanup once with retry logic
   * @returns {Promise<number>} Number of users deleted
   */
  async execute() {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
          console.warn(`MongoDB not ready (state: ${mongoose.connection.readyState}). Skipping cleanup attempt ${attempt}/${this.maxRetries}`);
          if (attempt < this.maxRetries) {
            await this.delay(2000 * attempt);
            continue;
          }
          return 0;
        }

        const expiryDate = new Date(Date.now() - this.expiryHours * 60 * 60 * 1000);
        const result = await User.deleteMany({
          isConfirmed: false,
          createdAt: { $lt: expiryDate }
        });
        
        if (result.deletedCount > 0) {
          console.log(`Cleanup successful: deleted ${result.deletedCount} unverified users`);
        }
        
        return result.deletedCount;
      } catch (error) {
        lastError = error;
        const isNetworkError = error.name === 'MongoNetworkError' || 
                               error.code === 'ECONNRESET' ||
                               error.code === 'ETIMEDOUT';
        
        if (isNetworkError && attempt < this.maxRetries) {
          console.warn('Network error in cleanup (attempt %d/%d):', attempt, this.maxRetries, error.message);
          await this.delay(2000 * attempt);
        } else {
          console.error('Error in unverified users cleanup:', error);
          break;
        }
      }
    }
    
    return 0;
  }

  /**
   * Delay helper for retry logic
   * @param {number} ms - Milliseconds to delay
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
  }

  /**
   * Stop periodic cleanup
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

module.exports = CleanupUnverifiedUsersJob;
