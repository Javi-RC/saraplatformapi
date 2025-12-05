const InAppChannel = require('./InAppChannel');
const EmailChannel = require('./EmailChannel');
const PushChannel = require('./PushChannel');
const { NotificationChannels } = require('../../models/notification.model');

/**
 * Factory para crear instancias de canales de notificación
 * Implementa el patrón Factory para la creación de canales
 */
class NotificationChannelFactory {
  constructor() {
    this.channels = new Map();
    this.emailService = null;
  }

  /**
   * Configura el servicio de email necesario para EmailChannel
   */
  setEmailService(emailService) {
    this.emailService = emailService;
  }

  /**
   * Registra un canal personalizado
   * @param {string} type - Tipo de canal
   * @param {NotificationChannel} channelInstance - Instancia del canal
   */
  registerChannel(type, channelInstance) {
    this.channels.set(type, channelInstance);
  }

  /**
   * Obtiene una instancia del canal solicitado
   * @param {string} channelType - Tipo de canal (in_app, email, push)
   * @returns {NotificationChannel}
   */
  getChannel(channelType) {
    // Si el canal ya está registrado, retornarlo
    if (this.channels.has(channelType)) {
      return this.channels.get(channelType);
    }

    // Crear e instanciar el canal según el tipo
    let channel;
    
    switch (channelType) {
      case NotificationChannels.IN_APP:
        channel = new InAppChannel();
        break;
      
      case NotificationChannels.EMAIL:
        if (!this.emailService) {
          throw new Error('EmailService no está configurado en el factory');
        }
        channel = new EmailChannel(this.emailService);
        break;
      
      case NotificationChannels.PUSH:
        channel = new PushChannel();
        break;
      
      default:
        throw new Error(`Canal de notificación desconocido: ${channelType}`);
    }

    // Registrar el canal para reutilizarlo
    this.channels.set(channelType, channel);
    
    return channel;
  }

  /**
   * Obtiene todos los canales disponibles
   * @returns {Array<string>}
   */
  getAvailableChannels() {
    return Object.values(NotificationChannels);
  }

  /**
   * Limpia el cache de canales
   */
  clearCache() {
    this.channels.clear();
  }
}

// Exportar una instancia singleton del factory
module.exports = new NotificationChannelFactory();
