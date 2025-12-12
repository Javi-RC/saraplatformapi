const CV = require('../models/cv.model');
const Organization = require('../models/organization.model');
const User = require('../models/user.model');
const cvUtils = require('../utils/cvUtils');
const dictionaries = require('../utils/dictionaries');
const organizationNotificationHelper = require('./organizationNotificationHelper');
const cvNotificationHelper = require('./cvNotificationHelper');

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

      // Obtener información del usuario para las notificaciones
      const user = await User.findById(userId);
      const userName = user?.name || 'Usuario';

      // Enviar notificación In-App de CV procesado
      cvNotificationHelper.notifyCVProcessed(userId, userName, cv._id).catch(err => {
        console.error('Error enviando notificación de CV procesado:', err);
      });

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
   * Envía un CV a una organización
   * @param {string} userId - ID del usuario
   * @param {string} organizationId - ID de la organización
   * @returns {Object} - CV actualizado
   */
  async submitCVToOrganization(userId, organizationId) {
    try {
      // Verificar que la organización existe y está activa
      const organization = await Organization.findById(organizationId)
        .populate('admin', 'name email avatar')
        .populate('additionalAdmins', 'name email avatar');

      if (!organization) {
        throw new Error('ORGANIZATION_NOT_FOUND');
      }

      if (organization.status !== 'active') {
        throw new Error('ORGANIZATION_NOT_ACTIVE');
      }

      // Verificar que el usuario tiene un CV
      let cv = await CV.findOne({ userId });
      if (!cv) {
        throw new Error('CV_NOT_FOUND');
      }

      // Verificar si ya envió el CV a esta organización
      if (cv.organization && cv.organization.toString() === organizationId) {
        throw new Error('CV_ALREADY_SUBMITTED');
      }

      // Obtener información del usuario
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Actualizar el CV con la información de la organización
      cv.organization = organizationId;
      cv.organizationStatus = 'pending';
      cv.submittedToOrganizationAt = new Date();
      await cv.save();

      // Notificar a los administradores de la organización
      await organizationNotificationHelper.notifyCVSubmitted(organization, user, cv);

      return cv;
    } catch (error) {
      console.error('Error enviando CV a organización:', error);
      throw error;
    }
  }

  /**
   * Obtiene los CVs enviados a una organización
   * @param {string} organizationId - ID de la organización
   * @param {string} adminId - ID del administrador que solicita
   * @param {Object} filters - Filtros opcionales
   * @returns {Array} - Lista de CVs
   */
  async getOrganizationCVs(organizationId, adminId, filters = {}) {
    try {
      // Verificar que la organización existe
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('ORGANIZATION_NOT_FOUND');
      }

      // Verificar que el usuario es administrador
      if (!organization.isAdmin(adminId)) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Construir query
      const query = { organization: organizationId };

      // Aplicar filtros
      if (filters.status) {
        query.organizationStatus = filters.status;
      }

      // Opciones de paginación
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;

      // Obtener CVs con información del usuario
      const cvs = await CV.find(query)
        .populate('userId', 'name email avatar')
        .sort({ submittedToOrganizationAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await CV.countDocuments(query);

      return {
        cvs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error obteniendo CVs de organización:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un CV en una organización
   * @param {string} cvId - ID del CV
   * @param {string} organizationId - ID de la organización
   * @param {string} adminId - ID del administrador
   * @param {string} newStatus - Nuevo estado
   * @param {string} notes - Notas del administrador
   * @param {Object} employeeData - Datos adicionales del empleado (posición, departamento)
   * @returns {Object} - CV actualizado
   */
  async updateCVStatus(cvId, organizationId, adminId, newStatus, notes = '', employeeData = {}) {
    try {
      // Verificar que la organización existe
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('ORGANIZATION_NOT_FOUND');
      }

      // Verificar que el usuario es administrador
      if (!organization.isAdmin(adminId)) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Buscar el CV
      const cv = await CV.findById(cvId);
      if (!cv) {
        throw new Error('CV_NOT_FOUND');
      }

      // Verificar que el CV pertenece a esta organización
      if (!cv.organization || cv.organization.toString() !== organizationId) {
        throw new Error('CV_NOT_BELONGS_TO_ORGANIZATION');
      }

      const oldStatus = cv.organizationStatus;

      // Actualizar estado y notas
      cv.organizationStatus = newStatus;
      if (notes) {
        cv.organizationNotes = notes;
      }
      await cv.save();

      // Si el CV es aceptado, agregar al usuario como empleado de la organización
      if (newStatus === 'accepted' && oldStatus !== 'accepted') {
        await this._addUserAsEmployee(cv.userId, organization, employeeData);
      }

      // Si el CV es rechazado y el usuario era empleado, removerlo
      if (newStatus === 'rejected' && oldStatus === 'accepted') {
        await this._removeUserAsEmployee(cv.userId, organization);
      }

      // Notificar al usuario
      await organizationNotificationHelper.notifyCVStatusChanged(
        cv,
        organization,
        oldStatus,
        newStatus
      );

      return cv;
    } catch (error) {
      console.error('Error actualizando estado de CV:', error);
      throw error;
    }
  }

  /**
   * Añade un usuario como empleado de una organización cuando su CV es aceptado
   * @param {string} userId - ID del usuario
   * @param {Object} organization - Organización
   * @param {Object} employeeData - Datos del empleado (posición, departamento)
   * @private
   */
  async _addUserAsEmployee(userId, organization, employeeData = {}) {
    try {
      // Verificar si el usuario ya es empleado
      const existingEmployee = organization.employees.find(
        emp => emp.user.toString() === userId.toString()
      );

      if (existingEmployee) {
        // Si ya existe pero no está activo, activarlo
        if (existingEmployee.status !== 'active') {
          existingEmployee.status = 'active';
          if (employeeData.position) existingEmployee.position = employeeData.position;
          if (employeeData.department) existingEmployee.department = employeeData.department;
          await organization.save();
        }
        return;
      }

      // Agregar como nuevo empleado con estado activo (ya fue aprobado por el admin)
      organization.employees.push({
        user: userId,
        position: employeeData.position || '',
        department: employeeData.department || '',
        joinedAt: new Date(),
        status: 'active'
      });

      organization.lastActivityAt = Date.now();
      await organization.save();

      // Actualizar el rol del usuario a employee si es necesario
      const user = await User.findById(userId);
      if (user && user.role === 'unassigned') {
        user.role = 'employee';
        await user.save();
      }

      console.log(`Usuario ${userId} añadido como empleado a la organización ${organization._id}`);
    } catch (error) {
      console.error('Error añadiendo usuario como empleado:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Remueve un usuario como empleado de una organización cuando su CV es rechazado
   * @param {string} userId - ID del usuario
   * @param {Object} organization - Organización
   * @private
   */
  async _removeUserAsEmployee(userId, organization) {
    try {
      const employeeIndex = organization.employees.findIndex(
        emp => emp.user.toString() === userId.toString()
      );

      if (employeeIndex !== -1) {
        organization.employees.splice(employeeIndex, 1);
        organization.lastActivityAt = Date.now();
        await organization.save();
        console.log(`Usuario ${userId} removido como empleado de la organización ${organization._id}`);
      }
    } catch (error) {
      console.error('Error removiendo usuario como empleado:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Obtiene un CV específico de una organización
   * @param {string} cvId - ID del CV
   * @param {string} organizationId - ID de la organización
   * @param {string} adminId - ID del administrador
   * @returns {Object} - CV con detalles completos
   */
  async getOrganizationCV(cvId, organizationId, adminId) {
    try {
      // Verificar que la organización existe
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        throw new Error('ORGANIZATION_NOT_FOUND');
      }

      // Verificar que el usuario es administrador
      if (!organization.isAdmin(adminId)) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Buscar el CV
      const cv = await CV.findById(cvId).populate('userId', 'name email avatar');
      if (!cv) {
        throw new Error('CV_NOT_FOUND');
      }

      // Verificar que el CV pertenece a esta organización
      if (!cv.organization || cv.organization.toString() !== organizationId) {
        throw new Error('CV_NOT_BELONGS_TO_ORGANIZATION');
      }

      return cv;
    } catch (error) {
      console.error('Error obteniendo CV de organización:', error);
      throw error;
    }
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
