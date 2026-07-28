const certificationsExtractor = require('../../../../../src/services/cv/extractors/certificationsExtractor');
const cvUtils = require('../../../../../src/utils/cvUtils');

describe('CertificationsExtractor - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);
  });

  it('should return empty array when no sectionText', () => {
    expect(certificationsExtractor.extract('')).toEqual([]);
    expect(certificationsExtractor.extract(null)).toEqual([]);
  });

  it('should extract certification entries with dates, credentialId and url', () => {
    const text = [
      'AWS Certified Solutions Architect',
      'Amazon Web Services',
      '2020',
      'Credential ID: ABC-123',
      'https://verify.example.com',
      '',
      'Microsoft Certified: Azure Developer Associate',
      '2021 - 2023',
      'credential # xyz-999',
      'https://learn.microsoft.com'
    ].join('\n');

    const result = certificationsExtractor.extract(text);

    expect(result.length).toBe(2);

    expect(result[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        issuer: expect.any(String),
        dateObtained: expect.any(String),
        credentialId: 'ABC-123',
        url: 'https://verify.example.com'
      })
    );

    // Second one: issuer should likely be omitted because second line contains dates
    expect(result[1].name).toContain('Microsoft');
    expect(result[1].dateObtained).toBeTruthy();
    expect(result[1].expirationDate).toBeTruthy();
    expect(result[1].credentialId).toBe('xyz-999');
    expect(result[1].url).toBe('https://learn.microsoft.com');
  });
});
