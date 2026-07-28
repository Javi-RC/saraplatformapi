const cvUtils = require('../../../../../src/utils/cvUtils');
const skillsExtractor = require('../../../../../src/services/cv/extractors/skillsExtractor');

// Mockear los métodos de cvUtils
jest.spyOn(cvUtils, 'normalizeText');
jest.spyOn(cvUtils, 'normalizeTechnology');

describe('SkillsExtractor - Unit Tests', () => {
  
  let mockTechnologyDictionary;

  beforeEach(() => {
    
    
    mockTechnologyDictionary = {
      getAllTechnologies: jest.fn(),
      detectTechnologyCategory: jest.fn(() => 'other'),
      technologyNormalizations: {}
    };
    
    jest.clearAllMocks();
    
    cvUtils.normalizeText.mockImplementation(text => text);
    cvUtils.normalizeTechnology.mockImplementation((tech) => tech.toLowerCase());
  });

  describe('extract', () => {
    it('debería retornar estructura vacía si no hay texto', () => {
      const result = skillsExtractor.extract('', mockTechnologyDictionary);

      expect(result).toEqual({ technical: [], soft: [] });
    });

    it('debería retornar estructura vacía si texto es null', () => {
      const result = skillsExtractor.extract(null, mockTechnologyDictionary);

      expect(result).toEqual({ technical: [], soft: [] });
    });

    it('debería extraer habilidades técnicas del diccionario', () => {
      mockTechnologyDictionary.getAllTechnologies.mockReturnValue([
        'JavaScript', 'Python', 'React'
      ]);

      const text = 'I have experience with JavaScript, Python, and React';
      
      const result = skillsExtractor.extract(text, mockTechnologyDictionary);

      expect(result.technical.length).toBeGreaterThan(0);
      expect(mockTechnologyDictionary.getAllTechnologies).toHaveBeenCalled();
    });

    it('debería manejar diccionario vacío', () => {
      mockTechnologyDictionary.getAllTechnologies.mockReturnValue([]);

      const text = 'JavaScript, Python, React';
      
      const result = skillsExtractor.extract(text, mockTechnologyDictionary);

      expect(result.technical).toEqual([]);
    });

    it('debería extraer habilidades sin diccionario', () => {
      const text = 'Skills: Leadership, Communication, Problem Solving';
      
      const result = skillsExtractor.extract(text, null);

      expect(result.technical).toEqual([]);
      expect(result.soft.length).toBeGreaterThan(0);
    });

    it('debería normalizar el texto antes de procesar', () => {
      mockTechnologyDictionary.getAllTechnologies.mockReturnValue(['Java']);
      
      const text = 'Java  \n  Experience';
      skillsExtractor.extract(text, mockTechnologyDictionary);

      expect(cvUtils.normalizeText).toHaveBeenCalledWith(text);
    });

    it('debería manejar texto con múltiples líneas', () => {
      mockTechnologyDictionary.getAllTechnologies.mockReturnValue(['Node.js']);

      const text = 'Technical Skills:\n- Node.js\n- Express\n- MongoDB';
      
      const result = skillsExtractor.extract(text, mockTechnologyDictionary);

      expect(result).toHaveProperty('technical');
      expect(result).toHaveProperty('soft');
    });
  });
});
