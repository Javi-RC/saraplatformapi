const BaseRepository = require('./base.repository');
const CaseBase = require('../models/caseBase.model');

/**
 * CaseBase Repository
 * Handles all database operations for CaseBase model
 */
class CaseBaseRepository extends BaseRepository {
  constructor() {
    super(CaseBase);
  }

  /**
   * Find cases by project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByProject(projectId, options = {}) {
    return this.find({ projectId }, options);
  }

  /**
   * Find cases by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByOrganization(organizationId, options = {}) {
    return this.find({ organizationId }, options);
  }

  /**
   * Find all cases for similarity matching
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAllForMatching(options = {}) {
    return this.find({}, {
      ...options,
      select: 'teamProfile risks outcome organizationId projectId'
    });
  }

  /**
   * Delete cases by project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async deleteByProject(projectId, options = {}) {
    return this.deleteMany({ projectId }, options);
  }

  /**
   * Count cases by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countByOrganization(organizationId) {
    return this.count({ organizationId });
  }

  /**
   * Count cases by project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>}
   */
  async countByProject(projectId) {
    return this.count({ projectId });
  }

  /**
   * Find cases by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByDateRange(startDate, endDate, options = {}) {
    return this.find(
      {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      },
      options
    );
  }
}

module.exports = new CaseBaseRepository();
