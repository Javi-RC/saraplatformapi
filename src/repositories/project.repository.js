const BaseRepository = require('./base.repository');
const Project = require('../models/project.model');

/**
 * Project Repository
 * Handles all database operations for Project model
 */
class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  /**
   * Find projects by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByOrganization(organizationId, options = {}) {
    return this.find({ organization: organizationId }, options);
  }

  /**
   * Find projects by project manager
   * @param {string} projectManagerId - Project manager ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByProjectManager(projectManagerId, options = {}) {
    return this.find({ projectManager: projectManagerId }, options);
  }

  /**
   * Find projects where user is assigned
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByAssignedUser(userId, options = {}) {
    return this.find(
      { 'team.assignedEmployees': userId },
      options
    );
  }

  /**
   * Find projects by status
   * @param {string} status - Project status
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByStatus(status, options = {}) {
    return this.find({ status }, options);
  }

  /**
   * Find projects by status and organization
   * @param {string} status - Project status
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByStatusAndOrganization(status, organizationId, options = {}) {
    return this.find(
      { status, organization: organizationId },
      options
    );
  }

  /**
   * Update project status
   * @param {string} projectId - Project ID
   * @param {string} status - New status
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateStatus(projectId, status, options = {}) {
    return this.updateById(
      projectId,
      { status, lastActivityAt: new Date() },
      options
    );
  }

  /**
   * Update project team
   * @param {string} projectId - Project ID
   * @param {Object} teamData - Team data
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateTeam(projectId, teamData, options = {}) {
    return this.updateById(
      projectId,
      { team: teamData, lastActivityAt: new Date() },
      options
    );
  }

  /**
   * Update last activity timestamp
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateLastActivity(projectId, options = {}) {
    return this.updateById(
      projectId,
      { lastActivityAt: new Date() },
      options
    );
  }

  /**
   * Count projects by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countByOrganization(organizationId) {
    return this.count({ organization: organizationId });
  }

  /**
   * Count active projects by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countActiveByOrganization(organizationId) {
    return this.count({
      organization: organizationId,
      status: { $in: ['in_progress', 'planning'] }
    });
  }

  /**
   * Find projects with populated fields
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findWithPopulate(criteria = {}, options = {}) {
    const defaultPopulate = [
      { path: 'projectManager', select: 'firstName lastName email' },
      { path: 'team.assignedEmployees', select: 'firstName lastName email' }
    ];
    
    return this.find(criteria, {
      ...options,
      populate: options.populate || defaultPopulate
    });
  }
}

module.exports = new ProjectRepository();
