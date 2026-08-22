const { translateSynergyObject, translateSynergy, translateSynergyValidation, translateSynergyValidations, translateHiringRecommendations } = require('../../../src/i18n/i18n.service');

describe('i18n - Synergy Translations', () => {
  describe('translateSynergy', () => {
    it('should return Spanish role name by default', () => {
      const result = translateSynergy('roles.innovator.name');
      expect(result).toBe('Innovador/Creador');
    });

    it('should return English role name when lang is en', () => {
      const result = translateSynergy('roles.innovator.name', 'en');
      expect(result).toBe('Innovator/Creator');
    });

    it('should return Spanish project fit message with params', () => {
      const result = translateSynergy('messages.projectFit.excellent', 'es', { projectType: 'Innovación/Startup' });
      expect(result).toBe('La personalidad del equipo es excelente para Innovación/Startup');
    });

    it('should fall back to default language for unsupported lang', () => {
      const result = translateSynergy('roles.executor.name', 'fr');
      expect(result).toBe('Ejecutor/Implementador');
    });
  });

  describe('translateSynergyObject - not available', () => {
    it('should translate message and recommendation when synergy is not available (es)', () => {
      const input = {
        available: false,
        message: 'No personality data available for team members',
        recommendation: 'Request team members to complete BFI-44 assessment'
      };

      const result = translateSynergyObject(input, 'es');

      expect(result.message).toBe('No hay datos de personalidad disponibles para los miembros del equipo');
      expect(result.recommendation).toBe('Solicita a los miembros del equipo que completen la evaluación BFI-44');
    });

    it('should keep English messages when lang is en', () => {
      const input = {
        available: false,
        message: 'No personality data available for team members',
        recommendation: 'Request team members to complete BFI-44 assessment'
      };

      const result = translateSynergyObject(input, 'en');

      expect(result.message).toBe('No personality data available for team members');
      expect(result.recommendation).toBe('Request team members to complete BFI-44 assessment');
    });
  });

  describe('translateSynergyObject - full synergy', () => {
    const buildSynergyData = () => ({
      available: true,
      teamSize: 3,
      profilesCovered: 3,
      coveragePercentage: 100,
      projectType: 'innovation',
      projectProfile: {
        name: 'Innovation/Startup',
        description: 'New product development with novel technologies'
      },
      overallScore: 75,
      metrics: {
        roleDiversity: {
          score: 80,
          level: 'excellent',
          averageStdDev: 0.34,
          traitVariance: {
            Openness: { stdDev: 0.3, normalizedScore: 15 },
            Conscientiousness: { stdDev: 0.7, normalizedScore: 35 },
            Extraversion: { stdDev: 0.5, normalizedScore: 25 },
            Agreeableness: { stdDev: 0.05, normalizedScore: 2 },
            Neuroticism: { stdDev: 0.15, normalizedScore: 7 }
          }
        },
        projectFit: {
          score: 70,
          level: 'good',
          projectType: 'Innovation/Startup',
          message: 'Team personality is good for Innovation/Startup'
        },
        previousCollaborations: {
          score: 45,
          totalCollaborations: 2,
          pairsWithHistory: 1,
          totalPairs: 3,
          collaborationPercentage: 33,
          level: 'fair',
          message: 'Moderate collaboration history - 33% of pairs have worked together'
        }
      },
      recommendations: [
        {
          category: 'previous_collaborations',
          priority: 'medium',
          title: 'Build Team Cohesion',
          description: 'Limited collaboration history detected (33% of pairs have worked together)',
          actions: ['Schedule team-building activities']
        }
      ]
    });

    it('should translate project profile to Spanish', () => {
      const result = translateSynergyObject(buildSynergyData(), 'es');

      expect(result.projectProfile.name).toBe('Innovación/Startup');
      expect(result.projectProfile.description).toBe('Desarrollo de productos nuevos con tecnologías novedosas');
    });

    it('should pass through roleDiversity trait variance and translate level', () => {
      const result = translateSynergyObject(buildSynergyData(), 'es');

      expect(result.metrics.roleDiversity.traitVariance).toEqual(buildSynergyData().metrics.roleDiversity.traitVariance);
      expect(result.metrics.roleDiversity.averageStdDev).toBe(0.34);
      expect(result.metrics.roleDiversity.level).toBe('excelente');
    });

    it('should translate score levels to Spanish', () => {
      const result = translateSynergyObject(buildSynergyData(), 'es');

      expect(result.metrics.roleDiversity.level).toBe('excelente');
      expect(result.metrics.projectFit.level).toBe('bueno');
      expect(result.metrics.previousCollaborations.level).toBe('regular');
    });

    it('should translate project fit message to Spanish', () => {
      const result = translateSynergyObject(buildSynergyData(), 'es');

      expect(result.metrics.projectFit.message).toContain('Innovación/Startup');
      expect(result.metrics.projectFit.message).toContain('buena');
    });

    it('should translate previous collaborations message to Spanish', () => {
      const result = translateSynergyObject(buildSynergyData(), 'es');

      expect(result.metrics.previousCollaborations.message).toContain('33%');
      expect(result.metrics.previousCollaborations.message).toContain('moderado');
    });

    it('should translate recommendations to Spanish', () => {
      const result = translateSynergyObject(buildSynergyData(), 'es');

      expect(result.recommendations[0].title).toBe('Construir cohesión de equipo');
    });

    it('should keep English values when lang is en', () => {
      const result = translateSynergyObject(buildSynergyData(), 'en');

      expect(result.projectProfile.name).toBe('Innovation/Startup');
      expect(result.metrics.roleDiversity.level).toBe('excellent');
      expect(result.metrics.roleDiversity.averageStdDev).toBe(0.34);
    });

    it('should return null for null input', () => {
      expect(translateSynergyObject(null, 'es')).toBeNull();
    });

    it('should translate explanation summary when present', () => {
      const data = buildSynergyData();
      data.explanation = {
        summary: {
          score: 75,
          level: 'good',
          text: 'This team has good synergy (75/100) for innovation projects.'
        },
        strengths: [
          { area: 'Trait Diversity', score: 80, description: 'Team has good Big Five trait diversity' }
        ],
        concerns: [
          { area: 'Previous Collaborations', score: 45, severity: 'medium', description: 'Limited collaboration history' }
        ],
        recommendations: data.recommendations
      };

      const result = translateSynergyObject(data, 'es');

      expect(result.explanation.summary.level).toBe('bueno');
      expect(result.explanation.summary.text).toContain('sinergia');
      expect(result.explanation.strengths[0].description).toContain('diversidad de rasgos');
      expect(result.explanation.concerns[0].description).toContain('inexistente');
    });
  });

  describe('translateSynergyValidation - addition messages', () => {
    it('should translate excellent addition message to Spanish', () => {
      const validation = {
        userId: 'user1',
        recommended: true,
        synergyImpact: 8,
        message: 'Excellent addition - significantly improves team synergy'
      };

      const result = translateSynergyValidation(validation, 'es');

      expect(result.message).toBe('Excelente incorporación — mejora significativamente la sinergia del equipo');
    });

    it('should translate good addition message to Spanish', () => {
      const result = translateSynergyValidation({
        synergyImpact: 3,
        message: 'Good addition - improves team synergy'
      }, 'es');

      expect(result.message).toBe('Buena incorporación — mejora la sinergia del equipo');
    });

    it('should translate neutral addition message to Spanish', () => {
      const result = translateSynergyValidation({
        synergyImpact: 0,
        message: 'Neutral addition - maintains current synergy level'
      }, 'es');

      expect(result.message).toBe('Incorporación neutral — mantiene el nivel de sinergia actual');
    });

    it('should translate warning message to Spanish', () => {
      const result = translateSynergyValidation({
        synergyImpact: -7,
        message: 'Warning - may negatively impact team synergy.'
      }, 'es');

      expect(result.message).toContain('Advertencia');
    });

    it('should translate no-data message to Spanish', () => {
      const result = translateSynergyValidation({
        synergyImpact: null,
        message: 'Unable to assess impact'
      }, 'es');

      expect(result.message).toContain('falta de datos de personalidad');
    });

    it('should keep English when lang is en', () => {
      const result = translateSynergyValidation({
        synergyImpact: 8,
        message: 'Excellent addition - significantly improves team synergy'
      }, 'en');

      expect(result.message).toBe('Excellent addition - significantly improves team synergy');
    });

    it('should return null for null input', () => {
      expect(translateSynergyValidation(null, 'es')).toBeNull();
    });
  });

  describe('translateSynergyValidations - array', () => {
    it('should translate an array of validations to Spanish', () => {
      const validations = [
        { userId: 'u1', synergyImpact: 8, message: 'Excellent addition' },
        { userId: 'u2', synergyImpact: 0, message: 'Neutral addition' }
      ];

      const results = translateSynergyValidations(validations, 'es');

      expect(results[0].message).toContain('Excelente incorporación');
      expect(results[1].message).toContain('Incorporación neutral');
    });

    it('should return non-array input as-is', () => {
      expect(translateSynergyValidations(null, 'es')).toBeNull();
    });
  });

  describe('translateHiringRecommendations', () => {
    it('should translate not-available message to Spanish', () => {
      const input = {
        available: false,
        message: 'Unable to generate recommendations without personality data'
      };

      const result = translateHiringRecommendations(input, 'es');

      expect(result.message).toBe('No se pueden generar recomendaciones sin datos de personalidad');
    });

    it('should translate role names in ideal profiles to Spanish', () => {
      const input = {
        available: true,
        recommendations: {
          idealProfiles: [
            { role: 'innovator', name: 'Innovator/Creator', description: 'Generates new ideas', priority: 'high' }
          ],
          avoidProfiles: [],
          reasoning: ['Seek Innovator/Creator to fill missing role in team']
        }
      };

      const result = translateHiringRecommendations(input, 'es');

      expect(result.recommendations.idealProfiles[0].name).toBe('Innovador/Creador');
      expect(result.recommendations.idealProfiles[0].description).toBe('Genera nuevas ideas y soluciones creativas');
      expect(result.recommendations.reasoning[0]).toContain('Buscar');
    });

    it('should return null for null input', () => {
      expect(translateHiringRecommendations(null, 'es')).toBeNull();
    });
  });
});
