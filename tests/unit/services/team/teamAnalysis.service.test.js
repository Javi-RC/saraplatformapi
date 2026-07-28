const teamAnalysisService = require('../../../../src/services/team/teamAnalysis.service');

describe('teamAnalysis.service - Unit Tests', () => {
  it('extractTeamSkills aggregates and categorizes skills', () => {
    const cvs = [
      {
        skills: {
          technical: [
            { name: 'JavaScript', level: 'avanzado', category: 'programming' },
            { name: 'React', level: 'intermedio', category: 'frameworks' }
          ]
        }
      },
      {
        skills: {
          technical: [
            { name: 'javascript', level: 'experto', category: 'programming' },
            { name: 'PostgreSQL', level: 'intermedio', category: 'databases' }
          ]
        }
      }
    ];

    const result = teamAnalysisService.extractTeamSkills(cvs);

    expect(result.count).toBeGreaterThanOrEqual(3);
    expect(result.all).toEqual(expect.arrayContaining(['javascript', 'react', 'postgresql']));
    expect(result.levels.javascript).toBe('experto');
    expect(result.categories.programming).toEqual(expect.arrayContaining(['javascript']));
  });

  it('analyzeTeamPersonality marks unavailable when no results', () => {
    const result = teamAnalysisService.analyzeTeamPersonality([]);
    expect(result).toEqual(expect.objectContaining({ available: false }));
  });
});
