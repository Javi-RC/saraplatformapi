const decisionTree = require('../../../src/services/decisionTree.service');

describe('decisionTree.service - Unit Tests', () => {
  it('checkConflictEscalationRisk returns null when personality is unavailable', () => {
    const risk = decisionTree.checkConflictEscalationRisk({}, { personality: { available: false } });
    expect(risk).toBeNull();
  });

  it('checkConflictEscalationRisk returns a risk object for low agreeableness + high variance', () => {
    const project = {
      culturalDiversityLevel: 'high',
      involvedTeams: [{}, {}, {}],
      criticalDependencies: [{}, {}, {}]
    };

    const teamAnalysis = {
      personality: {
        available: true,
        teamCoverage: 0.5,
        traits: {
          Agreeableness: {
            average: 2.0,
            variance: 2.0
          }
        }
      }
    };

    const risk = decisionTree.checkConflictEscalationRisk(project, teamAnalysis);

    expect(risk).toEqual(
      expect.objectContaining({
        type: 'conflict_escalation_risk',
        source: 'expert_rules_big_five',
        severity: expect.stringMatching(/medium|medium-high|high/)
      })
    );

    // Catalog-only output: should not include extra analytical fields
    expect(risk).not.toHaveProperty('probability');
    expect(risk).not.toHaveProperty('confidence');
    expect(risk).not.toHaveProperty('predictedImpact');
    expect(risk).not.toHaveProperty('earlyWarningSignals');

    expect(risk.severity).toMatch(/medium|medium-high|high/);
  });
});
