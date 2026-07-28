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
    return this.find({ caseId: projectId }, options);
  }

  /**
   * Find cases by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByOrganization(organizationId, options = {}) {
    return this.find({ organization: organizationId }, options);
  }

  /**
   * Find all cases for similarity matching
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findAllForMatching(options = {}) {
    return this.find({}, {
      ...options,
      select: 'caseId organization type source problem solution result metadata'
    });
  }

  /**
   * Delete cases by project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async deleteByProject(projectId, options = {}) {
    return this.deleteMany({ caseId: projectId }, options);
  }

  /**
   * Count cases by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countByOrganization(organizationId) {
    return this.count({ organization: organizationId });
  }

  /**
   * Count cases by project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>}
   */
  async countByProject(projectId) {
    return this.count({ caseId: projectId });
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

  /**
   * Get case base statistics for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>}
   */
  async getCaseBaseStats(organizationId) {
    return this.model.getCaseBaseStats(organizationId);
  }

  /**
   * Get all cases for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async getOrganizationCases(organizationId, options = {}) {
    return this.model.getOrganizationCases(organizationId, options);
  }

  /**
   * Find similar cases based on features
   * @param {Object} projectFeatures - Project features for similarity matching
   * @param {string} organizationId - Organization ID
   * @param {number} limit - Max results
   * @returns {Promise<Array>}
   */
  async findSimilar(projectFeatures, organizationId, limit = 5) {
    return this.model.findSimilar(projectFeatures, organizationId, limit);
  }
}

module.exports = new CaseBaseRepository();
