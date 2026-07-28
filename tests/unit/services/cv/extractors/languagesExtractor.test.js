const languagesExtractor = require('../../../../../src/services/cv/extractors/languagesExtractor');
const cvUtils = require('../../../../../src/utils/cvUtils');

describe('LanguagesExtractor - Unit Tests', () => {
  let languageDictionary;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);

    languageDictionary = {
      commonLanguages: ['English', 'Spanish'],
      languageLevels: {
        advanced: ['Advanced'],
        intermediate: ['Intermediate'],
        basic: ['Basic'],
        fluent: ['Fluent'],
        spanish: ['Nativo'],
      }
    };
  });

  it('should return empty array when no text', () => {
    expect(languagesExtractor.extract('', languageDictionary)).toEqual([]);
    expect(languagesExtractor.extract(null, languageDictionary)).toEqual([]);
  });

  it('should extract language with normalized level from dictionary', () => {
    const result = languagesExtractor.extract('English - Advanced', languageDictionary);

    expect(result).toEqual([
      { language: 'English', level: 'avanzado' }
    ]);
  });

  it('should detect CEFR levels from common patterns', () => {
    const result = languagesExtractor.extract('Spanish B2', languageDictionary);

    expect(result.length).toBe(1);
    expect(result[0].language).toBe('Spanish');
    expect(String(result[0].level).toUpperCase()).toBe('B2');
  });

  it('should default to intermedio when level is not provided', () => {
    const result = languagesExtractor.extract('English', languageDictionary);

    expect(result).toEqual([
      { language: 'English', level: 'intermedio' }
    ]);
  });
});
