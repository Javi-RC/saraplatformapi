const { NotificationChannels, NotificationStatus } = require('../../../models/notification.model');
const AppError = require('../../../utils/AppError');

/**
 * Base interface for notification channels (Strategy Pattern)
 * All channels must implement the send method
 */
class NotificationChannel {
  /**
   * Sends a notification through the specific channel
   * @param {Object} notification - The notification to send
   * @param {Object} recipient - The recipient user
   * @returns {Promise<Object>} Send result with status and details
   */
  async send(notification, recipient) {
    throw new AppError('SEND_NOT_IMPLEMENTED', 500, 'The send method must be implemented by the child class');
  }

  /**
   * Validates that the channel can send the notification
   * @param {Object} notification - The notification to validate
   * @param {Object} recipient - The recipient user
   * @returns {Promise<boolean>}
   */
  async canSend(notification, recipient) {
    return true;
  }

  /**
   * Gets the channel type
   * @returns {string}
   */
  getChannelType() {
    throw new AppError('GET_CHANNEL_TYPE_NOT_IMPLEMENTED', 500, 'The getChannelType method must be implemented by the child class');
  }
}

module.exports = NotificationChannel;
