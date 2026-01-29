const BaseRepository = require('./base.repository');
const Risk = require('../models/risk.model');

/**
 * Risk Repository
 * Handles all database operations for Risk model
 */
class RiskRepository extends BaseRepository {
  constructor() {
    super(Risk);
  }

  /**
   * Find risks by project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByProject(projectId, options = {}) {
    return this.find({ project: projectId }, options);
  }

  /**
   * Find risks by project and source
   * @param {string} projectId - Project ID
   * @param {string} source - Risk source (prediction, manual)
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByProjectAndSource(projectId, source, options = {}) {
    return this.find({ project: projectId, source }, options);
  }

  /**
   * Find active risks by project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findActiveByProject(projectId, options = {}) {
    return this.find(
      { project: projectId, status: { $ne: 'resolved' } },
      options
    );
  }

  /**
   * Delete risks by project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async deleteByProject(projectId, options = {}) {
    return this.deleteMany({ project: projectId }, options);
  }

  /**
   * Delete risks by project and source
   * @param {string} projectId - Project ID
   * @param {string} source - Risk source
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async deleteByProjectAndSource(projectId, source, options = {}) {
    return this.deleteMany({ project: projectId, source }, options);
  }

  /**
   * Count risks by project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>}
   */
  async countByProject(projectId) {
    return this.count({ project: projectId });
  }

  /**
   * Count active risks by project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>}
   */
  async countActiveByProject(projectId) {
    return this.count({ project: projectId, status: { $ne: 'resolved' } });
  }

  /**
   * Update risk status
   * @param {string} riskId - Risk ID
   * @param {string} status - New status
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateStatus(riskId, status, options = {}) {
    return this.updateById(riskId, { status }, options);
  }
}

module.exports = new RiskRepository();
