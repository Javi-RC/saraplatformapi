const dictionaries = require('../../../src/utils/dictionaries');

describe('Dictionaries - Unit Tests', () => {
  describe('getAllTechnologies', () => {
    it('should return all technologies in a flat array', () => {
      const allTech = dictionaries.getAllTechnologies();
      
      expect(Array.isArray(allTech)).toBe(true);
      expect(allTech.length).toBeGreaterThan(0);
      expect(allTech).toContain('JavaScript');
      expect(allTech).toContain('React');
      expect(allTech).toContain('Node.js');
      expect(allTech).toContain('MongoDB');
    });

    it('should include technologies from all categories', () => {
      const allTech = dictionaries.getAllTechnologies();
      
      // Languages
      expect(allTech).toContain('Python');
      // Frontend
      expect(allTech).toContain('Angular');
      // Backend
      expect(allTech).toContain('Django');
      // Databases
      expect(allTech).toContain('PostgreSQL');
      // Cloud
      expect(allTech).toContain('AWS');
      // Tools
      expect(allTech).toContain('Git');
    });
  });

  describe('getAllCities', () => {
    it('should return all cities in a flat array', () => {
      const allCities = dictionaries.getAllCities();
      
      expect(Array.isArray(allCities)).toBe(true);
      expect(allCities.length).toBeGreaterThan(0);
      expect(allCities).toContain('Madrid');
      expect(allCities).toContain('Barcelona');
      expect(allCities).toContain('London');
      expect(allCities).toContain('New York');
    });

    it('should include both spanish and international cities', () => {
      const allCities = dictionaries.getAllCities();
      
      // Spanish cities
      expect(allCities).toContain('Valencia');
      expect(allCities).toContain('Sevilla');
      // International cities
      expect(allCities).toContain('Paris');
      expect(allCities).toContain('Berlin');
    });
  });

  describe('normalizeTechnology', () => {
    it('should normalize common technology variations', () => {
      expect(dictionaries.normalizeTechnology('node')).toBe('Node.js');
      expect(dictionaries.normalizeTechnology('nodejs')).toBe('Node.js');
      expect(dictionaries.normalizeTechnology('react.js')).toBe('React');
      expect(dictionaries.normalizeTechnology('reactjs')).toBe('React');
      expect(dictionaries.normalizeTechnology('vue.js')).toBe('Vue');
      expect(dictionaries.normalizeTechnology('vuejs')).toBe('Vue');
    });

    it('should handle case insensitive input', () => {
      expect(dictionaries.normalizeTechnology('NODE')).toBe('Node.js');
      expect(dictionaries.normalizeTechnology('REACTJS')).toBe('React');
      expect(dictionaries.normalizeTechnology('K8S')).toBe('Kubernetes');
    });

    it('should trim whitespace', () => {
      expect(dictionaries.normalizeTechnology('  node  ')).toBe('Node.js');
      expect(dictionaries.normalizeTechnology('  react.js  ')).toBe('React');
    });

    it('should return original tech if no normalization exists', () => {
      expect(dictionaries.normalizeTechnology('SomeUnknownTech')).toBe('SomeUnknownTech');
      expect(dictionaries.normalizeTechnology('CustomFramework')).toBe('CustomFramework');
    });

    it('should normalize database names', () => {
      expect(dictionaries.normalizeTechnology('postgres')).toBe('PostgreSQL');
      expect(dictionaries.normalizeTechnology('mongo')).toBe('MongoDB');
      expect(dictionaries.normalizeTechnology('mysql')).toBe('MySQL');
    });

    it('should normalize cloud providers', () => {
      expect(dictionaries.normalizeTechnology('aws')).toBe('Amazon Web Services');
      expect(dictionaries.normalizeTechnology('gcp')).toBe('Google Cloud Platform');
    });
  });

  describe('detectTechnologyCategory', () => {
    it('should detect programming languages', () => {
      expect(dictionaries.detectTechnologyCategory('JavaScript')).toBe('lenguaje');
      expect(dictionaries.detectTechnologyCategory('Python')).toBe('lenguaje');
      expect(dictionaries.detectTechnologyCategory('Java')).toBe('lenguaje');
      expect(dictionaries.detectTechnologyCategory('TypeScript')).toBe('lenguaje');
    });

    it('should detect frontend frameworks', () => {
      expect(dictionaries.detectTechnologyCategory('React')).toBe('framework');
      expect(dictionaries.detectTechnologyCategory('Angular')).toBe('framework');
      expect(dictionaries.detectTechnologyCategory('Vue')).toBe('framework');
    });

    it('should detect backend frameworks', () => {
      expect(dictionaries.detectTechnologyCategory('Node.js')).toBe('framework');
      expect(dictionaries.detectTechnologyCategory('Django')).toBe('framework');
      expect(dictionaries.detectTechnologyCategory('Express')).toBe('framework');
    });

    it('should detect databases', () => {
      expect(dictionaries.detectTechnologyCategory('MongoDB')).toBe('base_datos');
      expect(dictionaries.detectTechnologyCategory('PostgreSQL')).toBe('base_datos');
      expect(dictionaries.detectTechnologyCategory('MySQL')).toBe('base_datos');
    });

    it('should detect cloud technologies', () => {
      expect(dictionaries.detectTechnologyCategory('AWS')).toBe('cloud');
      expect(dictionaries.detectTechnologyCategory('Azure')).toBe('cloud');
      expect(dictionaries.detectTechnologyCategory('Docker')).toBe('cloud');
    });

    it('should detect tools', () => {
      expect(dictionaries.detectTechnologyCategory('Git')).toBe('herramienta');
      expect(dictionaries.detectTechnologyCategory('Jira')).toBe('herramienta');
    });

    it('should handle case insensitive input', () => {
      expect(dictionaries.detectTechnologyCategory('javascript')).toBe('lenguaje');
      expect(dictionaries.detectTechnologyCategory('REACT')).toBe('framework');
    });

    it('should normalize before detecting', () => {
      expect(dictionaries.detectTechnologyCategory('node')).toBe('framework');
      expect(dictionaries.detectTechnologyCategory('reactjs')).toBe('framework');
    });

    it('should return "otro" for unknown technologies', () => {
      expect(dictionaries.detectTechnologyCategory('UnknownTech')).toBe('otro');
      expect(dictionaries.detectTechnologyCategory('CustomFramework')).toBe('otro');
    });
  });

  describe('sectionKeywords', () => {
    it('should have keywords for all common curriculum sections', () => {
      expect(dictionaries.sectionKeywords.contact).toBeDefined();
      expect(dictionaries.sectionKeywords.education).toBeDefined();
      expect(dictionaries.sectionKeywords.experience).toBeDefined();
      expect(dictionaries.sectionKeywords.skills).toBeDefined();
      expect(dictionaries.sectionKeywords.languages).toBeDefined();
      expect(dictionaries.sectionKeywords.projects).toBeDefined();
      expect(dictionaries.sectionKeywords.certifications).toBeDefined();
      expect(dictionaries.sectionKeywords.achievements).toBeDefined();
    });

    it('should contain both spanish and english keywords', () => {
      expect(dictionaries.sectionKeywords.contact).toContain('contacto');
      expect(dictionaries.sectionKeywords.contact).toContain('contact');
      expect(dictionaries.sectionKeywords.education).toContain('educación');
      expect(dictionaries.sectionKeywords.education).toContain('education');
    });
  });

  describe('languageLevels', () => {
    it('should have all language proficiency levels', () => {
      expect(dictionaries.languageLevels.spanish).toBeDefined();
      expect(dictionaries.languageLevels.bilingual).toBeDefined();
      expect(dictionaries.languageLevels.fluent).toBeDefined();
      expect(dictionaries.languageLevels.advanced).toBeDefined();
      expect(dictionaries.languageLevels.intermediate).toBeDefined();
      expect(dictionaries.languageLevels.basic).toBeDefined();
    });

    it('should include CEFR levels', () => {
      expect(dictionaries.languageLevels.advanced).toContain('c1');
      expect(dictionaries.languageLevels.advanced).toContain('c2');
      expect(dictionaries.languageLevels.intermediate).toContain('b1');
      expect(dictionaries.languageLevels.intermediate).toContain('b2');
      expect(dictionaries.languageLevels.basic).toContain('a1');
      expect(dictionaries.languageLevels.basic).toContain('a2');
    });
  });

  describe('departments', () => {
    it('should include common software development departments', () => {
      expect(dictionaries.departments).toContain('Frontend');
      expect(dictionaries.departments).toContain('Backend');
      expect(dictionaries.departments).toContain('Full Stack');
      expect(dictionaries.departments).toContain('DevOps');
      expect(dictionaries.departments).toContain('Data Science');
    });
  });

  describe('workModes', () => {
    it('should include all work mode types', () => {
      expect(dictionaries.workModes).toContain('remoto');
      expect(dictionaries.workModes).toContain('remote');
      expect(dictionaries.workModes).toContain('híbrido');
      expect(dictionaries.workModes).toContain('hybrid');
      expect(dictionaries.workModes).toContain('presencial');
      expect(dictionaries.workModes).toContain('on-site');
    });
  });

  describe('commonLanguages', () => {
    it('should include major world languages', () => {
      expect(dictionaries.commonLanguages).toContain('Español');
      expect(dictionaries.commonLanguages).toContain('English');
      expect(dictionaries.commonLanguages).toContain('Francés');
      expect(dictionaries.commonLanguages).toContain('French');
      expect(dictionaries.commonLanguages).toContain('Alemán');
      expect(dictionaries.commonLanguages).toContain('German');
    });
  });
});
