const CV = require('../models/cv.model');
const cvUtils = require('../utils/cvUtils');
const dictionaries = require('../utils/dictionaries');

// Importar todos los extractores
const contactExtractor = require('./cvExtractors/contactExtractor');
const educationExtractor = require('./cvExtractors/educationExtractor');
const experienceExtractor = require('./cvExtractors/experienceExtractor');
const skillsExtractor = require('./cvExtractors/skillsExtractor');
const languagesExtractor = require('./cvExtractors/languagesExtractor');
const projectsExtractor = require('./cvExtractors/projectsExtractor');
const certificationsExtractor = require('./cvExtractors/certificationsExtractor');
const achievementsExtractor = require('./cvExtractors/achievementsExtractor');

/**
 * Servicio principal de procesamiento de CVs
 * Orquesta todos los extractores y gestiona el ciclo completo de análisis
 * Sigue el patrón de Inyección de Dependencias y Open/Closed Principle
 */
class CVService {
  /**
   * Procesa un CV y guarda la información extraída
   * @param {string} userId - ID del usuario propietario del CV
   * @param {string} textContent - Contenido de texto del CV
   * @param {string} originalFileName - Nombre original del archivo
   * @returns {Object} - CV guardado con toda la información extraída
   */
  async processCV(userId, textContent, originalFileName) {
    try {
      // Normalizar texto completo
      const normalizedText = cvUtils.normalizeText(textContent);

      // Dividir en secciones
      const sections = cvUtils.splitIntoSections(normalizedText, dictionaries.sectionKeywords);
      
      // Debug: mostrar secciones encontradas
      console.log('=== SECCIONES DETECTADAS ===');
      Object.keys(sections).forEach(key => {
        console.log(`- ${key}: ${sections[key]?.[0]?.substring(0, 100)}...`);
      });

      // Extraer información de cada sección usando los extractores especializados
      const cvData = {
        userId,
        originalFileName,
        rawText: textContent,
        contact: this._extractContact(sections, normalizedText),
        education: this._extractEducation(sections),
        experience: this._extractExperience(sections),
        skills: this._extractSkills(sections),
        languages: this._extractLanguages(sections),
        projects: this._extractProjects(sections),
        certifications: this._extractCertifications(sections),
        achievements: this._extractAchievements(sections)
      };

      // Debug: mostrar datos extraídos
      console.log('=== DATOS EXTRAÍDOS ===');
      console.log('Contacto:', cvData.contact ? 'SI' : 'NO');
      console.log('Educación:', cvData.education?.length || 0, 'entradas');
      console.log('Experiencia:', cvData.experience?.length || 0, 'entradas');
      console.log('Skills técnicas:', cvData.skills?.technical?.length || 0);
      console.log('Idiomas:', cvData.languages?.length || 0);
      console.log('Proyectos:', cvData.projects?.length || 0);
      console.log('Certificaciones:', cvData.certifications?.length || 0);

      // Validar y limpiar datos vacíos
      this._cleanEmptyFields(cvData);
      
      // Validar campos obligatorios en arrays
      this._validateRequiredFields(cvData);

      // Guardar en base de datos
      const cv = await this._saveOrUpdateCV(userId, cvData);

      return cv;
    } catch (error) {
      console.error('Error procesando CV:', error);
      throw new Error('ERROR_PROCESSING_CV');
    }
  }

  /**
   * Obtiene el CV de un usuario
   */
  async getUserCV(userId) {
    const cv = await CV.findOne({ userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }
    return cv;
  }

  /**
   * Obtiene todos los CVs (para admin)
   */
  async getAllCVs(filters = {}) {
    const query = {};
    
    // Aplicar filtros si existen
    if (filters.skills) {
      query['skills.technical.normalizedName'] = { 
        $in: filters.skills.map(s => s.toLowerCase()) 
      };
    }
    
    if (filters.languages) {
      query['languages.language'] = { $in: filters.languages };
    }

    const cvs = await CV.find(query).populate('userId', 'name email');
    return cvs;
  }

  /**
   * Actualiza el CV de un usuario
   */
  async updateCV(userId, cvId, updates) {
    const cv = await CV.findOne({ _id: cvId, userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }

    Object.assign(cv, updates);
    await cv.save();
    return cv;
  }

  /**
   * Elimina el CV de un usuario
   */
  async deleteCV(userId, cvId) {
    const cv = await CV.findOneAndDelete({ _id: cvId, userId });
    if (!cv) {
      throw new Error('CV_NOT_FOUND');
    }
    return { message: 'CV eliminado exitosamente' };
  }

  /**
   * Busca CVs por criterios
   */
  async searchCVs(criteria) {
    const query = {};

    if (criteria.skills && criteria.skills.length > 0) {
      query['skills.technical.normalizedName'] = {
        $in: criteria.skills.map(s => s.toLowerCase())
      };
    }

    if (criteria.languages && criteria.languages.length > 0) {
      query['languages.language'] = { $in: criteria.languages };
    }

    if (criteria.minExperience) {
      query['experience'] = {
        $exists: true,
        $not: { $size: 0 }
      };
    }

    const cvs = await CV.find(query).populate('userId', 'name email');
    return cvs;
  }

  // ==================== MÉTODOS PRIVADOS DE EXTRACCIÓN ====================

  /**
   * Extrae información de contacto
   */
  _extractContact(sections, fullText) {
    // Analizar todo el texto para contacto, priorizando el inicio
    const lines = fullText.split('\n');
    const topSection = lines.slice(0, 50).join('\n'); // Aumentado a 50 líneas
    
    const locationDict = {
      cities: dictionaries.getAllCities(),
      countries: dictionaries.countries
    };

    return contactExtractor.extractWithLocation(topSection, locationDict);
  }

  /**
   * Extrae educación
   */
  _extractEducation(sections) {
    const educationSection = sections.education?.[0] || '';
    return educationExtractor.extract(educationSection);
  }

  /**
   * Extrae experiencia laboral
   */
  _extractExperience(sections) {
    // Buscar en múltiples variaciones de la sección
    let experienceText = sections.experience?.[0] || '';
    
    // Si no encontró la sección, buscar en 'other' (por si no se detectó el título)
    if (!experienceText && sections.other) {
      experienceText = sections.other.join('\n');
    }
    
    return experienceExtractor.extract(experienceText, dictionaries);
  }

  /**
   * Extrae habilidades
   */
  _extractSkills(sections) {
    // Extraer skills de la sección específica
    let skillsText = sections.skills?.[0] || '';
    
    // También buscar en experiencia y proyectos para tecnologías mencionadas
    const experienceText = sections.experience?.[0] || '';
    const projectsText = sections.projects?.[0] || '';
    const combinedText = [skillsText, experienceText, projectsText].join('\n');
    
    return skillsExtractor.extract(combinedText, dictionaries);
  }

  /**
   * Extrae idiomas
   */
  _extractLanguages(sections) {
    const languagesSection = sections.languages?.[0] || '';
    return languagesExtractor.extract(languagesSection, dictionaries);
  }

  /**
   * Extrae proyectos
   */
  _extractProjects(sections) {
    const projectsSection = sections.projects?.[0] || '';
    return projectsExtractor.extract(projectsSection, dictionaries);
  }

  /**
   * Extrae certificaciones
   */
  _extractCertifications(sections) {
    const certificationsSection = sections.certifications?.[0] || '';
    return certificationsExtractor.extract(certificationsSection);
  }

  /**
   * Extrae logros y premios
   */
  _extractAchievements(sections) {
    const achievementsSection = sections.achievements?.[0] || '';
    return achievementsExtractor.extract(achievementsSection);
  }

  /**
   * Valida que los elementos de arrays tengan sus campos obligatorios
   */
  _validateRequiredFields(cvData) {
    // Validar educación: institution y degree son requeridos
    if (cvData.education && cvData.education.length > 0) {
      cvData.education = cvData.education.filter(edu => 
        edu.institution && edu.degree
      );
      if (cvData.education.length === 0) delete cvData.education;
    }
    
    // Validar experiencia: company y position son requeridos
    if (cvData.experience && cvData.experience.length > 0) {
      cvData.experience = cvData.experience.filter(exp => 
        exp.company && exp.position
      );
      if (cvData.experience.length === 0) delete cvData.experience;
    }
    
    // Validar proyectos: name es requerido
    if (cvData.projects && cvData.projects.length > 0) {
      cvData.projects = cvData.projects.filter(proj => proj.name);
      if (cvData.projects.length === 0) delete cvData.projects;
    }
    
    // Validar certificaciones: name es requerido
    if (cvData.certifications && cvData.certifications.length > 0) {
      cvData.certifications = cvData.certifications.filter(cert => cert.name);
      if (cvData.certifications.length === 0) delete cvData.certifications;
    }
  }

  /**
   * Limpia campos vacíos del objeto de datos del CV
   */
  _cleanEmptyFields(cvData) {
    // Limpiar arrays vacíos
    if (cvData.education && cvData.education.length === 0) delete cvData.education;
    if (cvData.experience && cvData.experience.length === 0) delete cvData.experience;
    if (cvData.languages && cvData.languages.length === 0) delete cvData.languages;
    if (cvData.projects && cvData.projects.length === 0) delete cvData.projects;
    if (cvData.certifications && cvData.certifications.length === 0) delete cvData.certifications;

    // Limpiar skills
    if (cvData.skills) {
      if (cvData.skills.technical && cvData.skills.technical.length === 0) {
        delete cvData.skills.technical;
      }
      if (cvData.skills.soft && cvData.skills.soft.length === 0) {
        delete cvData.skills.soft;
      }
      if (!cvData.skills.technical && !cvData.skills.soft) {
        delete cvData.skills;
      }
    }

    // Limpiar achievements
    if (cvData.achievements) {
      if (cvData.achievements.publications && cvData.achievements.publications.length === 0) {
        delete cvData.achievements.publications;
      }
      if (cvData.achievements.awards && cvData.achievements.awards.length === 0) {
        delete cvData.achievements.awards;
      }
      if (cvData.achievements.hackathons && cvData.achievements.hackathons.length === 0) {
        delete cvData.achievements.hackathons;
      }
      if (!cvData.achievements.publications && 
          !cvData.achievements.awards && 
          !cvData.achievements.hackathons) {
        delete cvData.achievements;
      }
    }
  }

  /**
   * Guarda o actualiza el CV en la base de datos
   */
  async _saveOrUpdateCV(userId, cvData) {
    // Buscar si ya existe un CV para este usuario
    let cv = await CV.findOne({ userId });

    if (cv) {
      // Actualizar CV existente
      Object.assign(cv, cvData);
      await cv.save();
    } else {
      // Crear nuevo CV
      cv = new CV(cvData);
      await cv.save();
    }

    return cv;
  }
}

module.exports = new CVService();
