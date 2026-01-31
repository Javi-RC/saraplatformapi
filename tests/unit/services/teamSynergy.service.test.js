const teamSynergyService = require('../../../src/services/teamSynergy.service');

describe('teamSynergy.service - Unit Tests', () => {
  it('_calculateComplementarity returns a score for 2+ profiles', () => {
    const profiles = [
      { traits: { Openness: 4.0, Conscientiousness: 3.0, Extraversion: 3.0, Agreeableness: 3.5, Neuroticism: 2.5 } },
      { traits: { Openness: 3.0, Conscientiousness: 4.0, Extraversion: 2.5, Agreeableness: 3.0, Neuroticism: 3.0 } }
    ];

    const result = teamSynergyService._calculateComplementarity(profiles);

    expect(result).toEqual(
      expect.objectContaining({
        score: expect.any(Number)
      })
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('_calculateRoleDiversity returns assignments and distribution', () => {
    const profiles = [
      { traits: { Openness: 4.2, Extraversion: 3.6, Conscientiousness: 3.0, Agreeableness: 3.2, Neuroticism: 2.5 } },
      { traits: { Openness: 3.6, Conscientiousness: 4.4, Extraversion: 2.6, Agreeableness: 3.3, Neuroticism: 2.2 } }
    ];

    const result = teamSynergyService._calculateRoleDiversity(profiles);

    expect(result).toEqual(
      expect.objectContaining({
        score: expect.any(Number),
        uniqueRoles: expect.any(Number),
        assignments: expect.any(Array),
        distribution: expect.any(Object)
      })
    );
  });
});
