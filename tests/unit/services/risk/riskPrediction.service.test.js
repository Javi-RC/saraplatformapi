const { combineRisks } = require('../../../../src/services/risk/riskPrediction.service');

describe('riskPrediction.service - Unit Tests', () => {
  it('combineRisks separates DT and CBR risks with detection summary', () => {
    const treeRisks = [
      {
        type: 'communication_breakdown',
        title: 'Comm',
        description: 'd',
        category: 'coordination',
        severity: 'medium',
        reasoning: 'DT reasoning',
        indicators: ['indicator1'],
        recommendations: ['A']
      }
    ];

    const cbrRisks = [
      {
        type: 'communication_breakdown',
        title: 'Comm2',
        description: 'd2',
        category: 'coordination',
        severity: 'high',
        similarity: 0.85,
        reasoning: 'CBR reasoning',
        recommendations: ['B']
      }
    ];

    const combined = combineRisks(treeRisks, cbrRisks);

    expect(combined).toHaveProperty('dtRisks');
    expect(combined).toHaveProperty('cbrRisks');
    expect(combined).toHaveProperty('detectionSummary');
    expect(combined.dtRisks).toHaveLength(1);
    expect(combined.cbrRisks).toHaveLength(1);
    expect(combined.dtRisks[0].source).toBe('expert_rules');
    expect(combined.cbrRisks[0].source).toBe('cbr');
    expect(combined.detectionSummary.commonTypes).toContain('communication_breakdown');
  });
});
