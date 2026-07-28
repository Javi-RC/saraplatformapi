const InAppChannel = require('./InAppChannel');
const EmailChannel = require('./EmailChannel');
const PushChannel = require('./PushChannel');
const { NotificationChannels } = require('../../../models/notification.model');
const AppError = require('../../../utils/AppError');

/**
 * Factory for creating notification channel instances
 * Implements the Factory pattern for channel creation
 */
class NotificationChannelFactory {
  constructor() {
    this.channels = new Map();
    this.emailService = null;
  }

  /**
   * Configures the email service needed for EmailChannel
   */
  setEmailService(emailService) {
    this.emailService = emailService;
  }

  /**
   * Registers a custom channel
   * @param {string} type - Channel type
   * @param {NotificationChannel} channelInstance - Channel instance
   */
  registerChannel(type, channelInstance) {
    this.channels.set(type, channelInstance);
  }

  /**
   * Gets an instance of the requested channel
   * @param {string} channelType - Channel type (in_app, email, push)
   * @returns {NotificationChannel}
   */
  getChannel(channelType) {
    // If the channel is already registered, return it
    if (this.channels.has(channelType)) {
      return this.channels.get(channelType);
    }

    // Create and instantiate the channel based on type
    let channel;
    
    switch (channelType) {
      case NotificationChannels.IN_APP:
        channel = new InAppChannel();
        break;
      
      case NotificationChannels.EMAIL:
        if (!this.emailService) {
          throw AppError.badRequest('EMAIL_SERVICE_NOT_CONFIGURED', 'EmailService is not configured in the factory');
        }
        channel = new EmailChannel(this.emailService);
        break;
      
      case NotificationChannels.PUSH:
        channel = new PushChannel();
        break;
      
      default:
        throw AppError.badRequest('UNKNOWN_NOTIFICATION_CHANNEL', `Unknown notification channel: ${channelType}`);
    }

    // Register the channel for reuse
    this.channels.set(channelType, channel);
    
    return channel;
  }

  /**
   * Gets all available channels
   * @returns {Array<string>}
   */
  getAvailableChannels() {
    return Object.values(NotificationChannels);
  }

  /**
   * Clears the channel cache
   */
  clearCache() {
    this.channels.clear();
  }
}

// Export a singleton instance of the factory
module.exports = new NotificationChannelFactory();
