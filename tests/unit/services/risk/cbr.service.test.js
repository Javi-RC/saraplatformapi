const cbr = require('../../../../src/services/risk/cbr.service');

describe('cbr.service - Unit Tests', () => {
  it('calculateSimilarity returns 0 when features2 is missing', () => {
    expect(cbr.calculateSimilarity({ coordination: { timeOverlap: 1 } }, null)).toBe(0);
  });

  it('calculateSimilarity returns a value clamped to [0, 1]', () => {
    const f1 = {
      coordination: { timeOverlap: 4, weeklyMeetings: 2, involvedCountries: ['Europe'] },
      technical: { experienceLevel: 'senior', mainTechnologies: ['Node.js'] },
      team: { size: 5, weeklyHours: 40 },
      management: { methodology: 'scrum' },
      organizational: { involvedTeams: 2, stakeholdersCount: 3 }
    };

    const f2 = {
      coordination: { timeOverlap: 4, weeklyMeetings: 2, involvedCountries: ['europe'] },
      technical: { experienceLevel: 'senior', mainTechnologies: ['node.js'] },
      team: { size: 6, weeklyHours: 40 },
      management: { methodology: 'scrum' },
      organizational: { involvedTeams: 2, stakeholdersCount: 3 }
    };

    const sim = cbr.calculateSimilarity(f1, f2);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
    expect(sim).toBeGreaterThan(0.3);
  });

  it('extractProjectFeatures should include language coverage from teamAnalysis', () => {
    const project = {
      expectedTimeOverlap: { value: 3 },
      weeklyMeetingsCount: 1,
      mainTechnologies: ['Node.js'],
      assignedEmployees: [{}, {}]
    };

    const teamAnalysis = {
      languages: { hasAllRequired: false, coverage: 0.5 },
      technicalMatch: { matchPercentage: 80, missing: ['react'], avgProficiency: 3 }
    };

    const features = cbr.extractProjectFeatures(project, teamAnalysis);
    expect(features.coordination.hasLanguageBarriers).toBe(true);
    expect(features.coordination.languageCoverage).toBe(0.5);
    expect(features.technical.techMatchPercentage).toBe(80);
  });
});
