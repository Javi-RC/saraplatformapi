const NotificationChannel = require('./NotificationChannel');
const { NotificationChannels, NotificationStatus } = require('../../models/notification.model');

/**
 * Canal de notificación In-App
 * Las notificaciones in-app se almacenan en la base de datos y se consultan a través de la API
 * Este canal siempre tiene éxito ya que la notificación ya está creada en la DB
 */
class InAppChannel extends NotificationChannel {
  /**
   * Para las notificaciones in-app, simplemente confirmamos que está almacenada
   * @param {Object} notification - La notificación (documento de Mongoose)
   * @param {Object} recipient - El usuario receptor
   * @returns {Promise<Object>}
   */
  async send(notification, recipient) {
    try {
      // Las notificaciones in-app se consideran "enviadas" automáticamente
      // ya que están almacenadas en la base de datos
      return {
        success: true,
        status: NotificationStatus.DELIVERED,
        channel: this.getChannelType(),
        deliveredAt: new Date()
      };
    } catch (error) {
      console.error('Error en InAppChannel:', error);
      return {
        success: false,
        status: NotificationStatus.FAILED,
        channel: this.getChannelType(),
        error: error.message
      };
    }
  }

  /**
   * Valida que el usuario esté activo y confirmado
   */
  async canSend(notification, recipient) {
    return recipient && recipient.isConfirmed;
  }

  getChannelType() {
    return NotificationChannels.IN_APP;
  }
}

module.exports = InAppChannel;
