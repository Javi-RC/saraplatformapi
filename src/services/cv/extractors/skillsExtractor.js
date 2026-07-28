const cvUtils = require('../../../utils/cvUtils');

/**
 * Technical skills extractor
 * Single responsibility: extract skills from curriculum
 */
class SkillsExtractor {
  /**
   * Extracts technical skills from the corresponding section text
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

    // Extract technical skills
    skills.technical = this._extractTechnicalSkills(normalizedText, technologyDictionary);

    // Extract soft skills
    skills.soft = this._extractSoftSkills(normalizedText);

    return skills;
  }

  /**
   * Extracts technical skills by comparing with the dictionary
   */
  _extractTechnicalSkills(text, technologyDictionary) {
    const technicalSkills = [];
    
    if (!technologyDictionary) return technicalSkills;

    // Get all technologies from the dictionary
    const allTechs = technologyDictionary.getAllTechnologies();
    const foundTechnologies = new Map(); // Use Map to avoid duplicates

    // Search for each technology in the text
    allTechs.forEach(tech => {
      const regex = cvUtils.createWordBoundaryRegex(tech);
      if (!regex) return;
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

    // Convert Map to array
    return Array.from(foundTechnologies.values());
  }

  /**
   * Tries to extract the skill level near the mentioned technology
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

    // Search for the line containing the technology
    const techRegex = cvUtils.createWordBoundaryRegex(technology);
    for (const line of lines) {
      if (techRegex && techRegex.test(line)) {
        const lineLower = line.toLowerCase();
        
        // Search for level keywords on the same line
        for (const [keyword, level] of Object.entries(levelKeywords)) {
          if (lineLower.includes(keyword)) {
            return level;
          }
        }
      }
    }

    return ''; // Level not specified
  }

  /**
   * Extracts soft skills
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
        // Capitalize first letter
        const capitalized = skill.charAt(0).toUpperCase() + skill.slice(1);
        foundSoftSkills.add(capitalized);
      }
    });

    return Array.from(foundSoftSkills);
  }
}

module.exports = new SkillsExtractor();
