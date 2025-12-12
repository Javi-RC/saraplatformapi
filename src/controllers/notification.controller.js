const notificationService = require('../services/notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');
const responseHandler = require('../utils/responseHandler');

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
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Notificaciones obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener notificaciones'
      });
    }
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const count = await notificationService.getUnreadCount(userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: 'Conteo obtenido correctamente'
      });
    } catch (error) {
      console.error('Error obteniendo conteo de no leídas:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener el conteo'
      });
    }
  }

  /**
   * Obtiene estadísticas de notificaciones del usuario
   * GET /api/notifications/stats
   */
  async getStats(req, res) {
    try {
      const userId = req.user.userId;
      const stats = await notificationService.getUserStats(userId);
      
      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Estadísticas obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Marca una notificación como leída
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await notificationService.markAsRead(id, userId);
      
      return res.status(200).json({
        success: true,
        data: notification,
        message: 'Notificación marcada como leída'
      });
    } catch (error) {
      console.error('Error marcando como leída:', error);
      if (error.message === 'Notificación no encontrada') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Error al marcar como leída'
      });
    }
  }

  /**
   * Marca múltiples notificaciones como leídas
   * PATCH /api/notifications/read-multiple
   */
  async markMultipleAsRead(req, res) {
    try {
      const { notificationIds } = req.body;
      const userId = req.user.userId;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere un array de IDs de notificaciones'
        });
      }

      const count = await notificationService.markMultipleAsRead(notificationIds, userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: `${count} notificaciones marcadas como leídas`
      });
    } catch (error) {
      console.error('Error marcando múltiples como leídas:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al marcar notificaciones'
      });
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   * PATCH /api/notifications/read-all
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const count = await notificationService.markAllAsRead(userId);
      
      return res.status(200).json({
        success: true,
        data: { count },
        message: `${count} notificaciones marcadas como leídas`
      });
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al marcar todas como leídas'
      });
    }
  }

  /**
   * Archiva una notificación
   * PATCH /api/notifications/:id/archive
   */
  async archive(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await notificationService.archive(id, userId);
      
      return res.status(200).json({
        success: true,
        data: notification,
        message: 'Notificación archivada'
      });
    } catch (error) {
      console.error('Error archivando notificación:', error);
      if (error.message === 'Notificación no encontrada') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Error al archivar notificación'
      });
    }
  }

  /**
   * Elimina una notificación
   * DELETE /api/notifications/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const deleted = await notificationService.delete(id, userId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Notificación no encontrada'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Notificación eliminada correctamente'
      });
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar notificación'
      });
    }
  }

  /**
   * Crea una notificación (solo para admins)
   * POST /api/notifications
   */
  async create(req, res) {
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
          error: 'recipientId, type, title y message son requeridos'
        });
      }

      // Validar que el tipo es válido
      if (!Object.values(NotificationTypes).includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de notificación inválido'
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

      return res.status(201).json({
        success: true,
        data: notification,
        message: 'Notificación creada correctamente'
      });
    } catch (error) {
      console.error('Error creando notificación:', error);
      if (error.message === 'Usuario receptor no encontrado') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Error al crear notificación'
      });
    }
  }

  /**
   * Envía notificaciones masivas (solo para admins)
   * POST /api/notifications/bulk
   */
  async sendBulk(req, res) {
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
          error: 'Se requiere un array de recipientIds'
        });
      }

      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'type, title y message son requeridos'
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

      return res.status(201).json({
        success: true,
        data: { count: notifications.length, notifications },
        message: `${notifications.length} notificaciones enviadas correctamente`
      });
    } catch (error) {
      console.error('Error enviando notificaciones masivas:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al enviar notificaciones masivas'
      });
    }
  }

  /**
   * Envía notificación a un rol específico (solo para admins)
   * POST /api/notifications/send-to-role
   */
  async sendToRole(req, res) {
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
          error: 'role, type, title y message son requeridos'
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
        message: `${notifications.length} notificaciones enviadas al rol ${role}`
      });
    } catch (error) {
      console.error('Error enviando notificaciones por rol:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al enviar notificaciones por rol'
      });
    }
  }

  /**
   * Envía notificación a todos los usuarios (solo para admins)
   * POST /api/notifications/send-to-all
   */
  async sendToAll(req, res) {
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
          error: 'type, title y message son requeridos'
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
        message: `${notifications.length} notificaciones enviadas a todos los usuarios`
      });
    } catch (error) {
      console.error('Error enviando notificaciones a todos:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al enviar notificaciones a todos'
      });
    }
  }
}

module.exports = new NotificationController();
