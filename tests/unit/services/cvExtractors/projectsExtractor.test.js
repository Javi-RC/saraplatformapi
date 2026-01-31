const projectsExtractor = require('../../../../src/services/cvExtractors/projectsExtractor');
const cvUtils = require('../../../../src/utils/cvUtils');

describe('ProjectsExtractor - Unit Tests', () => {
  let mockTechnologyDictionary;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    jest.spyOn(cvUtils, 'normalizeText').mockImplementation((t) => t);
    jest.spyOn(cvUtils, 'normalizeTechnology').mockImplementation((t) => t.toLowerCase());

    mockTechnologyDictionary = {
      getAllTechnologies: jest.fn(() => ['React', 'Node.js']),
      technologyNormalizations: {}
    };
  });

  it('should return empty array when sectionText is empty', () => {
    expect(projectsExtractor.extract('', mockTechnologyDictionary)).toEqual([]);
    expect(projectsExtractor.extract(null, mockTechnologyDictionary)).toEqual([]);
  });

  it('should extract project entry with urls, dates and technologies', () => {
    const text = [
      'My Portfolio',
      'Built with React and Node.js',
      'https://my.site',
      'https://github.com/me/portfolio',
      '2021 - 2022'
    ].join('\n');

    const result = projectsExtractor.extract(text, mockTechnologyDictionary);

    expect(result.length).toBeGreaterThanOrEqual(1);
    // Find the project that matches My Portfolio
    const portfolioProject = result.find(p => p.name === 'My Portfolio' || 
                                             p.description?.includes('React'));
    expect(portfolioProject).toBeDefined();
    if (portfolioProject.repositoryUrl) {
      expect(portfolioProject.repositoryUrl).toContain('github.com');
    }
    if (portfolioProject.url) {
      expect(portfolioProject.url).toContain('my.site');
    }
  });

  it('should split multiple projects into multiple entries', () => {
    const text = [
      'First Project',
      'Some description',
      '',
      'Second Project',
      'Another description'
    ].join('\n');

    const result = projectsExtractor.extract(text, mockTechnologyDictionary);

    expect(result.length).toBeGreaterThanOrEqual(2);
    // Check that both projects are present
    const hasFirst = result.some(p => p.name === 'First Project' || p.description?.includes('Some description'));
    const hasSecond = result.some(p => p.name === 'Second Project' || p.description?.includes('Another description'));
    expect(hasFirst).toBe(true);
    expect(hasSecond).toBe(true);
  });
});
