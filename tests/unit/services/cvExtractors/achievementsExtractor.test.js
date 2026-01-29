const achievementsExtractor = require('../../../../src/services/cvExtractors/achievementsExtractor');
const cvUtils = require('../../../../src/utils/cvUtils');

describe('AchievementsExtractor - Unit Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should return empty structure when sectionText is empty', () => {
    expect(achievementsExtractor.extract('')).toEqual({
      publications: [],
      awards: [],
      hackathons: []
    });
  });

  it('should extract publications when publication keywords exist', () => {
    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);

    const text = [
      'Publication: My First Article',
      '2022',
      'https://example.com/paper',
      '',
      'Conference paper: Another Paper',
      '2021'
    ].join('\n');

    const result = achievementsExtractor.extract(text);

    expect(result.publications.length).toBeGreaterThan(0);
    expect(result.publications[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        type: expect.any(String)
      })
    );
  });

  it('should extract awards and issuer when award keywords exist', () => {
    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);

    const text = [
      'Award: Best Developer Award',
      'Issued by ACM',
      '2020'
    ].join('\n');

    const result = achievementsExtractor.extract(text);

    expect(result.awards.length).toBe(1);
    expect(result.awards[0].name).toContain('Award');
    expect(result.awards[0].issuer).toBeTruthy();
  });

  it('should extract hackathons with position when hackathon keywords exist', () => {
    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);

    const text = [
      'Global Hackathon',
      'Winner',
      '2021'
    ].join('\n');

    const result = achievementsExtractor.extract(text);

    expect(result.hackathons.length).toBe(1);
    expect(result.hackathons[0].name).toContain('Hackathon');
    expect(String(result.hackathons[0].position || '').toLowerCase()).toContain('winner');
  });

  it('should fallback to generic achievements when no specific keywords found', () => {
    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);

    const text = [
      'Reached 1M users',
      '2023'
    ].join('\n');

    const result = achievementsExtractor.extract(text);

    expect(result.publications).toEqual([]);
    expect(result.hackathons).toEqual([]);
    expect(result.awards.length).toBeGreaterThan(0);
    expect(result.awards[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String)
      })
    );
  });
});
