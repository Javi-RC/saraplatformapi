const BFI44Service = require('../services/core/bfi44.service');
const responseHandler = require('../utils/responseHandler');
const { userRepository, organizationRepository } = require('../repositories');
const { ROLES } = require('../config/roles');

/**
 * BFI-44 Controller
 * Handles HTTP requests for the Big Five Inventory
 * Following SOLID principles and existing architecture
 */
class BFI44Controller {
  /**
   * GET /api/bfi-44/questions
   * Get the full BFI-44 questionnaire
   * @query language - Language code ('en' or 'es', default: 'en')
   */
  static getQuestions(req, res) {
    try {
      const language = req.query.language || req.query.lang || 'en';
      const questionnaire = BFI44Service.getQuestionnaire(language);
      
      return responseHandler.success(res, questionnaire);
    } catch (error) {
      console.error('Error in getQuestions:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/submit
   * Submit questionnaire responses
   */
  static async submitResponses(req, res) {
    try {
      const { responses } = req.body;
      const userId = req.user.id;

      if (!responses) {
        return responseHandler.error(res, 'Responses are required', 400);
      }

      const result = await BFI44Service.submitResponses(userId, responses);

      return responseHandler.success(res, {
        message: 'Questionnaire completed successfully',
        ...result
      }, 201);

    } catch (error) {
      console.error('Error in submitResponses:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/profile/:userId
   * Get a user's BFI-44 profile
   */
  static async getProfile(req, res) {
    try {
      const { userId } = req.params;

      if (req.user.id !== userId && req.user.role !== ROLES.ORG_ADMIN) {
        const targetUser = await userRepository.findById(userId, { select: 'organization' });
        const organizationId = targetUser?.organization;

        if (!organizationId) {
          return responseHandler.error(res, 'Not authorized to view this profile', 403);
        }

        const organization = await organizationRepository.findById(organizationId);
        const isAllowed = organization && (organization.isAdmin(req.user.id) || organization.isProjectManager(req.user.id));

        if (!isAllowed) {
          return responseHandler.error(res, 'Not authorized to view this profile', 403);
        }
      }

      const profile = await BFI44Service.getUserProfile(userId);

      if (!profile) {
        return responseHandler.error(res, 'BFI-44 profile not found', 404);
      }

      return responseHandler.success(res, profile);

    } catch (error) {
      console.error('Error in getProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/my-profile
   * Get the authenticated user's BFI-44 profile
   */
  static async getMyProfile(req, res) {
    try {
      const userId = req.user.id;

      const profile = await BFI44Service.getUserProfile(userId);

      if (!profile) {
        return responseHandler.error(res, 'You have not completed the BFI-44 questionnaire', 404);
      }

      return responseHandler.success(res, profile);

    } catch (error) {
      console.error('Error in getMyProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/recalculate/:responseId
   * Recalculate a profile's results (admin only)
   */
  static async recalculateProfile(req, res) {
    try {
      const { responseId } = req.params;

      if (req.user.role !== ROLES.ORG_ADMIN) {
        return responseHandler.error(res, 'Not authorized', 403);
      }

      const result = await BFI44Service.recalculateProfile(responseId);

      return responseHandler.success(res, {
        message: 'Profile recalculated successfully',
        ...result
      });

    } catch (error) {
      console.error('Error in recalculateProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/has-profile
   * Check if the authenticated user has a BFI-44 profile
   */
  static async hasProfile(req, res) {
    try {
      const userId = req.user.id;

      const hasProfile = await BFI44Service.hasProfile(userId);

      return responseHandler.success(res, { hasProfile });

    } catch (error) {
      console.error('Error in hasProfile:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/notify-pending
   * Notify employees without test (org_admin or project manager)
   */
  static async notifyPendingEmployees(req, res) {
    try {
      const isOrgAdmin = req.user.role === ROLES.ORG_ADMIN;
      const isProjectManager = req.isProjectManager === true;

      if (!isOrgAdmin && !isProjectManager) {
        return responseHandler.error(res, 'Not authorized', 403);
      }

      if (!req.user.organization) {
        return responseHandler.error(res, 'You do not belong to any organization', 400);
      }

      const result = await BFI44Service.notifyEmployeesWithoutTest(req.user.organization);

      return responseHandler.success(res, {
        message: `${result.notified} employee(s) notified`,
        ...result
      });

    } catch (error) {
      console.error('Error in notifyPendingEmployees:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * POST /api/bfi-44/notify-user/:userId
   * Notify a specific employee to complete the test
   */
  static async notifySpecificUser(req, res) {
    try {
      const { userId } = req.params;

      if (!req.user.organization) {
        return responseHandler.error(res, 'You do not belong to any organization', 400);
      }

      // Verify the target user belongs to the same organization
      const targetUser = await userRepository.findById(userId, { select: 'organization role' });

      if (!targetUser) {
        return responseHandler.error(res, 'User not found', 404);
      }

      if (!targetUser.organization || targetUser.organization.toString() !== req.user.organization.toString()) {
        return responseHandler.error(res, 'The user does not belong to your organization', 403);
      }

      const result = await BFI44Service.checkAndNotifyUser(userId);

      return responseHandler.success(res, result);

    } catch (error) {
      console.error('Error in notifySpecificUser:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/employees-without-test
   * Get list of employees without test (org_admin or project manager)
   */
  static async getEmployeesWithoutTest(req, res) {
    try {
      const isOrgAdmin = req.user.role === ROLES.ORG_ADMIN;
      const isProjectManager = req.isProjectManager === true;

      if (!isOrgAdmin && !isProjectManager) {
        return responseHandler.error(res, 'Not authorized', 403);
      }

      if (!req.user.organization) {
        return responseHandler.error(res, 'You do not belong to any organization', 400);
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
      console.error('Error in getEmployeesWithoutTest:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/consent-status
   * Check if the user has consent for the BFI-44
   */
  static async getConsentStatus(req, res) {
    try {
      const userId = req.user.id;
      const user = await userRepository.findById(userId, { select: 'personalityDataConsent' });

      if (!user) {
        return responseHandler.error(res, 'User not found', 404);
      }

      return responseHandler.success(res, {
        hasConsent: user.hasPersonalityDataConsent(),
        consent: user.personalityDataConsent || { accepted: false, version: '1.0' }
      });

    } catch (error) {
      console.error('Error in getConsentStatus:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * GET /api/bfi-44/organization-stats
   * Get test statistics by organization (org_admin only)
   */
  static async getOrganizationStats(req, res) {
    try {
      if (req.user.role !== ROLES.ORG_ADMIN) {
        return responseHandler.error(res, 'Not authorized', 403);
      }

      if (!req.user.organization) {
        return responseHandler.error(res, 'You do not belong to any organization', 400);
      }

      const stats = await BFI44Service.getOrganizationStats(req.user.organization);

      return responseHandler.success(res, stats);

    } catch (error) {
      console.error('Error in getOrganizationStats:', error);
      return responseHandler.handleError(error, res);
    }
  }
}

module.exports = BFI44Controller;
