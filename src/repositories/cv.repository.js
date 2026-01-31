const BaseRepository = require('./base.repository');
const CV = require('../models/cv.model');

/**
 * CV Repository
 * Handles all database operations for CV model
 */
class CVRepository extends BaseRepository {
  constructor() {
    super(CV);
  }

  /**
   * Find CV by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findByUser(userId, options = {}) {
    return this.findOne({ userId }, options);
  }

  /**
   * Find CVs by user IDs
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUsers(userIds, options = {}) {
    return this.find({ userId: { $in: userIds } }, options);
  }

  /**
   * Find CVs by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByOrganization(organizationId, options = {}) {
    return this.find({ organization: organizationId }, options);
  }

  /**
   * Update CV completeness status
   * @param {string} cvId - CV ID
   * @param {boolean} isComplete - Completeness status
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateCompletenessStatus(cvId, isComplete, options = {}) {
    return this.updateById(cvId, { isComplete }, options);
  }

  /**
   * Check if user has CV
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async userHasCV(userId) {
    return this.exists({ userId });
  }

  /**
   * Count CVs by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countByOrganization(organizationId) {
    return this.count({ organization: organizationId });
  }

  /**
   * Find complete CVs by organization
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
