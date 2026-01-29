describe('personalityOptimizer.service - Unit Tests', () => {
  function setup({ profiles = [], synergyAvailable = true } = {}) {
    jest.resetModules();

    const BFI44ResponseMock = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(profiles)
      })
    };

    const teamSynergyServiceMock = {
      calculateTeamSynergy: jest.fn().mockResolvedValue({
        available: synergyAvailable,
        overallScore: 80
      })
    };

    // Make PROJECT_PROFILES accessible via `.constructor.PROJECT_PROFILES`
    teamSynergyServiceMock.constructor = {
      PROJECT_PROFILES: {
        standard: {
          name: 'Standard',
          description: 'Standard',
          requirements: {
            Openness: { optimal: 3.5, weight: 0.2 },
            Conscientiousness: { optimal: 4.0, weight: 0.2 },
            Extraversion: { optimal: 3.0, weight: 0.2 },
            Agreeableness: { optimal: 3.5, weight: 0.2 },
            Neuroticism: { optimal: 3.0, weight: 0.2 }
          }
        }
      }
    };

    jest.doMock('../../../src/models/bfi44.model', () => BFI44ResponseMock);
    jest.doMock('../../../src/services/teamSynergy.service', () => teamSynergyServiceMock);

    const optimizer = require('../../../src/services/personalityOptimizer.service');
    return { optimizer, BFI44ResponseMock, teamSynergyServiceMock };
  }

  it('optimizeTeamComposition returns optimized=false when no candidates', async () => {
    const { optimizer } = setup();

    const result = await optimizer.optimizeTeamComposition([], {}, 3);

    expect(result.optimized).toBe(false);
    expect(result.team).toEqual([]);
  });

  it('optimizeTeamComposition returns optimized=false when no profiles available', async () => {
    const { optimizer } = setup({ profiles: [] });

    const candidates = [{ userId: 'u1' }, { userId: 'u2' }];
    const result = await optimizer.optimizeTeamComposition(candidates, {}, 2);

    expect(result.optimized).toBe(false);
    expect(result.team).toHaveLength(2);
  });

  it('optimizeTeamComposition returns optimized=true when profiles exist', async () => {
    const profiles = [
      {
        userId: { toString: () => 'u1' },
        results: { traits: { openness: 4, conscientiousness: 4, extraversion: 3, agreeableness: 3, neuroticism: 2 } },
        createdAt: new Date('2024-01-02')
      },
      {
        userId: { toString: () => 'u2' },
        results: { traits: { openness: 3, conscientiousness: 5, extraversion: 2, agreeableness: 4, neuroticism: 3 } },
        createdAt: new Date('2024-01-01')
      }
    ];

    const { optimizer, teamSynergyServiceMock } = setup({ profiles });

    const candidates = [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }];
    const result = await optimizer.optimizeTeamComposition(candidates, {}, 2);

    expect(result.optimized).toBe(true);
    expect(result.team).toHaveLength(2);
    expect(teamSynergyServiceMock.calculateTeamSynergy).toHaveBeenCalled();
  });
});
