const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');

/**
 * Middleware de validación para notificaciones
 */
class NotificationValidator {
  /**
   * Valida los datos de creación de una notificación
   */
  static validateCreateNotification(req, res, next) {
    const { recipientId, type, title, message, channels, priority } = req.body;
    const errors = [];

    // Validar recipientId
    if (!recipientId) {
      errors.push('recipientId es requerido');
    }

    // Validar type
    if (!type) {
      errors.push('type es requerido');
    } else if (!Object.values(NotificationTypes).includes(type)) {
      errors.push(`type debe ser uno de: ${Object.values(NotificationTypes).join(', ')}`);
    }

    // Validar title
    if (!title) {
      errors.push('title es requerido');
    } else if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title debe ser un string no vacío');
    } else if (title.length > 200) {
      errors.push('title no puede exceder 200 caracteres');
    }

    // Validar message
    if (!message) {
      errors.push('message es requerido');
    } else if (typeof message !== 'string' || message.trim().length === 0) {
      errors.push('message debe ser un string no vacío');
    } else if (message.length > 1000) {
      errors.push('message no puede exceder 1000 caracteres');
    }

    // Validar channels (opcional)
    if (channels) {
      if (!Array.isArray(channels)) {
        errors.push('channels debe ser un array');
      } else {
        const validChannels = Object.values(NotificationChannels);
        const invalidChannels = channels.filter(ch => !validChannels.includes(ch));
        if (invalidChannels.length > 0) {
          errors.push(`Canales inválidos: ${invalidChannels.join(', ')}`);
        }
      }
    }

    // Validar priority (opcional)
    if (priority && !Object.values(NotificationPriority).includes(priority)) {
      errors.push(`priority debe ser uno de: ${Object.values(NotificationPriority).join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors
      });
    }

    next();
  }

  /**
   * Valida los datos de notificación masiva
   */
  static validateBulkNotification(req, res, next) {
    const { recipientIds, type, title, message } = req.body;
    const errors = [];

    // Validar recipientIds
    if (!recipientIds) {
      errors.push('recipientIds es requerido');
    } else if (!Array.isArray(recipientIds)) {
      errors.push('recipientIds debe ser un array');
    } else if (recipientIds.length === 0) {
      errors.push('recipientIds no puede estar vacío');
    } else if (recipientIds.length > 1000) {
      errors.push('recipientIds no puede tener más de 1000 elementos');
    }

    // Validar type, title, message (igual que create)
    if (!type) {
      errors.push('type es requerido');
    } else if (!Object.values(NotificationTypes).includes(type)) {
      errors.push(`type debe ser uno de: ${Object.values(NotificationTypes).join(', ')}`);
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title es requerido y debe ser un string no vacío');
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.push('message es requerido y debe ser un string no vacío');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors
      });
    }

    next();
  }

  /**
   * Valida los datos para enviar a un rol
   */
  static validateSendToRole(req, res, next) {
    const { role, type, title, message } = req.body;
    const errors = [];
    const validRoles = ['employee', 'org_admin', 'unassigned'];

    if (!role) {
      errors.push('role es requerido');
    } else if (!validRoles.includes(role)) {
      errors.push(`role debe ser uno de: ${validRoles.join(', ')}`);
    }

    if (!type || !Object.values(NotificationTypes).includes(type)) {
      errors.push('type es requerido y debe ser válido');
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title es requerido y debe ser un string no vacío');
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.push('message es requerido y debe ser un string no vacío');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors
      });
    }

    next();
  }

  /**
   * Valida los parámetros de consulta para obtener notificaciones
   */
  static validateGetNotifications(req, res, next) {
    const { page, limit, status, type } = req.query;
    const errors = [];

    // Validar page
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      errors.push('page debe ser un número mayor a 0');
    }

    // Validar limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limit) || limitNum < 1 || limitNum > 100) {
        errors.push('limit debe ser un número entre 1 y 100');
      }
    }

    // Validar status
    if (status && !['pending', 'sent', 'delivered', 'read', 'failed'].includes(status)) {
      errors.push('status debe ser: pending, sent, delivered, read o failed');
    }

    // Validar type
    if (type && !Object.values(NotificationTypes).includes(type)) {
      errors.push(`type debe ser uno de los tipos válidos`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Errores de validación',
        details: errors
      });
    }

    next();
  }
}

module.exports = NotificationValidator;
