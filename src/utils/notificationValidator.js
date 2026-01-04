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
      errors.push('recipientId is required');
    }

    // Validar type
    if (!type) {
      errors.push('type is required');
    } else if (!Object.values(NotificationTypes).includes(type)) {
      errors.push(`type must be one of: ${Object.values(NotificationTypes).join(', ')}`);
    }

    // Validar title
    if (!title) {
      errors.push('title is required');
    } else if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title must be a non-empty string');
    } else if (title.length > 200) {
      errors.push('title cannot exceed 200 characters');
    }

    // Validar message
    if (!message) {
      errors.push('message is required');
    } else if (typeof message !== 'string' || message.trim().length === 0) {
      errors.push('message must be a non-empty string');
    } else if (message.length > 1000) {
      errors.push('message cannot exceed 1000 characters');
    }

    // Validar channels (opcional)
    if (channels) {
      if (!Array.isArray(channels)) {
        errors.push('channels must be an array');
      } else {
        const validChannels = Object.values(NotificationChannels);
        const invalidChannels = channels.filter(ch => !validChannels.includes(ch));
        if (invalidChannels.length > 0) {
          errors.push(`Invalid channels: ${invalidChannels.join(', ')}`);
        }
      }
    }

    // Validar priority (opcional)
    if (priority && !Object.values(NotificationPriority).includes(priority)) {
      errors.push(`priority must be one of: ${Object.values(NotificationPriority).join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
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
      errors.push('recipientIds is required');
    } else if (!Array.isArray(recipientIds)) {
      errors.push('recipientIds must be an array');
    } else if (recipientIds.length === 0) {
      errors.push('recipientIds cannot be empty');
    } else if (recipientIds.length > 1000) {
      errors.push('recipientIds cannot have more than 1000 items');
    }

    // Validar type, title, message (igual que create)
    if (!type) {
      errors.push('type is required');
    } else if (!Object.values(NotificationTypes).includes(type)) {
      errors.push(`type must be one of: ${Object.values(NotificationTypes).join(', ')}`);
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.push('message is required and must be a non-empty string');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
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
      errors.push('role is required');
    } else if (!validRoles.includes(role)) {
      errors.push(`role must be one of: ${validRoles.join(', ')}`);
    }

    if (!type || !Object.values(NotificationTypes).includes(type)) {
      errors.push('type is required and must be valid');
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.push('message is required and must be a non-empty string');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
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
      errors.push('page must be a number greater than 0');
    }

    // Validar limit
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limit) || limitNum < 1 || limitNum > 100) {
        errors.push('limit must be a number between 1 and 100');
      }
    }

    // Validar status
    if (status && !['pending', 'sent', 'delivered', 'read', 'failed'].includes(status)) {
      errors.push('status must be: pending, sent, delivered, read or failed');
    }

    // Validar type
    if (type && !Object.values(NotificationTypes).includes(type)) {
      errors.push('type must be a valid notification type');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation errors',
        details: errors
      });
    }

    next();
  }
}

module.exports = NotificationValidator;
