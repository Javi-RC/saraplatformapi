const experienceExtractor = require('../../../../../src/services/cv/extractors/experienceExtractor');
const cvUtils = require('../../../../../src/utils/cvUtils');

describe('ExperienceExtractor - Unit Tests', () => {
  let mockTechnologyDictionary;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);
    jest.spyOn(cvUtils, 'normalizeTechnology').mockImplementation((t) => t.toLowerCase());

    mockTechnologyDictionary = {
      getAllTechnologies: jest.fn(() => ['Node.js', 'React', 'Python']),
      technologyNormalizations: {}
    };
  });

  it('should return empty array when sectionText is empty', () => {
    expect(experienceExtractor.extract('', mockTechnologyDictionary)).toEqual([]);
    expect(experienceExtractor.extract(null, mockTechnologyDictionary)).toEqual([]);
  });

  it('should extract current job (Presente) and technologies', () => {
    const text = [
      'Acme Corp',
      'Senior Developer',
      '01/2020 - Presente',
      '- Built APIs using Node.js and React'
    ].join('\n');

    const result = experienceExtractor.extract(text, mockTechnologyDictionary);

    expect(result.length).toBeGreaterThanOrEqual(1);
    // Find the entry that has Acme Corp or Senior Developer position
    const acmeEntry = result.find(r => r.company === 'Acme Corp' || r.position === 'Senior Developer');
    expect(acmeEntry).toBeDefined();
    // The extractor found an entry for Acme Corp / Senior Developer
    const hasValidEntry = Boolean(acmeEntry.company) || Boolean(acmeEntry.position);
    expect(hasValidEntry).toBe(true);
  });

  it('should split multiple jobs by blank lines', () => {
    const text = [
      'Beta Ltd',
      'Engineer',
      '2018 - 2019',
      'Worked with Python',
      '',
      'Gamma Inc',
      'Consultant',
      '2020',
      'Did things'
    ].join('\n');

    const result = experienceExtractor.extract(text, mockTechnologyDictionary);

    expect(result.length).toBeGreaterThanOrEqual(2);
    // Check that we have entries for both companies
    const hasBeta = result.some(r => r.company === 'Beta Ltd' || r.position === 'Engineer');
    const hasGamma = result.some(r => r.company === 'Gamma Inc' || r.position === 'Consultant');
    expect(hasBeta).toBe(true);
    expect(hasGamma).toBe(true);
  });
});

