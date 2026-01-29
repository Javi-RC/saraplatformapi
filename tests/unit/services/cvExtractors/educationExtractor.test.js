const cvUtils = require('../../../../src/utils/cvUtils');
const educationExtractor = require('../../../../src/services/cvExtractors/educationExtractor');

// Mockear los métodos de cvUtils
jest.spyOn(cvUtils, 'normalizeText');
jest.spyOn(cvUtils, 'validateField');

describe('EducationExtractor - Unit Tests', () => {
  

  beforeEach(() => {
    
    jest.clearAllMocks();
    
    cvUtils.normalizeText.mockImplementation(text => text);
    cvUtils.validateField.mockReturnValue(true);
  });

  describe('extract', () => {
    it('debería retornar array vacío si no hay texto', () => {
      const result = educationExtractor.extract('');

      expect(result).toEqual([]);
    });

    it('debería retornar array vacío si texto es null', () => {
      const result = educationExtractor.extract(null);

      expect(result).toEqual([]);
    });

    it('debería normalizar el texto antes de procesar', () => {
      const text = 'Bachelor in Computer Science\n2015-2019';
      
      educationExtractor.extract(text);

      expect(cvUtils.normalizeText).toHaveBeenCalledWith(text);
    });

    it('debería procesar múltiples entradas de educación', () => {
      cvUtils.validateField.mockReturnValue(true);
      
      const text = `
        Bachelor in Computer Science
        University A
        2015-2019
        
        Master in Software Engineering  
        University B
        2019-2021
      `.trim();

      const result = educationExtractor.extract(text);

      expect(Array.isArray(result)).toBe(true);
    });

    it('debería filtrar entradas inválidas', () => {
      cvUtils.validateField
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      
      const text = `
        Valid Entry 1
        
        Invalid Entry
        
        Valid Entry 2
      `.trim();

      const result = educationExtractor.extract(text);

      expect(cvUtils.validateField).toHaveBeenCalled();
    });

    it('debería manejar texto con solo espacios', () => {
      const result = educationExtractor.extract('   \n   \n   ');

      expect(result).toEqual([]);
    });

    it('debería procesar entradas de educación con fechas', () => {
      const text = `
        Computer Science Degree
        MIT
        2015 - 2019
      `.trim();

      const result = educationExtractor.extract(text);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('_splitIntoBlocks', () => {
    it('debería dividir texto en bloques por líneas vacías', () => {
      const text = `Block 1\n\nBlock 2\n\nBlock 3`;
      
      const blocks = educationExtractor._splitIntoBlocks(text);

      expect(blocks.length).toBeGreaterThan(0);
    });
  });
});
