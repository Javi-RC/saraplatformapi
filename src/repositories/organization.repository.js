const BaseRepository = require('./base.repository');
const Organization = require('../models/organization.model');

/**
 * Organization Repository
 * Handles all database operations for Organization model
 */
class OrganizationRepository extends BaseRepository {
  constructor() {
    super(Organization);
  }

  /**
   * Find organization by name
   * @param {string} name - Organization name
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findByName(name, options = {}) {
    return this.findOne({ name }, options);
  }

  /**
   * Find organizations where user is admin
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByAdmin(userId, options = {}) {
    return this.find({
      $or: [
        { admin: userId },
        { additionalAdmins: userId }
      ]
    }, options);
  }

  /**
   * Find organizations where user is project manager
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByProjectManager(userId, options = {}) {
    return this.find({ employees: { $elemMatch: { user: userId, isProjectManager: true } } }, options);
  }

  /**
   * Add admin to organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID to add as admin
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async addAdmin(organizationId, userId, options = {}) {
    return this.updateById(
      organizationId,
      { $addToSet: { additionalAdmins: userId } },
      options
    );
  }

  /**
   * Remove admin from organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID to remove
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async removeAdmin(organizationId, userId, options = {}) {
    return this.updateById(
      organizationId,
      { $pull: { additionalAdmins: userId } },
      options
    );
  }

  /**
   * Add project manager to organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID to add as project manager
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async addProjectManager(organizationId, userId, options = {}) {
    return this.model.findByIdAndUpdate(
      organizationId,
      { $set: { 'employees.$[elem].isProjectManager': true } },
      { arrayFilters: [{ 'elem.user': userId }], new: true, ...options }
    );
  }

  /**
   * Remove project manager from organization
   * @param {string} organizationId - Organization ID
   * @param {string} userId - User ID to remove
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async removeProjectManager(organizationId, userId, options = {}) {
    return this.model.findByIdAndUpdate(
      organizationId,
      { $set: { 'employees.$[elem].isProjectManager': false } },
      { arrayFilters: [{ 'elem.user': userId }], new: true, ...options }
    );
  }

  /**
   * Check if organization name exists
   * @param {string} name - Organization name
   * @returns {Promise<boolean>}
   */
  async nameExists(name) {
    return this.exists({ name });
  }

  /**
   * Find organizations with populated admins
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findWithAdmins(criteria = {}, options = {}) {
    return this.find(criteria, {
      ...options,
      populate: { path: 'admin', select: 'name email' }
    });
  }
}

module.exports = new OrganizationRepository();
