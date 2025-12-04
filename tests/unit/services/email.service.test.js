const EmailService = require('../../../src/services/email.service');

// Mock de fetch global
global.fetch = jest.fn();

describe('EmailService', () => {
  let emailService;

  beforeEach(() => {
    emailService = require('../../../src/services/email.service');
    jest.clearAllMocks();
    process.env.BREVO_API_KEY = 'test-api-key';
  });

  describe('sendConfirmationEmail', () => {
    it('debería enviar email exitosamente', async () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      const confirmLink = 'http://localhost:3000/auth/confirm?token=abc123';

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ messageId: '12345' })
      };

      global.fetch.mockResolvedValue(mockResponse);

      // Act
      const result = await emailService.sendConfirmationEmail(email, name, confirmLink);

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.brevo.com/v3/smtp/email',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'api-key': 'test-api-key'
          })
        })
      );
      expect(result.messageId).toBe('12345');
    });

    it('debería lanzar error cuando la API de Brevo falla', async () => {
      // Arrange
      const email = 'test@example.com';
      const name = 'Test User';
      const confirmLink = 'http://localhost:3000/auth/confirm?token=abc123';

      const mockResponse = {
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request')
      };

      global.fetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(emailService.sendConfirmationEmail(email, name, confirmLink))
        .rejects
        .toThrow('Brevo API error: 400 - Bad Request');
    });
  });

  describe('getConfirmationEmailTemplate', () => {
    it('debería generar template de email correctamente', () => {
      // Arrange
      const name = 'Test User';
      const confirmLink = 'http://localhost:3000/auth/confirm?token=abc123';

      // Act
      const template = emailService.getConfirmationEmailTemplate(name, confirmLink);

      // Assert
      expect(template).toContain(name);
      expect(template).toContain(confirmLink);
      expect(template).toContain('Confirmar Mi Cuenta');
      expect(template).toContain('expirará en 24 horas');
    });
  });
});