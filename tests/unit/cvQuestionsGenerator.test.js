/**
 * Unit Tests for CV Questions Generator Service
 */

const {
  generateQuestionsForMissingFields,
  generateConditionalQuestions,
  getQuestionsByCategory,
  shouldAskQuestion,
  QUESTION_TEMPLATES
} = require('../../src/services/cvQuestionsGenerator.service');

describe('CV Questions Generator Service', () => {
  describe('generateQuestionsForMissingFields', () => {
    test('should generate questions in English by default', () => {
      const missingFields = ['contact.email', 'availability.immediate'];
      const questions = generateQuestionsForMissingFields(missingFields);

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toHaveProperty('question');
      expect(questions[0]).toHaveProperty('type');
      expect(questions[0]).toHaveProperty('field');
      expect(questions[0]).toHaveProperty('priority');
    });

    test('should generate questions in Spanish when specified', () => {
      const missingFields = ['contact.email', 'availability.immediate'];
      const questions = generateQuestionsForMissingFields(missingFields, 'es');

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].question).toMatch(/¿/); // Spanish question mark
    });

    test('should default to English for unsupported language', () => {
      const missingFields = ['contact.email'];
      const questions = generateQuestionsForMissingFields(missingFields, 'fr');

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0].question).not.toMatch(/¿/);
    });

    test('should sort questions by priority', () => {
      const missingFields = [
        'remoteWorkExperience.yearsRemote', // low
        'contact.email', // critical
        'languages' // high
      ];
      const questions = generateQuestionsForMissingFields(missingFields);

      expect(questions.length).toBe(3);
      expect(questions[0].priority).toBe('critical');
      expect(questions[1].priority).toBe('high');
      expect(questions[2].priority).toBe('low');
    });

    test('should remove duplicate fields', () => {
      const missingFields = ['contact.email', 'contact.email', 'contact.email'];
      const questions = generateQuestionsForMissingFields(missingFields);

      expect(questions.length).toBe(1);
    });

    test('should handle array field references', () => {
      const missingFields = ['education[0].institution', 'education[1].degree'];
      const questions = generateQuestionsForMissingFields(missingFields);

      expect(questions.length).toBeGreaterThan(0);
    });

    test('should handle empty missing fields array', () => {
      const questions = generateQuestionsForMissingFields([]);
      expect(questions).toEqual([]);
    });
  });

  describe('generateConditionalQuestions', () => {
    test('should skip startDate question if immediate is true', () => {
      const missingFields = ['availability.startDate'];
      const currentAnswers = {
        availability: {
          immediate: true
        }
      };

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions).toEqual([]);
    });

    test('should include startDate question if immediate is false', () => {
      const missingFields = ['availability.startDate'];
      const currentAnswers = {
        availability: {
          immediate: false
        }
      };

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions.length).toBe(1);
      expect(questions[0].field).toBe('availability.startDate');
    });

    test('should skip travelFrequency if not willing to travel', () => {
      const missingFields = ['availability.travelFrequency'];
      const currentAnswers = {
        availability: {
          willingToTravel: false
        }
      };

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions).toEqual([]);
    });

    test('should include travelFrequency if willing to travel', () => {
      const missingFields = ['availability.travelFrequency'];
      const currentAnswers = {
        availability: {
          willingToTravel: true
        }
      };

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions.length).toBe(1);
      expect(questions[0].field).toBe('availability.travelFrequency');
    });

    test('should skip overtimeAvailability if not willing to work off-hours', () => {
      const missingFields = ['availability.overtimeAvailability'];
      const currentAnswers = {
        availability: {
          willingToWorkOffHours: false
        }
      };

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions).toEqual([]);
    });

    test('should include overtimeAvailability if willing to work off-hours', () => {
      const missingFields = ['availability.overtimeAvailability'];
      const currentAnswers = {
        availability: {
          willingToWorkOffHours: true
        }
      };

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions.length).toBe(1);
      expect(questions[0].field).toBe('availability.overtimeAvailability');
    });

    test('should skip countriesWorkedWith if no cross-cultural experience', () => {
      const missingFields = ['crossCulturalExperience.countriesWorkedWith'];
      const currentAnswers = {
        crossCulturalExperience: {
          hasExperience: false
        }
      };

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions).toEqual([]);
    });

    test('should include all unconditional questions', () => {
      const missingFields = ['contact.email', 'languages'];
      const currentAnswers = {};

      const questions = generateConditionalQuestions(missingFields, currentAnswers);

      expect(questions.length).toBe(2);
    });
  });

  describe('shouldAskQuestion', () => {
    test('should return false for startDate when immediate is true', () => {
      const currentAnswers = {
        availability: { immediate: true }
      };

      const result = shouldAskQuestion('availability.startDate', currentAnswers);
      expect(result).toBe(false);
    });

    test('should return true for startDate when immediate is false', () => {
      const currentAnswers = {
        availability: { immediate: false }
      };

      const result = shouldAskQuestion('availability.startDate', currentAnswers);
      expect(result).toBe(true);
    });

    test('should return false for travelFrequency when not willing to travel', () => {
      const currentAnswers = {
        availability: { willingToTravel: false }
      };

      const result = shouldAskQuestion('availability.travelFrequency', currentAnswers);
      expect(result).toBe(false);
    });

    test('should return true for travelFrequency when willing to travel', () => {
      const currentAnswers = {
        availability: { willingToTravel: true }
      };

      const result = shouldAskQuestion('availability.travelFrequency', currentAnswers);
      expect(result).toBe(true);
    });

    test('should return true for unconditional questions', () => {
      const result = shouldAskQuestion('contact.email', {});
      expect(result).toBe(true);
    });
  });

  describe('getQuestionsByCategory', () => {
    test('should group questions by category', () => {
      const missingFields = [
        'contact.email', // basic
        'availability.immediate', // availability
        'education', // background
        'skills.technical' // technical
      ];

      const grouped = getQuestionsByCategory(missingFields);

      expect(grouped).toHaveProperty('basic');
      expect(grouped).toHaveProperty('availability');
      expect(grouped).toHaveProperty('background');
      expect(grouped).toHaveProperty('technical');
    });

    test('should have arrays of questions for each category', () => {
      const missingFields = ['contact.email', 'contact.phones'];
      const grouped = getQuestionsByCategory(missingFields);

      expect(Array.isArray(grouped.basic)).toBe(true);
      expect(grouped.basic.length).toBeGreaterThan(0);
    });

    test('should support different languages', () => {
      const missingFields = ['contact.email'];
      const grouped = getQuestionsByCategory(missingFields, 'es');

      expect(grouped.basic[0].question).toMatch(/¿/);
    });

    test('should return empty object for no missing fields', () => {
      const grouped = getQuestionsByCategory([]);
      expect(Object.keys(grouped).length).toBe(0);
    });
  });

  describe('QUESTION_TEMPLATES', () => {
    test('should have both English and Spanish versions for all questions', () => {
      Object.entries(QUESTION_TEMPLATES).forEach(([key, template]) => {
        expect(template).toHaveProperty('en');
        expect(template).toHaveProperty('es');
      });
    });

    test('should have required properties in all questions', () => {
      Object.values(QUESTION_TEMPLATES).forEach(template => {
        ['en', 'es'].forEach(lang => {
          expect(template[lang]).toHaveProperty('question');
          expect(template[lang]).toHaveProperty('type');
          expect(template[lang]).toHaveProperty('required');
        });
      });
    });

    test('should have proper question types', () => {
      const validTypes = [
        'email',
        'phone',
        'text',
        'number',
        'date',
        'boolean',
        'select',
        'multiselect',
        'array'
      ];

      Object.values(QUESTION_TEMPLATES).forEach(template => {
        expect(validTypes).toContain(template.en.type);
        expect(validTypes).toContain(template.es.type);
      });
    });

    test('boolean questions should have options', () => {
      Object.entries(QUESTION_TEMPLATES).forEach(([key, template]) => {
        if (template.en.type === 'boolean') {
          expect(template.en).toHaveProperty('options');
          expect(template.en.options).toHaveLength(2);
          expect(template.es).toHaveProperty('options');
          expect(template.es.options).toHaveLength(2);
        }
      });
    });

    test('select questions should have options', () => {
      Object.entries(QUESTION_TEMPLATES).forEach(([key, template]) => {
        if (template.en.type === 'select') {
          expect(template.en).toHaveProperty('options');
          expect(template.en.options.length).toBeGreaterThan(0);
          expect(template.es).toHaveProperty('options');
          expect(template.es.options.length).toBeGreaterThan(0);
        }
      });
    });

    test('should have templates for all availability fields', () => {
      const availabilityFields = [
        'availability.immediate',
        'availability.startDate',
        'availability.willingToTravel',
        'availability.travelFrequency',
        'availability.willingToWorkOffHours',
        'availability.overtimeAvailability',
        'availability.weekendAvailability',
        'availability.onCallAvailability',
        'availability.willingToRelocate'
      ];

      availabilityFields.forEach(field => {
        expect(QUESTION_TEMPLATES[field]).toBeDefined();
        expect(QUESTION_TEMPLATES[field]).toHaveProperty('en');
        expect(QUESTION_TEMPLATES[field]).toHaveProperty('es');
      });
    });
  });
});
