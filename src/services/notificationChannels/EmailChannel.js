const NotificationChannel = require('./NotificationChannel');
const { NotificationChannels, NotificationStatus } = require('../../models/notification.model');

/**
 * Canal de notificación por Email
 * Utiliza el servicio de email existente (Brevo) para enviar notificaciones
 */
class EmailChannel extends NotificationChannel {
  constructor(emailService) {
    super();
    this.emailService = emailService;
  }

  /**
   * Envía una notificación por email
   * @param {Object} notification - La notificación (documento de Mongoose)
   * @param {Object} recipient - El usuario receptor
   * @returns {Promise<Object>}
   */
  async send(notification, recipient) {
    try {
      // Validar que el usuario tenga email
      if (!recipient.email) {
        throw new Error('El usuario no tiene email configurado');
      }

      // Construir el contenido del email
      const emailContent = this.buildEmailContent(notification, recipient);

      // Enviar el email usando el servicio existente
      await this.sendEmail(recipient.email, recipient.name, emailContent);

      return {
        success: true,
        status: NotificationStatus.SENT,
        channel: this.getChannelType(),
        sentAt: new Date()
      };
    } catch (error) {
      console.error('Error en EmailChannel:', error);
      return {
        success: false,
        status: NotificationStatus.FAILED,
        channel: this.getChannelType(),
        error: error.message
      };
    }
  }

  /**
   * Valida que el usuario tenga email y preferencias habilitadas
   */
  async canSend(notification, recipient) {
    // Verificar que el usuario tenga email
    if (!recipient.email) {
      return false;
    }

    // Verificar que el usuario tenga confirmado su email
    if (!recipient.isConfirmed) {
      return false;
    }

    // Verificar preferencias de notificaciones del usuario (si existen)
    if (recipient.notificationPreferences) {
      return recipient.notificationPreferences.email !== false;
    }

    return true;
  }

  /**
   * Construye el contenido HTML del email
   * @private
   */
  buildEmailContent(notification, recipient) {
    const actionButton = notification.actionUrl ? `
      <a href="${notification.actionUrl}" 
         style="background-color: #007bff; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
        ${notification.actionText || 'Ver más'}
      </a>
    ` : '';

    return {
      subject: notification.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
            <h1>${notification.title}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 20px;">
            <p>Hola ${recipient.name},</p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              ${notification.message}
            </div>
            ${actionButton}
            ${this.getPriorityBadge(notification.priority)}
          </div>
          <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>Esta es una notificación automática del sistema.</p>
            <p>Si no deseas recibir este tipo de notificaciones, puedes configurar tus preferencias en tu perfil.</p>
          </div>
        </div>
      `
    };
  }

  /**
   * Obtiene el badge HTML según la prioridad
   * @private
   */
  getPriorityBadge(priority) {
    const badges = {
      urgent: '<span style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">URGENTE</span>',
      high: '<span style="background: #ffc107; color: #000; padding: 4px 8px; border-radius: 3px; font-size: 11px;">ALTA PRIORIDAD</span>',
      medium: '',
      low: ''
    };
    return badges[priority] || '';
  }

  /**
   * Envía el email usando el servicio de email
   * @private
   */
  async sendEmail(email, name, content) {
    const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

    const payload = {
      sender: {
        name: process.env.EMAIL_SENDER_NAME || 'Tu Aplicación',
        email: process.env.EMAIL_SENDER_EMAIL || 'noreply@tudominio.com'
      },
      to: [{ email, name }],
      subject: content.subject,
      htmlContent: content.html
    };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error al enviar email: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  getChannelType() {
    return NotificationChannels.EMAIL;
  }
}

module.exports = EmailChannel;
