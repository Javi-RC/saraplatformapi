const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

class EmailService {
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
      throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
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