const { NotificationChannels, NotificationStatus } = require('../../models/notification.model');

/**
 * Interface base para los canales de notificación (Strategy Pattern)
 * Todos los canales deben implementar el método send
 */
class NotificationChannel {
  /**
   * Envía una notificación a través del canal específico
   * @param {Object} notification - La notificación a enviar
   * @param {Object} recipient - El usuario receptor
   * @returns {Promise<Object>} Resultado del envío con status y detalles
   */
  async send(notification, recipient) {
    throw new Error('The send method must be implemented by the child class');
  }

  /**
   * Valida que el canal pueda enviar la notificación
   * @param {Object} notification - La notificación a validar
   * @param {Object} recipient - El usuario receptor
   * @returns {Promise<boolean>}
   */
  async canSend(notification, recipient) {
    return true;
  }

  /**
   * Obtiene el tipo de canal
   * @returns {string}
   */
  getChannelType() {
    throw new Error('The getChannelType method must be implemented by the child class');
  }
}

module.exports = NotificationChannel;
