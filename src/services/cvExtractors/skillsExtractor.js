const cvUtils = require('../../utils/cvUtils');

/**
 * Extractor de habilidades técnicas
 * Responsabilidad única: extraer skills del currículo
 */
class SkillsExtractor {
  /**
   * Extrae habilidades técnicas del texto de la sección correspondiente
   */
  extract(sectionText, technologyDictionary) {
    if (!sectionText || sectionText.trim().length === 0) {
      return { technical: [], soft: [] };
    }

    const skills = {
      technical: [],
      soft: []
    };

    const normalizedText = cvUtils.normalizeText(sectionText);

    // Extraer habilidades técnicas
    skills.technical = this._extractTechnicalSkills(normalizedText, technologyDictionary);

    // Extraer habilidades blandas
    skills.soft = this._extractSoftSkills(normalizedText);

    return skills;
  }

  /**
   * Extrae habilidades técnicas comparando con el diccionario
   */
  _extractTechnicalSkills(text, technologyDictionary) {
    const technicalSkills = [];
    
    if (!technologyDictionary) return technicalSkills;

    // Obtener todas las tecnologías del diccionario
    const allTechs = technologyDictionary.getAllTechnologies();
    const foundTechnologies = new Map(); // Usar Map para evitar duplicados

    // Buscar cada tecnología en el texto
    allTechs.forEach(tech => {
      const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = text.match(regex);
      
      if (matches) {
        const normalized = cvUtils.normalizeTechnology(tech, technologyDictionary.technologyNormalizations);
        const normalizedLower = normalized.toLowerCase();
        
        if (!foundTechnologies.has(normalizedLower)) {
          const skill = {
            name: normalized,
            normalizedName: normalizedLower,
            level: this._extractSkillLevel(text, tech),
            category: technologyDictionary.detectTechnologyCategory(tech)
          };
          
          foundTechnologies.set(normalizedLower, skill);
        }
      }
    });

    // Convertir Map a array
    return Array.from(foundTechnologies.values());
  }

  /**
   * Intenta extraer el nivel de habilidad cerca de la tecnología mencionada
   */
  _extractSkillLevel(text, technology) {
    const lines = text.split('\n');
    const levelKeywords = {
      'básico': 'básico',
      'basic': 'básico',
      'beginner': 'básico',
      'principiante': 'básico',
      'intermedio': 'intermedio',
      'intermediate': 'intermedio',
      'avanzado': 'avanzado',
      'advanced': 'avanzado',
      'experto': 'experto',
      'expert': 'experto'
    };

    // Buscar la línea que contiene la tecnología
    for (const line of lines) {
      if (new RegExp(`\\b${technology}\\b`, 'gi').test(line)) {
        const lineLower = line.toLowerCase();
        
        // Buscar palabras clave de nivel en la misma línea
        for (const [keyword, level] of Object.entries(levelKeywords)) {
          if (lineLower.includes(keyword)) {
            return level;
          }
        }
      }
    }

    return ''; // Nivel no especificado
  }

  /**
   * Extrae habilidades blandas (soft skills)
   */
  _extractSoftSkills(text) {
    const softSkillsKeywords = [
      'liderazgo', 'leadership', 'trabajo en equipo', 'teamwork', 'comunicación',
      'communication', 'resolución de problemas', 'problem solving', 'creatividad',
      'creativity', 'adaptabilidad', 'adaptability', 'organización', 'organization',
      'gestión del tiempo', 'time management', 'pensamiento crítico', 'critical thinking',
      'negociación', 'negotiation', 'empatía', 'empathy', 'proactividad', 'proactive'
    ];

    const foundSoftSkills = new Set();
    const textLower = text.toLowerCase();

    softSkillsKeywords.forEach(skill => {
      if (textLower.includes(skill.toLowerCase())) {
        // Capitalizar primera letra
        const capitalized = skill.charAt(0).toUpperCase() + skill.slice(1);
        foundSoftSkills.add(capitalized);
      }
    });

    return Array.from(foundSoftSkills);
  }
}

module.exports = new SkillsExtractor();
