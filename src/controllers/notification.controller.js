const notificationService = require('../services/notification/notification.service');
const { NotificationTypes, NotificationChannels } = require('../models/notification.model');
const i18nService = require('../i18n/i18n.service');
const { ROLES } = require('../config/roles');
const { handleErrorCatch } = require('../utils/errorHelper');

/**
 * Notification Controller
 * Handles HTTP requests related to notifications
 */
class NotificationController {
  /**
   * Gets the authenticated user's notifications
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        status,
        type,
        unreadOnly,
        includeArchived
      } = req.query;

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status,
        type,
        unreadOnly: unreadOnly === 'true',
        includeArchived: includeArchived === 'true'
      };

      const result = await notificationService.getUserNotifications(userId, options);
      
      // Translate notifications according to language
      const translatedNotifications = i18nService.translateNotifications(result.notifications, lang);
      
      return res.status(200).json({
        success: true,
        data: {
          ...result,
          notifications: translatedNotifications
        },
        message: i18nService.translate(lang, 'notifications.messages.obtained_successfully')
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets the unread notification count
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const userId = req.user.id;
      const count = await notificationService.getUnreadCount(userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: i18nService.translate(lang, 'notifications.messages.count_obtained_successfully')
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets user notification statistics
   * GET /api/notifications/stats
   */
  async getStats(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const userId = req.user.id;
      const stats = await notificationService.getUserStats(userId);
      
      return res.status(200).json({
        success: true,
        data: stats,
        message: i18nService.translate(lang, 'notifications.messages.statistics_obtained_successfully')
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Marks a notification as read
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.markAsRead(id, userId);
      const translatedNotification = i18nService.translateNotification(notification, lang);
      
      return res.status(200).json({
        success: true,
        data: translatedNotification,
        message: i18nService.translate(lang, 'notifications.messages.marked_as_read')
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Marks multiple notifications as read
   * PATCH /api/notifications/read-multiple
   */
  async markMultipleAsRead(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { notificationIds } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.array_required')
        });
      }

      const count = await notificationService.markMultipleAsRead(notificationIds, userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: i18nService.translate(lang, 'notifications.messages.marked_as_read_multiple', { count })
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Marks all notifications as read
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const userId = req.user.id;
      const count = await notificationService.markAllAsRead(userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: i18nService.translate(lang, 'notifications.messages.marked_as_read_all', { count })
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Archives a notification
   * PATCH /api/notifications/:id/archive
   */
  async archive(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const notification = await notificationService.archive(id, userId);
      const translatedNotification = i18nService.translateNotification(notification, lang);
      
      return res.status(200).json({
        success: true,
        data: translatedNotification,
        message: i18nService.translate(lang, 'notifications.messages.archived')
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Deletes a notification
   * DELETE /api/notifications/:id
   */
  async delete(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const deleted = await notificationService.delete(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.not_found')
        });
      }
      
      return res.status(200).json({
        success: true,
        data: null,
        message: i18nService.translate(lang, 'notifications.messages.deleted_successfully')
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Creates a notification (admin only)
   * POST /api/notifications
   */
  async create(req, res) {
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.ORG_ADMIN) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const {
        recipientId,
        type,
        title,
        message,
        channels,
        metadata,
        priority,
        actionUrl,
        actionText,
        expiresAt
      } = req.body;

      // Basic validations
      if (!recipientId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.required_fields')
        });
      }

      // Validate that the type is valid
      if (!Object.values(NotificationTypes).includes(type)) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.invalid_type')
        });
      }

      const notification = await notificationService.create({
        recipientId,
        type,
        title,
        message,
        channels: channels || [NotificationChannels.IN_APP],
        metadata,
        priority,
        actionUrl,
        actionText,
        expiresAt,
        senderId: req.user.id
      });

      const translatedNotification = i18nService.translateNotification(notification, lang);

      return res.status(201).json({
        success: true,
        data: translatedNotification,
        message: i18nService.translate(lang, 'notifications.messages.created_successfully')
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Sends bulk notifications (admin only)
   * POST /api/notifications/bulk
   */
  async sendBulk(req, res) {
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.ORG_ADMIN) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const {
        recipientIds,
        type,
        title,
        message,
        channels,
        metadata,
        priority,
        actionUrl,
        actionText
      } = req.body;

      // Validations
      if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.required_array_recipients')
        });
      }

      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.required_fields_bulk')
        });
      }

      const notifications = await notificationService.sendBulkNotifications(
        recipientIds,
        {
          type,
          title,
          message,
          channels: channels || [NotificationChannels.IN_APP],
          metadata,
          priority,
          actionUrl,
          actionText,
          senderId: req.user.id
        }
      );

      const translatedNotifications = i18nService.translateNotifications(notifications, lang);

      return res.status(201).json({
        success: true,
        data: { count: translatedNotifications.length, notifications: translatedNotifications },
        message: i18nService.translate(lang, 'notifications.messages.bulk_sent_successfully', { count: notifications.length })
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Sends notification to a specific role (admin only)
   * POST /api/notifications/send-to-role
   */
  async sendToRole(req, res) {
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.ORG_ADMIN) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const {
        role,
        type,
        title,
        message,
        channels,
        metadata,
        priority,
        actionUrl,
        actionText
      } = req.body;

      // Validations
      if (!role || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.required_fields_role')
        });
      }

      const notifications = await notificationService.sendToRole(role, {
        type,
        title,
        message,
        channels: channels || [NotificationChannels.IN_APP],
        metadata,
        priority,
        actionUrl,
        actionText,
        senderId: req.user.id
      });

      return res.status(201).json({
        success: true,
        data: { count: notifications.length },
        message: i18nService.translate(lang, 'notifications.messages.sent_to_role', { count: notifications.length, role })
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Sends notification to all users (admin only)
   * POST /api/notifications/send-to-all
   */
  async sendToAll(req, res) {
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.ORG_ADMIN) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const {
        type,
        title,
        message,
        channels,
        metadata,
        priority,
        actionUrl,
        actionText
      } = req.body;

      // Validations
      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.required_fields_bulk')
        });
      }

      const notifications = await notificationService.sendToAll({
        type,
        title,
        message,
        channels: channels || [NotificationChannels.IN_APP],
        metadata,
        priority,
        actionUrl,
        actionText,
        senderId: req.user.id
      });

      return res.status(201).json({
        success: true,
        data: { count: notifications.length },
        message: i18nService.translate(lang, 'notifications.messages.sent_to_all', { count: notifications.length })
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }
}

module.exports = new NotificationController();
