const aiExtractorService = require('../services/aiExtractor.service');
const responseHandler = require('../utils/responseHandler');
const pdfParse = require('pdf-parse');

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
}

module.exports = new CVController();
