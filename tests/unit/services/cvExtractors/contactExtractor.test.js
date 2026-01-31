const cvUtils = require('../../../../src/utils/cvUtils');
const contactExtractor = require('../../../../src/services/cvExtractors/contactExtractor');

// Mockear los métodos de cvUtils
jest.spyOn(cvUtils, 'extractEmails');
jest.spyOn(cvUtils, 'extractPhones');
jest.spyOn(cvUtils, 'extractLinkedIn');
jest.spyOn(cvUtils, 'extractGitHub');
jest.spyOn(cvUtils, 'extractUrls');

describe('ContactExtractor - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extract', () => {
    it('debería extraer email correctamente', () => {
      cvUtils.extractEmails.mockReturnValue(['test@example.com', 'other@example.com']);
      cvUtils.extractPhones.mockReturnValue([]);
      cvUtils.extractLinkedIn.mockReturnValue(null);
      cvUtils.extractGitHub.mockReturnValue(null);
      cvUtils.extractUrls.mockReturnValue([]);

      const result = contactExtractor.extract('test text');

      expect(result.email).toBe('test@example.com');
    });

    it('debería extraer teléfonos correctamente', () => {
      cvUtils.extractEmails.mockReturnValue([]);
      cvUtils.extractPhones.mockReturnValue(['+34 123 456 789', '987654321']);
      cvUtils.extractLinkedIn.mockReturnValue(null);
      cvUtils.extractGitHub.mockReturnValue(null);
      cvUtils.extractUrls.mockReturnValue([]);

      const result = contactExtractor.extract('test text');

      expect(result.phones).toHaveLength(2);
      expect(result.phones[0]).toEqual({
        number: '+34 123 456 789',
        type: 'mobile'
      });
    });

    it('debería extraer LinkedIn correctamente', () => {
      cvUtils.extractEmails.mockReturnValue([]);
      cvUtils.extractPhones.mockReturnValue([]);
      cvUtils.extractLinkedIn.mockReturnValue('https://linkedin.com/in/testuser');
      cvUtils.extractGitHub.mockReturnValue(null);
      cvUtils.extractUrls.mockReturnValue([]);

      const result = contactExtractor.extract('test text');

      expect(result.links.linkedin).toBe('https://linkedin.com/in/testuser');
    });

    it('debería extraer GitHub correctamente', () => {
      cvUtils.extractEmails.mockReturnValue([]);
      cvUtils.extractPhones.mockReturnValue([]);
      cvUtils.extractLinkedIn.mockReturnValue(null);
      cvUtils.extractGitHub.mockReturnValue('https://github.com/testuser');
      cvUtils.extractUrls.mockReturnValue([]);

      const result = contactExtractor.extract('test text');

      expect(result.links.github).toBe('https://github.com/testuser');
    });

    it('debería retornar estructura vacía si no hay datos', () => {
      cvUtils.extractEmails.mockReturnValue([]);
      cvUtils.extractPhones.mockReturnValue([]);
      cvUtils.extractLinkedIn.mockReturnValue(null);
      cvUtils.extractGitHub.mockReturnValue(null);
      cvUtils.extractUrls.mockReturnValue([]);

      const result = contactExtractor.extract('test text');

      expect(result.email).toBeNull();
      expect(result.phones).toBeUndefined();
      expect(result.links.linkedin).toBeNull();
      expect(result.links.github).toBeNull();
    });

    it('debería extraer información completa de contacto', () => {
      cvUtils.extractEmails.mockReturnValue(['john@example.com']);
      cvUtils.extractPhones.mockReturnValue(['+1234567890']);
      cvUtils.extractLinkedIn.mockReturnValue('https://linkedin.com/in/john');
      cvUtils.extractGitHub.mockReturnValue('https://github.com/john');
      cvUtils.extractUrls.mockReturnValue(['https://portfolio.com']);

      const result = contactExtractor.extract('John Doe\njohn@example.com\n+1234567890');

      expect(result.email).toBe('john@example.com');
      expect(result.phones).toHaveLength(1);
      expect(result.links.linkedin).toBeTruthy();
      expect(result.links.github).toBeTruthy();
    });

    it('debería manejar múltiples emails y tomar el primero', () => {
      cvUtils.extractEmails.mockReturnValue(['first@test.com', 'second@test.com']);
      cvUtils.extractPhones.mockReturnValue([]);
      cvUtils.extractLinkedIn.mockReturnValue(null);
      cvUtils.extractGitHub.mockReturnValue(null);
      cvUtils.extractUrls.mockReturnValue([]);

      const result = contactExtractor.extract('test');

      expect(result.email).toBe('first@test.com');
    });
  });
});
