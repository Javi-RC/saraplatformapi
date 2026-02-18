const BaseRepository = require('./base.repository');
const CV = require('../models/cv.model');

/**
 * Curriculum Repository
 * Handles all database operations for Curriculum model
 */
class CVRepository extends BaseRepository {
  constructor() {
    super(CV);
  }

  /**
   * Find curriculum by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findByUser(userId, options = {}) {
    return this.findOne({ userId }, options);
  }

  /**
   * Find curricula by user IDs
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUsers(userIds, options = {}) {
    return this.find({ userId: { $in: userIds } }, options);
  }

  /**
   * Find curricula by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByOrganization(organizationId, options = {}) {
    return this.find({ organization: organizationId }, options);
  }

  /**
   * Update curriculum completeness status
   * @param {string} cvId - Curriculum ID
   * @param {boolean} isComplete - Completeness status
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateCompletenessStatus(cvId, isComplete, options = {}) {
    return this.updateById(cvId, { isComplete }, options);
  }

  /**
   * Check if user has curriculum
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async userHasCV(userId) {
    return this.exists({ userId });
  }

  /**
   * Count curricula by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countByOrganization(organizationId) {
    return this.count({ organization: organizationId });
  }

  /**
   * Find complete curricula by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findCompleteByOrganization(organizationId, options = {}) {
    return this.find(
      { organization: organizationId, isComplete: true },
      options
    );
  }
}

module.exports = new CVRepository();
