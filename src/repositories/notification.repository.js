const BaseRepository = require('./base.repository');
const { Notification } = require('../models/notification.model');

/**
 * Notification Repository
 * Handles all database operations for Notification model
 */
class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  /**
   * Find notifications by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUser(userId, options = {}) {
    return this.find({ recipient: userId }, options);
  }

  /**
   * Find unread notifications by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findUnreadByUser(userId, options = {}) {
    return this.find({ recipient: userId, status: { $ne: 'read' } }, options);
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async markAsRead(notificationId, options = {}) {
    return this.updateById(
      notificationId,
      { status: 'read', readAt: new Date() },
      options
    );
  }

  /**
   * Mark all notifications as read for user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async markAllAsReadForUser(userId, options = {}) {
    return this.updateMany(
      { recipient: userId, status: { $ne: 'read' } },
      { status: 'read', readAt: new Date() },
      options
    );
  }

  /**
   * Count unread notifications for user
   * @param {string} userId - User ID
   * @returns {Promise<number>}
   */
  async countUnreadByUser(userId) {
    return this.count({ recipient: userId, status: { $ne: 'read' } });
  }

  /**
   * Delete old notifications
   * @param {Date} olderThan - Delete notifications older than this date
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  async deleteOlderThan(olderThan, options = {}) {
    return this.deleteMany({ createdAt: { $lt: olderThan } }, options);
  }

  /**
   * Find notifications by type for user
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} options - Query options
   * @returns {Promise<Array>}
   */
  async findByUserAndType(userId, type, options = {}) {
    return this.find({ recipient: userId, type }, options);
  }
}

module.exports = new NotificationRepository();
