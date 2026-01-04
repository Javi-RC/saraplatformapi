const aiExtractorService = require('../services/aiExtractor.service');
const cvService = require('../services/cv.service');
const responseHandler = require('../utils/responseHandler');
const pdfParse = require('pdf-parse');
const cvNotificationHelper = require('../services/cvNotificationHelper');
const User = require('../models/user.model');

/**
 * Controlador de CVs
 * Maneja las peticiones HTTP relacionadas con CVs
 */
class CVController {
  /**
   * Sube y procesa un CV
   * Acepta archivos PDF y TXT
   */
  async uploadCV(req, res) {
    try {
      if (!req.file) {
        return responseHandler.error(res, 'No se proporcionó ningún archivo', 400);
      }

      const userId = req.user.id; // Obtenido del middleware de autenticación
      const file = req.file;

      // Extraer texto según el tipo de archivo
      let textContent;
      
      if (file.mimetype === 'application/pdf') {
        // Procesar PDF
        const dataBuffer = file.buffer;
        const pdfData = await pdfParse(dataBuffer);
        textContent = pdfData.text;
      } else if (file.mimetype === 'text/plain') {
        // Procesar TXT
        textContent = file.buffer.toString('utf-8');
      } else {
        return responseHandler.error(res, 'Formato de archivo no soportado. Use PDF o TXT', 400);
      }

      // Validar que se extrajo texto
      if (!textContent || textContent.trim().length === 0) {
        return responseHandler.error(res, 'No se pudo extraer texto del archivo', 400);
      }

      // Obtener información del usuario para validar consentimiento
      const user = await User.findById(userId);
      const userName = user?.name || 'Usuario';

      // Verificar consentimiento para procesamiento con IA
      if (!user.hasCVProcessingConsent()) {
        return responseHandler.error(res, 
          'Debes aceptar el consentimiento para el procesamiento de CVs con IA antes de subir tu CV. ' +
          'Por favor, acepta los términos en tu perfil de privacidad.', 
          403
        );
      }

      // Enviar notificación de CV subido (antes de procesar)
      cvNotificationHelper.notifyCVUploaded(userId, userName, null, file.originalname).catch(err => {
        console.error('Error enviando notificación de CV subido:', err);
      });

      // Procesar CV con IA
      const cv = await aiExtractorService.processCV(userId, textContent, file.originalname);

      return responseHandler.success(res, {
        message: 'CV procesado exitosamente',
        cv: cv.getSummary()
      }, 201);

    } catch (error) {
      console.error('Error en uploadCV:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Obtiene el CV del usuario autenticado
   */
  async getMyCV(req, res) {
    try {
      const userId = req.user.id;
      const cv = await aiExtractorService.getUserCV(userId);

      return responseHandler.success(res, {
        cv
      });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Obtiene un CV específico por ID (solo el propietario o admin)
   */
  async getCVById(req, res) {
    try {
      const { cvId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const cv = await aiExtractorService.getUserCV(userId);

      // Verificar permisos
      if (cv._id.toString() !== cvId && userRole !== 'org_admin') {
        return responseHandler.error(res, 'No tienes permisos para ver este CV', 403);
      }

      return responseHandler.success(res, { cv });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Obtiene todos los CVs (solo admin)
   */
  async getAllCVs(req, res) {
    try {
      const filters = {
        skills: req.query.skills ? req.query.skills.split(',') : undefined,
        languages: req.query.languages ? req.query.languages.split(',') : undefined
      };

      const cvs = await aiExtractorService.getAllCVs(filters);

      return responseHandler.success(res, {
        count: cvs.length,
        cvs
      });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Busca CVs por criterios (solo admin)
   */
  async searchCVs(req, res) {
    try {
      const criteria = {
        skills: req.body.skills || [],
        languages: req.body.languages || [],
        minExperience: req.body.minExperience || null
      };

      const cvs = await aiExtractorService.searchCVs(criteria);

      return responseHandler.success(res, {
        count: cvs.length,
        cvs
      });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Actualiza el CV del usuario
   */
  async updateCV(req, res) {
    try {
      const userId = req.user.id;
      const { cvId } = req.params;
      const updates = req.body;

      const cv = await aiExtractorService.updateCV(userId, cvId, updates);

      return responseHandler.success(res, {
        message: 'CV actualizado exitosamente',
        cv
      });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Elimina el CV del usuario
   */
  async deleteCV(req, res) {
    try {
      const userId = req.user.id;
      const { cvId } = req.params;

      const result = await aiExtractorService.deleteCV(userId, cvId);

      return responseHandler.success(res, result);

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Obtiene estadísticas del CV (para dashboard)
   */
  async getCVStats(req, res) {
    try {
      const userId = req.user.id;
      const cv = await aiExtractorService.getUserCV(userId);

      const stats = {
        totalSkills: cv.skills?.technical?.length || 0,
        totalExperience: cv.experience?.length || 0,
        totalEducation: cv.education?.length || 0,
        totalProjects: cv.projects?.length || 0,
        totalCertifications: cv.certifications?.length || 0,
        totalLanguages: cv.languages?.length || 0,
        topSkills: cv.skills?.technical?.slice(0, 10).map(s => s.name) || [],
        lastUpdated: cv.lastUpdated
      };

      return responseHandler.success(res, { stats });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Envía el CV a una organización
   * POST /api/cv/submit-to-organization
   */
  async submitToOrganization(req, res) {
    try {
      const userId = req.user.id;
      const { organizationId } = req.body;

      if (!organizationId) {
        return responseHandler.error(res, 'Se requiere el ID de la organización', 400);
      }

      const cv = await cvService.submitCVToOrganization(userId, organizationId);

      return responseHandler.success(res, {
        message: 'CV enviado exitosamente a la organización',
        cv
      }, 201);

    } catch (error) {
      console.error('Error enviando CV a organización:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'ORGANIZATION_NOT_ACTIVE': 'La organización no está activa',
        'CV_NOT_FOUND': 'No tienes un CV registrado',
        'CV_ALREADY_SUBMITTED': 'Ya has enviado tu CV a esta organización',
        'USER_NOT_FOUND': 'Usuario no encontrado'
      };

      const statusCodes = {
        'ORGANIZATION_NOT_FOUND': 404,
        'ORGANIZATION_NOT_ACTIVE': 403,
        'CV_NOT_FOUND': 404,
        'CV_ALREADY_SUBMITTED': 409,
        'USER_NOT_FOUND': 404
      };

      const message = errorMessages[error.message] || 'Error al enviar CV';
      const statusCode = statusCodes[error.message] || 400;

      return responseHandler.error(res, message, statusCode);
    }
  }

  /**
   * Obtiene los CVs enviados a una organización (solo admins)
   * GET /api/organizations/:id/cvs
   */
  async getOrganizationCVs(req, res) {
    try {
      const { id: organizationId } = req.params;
      const adminId = req.user.id;
      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await cvService.getOrganizationCVs(organizationId, adminId, filters);

      return responseHandler.success(res, result);

    } catch (error) {
      console.error('Error obteniendo CVs de organización:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'UNAUTHORIZED_ACCESS': 'No tienes permisos para ver estos CVs'
      };

      const statusCodes = {
        'ORGANIZATION_NOT_FOUND': 404,
        'UNAUTHORIZED_ACCESS': 403
      };

      const message = errorMessages[error.message] || 'Error al obtener CVs';
      const statusCode = statusCodes[error.message] || 400;

      return responseHandler.error(res, message, statusCode);
    }
  }

  /**
   * Obtiene un CV específico de la organización
   * GET /api/organizations/:id/cvs/:cvId
   */
  async getOrganizationCV(req, res) {
    try {
      const { id: organizationId, cvId } = req.params;
      const adminId = req.user.id;

      const cv = await cvService.getOrganizationCV(cvId, organizationId, adminId);

      return responseHandler.success(res, { cv });

    } catch (error) {
      console.error('Error obteniendo CV de organización:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'UNAUTHORIZED_ACCESS': 'No tienes permisos para ver este CV',
        'CV_NOT_FOUND': 'CV no encontrado',
        'CV_NOT_BELONGS_TO_ORGANIZATION': 'Este CV no pertenece a esta organización'
      };

      const statusCodes = {
        'ORGANIZATION_NOT_FOUND': 404,
        'UNAUTHORIZED_ACCESS': 403,
        'CV_NOT_FOUND': 404,
        'CV_NOT_BELONGS_TO_ORGANIZATION': 403
      };

      const message = errorMessages[error.message] || 'Error al obtener CV';
      const statusCode = statusCodes[error.message] || 400;

      return responseHandler.error(res, message, statusCode);
    }
  }

  /**
   * Actualiza el estado de un CV en la organización
   * PATCH /api/organizations/:id/cvs/:cvId/status
   */
  async updateCVStatus(req, res) {
    try {
      const { id: organizationId, cvId } = req.params;
      const adminId = req.user.id;
      const { status, notes, position, department } = req.body;

      if (!status) {
        return responseHandler.error(res, 'Se requiere el nuevo estado', 400);
      }

      const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
      if (!validStatuses.includes(status)) {
        return responseHandler.error(
          res,
          `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}`,
          400
        );
      }

      // Datos adicionales del empleado cuando se acepta el CV
      const employeeData = {
        position: position || '',
        department: department || ''
      };

      const cv = await cvService.updateCVStatus(
        cvId,
        organizationId,
        adminId,
        status,
        notes,
        employeeData
      );

      return responseHandler.success(res, {
        message: 'Estado del CV actualizado exitosamente',
        cv
      });

    } catch (error) {
      console.error('Error actualizando estado de CV:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'UNAUTHORIZED_ACCESS': 'No tienes permisos para actualizar este CV',
        'CV_NOT_FOUND': 'CV no encontrado',
        'CV_NOT_BELONGS_TO_ORGANIZATION': 'Este CV no pertenece a esta organización'
      };

      const statusCodes = {
        'ORGANIZATION_NOT_FOUND': 404,
        'UNAUTHORIZED_ACCESS': 403,
        'CV_NOT_FOUND': 404,
        'CV_NOT_BELONGS_TO_ORGANIZATION': 403
      };

      const message = errorMessages[error.message] || 'Error al actualizar estado';
      const statusCode = statusCodes[error.message] || 400;

      return responseHandler.error(res, message, statusCode);
    }
  }
}

module.exports = new CVController();