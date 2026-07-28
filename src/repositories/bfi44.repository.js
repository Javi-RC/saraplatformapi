const BaseRepository = require('./base.repository');
const BFI44Response = require('../models/bfi44.model');

/**
 * BFI44 Repository
 * Handles all database operations for BFI44Response model
 */
class BFI44Repository extends BaseRepository {
  constructor() {
    super(BFI44Response);
  }

  /**
   * Find BFI44 response by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findByUser(userId, options = {}) {
    return this.findOne({ userId }, options);
  }

  /**
   * Find BFI44 responses by user IDs
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUsers(userIds, options = {}) {
    return this.find({ userId: { $in: userIds } }, options);
  }

  /**
   * Check if user has completed BFI44
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async userHasCompleted(userId) {
    return this.exists({ userId });
  }

  /**
   * Count responses by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  // NOTE: countByOrganization removed — BFI44Response model has no organization field; requires a populate/join approach via user.

  /**
   * Find responses by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  // NOTE: findByOrganization removed — BFI44Response model has no organization field; requires a populate/join approach via user.
}

module.exports = new BFI44Repository();
