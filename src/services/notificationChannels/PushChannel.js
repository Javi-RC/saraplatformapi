const NotificationChannel = require('./NotificationChannel');
const { NotificationChannels, NotificationStatus } = require('../../models/notification.model');

/**
 * Canal de notificación Push
 * Placeholder para futuras implementaciones de notificaciones push
 * (Firebase Cloud Messaging, OneSignal, etc.)
 */
class PushChannel extends NotificationChannel {
  /**
   * Envía una notificación push
   * @param {Object} notification - La notificación (documento de Mongoose)
   * @param {Object} recipient - El usuario receptor
   * @returns {Promise<Object>}
   */
  async send(notification, recipient) {
    try {
      // TODO: Implementar lógica de notificaciones push
      // Por ahora, marcamos como no implementado
      console.warn('PushChannel no está implementado todavía');
      
      return {
        success: false,
        status: NotificationStatus.FAILED,
        channel: this.getChannelType(),
        error: 'Canal push no implementado'
      };
    } catch (error) {
      console.error('Error en PushChannel:', error);
      return {
        success: false,
        status: NotificationStatus.FAILED,
        channel: this.getChannelType(),
        error: error.message
      };
    }
  }

  /**
   * Valida que el usuario tenga configurado el canal push y las preferencias habilitadas
   */
  async canSend(notification, recipient) {
    if (!recipient) {
      return false;
    }

    // Verificar preferencias de notificaciones del usuario
    if (recipient.notificationPreferences) {
      if (recipient.notificationPreferences.push === false) {
        return false;
      }
    }

    // TODO: Verificar si el usuario tiene tokens de dispositivos registrados
    // Por ahora, retorna false porque el canal no está implementado
    return false;
  }

  getChannelType() {
    return NotificationChannels.PUSH;
  }
}

module.exports = PushChannel;
