const postProject = require('../../../../src/services/risk/postProject.service');
const i18n = require('../../../../src/i18n/i18n.service');

describe('postProject.service - Unit Tests', () => {
  describe('calculatePredictionAccuracy', () => {
    it('returns 0 when no predictions', () => {
      const result = postProject.calculatePredictionAccuracy([], []);
      expect(result).toBe(0);
    });

    it('counts correct predictions only', () => {
      const predicted = [{ type: 'a' }, { type: 'b' }];
      const actualized = [{ type: 'a', occurred: true }, { type: 'c', occurred: true }];

      const result = postProject.calculatePredictionAccuracy(predicted, actualized);

      expect(result).toBe(1);
    });
  });

  describe('i18n integration - risk translations', () => {
    it('should translate risk types to Spanish', () => {
      const riskTypes = [
        'timezone_scheduling_gap',
        'social_isolation',
        'team_autonomy_risk',
        'schedule_flexibility_risk',
        'travel_availability_risk',
        'communication_breakdown'
      ];

      riskTypes.forEach(type => {
        const translated = i18n.translateRisk(type, 'es');
        expect(translated).toBeDefined();
        expect(translated.title).toBeDefined();
        expect(translated.title).not.toBe(type); // Should not return the raw type
        expect(translated.description).toBeDefined();
      });
    });

    it('should translate risk types to English', () => {
      const riskTypes = [
        'timezone_scheduling_gap',
        'social_isolation',
        'team_autonomy_risk',
        'schedule_flexibility_risk',
        'travel_availability_risk',
        'communication_breakdown'
      ];

      riskTypes.forEach(type => {
        const translated = i18n.translateRisk(type, 'en');
        expect(translated).toBeDefined();
        expect(translated.title).toBeDefined();
        expect(translated.title).not.toBe(type); // Should not return the raw type
        expect(translated.description).toBeDefined();
      });
    });

    it('should have Spanish translations for postProject section', () => {
      const keys = [
        'postProject.sections.generalOutcome',
        'postProject.sections.predictedRisks',
        'postProject.sections.lessonsLearned',
        'postProject.fields.completed',
        'postProject.fields.actualCompletedDate',
        'postProject.fields.qualityScore',
        'postProject.fields.clientSatisfaction',
        'postProject.fields.teamMorale',
        'postProject.fields.budgetOverrun',
        'postProject.fields.actualizedRisks',
        'postProject.fields.lessonsLearned',
        'postProject.fields.successfulPractices',
        'postProject.fields.unsuccessfulPractices',
        'postProject.fields.recommendations'
      ];

      keys.forEach(key => {
        const translated = i18n.translate('es', key);
        expect(translated).toBeDefined();
        expect(translated).not.toBe(key); // Should not return the raw key
      });
    });

    it('should have English translations for postProject section', () => {
      const keys = [
        'postProject.sections.generalOutcome',
        'postProject.sections.predictedRisks',
        'postProject.sections.lessonsLearned',
        'postProject.fields.completed',
        'postProject.fields.actualCompletedDate'
      ];

      keys.forEach(key => {
        const translated = i18n.translate('en', key);
        expect(translated).toBeDefined();
        expect(translated).not.toBe(key); // Should not return the raw key
      });
    });

    it('should have risk descriptions for postProject in Spanish', () => {
      const riskTypes = [
        'communication_breakdown',
        'process_mismatch',
        'scope_creep',
        'team_overload',
        'dependency_blockage',
        'timezone_scheduling_gap',
        'social_isolation',
        'team_autonomy_risk',
        'schedule_flexibility_risk',
        'travel_availability_risk'
      ];

      riskTypes.forEach(type => {
        const key = `postProject.riskDescriptions.${type}`;
        const translated = i18n.translate('es', key);
        expect(translated).toBeDefined();
        expect(translated).not.toBe(key); // Should not return the raw key
      });
    });
  });
});
