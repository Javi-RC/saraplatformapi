const NotificationChannel = require('./NotificationChannel');
const { NotificationChannels, NotificationStatus } = require('../../../models/notification.model');
const AppError = require('../../../utils/AppError');

/**
 * Email notification channel
 * Uses the existing email service (Brevo) to send notifications
 */
class EmailChannel extends NotificationChannel {
  constructor(emailService) {
    super();
    this.emailService = emailService;
  }

  /**
   * Sends a notification via email
   * @param {Object} notification - The notification (Mongoose document)
   * @param {Object} recipient - The recipient user
   * @returns {Promise<Object>}
   */
  async send(notification, recipient) {
    try {
      // Validate that the user has an email
      if (!recipient.email) {
        throw AppError.badRequest('USER_NO_EMAIL', 'The user does not have an email configured');
      }

      // Build the email content
      const emailContent = this.buildEmailContent(notification, recipient);

      // Send the email using the existing service
      await this.sendEmail(recipient.email, recipient.name, emailContent);

      return {
        success: true,
        status: NotificationStatus.SENT,
        channel: this.getChannelType(),
        sentAt: new Date()
      };
    } catch (error) {
      console.error('Error in EmailChannel:', error);
      return {
        success: false,
        status: NotificationStatus.FAILED,
        channel: this.getChannelType(),
        error: error.message
      };
    }
  }

  /**
   * Validates that the user has an email and preferences enabled
   */
  async canSend(notification, recipient) {
    // Check that the user has an email
    if (!recipient.email) {
      return false;
    }

    // Check that the user has confirmed their email
    if (!recipient.isConfirmed) {
      return false;
    }

    // Check user notification preferences (if they exist)
    if (recipient.notificationPreferences) {
      return recipient.notificationPreferences.email !== false;
    }

    return true;
  }

  /**
   * Builds the HTML content of the email
   * @private
   */
  buildEmailContent(notification, recipient) {
    const actionButton = notification.actionUrl ? `
      <a href="${notification.actionUrl}" 
         style="background-color: #007bff; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
        ${notification.actionText || 'View more'}
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
            <p>Hello ${recipient.name},</p>
            <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
              ${notification.message}
            </div>
            ${actionButton}
            ${this.getPriorityBadge(notification.priority)}
          </div>
          <div style="background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automatic system notification.</p>
            <p>If you do not wish to receive this type of notification, you can configure your preferences in your profile.</p>
          </div>
        </div>
      `
    };
  }

  /**
   * Gets the HTML badge based on priority
   * @private
   */
  getPriorityBadge(priority) {
    const badges = {
      urgent: '<span style="background: #dc3545; color: white; padding: 4px 8px; border-radius: 3px; font-size: 11px;">URGENT</span>',
      high: '<span style="background: #ffc107; color: #000; padding: 4px 8px; border-radius: 3px; font-size: 11px;">HIGH PRIORITY</span>',
      medium: '',
      low: ''
    };
    return badges[priority] || '';
  }

  /**
   * Sends the email using the email service
   * @private
   */
  async sendEmail(email, name, content) {
    const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

    const payload = {
      sender: {
        name: process.env.EMAIL_SENDER_NAME || 'Your Application',
        email: process.env.EMAIL_SENDER_EMAIL || 'noreply@yourdomain.com'
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
      throw new AppError('EMAIL_SEND_FAILED', 500, `Error sending email: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  getChannelType() {
    return NotificationChannels.EMAIL;
  }
}

module.exports = EmailChannel;
