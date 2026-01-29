const notificationService = require('../services/notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');
const responseHandler = require('../utils/responseHandler');
const i18nService = require('../i18n/i18n.service');

/**
 * Controlador de Notificaciones
 * Maneja las peticiones HTTP relacionadas con notificaciones
 */
class NotificationController {
  /**
   * Obtiene las notificaciones del usuario autenticado
   * GET /api/notifications
   */
  async getNotifications(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    console.log('[NotificationController] Detected language:', lang, '| Query:', req.query?.lang, '| User pref:', req.user?.preferredLanguage);
    try {
      const userId = req.user.userId;
      const {
        page = 1,
        limit = 20,
        status,
        type,
        unreadOnly,
        includeArchived
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        type,
        unreadOnly: unreadOnly === 'true',
        includeArchived: includeArchived === 'true'
      };

      const result = await notificationService.getUserNotifications(userId, options);
      
      // Traducir las notificaciones según el idioma
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
      console.error('Error obteniendo notificaciones:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_obtaining')
      });
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const userId = req.user.userId;
      const count = await notificationService.getUnreadCount(userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: i18nService.translate(lang, 'notifications.messages.count_obtained_successfully')
      });
    } catch (error) {
      console.error('Error obteniendo conteo de no leídas:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_obtaining_count')
      });
    }
  }

  /**
   * Obtiene estadísticas de notificaciones del usuario
   * GET /api/notifications/stats
   */
  async getStats(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const userId = req.user.userId;
      const stats = await notificationService.getUserStats(userId);
      
      return res.status(200).json({
        success: true,
        data: stats,
        message: i18nService.translate(lang, 'notifications.messages.statistics_obtained_successfully')
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_obtaining_statistics')
      });
    }
  }

  /**
   * Marca una notificación como leída
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await notificationService.markAsRead(id, userId);
      const translatedNotification = i18nService.translateNotification(notification, lang);
      
      return res.status(200).json({
        success: true,
        data: translatedNotification,
        message: i18nService.translate(lang, 'notifications.messages.marked_as_read')
      });
    } catch (error) {
      console.error('Error marcando como leída:', error);
      if (error.message === 'Notification not found') {
        return res.status(404).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.not_found')
        });
      }
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_marking_as_read')
      });
    }
  }

  /**
   * Marca múltiples notificaciones como leídas
   * PATCH /api/notifications/read-multiple
   */
  async markMultipleAsRead(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { notificationIds } = req.body;
      const userId = req.user.userId;

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
      console.error('Error marcando múltiples como leídas:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_marking_multiple')
      });
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const userId = req.user.userId;
      const count = await notificationService.markAllAsRead(userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: i18nService.translate(lang, 'notifications.messages.marked_as_read_all', { count })
      });
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_marking_all')
      });
    }
  }

  /**
   * Archiva una notificación
   * PATCH /api/notifications/:id/archive
   */
  async archive(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await notificationService.archive(id, userId);
      const translatedNotification = i18nService.translateNotification(notification, lang);
      
      return res.status(200).json({
        success: true,
        data: translatedNotification,
        message: i18nService.translate(lang, 'notifications.messages.archived')
      });
    } catch (error) {
      console.error('Error archivando notificación:', error);
      if (error.message === 'Notification not found') {
        return res.status(404).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.not_found')
        });
      }
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_archiving')
      });
    }
  }

  /**
   * Elimina una notificación
   * DELETE /api/notifications/:id
   */
  async delete(req, res) {
    const lang = i18nService.getLanguageFromRequest(req);
    try {
      const { id } = req.params;
      const userId = req.user.userId;

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
      console.error('Error eliminando notificación:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_deleting')
      });
    }
  }

  /**
   * Crea una notificación (solo para admins)
   * POST /api/notifications
   */
  async create(req, res) {
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

      // Validaciones básicas
      if (!recipientId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.required_fields')
        });
      }

      // Validar que el tipo es válido
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
        senderId: req.user.userId
      });

      const translatedNotification = i18nService.translateNotification(notification, lang);

      return res.status(201).json({
        success: true,
        data: translatedNotification,
        message: i18nService.translate(lang, 'notifications.messages.created_successfully')
      });
    } catch (error) {
      console.error('Error creando notificación:', error);
      if (error.message === 'Recipient user not found') {
        return res.status(404).json({
          success: false,
          error: i18nService.translate(lang, 'notifications.messages.recipient_not_found')
        });
      }
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_creating')
      });
    }
  }

  /**
   * Envía notificaciones masivas (solo para admins)
   * POST /api/notifications/bulk
   */
  async sendBulk(req, res) {
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

      // Validaciones
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
          senderId: req.user.userId
        }
      );

      const translatedNotifications = i18nService.translateNotifications(notifications, lang);

      return res.status(201).json({
        success: true,
        data: { count: translatedNotifications.length, notifications: translatedNotifications },
        message: i18nService.translate(lang, 'notifications.messages.bulk_sent_successfully', { count: notifications.length })
      });
    } catch (error) {
      console.error('Error enviando notificaciones masivas:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_sending_bulk')
      });
    }
  }

  /**
   * Envía notificación a un rol específico (solo para admins)
   * POST /api/notifications/send-to-role
   */
  async sendToRole(req, res) {
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

      // Validaciones
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
        senderId: req.user.userId
      });

      return res.status(201).json({
        success: true,
        data: { count: notifications.length },
        message: i18nService.translate(lang, 'notifications.messages.sent_to_role', { count: notifications.length, role })
      });
    } catch (error) {
      console.error('Error enviando notificaciones por rol:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_sending_to_role')
      });
    }
  }

  /**
   * Envía notificación a todos los usuarios (solo para admins)
   * POST /api/notifications/send-to-all
   */
  async sendToAll(req, res) {
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

      // Validaciones
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
        senderId: req.user.userId
      });

      return res.status(201).json({
        success: true,
        data: { count: notifications.length },
        message: i18nService.translate(lang, 'notifications.messages.sent_to_all', { count: notifications.length })
      });
    } catch (error) {
      console.error('Error enviando notificaciones a todos:', error);
      return res.status(500).json({
        success: false,
        error: i18nService.translate(lang, 'notifications.messages.error_sending_to_all')
      });
    }
  }
}

module.exports = new NotificationController();
