const Validators = require('../../../src/utils/validators');

describe('Validators - Unit Tests', () => {
  let validators;

  beforeEach(() => {
    // Support both constructor exports and plain object/function exports
    const V = Validators && Validators.default ? Validators.default : Validators;
    validators = typeof V === 'function' ? new V() : V;
  });

  describe('validateEmail', () => {
    it('debería aceptar email válido', () => {
      expect(validators.validateEmail('test@example.com')).toBe(true);
      expect(validators.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validators.validateEmail('user+tag@example.com')).toBe(true);
    });

    it('debería rechazar email inválido', () => {
      expect(validators.validateEmail('invalid-email')).toBe(false);
      expect(validators.validateEmail('user@')).toBe(false);
      expect(validators.validateEmail('@domain.com')).toBe(false);
      expect(validators.validateEmail('user@.com')).toBe(false);
      expect(validators.validateEmail('')).toBe(false);
      expect(validators.validateEmail(null)).toBe(false);
      expect(validators.validateEmail(undefined)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('debería aceptar contraseña válida', () => {
      expect(validators.validatePassword('password123')).toBe(true);
      expect(validators.validatePassword('123456')).toBe(true);
      expect(validators.validatePassword('contraseñaSegura123')).toBe(true);
    });

    it('debería rechazar contraseña inválida', () => {
      expect(validators.validatePassword('12345')).toBe(false);
      expect(validators.validatePassword('')).toBe(false);
      expect(validators.validatePassword(null)).toBe(false);
      expect(validators.validatePassword(undefined)).toBe(false);
    });
  });

  describe('validateRegistrationData', () => {
    it('debería aceptar datos de registro válidos', () => {
      expect(() => {
        validators.validateRegistrationData('test@example.com', 'Test User', 'password123');
      }).not.toThrow();
    });

    it('debería rechazar datos faltantes', () => {
      expect(() => {
        validators.validateRegistrationData('', 'Test User', 'password123');
      }).toThrow(expect.objectContaining({ code: 'MISSING_REQUIRED_FIELDS' }));

      expect(() => {
        validators.validateRegistrationData('test@example.com', '', 'password123');
      }).toThrow(expect.objectContaining({ code: 'MISSING_REQUIRED_FIELDS' }));

      expect(() => {
        validators.validateRegistrationData('test@example.com', 'Test User', '');
      }).toThrow(expect.objectContaining({ code: 'MISSING_REQUIRED_FIELDS' }));
    });

    it('debería rechazar email inválido', () => {
      expect(() => {
        validators.validateRegistrationData('invalid-email', 'Test User', 'password123');
      }).toThrow(expect.objectContaining({ code: 'INVALID_EMAIL_FORMAT' }));
    });

    it('debería rechazar contraseña corta', () => {
      expect(() => {
        validators.validateRegistrationData('test@example.com', 'Test User', '123');
      }).toThrow(expect.objectContaining({ code: 'PASSWORD_TOO_SHORT' }));
    });
  });
});