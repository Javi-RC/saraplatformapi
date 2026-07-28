const NotificationChannel = require('./NotificationChannel');
const { NotificationChannels, NotificationStatus } = require('../../../models/notification.model');

/**
 * In-App notification channel
 * In-app notifications are stored in the database and queried through the API
 * This channel always succeeds since the notification is already created in the DB
 */
class InAppChannel extends NotificationChannel {
  /**
   * For in-app notifications, we simply confirm that it is stored
   * @param {Object} notification - The notification (Mongoose document)
   * @param {Object} recipient - The recipient user
   * @returns {Promise<Object>}
   */
  async send(notification, recipient) {
    try {
      // In-app notifications are considered "sent" automatically
      // since they are stored in the database
      return {
        success: true,
        status: NotificationStatus.DELIVERED,
        channel: this.getChannelType(),
        deliveredAt: new Date()
      };
    } catch (error) {
      console.error('Error in InAppChannel:', error);
      return {
        success: false,
        status: NotificationStatus.FAILED,
        channel: this.getChannelType(),
        error: error.message
      };
    }
  }

  /**
   * Validates that the user is active, confirmed, and has in-app notifications enabled
   */
  async canSend(notification, recipient) {
    if (!recipient || !recipient.isConfirmed) {
      return false;
    }

    // Check user notification preferences
    if (recipient.notificationPreferences) {
      return recipient.notificationPreferences.inApp !== false;
    }

    // By default, allow in-app notifications if no preferences are configured
    return true;
  }

  getChannelType() {
    return NotificationChannels.IN_APP;
  }
}

module.exports = InAppChannel;
