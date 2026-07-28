const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const AppError = require('../../utils/AppError');

const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', msg, ...meta, timestamp: new Date().toISOString() })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', msg, ...meta, timestamp: new Date().toISOString() })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', msg, ...meta, timestamp: new Date().toISOString() }))
};

class EmailService {
  constructor() {
    this.maxRetries = Number(process.env.EMAIL_MAX_RETRIES) || 3;
    this.baseDelayMs = Number(process.env.EMAIL_RETRY_BASE_DELAY_MS) || 1000;
  }

  async sendConfirmationEmail(email, name, confirmLink) {
    const payload = {
      sender: {
        name: process.env.EMAIL_SENDER_NAME || 'Tu Aplicación',
        email: process.env.EMAIL_SENDER_EMAIL || 'noreply@tudominio.com'
      },
      to: [{ email, name }],
      subject: 'Confirma tu cuenta - Tu Aplicación',
      htmlContent: this.getConfirmationEmailTemplate(name, confirmLink)
    };

    let lastError = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this._sendViaBrevo(payload);

        if (attempt > 1) {
          logger.info('Email sent successfully after retry', { email, attempt });
        }

        return result;
      } catch (error) {
        lastError = error;
        logger.warn('Email send attempt failed', {
          email,
          attempt,
          maxRetries: this.maxRetries,
          error: error.message
        });

        if (attempt < this.maxRetries) {
          const delayMs = this.baseDelayMs * Math.pow(2, attempt - 1);
          await this._delay(delayMs);
        }
      }
    }

    logger.error('Email send failed after all retries', {
      email,
      attempts: this.maxRetries,
      error: lastError.message
    });

    throw lastError;
  }

  async _sendViaBrevo(payload) {
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
      throw new AppError('EMAIL_SEND_FAILED', 502, `Brevo API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConfirmationEmailTemplate(name, confirmLink) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
          <h1>Bienvenido a Tu Aplicación</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px;">
          <h2>¡Hola ${name}!</h2>
          <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
          <a href="${confirmLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
            Confirmar Mi Cuenta
          </a>
          <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
          <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
            ${confirmLink}
          </p>
          <p><strong>Este enlace expirará en 24 horas.</strong></p>
        </div>
      </div>
    `;
  }
}

module.exports = new EmailService();