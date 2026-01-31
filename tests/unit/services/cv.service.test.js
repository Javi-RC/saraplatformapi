const cvService = require('../../../src/services/cv.service');

describe('cv.service - Unit Tests', () => {
  it('_cleanEmptyFields removes empty arrays and empty nested structures', () => {
    const cvData = {
      education: [],
      experience: [],
      languages: [],
      projects: [],
      certifications: [],
      skills: { technical: [], soft: [] },
      achievements: { publications: [], awards: [], hackathons: [] }
    };

    cvService._cleanEmptyFields(cvData);

    expect(cvData.education).toBeUndefined();
    expect(cvData.experience).toBeUndefined();
    expect(cvData.languages).toBeUndefined();
    expect(cvData.projects).toBeUndefined();
    expect(cvData.certifications).toBeUndefined();
    expect(cvData.skills).toBeUndefined();
    expect(cvData.achievements).toBeUndefined();
  });
});
