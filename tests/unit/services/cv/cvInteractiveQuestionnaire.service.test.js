const questionnaire = require('../../../../src/services/cv/cvInteractiveQuestionnaire.service');

describe('cvInteractiveQuestionnaire.service - Unit Tests', () => {
  it('generateSessionId returns a non-empty string', () => {
    const id = questionnaire.generateSessionId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(5);
  });

  it('validateResponse returns errors for required empty string', () => {
    const result = questionnaire.validateResponse({ type: 'email', required: true }, '');
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('calculateProgress returns percentage in [0,100]', () => {
    const progress = questionnaire.calculateProgress(85);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThanOrEqual(100);
  });
});
