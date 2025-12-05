const { 
  Notification, 
  NotificationTypes, 
  NotificationPriority, 
  NotificationStatus,
  NotificationChannels 
} = require('../models/notification.model');
const User = require('../models/user.model');
const NotificationChannelFactory = require('./notificationChannels/NotificationChannelFactory');
const emailService = require('./email.service');

/**
 * Servicio de Notificaciones
 * Gestiona la creación, envío y consulta de notificaciones
 * Sigue el principio de responsabilidad única (SRP)
 */
class NotificationService {
  constructor() {
    // Configurar el factory con las dependencias necesarias
    NotificationChannelFactory.setEmailService(emailService);
  }

  /**
   * Crea y envía una notificación a un usuario
   * @param {Object} notificationData - Datos de la notificación
   * @param {string} notificationData.recipientId - ID del usuario receptor
   * @param {string} notificationData.type - Tipo de notificación
   * @param {string} notificationData.title - Título de la notificación
   * @param {string} notificationData.message - Mensaje de la notificación
   * @param {Array<string>} notificationData.channels - Canales de envío
   * @param {Object} [notificationData.metadata] - Datos adicionales
   * @param {string} [notificationData.priority] - Prioridad
   * @param {string} [notificationData.actionUrl] - URL de acción
   * @param {string} [notificationData.actionText] - Texto del botón
   * @param {Date} [notificationData.expiresAt] - Fecha de expiración
   * @param {string} [notificationData.senderId] - ID del emisor
   * @returns {Promise<Object>} Notificación creada
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

    // Validar que el receptor existe
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error('Usuario receptor no encontrado');
    }

    // Crear la notificación en la base de datos
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

    // Enviar por los canales especificados
    await this.sendThroughChannels(notification, recipient, channels);

    return notification;
  }

  /**
   * Envía una notificación existente a través de los canales especificados
   * @private
   */
  async sendThroughChannels(notification, recipient, channels) {
    const sendPromises = channels.map(async (channelType) => {
      try {
        const channel = NotificationChannelFactory.getChannel(channelType);
        
        // Verificar si el canal puede enviar la notificación
        const canSend = await channel.canSend(notification, recipient);
        if (!canSend) {
          await notification.updateDeliveryStatus(
            channelType, 
            NotificationStatus.FAILED, 
            'Canal no disponible para este usuario'
          );
          return;
        }

        // Enviar por el canal
        const result = await channel.send(notification, recipient);
        
        // Actualizar estado de entrega
        await notification.updateDeliveryStatus(
          channelType,
          result.status,
          result.error
        );
      } catch (error) {
        console.error(`Error enviando por canal ${channelType}:`, error);
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
   * Obtiene las notificaciones de un usuario con paginación
   * @param {string} userId - ID del usuario
   * @param {Object} options - Opciones de consulta
   * @param {number} [options.page=1] - Página actual
   * @param {number} [options.limit=20] - Límite por página
   * @param {string} [options.status] - Filtrar por estado
   * @param {string} [options.type] - Filtrar por tipo
   * @param {boolean} [options.unreadOnly=false] - Solo no leídas
   * @param {boolean} [options.includeArchived=false] - Incluir archivadas
   * @returns {Promise<Object>} Objeto con notificaciones y metadata de paginación
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

    // Validar que no esté expirada
    query.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name email avatar'),
      Notification.countDocuments(query)
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
   * Marca una notificación como leída
   * @param {string} notificationId - ID de la notificación
   * @param {string} userId - ID del usuario (para validar permisos)
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return await notification.markAsRead();
  }

  /**
   * Marca múltiples notificaciones como leídas
   * @param {Array<string>} notificationIds - IDs de las notificaciones
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>} Cantidad de notificaciones actualizadas
   */
  async markMultipleAsRead(notificationIds, userId) {
    const result = await Notification.updateMany(
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
   * Marca todas las notificaciones de un usuario como leídas
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>} Cantidad de notificaciones actualizadas
   */
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
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
   * Archiva una notificación
   * @param {string} notificationId - ID de la notificación
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async archive(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      throw new Error('Notificación no encontrada');
    }

    return await notification.archive();
  }

  /**
   * Elimina una notificación
   * @param {string} notificationId - ID de la notificación
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>}
   */
  async delete(notificationId, userId) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      recipient: userId
    });

    return result.deletedCount > 0;
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   * @param {string} userId - ID del usuario
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    return await Notification.countDocuments({
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
   * Obtiene estadísticas de notificaciones de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async getUserStats(userId) {
    return await Notification.getUserStats(userId);
  }

  /**
   * Limpia notificaciones antiguas archivadas
   * @param {number} daysOld - Días de antigüedad
   * @returns {Promise<number>} Cantidad de notificaciones eliminadas
   */
  async cleanupOldNotifications(daysOld = 90) {
    const result = await Notification.cleanupOldNotifications(daysOld);
    return result.deletedCount;
  }

  /**
   * Envía notificaciones masivas a múltiples usuarios
   * @param {Array<string>} recipientIds - IDs de los usuarios receptores
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Array>} Array con las notificaciones creadas
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
   * Envía notificaciones a usuarios con un rol específico
   * @param {string} role - Rol de los usuarios (employee, org_admin)
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Array>} Array con las notificaciones creadas
   */
  async sendToRole(role, notificationData) {
    const users = await User.find({ role, isConfirmed: true }).select('_id');
    const recipientIds = users.map(user => user._id.toString());
    
    return await this.sendBulkNotifications(recipientIds, notificationData);
  }

  /**
   * Envía notificaciones a todos los usuarios confirmados
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Array>} Array con las notificaciones creadas
   */
  async sendToAll(notificationData) {
    const users = await User.find({ isConfirmed: true }).select('_id');
    const recipientIds = users.map(user => user._id.toString());
    
    return await this.sendBulkNotifications(recipientIds, notificationData);
  }
}

module.exports = new NotificationService();
