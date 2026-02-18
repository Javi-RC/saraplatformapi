const aiExtractorService = require('../services/aiExtractor.service');
const cvService = require('../services/cv.service');
const responseHandler = require('../utils/responseHandler');
const pdfParse = require('pdf-parse');
const cvNotificationHelper = require('../services/cvNotificationHelper');
const User = require('../models/user.model');
const { validateCVCompleteness, getCategoryCompleteness } = require('../services/cvCompletenessValidator.service');
const { generateQuestionsForMissingFields, generateConditionalQuestions, getQuestionsByCategory } = require('../services/cvQuestionsGenerator.service');
const CV = require('../models/cv.model');
const {
  createQuestionnaireSession,
  getInitialQuestions,
  processResponsesAndGetNext,
  finalizeQuestionnaire,
  getAllPhases,
  getPhaseById,
  validateResponse
} = require('../services/cvInteractiveQuestionnaire.service');

/**
 * Controlador de currículos
 * Maneja las peticiones HTTP relacionadas con currículos
 */
class CVController {
  /**
   * Sube y procesa un currículo
   * Acepta archivos PDF y TXT
   */
  async uploadCV(req, res) {
    try {
      if (!req.file) {
        return responseHandler.error(res, 'No file provided', 400);
      }

      const userId = req.user.id;
      const file = req.file;

      let textContent;
      
      if (file.mimetype === 'application/pdf') {
        const dataBuffer = file.buffer;
        const pdfData = await pdfParse(dataBuffer);
        textContent = pdfData.text;
      } else if (file.mimetype === 'text/plain') {
        textContent = file.buffer.toString('utf-8');
      } else {
        return responseHandler.error(res, 'Unsupported file format. Use PDF or TXT', 400);
      }

      if (!textContent || textContent.trim().length === 0) {
        return responseHandler.error(res, 'Could not extract text from file', 400);
      }

      const user = await User.findById(userId);
      const userName = user?.name || 'Usuario';

      if (!user.hasCVProcessingConsent()) {
        return responseHandler.error(res, 
          'You must accept consent for AI curriculum processing before uploading your curriculum. ' +
          'Please accept the terms in your privacy profile.', 
          403
        );
      }

      cvNotificationHelper.notifyCVUploaded(userId, userName, null, file.originalname).catch(err => {
        console.error('Error enviando notificación de currículo subido:', err);
      });

      const cv = await aiExtractorService.processCV(userId, textContent, file.originalname);

      // ✅ Verificar completitud del currículo y decidir si mostrar cuestionario
      const completenessValidation = validateCVCompleteness(cv);
      const language = req.body.language || req.query.language || user.preferredLanguage || 'en';

      // Si el currículo no está completo, iniciar sesión de cuestionario
      if (!completenessValidation.isComplete) {
        const session = createQuestionnaireSession(userId.toString(), language);
        const questionnaire = getInitialQuestions(cv, language, session);

        return responseHandler.success(res, {
          message: 'Curriculum processed successfully. Please complete the questionnaire to finish your profile.',
          cv: cv.getSummary(),
          completeness: {
            isComplete: false,
            score: completenessValidation.completenessScore,
            missingFieldsCount: completenessValidation.missingFields.length,
            missingByPriority: completenessValidation.missingByPriority
          },
          questionnaire: {
            needsCompletion: true,
            sessionId: session.sessionId,
            currentPhase: questionnaire.phase,
            questions: questionnaire.questions,
            estimatedTime: '5-10 minutes',
            totalPhases: questionnaire.phase.total
          }
        }, 201);
      }

      // Currículo completo
      return responseHandler.success(res, {
        message: 'Curriculum processed successfully. Your profile is 100% complete!',
        cv: cv.getSummary(),
        completeness: {
          isComplete: true,
          score: 100,
          missingFieldsCount: 0
        },
        questionnaire: {
          needsCompletion: false
        }
      }, 201);

    } catch (error) {
      console.error('Error en uploadCV:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Obtiene el currículo del usuario autenticado
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
   * Obtiene un currículo específico por ID (solo el propietario o admin)
   */
  async getCVById(req, res) {
    try {
      const { cvId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const cv = await aiExtractorService.getUserCV(userId);

      if (cv._id.toString() !== cvId && userRole !== 'org_admin') {
        return responseHandler.error(res, 'No tienes permisos para ver este currículo', 403);
      }

      return responseHandler.success(res, { cv });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Obtiene todos los currículos (solo admin)
   * Los org_admin solo ven currículos de su organización
   */
  async getAllCVs(req, res) {
    try {
      const filters = {
        skills: req.query.skills ? req.query.skills.split(',') : undefined,
        languages: req.query.languages ? req.query.languages.split(',') : undefined
      };

      // Pasar el usuario completo para que el servicio pueda filtrar por organización
      const cvs = await aiExtractorService.getAllCVs(filters, req.user);

      return responseHandler.success(res, {
        count: cvs.length,
        cvs
      });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Busca currículos por criterios (solo admin)
   * Los org_admin solo buscan en currículos de su organización
   */
  async searchCVs(req, res) {
    try {
      const criteria = {
        skills: req.body.skills || [],
        languages: req.body.languages || [],
        minExperience: req.body.minExperience || null
      };

      // Pasar el usuario para filtrar por organización si es org_admin
      const cvs = await aiExtractorService.searchCVs(criteria, req.user);

      return responseHandler.success(res, {
        count: cvs.length,
        cvs
      });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Actualiza el currículo del usuario
   */
  async updateCV(req, res) {
    try {
      const userId = req.user.id;
      const { cvId } = req.params;
      const updates = req.body;

      const cv = await aiExtractorService.updateCV(userId, cvId, updates);

      return responseHandler.success(res, {
        message: 'Currículo actualizado exitosamente',
        cv
      });

    } catch (error) {
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Elimina el currículo del usuario
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
   * Obtiene estadísticas del currículo (para dashboard)
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
   * Envía el currículo a una organización
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
        message: 'Curriculum sent successfully to the organization',
        cv
      }, 201);

    } catch (error) {
      console.error('Error enviando currículo a organización:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'ORGANIZATION_NOT_ACTIVE': 'La organización no está activa',
        'CV_NOT_FOUND': 'No tienes un currículo registrado',
        'CV_ALREADY_SUBMITTED': 'Ya has enviado tu currículo a esta organización',
        'USER_NOT_FOUND': 'Usuario no encontrado'
      };

      const statusCodes = {
        'ORGANIZATION_NOT_FOUND': 404,
        'ORGANIZATION_NOT_ACTIVE': 403,
        'CV_NOT_FOUND': 404,
        'CV_ALREADY_SUBMITTED': 409,
        'USER_NOT_FOUND': 404
      };

      const message = errorMessages[error.message] || 'Error al enviar currículo';
      const statusCode = statusCodes[error.message] || 400;

      return responseHandler.error(res, message, statusCode);
    }
  }

  /**
   * Obtiene los currículos enviados a una organización (solo admins)
   * GET /api/organizations/:id/cvs
   */
  async getOrganizationCVs(req, res) {
    try {
      // Use the admin's own organization from their JWT profile.
      // req.params.id is accepted but validated against the user's actual org.
      const userOrg = req.user.organization?.toString();
      const paramOrg = req.params.id;
      const organizationId = userOrg || paramOrg;
      const adminId = req.user.id;

      if (!organizationId) {
        return responseHandler.error(res, 'No se proporcionó ID de organización', 400);
      }

      const filters = {
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await cvService.getOrganizationCVs(organizationId, adminId, filters);

      return responseHandler.success(res, result);

    } catch (error) {
      console.error('Error obteniendo currículos de organización:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'UNAUTHORIZED_ACCESS': 'No tienes permisos para ver estos currículos'
      };

      const statusCodes = {
        'ORGANIZATION_NOT_FOUND': 404,
        'UNAUTHORIZED_ACCESS': 403
      };

      const message = errorMessages[error.message] || 'Error al obtener currículos';
      const statusCode = statusCodes[error.message] || 400;

      return responseHandler.error(res, message, statusCode);
    }
  }

  /**
   * Obtiene un currículo específico de la organización
   * GET /api/organizations/:id/cvs/:cvId
   */
  async getOrganizationCV(req, res) {
    try {
      const { cvId } = req.params;
      const organizationId = req.user.organization?.toString() || req.params.id;
      const adminId = req.user.id;

      const cv = await cvService.getOrganizationCV(cvId, organizationId, adminId);

      return responseHandler.success(res, { cv });

    } catch (error) {
      console.error('Error obteniendo currículo de organización:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'UNAUTHORIZED_ACCESS': 'No tienes permisos para ver este currículo',
        'CV_NOT_FOUND': 'Currículo no encontrado',
        'CV_NOT_BELONGS_TO_ORGANIZATION': 'Este currículo no pertenece a esta organización'
      };

      const statusCodes = {
        'ORGANIZATION_NOT_FOUND': 404,
        'UNAUTHORIZED_ACCESS': 403,
        'CV_NOT_FOUND': 404,
        'CV_NOT_BELONGS_TO_ORGANIZATION': 403
      };

      const message = errorMessages[error.message] || 'Error al obtener currículo';
      const statusCode = statusCodes[error.message] || 400;

      return responseHandler.error(res, message, statusCode);
    }
  }

  /**
   * Actualiza el estado de un currículo en la organización
   * PATCH /api/organizations/:id/cvs/:cvId/status
   */
  async updateCVStatus(req, res) {
    try {
      const { cvId } = req.params;
      const organizationId = req.user.organization?.toString() || req.params.id;
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

      // Datos adicionales del empleado cuando se acepta el currículo
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
        message: 'Estado del currículo actualizado exitosamente',
        cv
      });

    } catch (error) {
      console.error('Error actualizando estado de currículo:', error);
      
      const errorMessages = {
        'ORGANIZATION_NOT_FOUND': 'Organización no encontrada',
        'UNAUTHORIZED_ACCESS': 'No tienes permisos para actualizar este currículo',
        'CV_NOT_FOUND': 'Currículo no encontrado',
        'CV_NOT_BELONGS_TO_ORGANIZATION': 'Este currículo no pertenece a esta organización'
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

  /**
   * Get curriculum completeness status
   * GET /api/cv/completeness
   */
  async getCompleteness(req, res) {
    try {
      const userId = req.user.id;

      const cv = await CV.findOne({ userId }).populate('userId', 'name email');

      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found. Please upload your curriculum first.', 404);
      }

      const completeness = validateCVCompleteness(cv);
      const categoryStatus = getCategoryCompleteness(cv);

      return responseHandler.success(res, {
        cv: {
          id: cv._id,
          lastUpdated: cv.lastUpdated
        },
        completeness: {
          isComplete: completeness.isComplete,
          score: completeness.completenessScore,
          totalMissing: completeness.totalMissingCount,
          criticalMissing: completeness.criticalMissingCount,
          highMissing: completeness.highMissingCount,
          mediumMissing: completeness.mediumMissingCount
        },
        categories: categoryStatus,
        missingFields: completeness.missingFields,
        missingByPriority: completeness.missingByPriority
      }, 'Curriculum completeness retrieved successfully');
    } catch (error) {
      console.error('Error getting curriculum completeness:', error);
      return responseHandler.error(res, 'Error retrieving curriculum completeness', 500);
    }
  }

  /**
   * Get questions for missing fields
   * GET /api/cv/missing-fields-questions
   */
  async getMissingFieldsQuestions(req, res) {
    try {
      const userId = req.user.id;
      const language = req.query.language || req.query.lang || 'en';
      const groupByCategory = req.query.groupByCategory === 'true';

      const cv = await CV.findOne({ userId });

      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found. Please upload your curriculum first.', 404);
      }

      const completeness = validateCVCompleteness(cv);

      if (completeness.isComplete) {
        return responseHandler.success(res, {
          isComplete: true,
          questions: [],
          message: 'Your curriculum is complete! No additional information needed.'
        }, 'Curriculum is complete');
      }

      let questions;
      if (groupByCategory) {
        questions = getQuestionsByCategory(completeness.missingFields, language);
      } else {
        questions = generateConditionalQuestions(completeness.missingFields, cv.toObject(), language);
      }

      return responseHandler.success(res, {
        isComplete: false,
        completenessScore: completeness.completenessScore,
        totalQuestions: Array.isArray(questions) ? questions.length : Object.values(questions).flat().length,
        questions,
        missingByPriority: completeness.missingByPriority
      }, 'Questions generated successfully');
    } catch (error) {
      console.error('Error generating questions:', error);
      return responseHandler.error(res, 'Error generating questions', 500);
    }
  }

  /**
   * Complete missing fields
   * PATCH /api/cv/complete-fields
   */
  async completeFields(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;

      if (!updates || Object.keys(updates).length === 0) {
        return responseHandler.error(res, 'No updates provided', 400);
      }

      const cv = await CV.findOne({ userId });

      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found. Please upload your curriculum first.', 404);
      }

      // Validate completeness before update
      const beforeCompleteness = validateCVCompleteness(cv);

      // Apply updates to curriculum
      Object.entries(updates).forEach(([key, value]) => {
        // Handle nested fields (e.g., 'availability.immediate')
        const keys = key.split('.');
        let target = cv;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) {
            target[keys[i]] = {};
          }
          target = target[keys[i]];
        }
        
        target[keys[keys.length - 1]] = value;
      });

      await cv.save();

      // Validate completeness after update
      const afterCompleteness = validateCVCompleteness(cv);

      const improvement = afterCompleteness.completenessScore - beforeCompleteness.completenessScore;

      return responseHandler.success(res, {
        cv: {
          id: cv._id,
          lastUpdated: cv.lastUpdated
        },
        completeness: {
          before: beforeCompleteness.completenessScore,
          after: afterCompleteness.completenessScore,
          improvement,
          isComplete: afterCompleteness.isComplete
        },
        updatedFields: Object.keys(updates),
        remainingMissing: afterCompleteness.missingFields
      }, 'Fields updated successfully');
    } catch (error) {
      console.error('Error completing fields:', error);
      return responseHandler.error(res, 'Error updating fields', 500);
    }
  }

  /**
   * Start interactive questionnaire
   * GET /api/cv/questionnaire/start
   */
  async startQuestionnaire(req, res) {
    try {
      const userId = req.user.id;
      const language = req.query.language || req.query.lang || 'en';

      const cv = await CV.findOne({ userId });

      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found. Please upload your curriculum first.', 404);
      }

      const completeness = validateCVCompleteness(cv);

      if (completeness.isComplete) {
        return responseHandler.success(res, {
          isComplete: true,
          message: {
            en: 'Your curriculum is already complete!',
            es: '¡Tu currículo ya está completo!'
          },
          completenessScore: 100
        }, 'Curriculum is complete');
      }

      // Create session and get initial questions
      const session = createQuestionnaireSession(userId, language);
      const questionnaireData = getInitialQuestions(cv, language, session);

      return responseHandler.success(res, {
        session: {
          sessionId: session.sessionId,
          language: session.language,
          startedAt: session.startedAt
        },
        ...questionnaireData
      }, 'Questionnaire started');
    } catch (error) {
      console.error('Error starting questionnaire:', error);
      return responseHandler.error(res, 'Error starting questionnaire', 500);
    }
  }

  /**
   * Get next questions in questionnaire
   * POST /api/cv/questionnaire/next
   * Body: { responses: { field: value, ... }, currentPhase: 'phase-id' }
   */
  async getNextQuestions(req, res) {
    try {
      const userId = req.user.id;
      const { responses, currentPhase } = req.body;
      const language = req.query.language || req.query.lang || 'en';

      if (!responses || typeof responses !== 'object') {
        return responseHandler.error(res, 'Invalid responses format', 400);
      }

      if (!currentPhase) {
        return responseHandler.error(res, 'Current phase is required', 400);
      }

      const cv = await CV.findOne({ userId });

      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found. Please upload your curriculum first.', 404);
      }

      // Process and move to next phase
      const result = processResponsesAndGetNext(cv, responses, currentPhase, language);

      return responseHandler.success(res, {
        ...result,
        sessionInfo: {
          currentPhase: result.phase?.id || null,
          language
        }
      }, 'Next questions retrieved');
    } catch (error) {
      console.error('Error getting next questions:', error);
      return responseHandler.error(res, 'Error retrieving next questions', 500);
    }
  }

  /**
   * Submit and finalize questionnaire (legacy)
   * @deprecated Use submitQuestionnaire with sessionId instead
   */
  async submitQuestionnaireSimple(req, res) {
    try {
      const userId = req.user.id;
      const { responses } = req.body;

      if (!responses || typeof responses !== 'object') {
        return responseHandler.error(res, 'Invalid responses format', 400);
      }

      const cv = await CV.findOne({ userId });

      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found. Please upload your curriculum first.', 404);
      }

      // Finalize questionnaire and update CV
      const result = finalizeQuestionnaire(cv, responses);

      // Update CV in database
      Object.entries(responses).forEach(([key, value]) => {
        const keys = key.split('.');
        let target = cv;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) {
            target[keys[i]] = {};
          }
          target = target[keys[i]];
        }

        target[keys[keys.length - 1]] = value;
      });

      await cv.save();

      return responseHandler.success(res, {
        cv: {
          id: cv._id,
          lastUpdated: cv.lastUpdated
        },
        completeness: {
          isComplete: result.isComplete,
          score: result.completenessScore,
          message: result.summary[req.query.language || 'en'] || result.summary.en
        },
        missingFields: result.missingFields,
        missingByPriority: result.missingByPriority
      }, 'Questionnaire completed successfully');
    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      return responseHandler.error(res, 'Error submitting questionnaire', 500);
    }
  }

  /**
   * Get questionnaire phases
   * GET /api/cv/questionnaire/phases
   */
  async getQuestionnairePhases(req, res) {
    try {
      const language = req.query.language || req.query.lang || 'en';
      const phases = getAllPhases();

      const phasesData = Object.entries(phases).map(([id, phase]) => ({
        id,
        title: phase.title[language],
        description: phase.description[language],
        fields: phase.fields
      }));

      return responseHandler.success(res, {
        phases: phasesData,
        totalPhases: phasesData.length
      }, 'Questionnaire phases retrieved');
    } catch (error) {
      console.error('Error getting phases:', error);
      return responseHandler.error(res, 'Error retrieving phases', 500);
    }
  }

  /**
   * Submit phase responses and get next phase
   */
  async submitPhaseResponses(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId, currentPhase, responses } = req.body;

      if (!sessionId || !currentPhase || !responses) {
        return responseHandler.error(res, 'Missing required fields: sessionId, currentPhase, responses', 400);
      }

      // Get user's curriculum
      const cv = await CV.findOne({ userId });
      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found', 404);
      }

      // Update curriculum with responses
      Object.entries(responses).forEach(([field, value]) => {
        const keys = field.split('.');
        let target = cv;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) {
            target[keys[i]] = {};
          }
          target = target[keys[i]];
        }

        target[keys[keys.length - 1]] = value;
      });

      await cv.save();

      // Get next phase
      const language = req.body.language || req.query.language || req.user.preferredLanguage || 'en';
      const nextPhaseData = processResponsesAndGetNext(cv, responses, currentPhase, language);

      if (nextPhaseData.isComplete) {
        return responseHandler.success(res, {
          isComplete: true,
          completenessScore: nextPhaseData.completenessScore,
          message: nextPhaseData.message
        });
      }

      return responseHandler.success(res, {
        session: {
          sessionId,
          userId,
          language,
          lastUpdatedAt: new Date().toISOString()
        },
        phase: nextPhaseData.phase,
        questions: nextPhaseData.questions,
        completenessScore: nextPhaseData.completenessScore,
        progressPercentage: Math.round((nextPhaseData.phase.index / nextPhaseData.phase.total) * 100)
      });

    } catch (error) {
      console.error('Error submitting phase responses:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Submit final questionnaire responses
   */
  async submitQuestionnaire(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId, finalResponses } = req.body;

      if (!sessionId || !finalResponses) {
        return responseHandler.error(res, 'Missing required fields: sessionId, finalResponses', 400);
      }

      // Get user's curriculum
      const cv = await CV.findOne({ userId });
      if (!cv) {
        return responseHandler.error(res, 'Curriculum not found', 404);
      }

      const previousCompleteness = validateCVCompleteness(cv);

      // Update CV with all final responses
      Object.entries(finalResponses).forEach(([field, value]) => {
        const keys = field.split('.');
        let target = cv;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) {
            target[keys[i]] = {};
          }
          target = target[keys[i]];
        }

        target[keys[keys.length - 1]] = value;
      });

      await cv.save();

      const finalCompleteness = validateCVCompleteness(cv);

      return responseHandler.success(res, {
        session: {
          sessionId,
          completedAt: new Date().toISOString()
        },
        result: {
          isComplete: finalCompleteness.isComplete,
          completenessScore: finalCompleteness.completenessScore,
          previousScore: previousCompleteness.completenessScore,
          improvementPoints: finalCompleteness.completenessScore - previousCompleteness.completenessScore,
          fieldsUpdated: Object.keys(finalResponses).length,
          missingFields: finalCompleteness.missingFields
        },
        message: 'Curriculum successfully updated! You are now ready for team recommendations.'
      });

    } catch (error) {
      console.error('Error submitting questionnaire:', error);
      return responseHandler.handleError(error, res);
    }
  }
}

module.exports = new CVController();