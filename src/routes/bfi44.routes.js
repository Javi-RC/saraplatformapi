const { Router } = require('express');
const router = Router();
const BFI44Controller = require('../controllers/bfi44.controller');
const { authMiddleware } = require('../utils/jwt');
const { requireRole, requireOrgAdminOrProjectManager } = require('../middleware/authorization');
const { ROLES } = require('../config/roles');

/**
 * BFI-44 Routes
 * Routes for the Big Five Inventory
 * All routes require authentication
 */

/**
 * GET /api/bfi-44/questions
 * Get the complete questionnaire
 * Query params: ?language=es (or ?lang=es)
 * Access: Authenticated users
 */
router.get(
  '/questions',
  authMiddleware,
  BFI44Controller.getQuestions
);

/**
 * POST /api/bfi-44/submit
 * Submit questionnaire responses
 * Access: Authenticated users
 */
router.post(
  '/submit',
  authMiddleware,
  BFI44Controller.submitResponses
);

/**
 * GET /api/bfi-44/my-profile
 * Get the BFI-44 profile of the authenticated user
 * Access: Authenticated user
 */
router.get(
  '/my-profile',
  authMiddleware,
  BFI44Controller.getMyProfile
);

/**
 * GET /api/bfi-44/has-profile
 * Check if the user has a BFI-44 profile
 * Access: Authenticated user
 */
router.get(
  '/has-profile',
  authMiddleware,
  BFI44Controller.hasProfile
);

/**
 * GET /api/bfi-44/profile/:userId
 * Get the BFI-44 profile of a specific user
 * Access: The user themselves or organization administrator
 */
router.get(
  '/profile/:userId',
  authMiddleware,
  BFI44Controller.getProfile
);

/**
 * POST /api/bfi-44/recalculate/:responseId
 * Recalculate profile results
 * Access: Organization administrators only
 */
router.post(
  '/recalculate/:responseId',
  authMiddleware,
  requireRole(ROLES.ORG_ADMIN),
  BFI44Controller.recalculateProfile
);

/**
 * GET /api/bfi-44/consent-status
 * Check if the user has consent for the BFI-44
 * Access: Authenticated user
 */
router.get(
  '/consent-status',
  authMiddleware,
  BFI44Controller.getConsentStatus
);

/**
 * POST /api/bfi-44/notify-pending
 * Notify employees who haven't completed the test
 * Access: Organization administrators and project managers
 */
router.post(
  '/notify-pending',
  authMiddleware,
  requireOrgAdminOrProjectManager,
  BFI44Controller.notifyPendingEmployees
);

/**
 * GET /api/bfi-44/employees-without-test
 * Get list of employees without test
 * Access: Organization administrators and project managers
 */
router.get(
  '/employees-without-test',
  authMiddleware,
  requireOrgAdminOrProjectManager,
  BFI44Controller.getEmployeesWithoutTest
);

/**
 * POST /api/bfi-44/notify-pending/:userId
 * Notify a specific employee who hasn't completed the test
 * Access: Organization administrators and project managers
 */
router.post(
  '/notify-pending/:userId',
  authMiddleware,
  requireOrgAdminOrProjectManager,
  BFI44Controller.notifySpecificUser
);

/**
 * GET /api/bfi-44/organization-stats
 * Get test statistics by organization
 * Access: Organization administrators only
 */
router.get(
  '/organization-stats',
  authMiddleware,
  requireRole(ROLES.ORG_ADMIN),
  BFI44Controller.getOrganizationStats
);

module.exports = router;
