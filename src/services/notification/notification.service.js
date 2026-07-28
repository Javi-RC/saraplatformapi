const { 
  Notification, 
  NotificationTypes, 
  NotificationPriority, 
  NotificationStatus,
  NotificationChannels 
} = require('../../models/notification.model');
const NotificationChannelFactory = require('./channels/NotificationChannelFactory');
const emailService = require('../auth/email.service');
const AppError = require('../../utils/AppError');

// Import repositories instead of direct model access for queries
const { notificationRepository, userRepository } = require('../../repositories');

/**
 * Notification Service
 * Manages the creation, sending, and querying of notifications
 * Follows the Single Responsibility Principle (SRP)
 */
class NotificationService {
  constructor() {
    // Configure the factory with the necessary dependencies
    NotificationChannelFactory.setEmailService(emailService);
  }

  /**
   * Creates and sends a notification to a user
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.recipientId - ID of the recipient user
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Array<string>} notificationData.channels - Sending channels
   * @param {Object} [notificationData.metadata] - Additional data
   * @param {string} [notificationData.priority] - Priority
   * @param {string} [notificationData.actionUrl] - Action URL
   * @param {string} [notificationData.actionText] - Button text
   * @param {Date} [notificationData.expiresAt] - Expiration date
   * @param {string} [notificationData.senderId] - ID of the sender
   * @returns {Promise<Object>} Created notification
   */
  async create(notificationData) {
    const {
      recipientId,
      type,
      title,
      message,
      channels = [NotificationChannels.IN_APP],
      metadata = {},
      priority = NotificationPriority.MEDIUM,
      actionUrl,
      actionText,
      expiresAt,
      senderId
    } = notificationData;

    // Validate that the recipient exists
    const recipient = await userRepository.findById(recipientId);
    if (!recipient) {
      throw AppError.notFound('USER_NOT_FOUND', 'Notification recipient not found');
    }

    // Create the notification in the database
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      channels,
      metadata,
      priority,
      actionUrl,
      actionText,
      expiresAt,
      sender: senderId,
      status: NotificationStatus.PENDING
    });

    await notification.save();

    // Send through the specified channels
    await this.sendThroughChannels(notification, recipient, channels);

    return notification;
  }

  /**
   * Sends an existing notification through the specified channels
   * @private
   */
  async sendThroughChannels(notification, recipient, channels) {
    const sendPromises = channels.map(async (channelType) => {
      try {
        const channel = NotificationChannelFactory.getChannel(channelType);
        
        // Check if the channel can send the notification
        const canSend = await channel.canSend(notification, recipient);
        if (!canSend) {
          await notification.updateDeliveryStatus(
            channelType, 
            NotificationStatus.FAILED, 
            'Channel not available for this user'
          );
          return;
        }

        // Send through the channel
        const result = await channel.send(notification, recipient);
        
        // Update delivery status
        await notification.updateDeliveryStatus(
          channelType,
          result.status,
          result.error
        );
      } catch (error) {
        console.error('Error sending through channel %s:', channelType, error);
        await notification.updateDeliveryStatus(
          channelType,
          NotificationStatus.FAILED,
          error.message
        );
      }
    });

    await Promise.all(sendPromises);
  }

  /**
   * Gets a user's notifications with pagination
   * @param {string} userId - ID of the user
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Current page
   * @param {number} [options.limit=20] - Items per page
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.type] - Filter by type
   * @param {boolean} [options.unreadOnly=false] - Unread only
   * @param {boolean} [options.includeArchived=false] - Include archived
   * @returns {Promise<Object>} Object with notifications and pagination metadata
   */
  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      unreadOnly = false,
      includeArchived = false
    } = options;

    const query = {
      recipient: userId
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (unreadOnly) {
      query.readAt = null;
    }

    if (!includeArchived) {
      query.isArchived = false;
    }

    // Validate that it is not expired
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      notificationRepository.find(query, {
        sort: { createdAt: -1 },
        skip,
        limit,
        populate: { path: 'sender', select: 'name email avatar' }
      }),
      notificationRepository.count(query)
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Marks a notification as read
   * @param {string} notificationId - ID of the notification
   * @param {string} userId - ID of the user (for permission validation)
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId, userId) {
    const notification = await notificationRepository.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw AppError.notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
    }

    return await notification.markAsRead();
  }

  /**
   * Marks multiple notifications as read
   * @param {Array<string>} notificationIds - IDs of the notifications
   * @param {string} userId - ID of the user
   * @returns {Promise<number>} Number of updated notifications
   */
  async markMultipleAsRead(notificationIds, userId) {
    const result = await notificationRepository.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId,
        readAt: null
      },
      {
        readAt: new Date(),
        status: NotificationStatus.READ
      }
    );

    return result.modifiedCount;
  }

  /**
   * Marks all notifications of a user as read
   * @param {string} userId - ID of the user
   * @returns {Promise<number>} Number of updated notifications
   */
  async markAllAsRead(userId) {
    const result = await notificationRepository.updateMany(
      {
        recipient: userId,
        readAt: null,
        isArchived: false
      },
      {
        readAt: new Date(),
        status: NotificationStatus.READ
      }
    );

    return result.modifiedCount;
  }

  /**
   * Archives a notification
   * @param {string} notificationId - ID of the notification
   * @param {string} userId - ID of the user
   * @returns {Promise<Object>}
   */
  async archive(notificationId, userId) {
    const notification = await notificationRepository.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw AppError.notFound('NOTIFICATION_NOT_FOUND', 'Notification not found');
    }

    return await notification.archive();
  }

  /**
   * Deletes a notification
   * @param {string} notificationId - ID of the notification
   * @param {string} userId - ID of the user
   * @returns {Promise<boolean>}
   */
  async delete(notificationId, userId) {
    const result = await notificationRepository.deleteOne({
      _id: notificationId,
      recipient: userId
    });

    return result.deletedCount > 0;
  }

  /**
   * Gets the unread notification count
   * @param {string} userId - ID of the user
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    return await notificationRepository.count({
      recipient: userId,
      readAt: null,
      isArchived: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
  }

  /**
   * Gets notification statistics for a user
   * @param {string} userId - ID of the user
   * @returns {Promise<Object>}
   */
  async getUserStats(userId) {
    return await Notification.getUserStats(userId);
  }

  /**
   * Cleans up old archived notifications
   * @param {number} daysOld - Age in days
   * @returns {Promise<number>} Number of deleted notifications
   */
  async cleanupOldNotifications(daysOld = 90) {
    const result = await Notification.cleanupOldNotifications(daysOld);
    return result.deletedCount;
  }

  /**
   * Sends bulk notifications to multiple users
   * @param {Array<string>} recipientIds - IDs of the recipient users
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  async sendBulkNotifications(recipientIds, notificationData) {
    const notifications = await Promise.all(
      recipientIds.map(recipientId =>
        this.create({
          ...notificationData,
          recipientId
        })
      )
    );

    return notifications;
  }

  /**
   * Sends notifications to users with a specific role
   * @param {string} role - Role of the users (employee, org_admin)
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  async sendToRole(role, notificationData) {
    const users = await userRepository.find(
      { role, isConfirmed: true },
      { select: '_id', lean: true }
    );
    const recipientIds = users.map(user => user._id.toString());
    
    return await this.sendBulkNotifications(recipientIds, notificationData);
  }

  /**
   * Sends notifications to all confirmed users
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Array>} Array of created notifications
   */
  async sendToAll(notificationData) {
    const users = await userRepository.find(
      { isConfirmed: true },
      { select: '_id', lean: true }
    );
    const recipientIds = users.map(user => user._id.toString());
    
    return await this.sendBulkNotifications(recipientIds, notificationData);
  }
}

module.exports = new NotificationService();
