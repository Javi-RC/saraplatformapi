const BFI44Service = require('../../../../src/services/core/bfi44.service');

describe('bfi44.service - Unit Tests', () => {
  it('reverseScore should invert 1..5 scale', () => {
    expect(BFI44Service.reverseScore(1)).toBe(5);
    expect(BFI44Service.reverseScore(5)).toBe(1);
    expect(BFI44Service.reverseScore(3)).toBe(3);
  });

  it('validateResponses should reject wrong response count', () => {
    expect(() => BFI44Service.validateResponses({ 1: 3 })).toThrow('Invalid response count');
  });

  it('validateResponses should reject missing questions', () => {
    const responses = {};
    for (let i = 1; i <= 44; i++) {
      responses[i.toString()] = 3;
    }
    delete responses['10'];

    // Keep the count at 44 so we can reach the missing-question validation
    responses['45'] = 3;

    expect(() => BFI44Service.validateResponses(responses)).toThrow('Missing question 10');
  });

  it('validateResponses should reject values outside 1..5', () => {
    const responses = {};
    for (let i = 1; i <= 44; i++) {
      responses[i.toString()] = 3;
    }
    responses['1'] = 9;

    expect(() => BFI44Service.validateResponses(responses)).toThrow('Invalid value for question 1');
  });

  it('calculateFactorScore should throw when an item is missing in Map', () => {
    const map = new Map();
    // Only populate some values
    map.set('1', 3);
    map.set('6', 3);

    expect(() => BFI44Service.calculateFactorScore(map, 'Extraversion')).toThrow('Missing item 11');
  });

  it('calculateAllFactors should return numeric scores for all factors', () => {
    const responsesObj = {};
    for (let i = 1; i <= 44; i++) {
      responsesObj[i.toString()] = 3;
    }

    BFI44Service.validateResponses(responsesObj);

    const responsesMap = new Map(Object.entries(responsesObj).map(([k, v]) => [k, v]));
    const results = BFI44Service.calculateAllFactors(responsesMap);

    expect(results).toEqual(
      expect.objectContaining({
        Extraversion: expect.any(Number),
        Agreeableness: expect.any(Number),
        Conscientiousness: expect.any(Number),
        Neuroticism: expect.any(Number),
        Openness: expect.any(Number)
      })
    );
  });
});
