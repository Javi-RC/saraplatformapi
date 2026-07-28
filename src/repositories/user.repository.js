const BaseRepository = require('./base.repository');
const User = require('../models/user.model');

/**
 * User Repository
 * Handles all database operations for User model
 * Following SOLID principles:
 * - Single Responsibility: Only data access for users
 * - Dependency Inversion: Services depend on this abstraction
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email, options = {}) {
    return this.findOne({ email }, options);
  }

  /**
   * Find user by verification token
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>}
   */
  async findByVerificationToken(token) {
    return this.findOne({ confirmationToken: token });
  }

  /**
   * Find user by password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>}
   */
  // NOTE: findByPasswordResetToken removed — User model has no passwordResetToken/passwordResetExpires fields.

  /**
   * Find users by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByOrganization(organizationId, options = {}) {
    return this.find({ organization: organizationId }, options);
  }

  /**
   * Find verified users by organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findVerifiedByOrganization(organizationId, options = {}) {
    return this.find(
      { organization: organizationId, isConfirmed: true },
      options
    );
  }

  /**
   * Find unverified users older than specified date
   * @param {Date} date - Cutoff date
   * @returns {Promise<Array>}
   */
  async findUnverifiedOlderThan(date) {
    return this.find({
      isConfirmed: false,
      createdAt: { $lt: date }
    });
  }

  /**
   * Update user verification status
   * @param {string} userId - User ID
   * @param {boolean} isVerified - Verification status
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updateVerificationStatus(userId, isVerified, options = {}) {
    return this.updateById(
      userId,
      {
        isConfirmed: isVerified,
        confirmationToken: null
      },
      options
    );
  }

  /**
   * Update user password
   * @param {string} userId - User ID
   * @param {string} passwordHash - New password hash
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async updatePassword(userId, passwordHash, options = {}) {
    return this.updateById(
      userId,
      {
        passwordHash
      },
      options
    );
  }

  /**
   * Set password reset token
   * @param {string} userId - User ID
   * @param {string} token - Reset token
   * @param {Date} expires - Token expiration
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  // NOTE: setPasswordResetToken removed — User model has no passwordResetToken/passwordResetExpires fields.

  /**
   * Update user's last login
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async updateLastLogin(userId) {
    return this.updateById(userId, { lastLogin: new Date() });
  }

  /**
   * Increment login attempts counter
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async incrementLoginAttempts(userId) {
    return this.model.findByIdAndUpdate(
      userId,
      { $inc: { loginAttempts: 1 } },
      { new: true }
    );
  }

  /**
   * Lock user account until specified time
   * @param {string} userId - User ID
   * @param {Date} lockUntil - Lock expiration time
   * @returns {Promise<Object|null>}
   */
  async lockAccount(userId, lockUntil) {
    return this.updateById(userId, {
      lockUntil,
      loginAttempts: 0
    });
  }

  /**
   * Reset login attempts and unlock account
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>}
   */
  async resetLoginAttempts(userId) {
    return this.updateById(userId, {
      loginAttempts: 0,
      lockUntil: null
    });
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>}
   */
  async emailExists(email) {
    return this.exists({ email });
  }

  /**
   * Count users by organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<number>}
   */
  async countByOrganization(organizationId) {
    return this.count({ organization: organizationId });
  }

  /**
   * Find users by IDs with specific fields
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByIds(userIds, options = {}) {
    return this.find({ _id: { $in: userIds } }, options);
  }
}

module.exports = new UserRepository();
