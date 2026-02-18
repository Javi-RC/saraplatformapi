const BFI44Service = require('../services/bfi44.service');
const responseHandler = require('../utils/responseHandler');
const Organization = require('../models/organization.model');
const User = require('../models/user.model');

/**
 * BFI-44 Controller
 * Controlador para manejar las peticiones HTTP del Big Five Inventory
 * Siguiendo principios SOLID y arquitectura existente
 */
class BFI44Controller {
  /**
   * GET /api/bfi-44/questions
   * Obtener el cuestionario completo del BFI-44
   * @query language - Language code ('en' or 'es', default: 'en')
   */
  static getQuestions(req, res) {
    try {
      const language = req.query.language || req.query.lang || 'en';
      const questionnaire = BFI44Service.getQuestionnaire(language);
      
      return responseHandler.success(res, questionnaire);
    } catch (error) {
      console.error('Error en getQuestions:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/submit
   * Enviar respuestas del cuestionario
   */
  static async submitResponses(req, res) {
    try {
      const { responses } = req.body;
      const userId = req.user.id;

      if (!responses) {
        return responseHandler.error(res, 'Las respuestas son requeridas', 400);
      }

      const result = await BFI44Service.submitResponses(userId, responses);

      return responseHandler.success(res, {
        message: 'Questionnaire completed successfully',
        ...result
      }, 201);

    } catch (error) {
      console.error('Error en submitResponses:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/profile/:userId
   * Obtener el perfil BFI-44 de un usuario
   */
  static async getProfile(req, res) {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && req.user.role !== 'org_admin') {
        const targetUser = await User.findById(userId).select('organization');
        const organizationId = targetUser?.organization;

        if (!organizationId) {
          return responseHandler.error(res, 'No autorizado para ver este perfil', 403);
        }

        const organization = await Organization.findById(organizationId);
        const isAllowed = organization && (organization.isAdmin(req.user.id) || organization.isProjectManager(req.user.id));

        if (!isAllowed) {
          return responseHandler.error(res, 'No autorizado para ver este perfil', 403);
        }
      }

      const profile = await BFI44Service.getUserProfile(userId);

      if (!profile) {
        return responseHandler.error(res, 'BFI-44 profile not found', 404);
      }

      return responseHandler.success(res, profile);

    } catch (error) {
      console.error('Error en getProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/my-profile
   * Obtener el perfil BFI-44 del usuario autenticado
   */
  static async getMyProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await BFI44Service.getUserProfile(userId);

      if (!profile) {
        return responseHandler.error(res, 'No has completado el cuestionario BFI-44', 404);
      }

      return responseHandler.success(res, profile);

    } catch (error) {
      console.error('Error en getMyProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/recalculate/:responseId
   * Recalcular resultados de un perfil (solo para admins)
   */
  static async recalculateProfile(req, res) {
    try {
      const { responseId } = req.params;

      if (req.user.role !== 'org_admin') {
        return responseHandler.error(res, 'No autorizado', 403);
      }

      const result = await BFI44Service.recalculateProfile(responseId);

      return responseHandler.success(res, {
        message: 'Profile recalculated successfully',
        ...result
      });

    } catch (error) {
      console.error('Error en recalculateProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/has-profile
   * Verificar si el usuario autenticado tiene un perfil BFI-44
   */
  static async hasProfile(req, res) {
    try {
      const userId = req.user.id;

      const hasProfile = await BFI44Service.hasProfile(userId);

      return responseHandler.success(res, { hasProfile });

    } catch (error) {
      console.error('Error en hasProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/notify-pending
   * Notificar a empleados sin test (org_admin o project manager)
   */
  static async notifyPendingEmployees(req, res) {
    try {
      const isOrgAdmin = req.user.role === 'org_admin';
      const isProjectManager = req.isProjectManager === true;

      if (!isOrgAdmin && !isProjectManager) {
        return responseHandler.error(res, 'No autorizado', 403);
      }

      if (!req.user.organization) {
        return responseHandler.error(res, 'No perteneces a ninguna organización', 400);
      }

      const result = await BFI44Service.notifyEmployeesWithoutTest(req.user.organization);

      return responseHandler.success(res, {
        message: `${result.notified} empleado(s) notificado(s)`,
        ...result
      });

    } catch (error) {
      console.error('Error en notifyPendingEmployees:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/notify-user/:userId
   * Notificar a un empleado específico que complete el test
   */
  static async notifySpecificUser(req, res) {
    try {
      const { userId } = req.params;

      if (!req.user.organization) {
        return responseHandler.error(res, 'No perteneces a ninguna organización', 400);
      }

      // Verify the target user belongs to the same organization
      const targetUser = await User.findById(userId).select('organization role');

      if (!targetUser) {
        return responseHandler.error(res, 'Usuario no encontrado', 404);
      }

      if (!targetUser.organization || targetUser.organization.toString() !== req.user.organization.toString()) {
        return responseHandler.error(res, 'El usuario no pertenece a tu organización', 403);
      }

      const result = await BFI44Service.checkAndNotifyUser(userId);

      return responseHandler.success(res, result);

    } catch (error) {
      console.error('Error en notifySpecificUser:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/employees-without-test
   * Obtener lista de empleados sin test (org_admin o project manager)
   */
  static async getEmployeesWithoutTest(req, res) {
    try {
      const isOrgAdmin = req.user.role === 'org_admin';
      const isProjectManager = req.isProjectManager === true;

      if (!isOrgAdmin && !isProjectManager) {
        return responseHandler.error(res, 'No autorizado', 403);
      }

      if (!req.user.organization) {
        return responseHandler.error(res, 'No perteneces a ninguna organización', 400);
      }

      const employees = await BFI44Service.getEmployeesWithoutTest(req.user.organization);

      return responseHandler.success(res, {
        count: employees.length,
        employees: employees.map(e => ({
          id: e._id,
          name: e.name,
          email: e.email
        }))
      });

    } catch (error) {
      console.error('Error en getEmployeesWithoutTest:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/consent-status
   * Verificar si el usuario tiene consentimiento para el BFI-44
   */
  static async getConsentStatus(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('personalityDataConsent');

      if (!user) {
        return responseHandler.error(res, 'Usuario no encontrado', 404);
      }

      return responseHandler.success(res, {
        hasConsent: user.hasPersonalityDataConsent(),
        consent: user.personalityDataConsent || { accepted: false, version: '1.0' }
      });

    } catch (error) {
      console.error('Error en getConsentStatus:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/organization-stats
   * Obtener estadísticas de test por organización (solo para org_admin)
   */
  static async getOrganizationStats(req, res) {
    try {
      if (req.user.role !== 'org_admin') {
        return responseHandler.error(res, 'No autorizado', 403);
      }

      if (!req.user.organization) {
        return responseHandler.error(res, 'No perteneces a ninguna organización', 400);
      }

      const stats = await BFI44Service.getOrganizationStats(req.user.organization);

      return responseHandler.success(res, stats);

    } catch (error) {
      console.error('Error en getOrganizationStats:', error);
      return responseHandler.handleError(error, res);
    }
  }
}

module.exports = BFI44Controller;
