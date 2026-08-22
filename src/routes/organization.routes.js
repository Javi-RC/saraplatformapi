const express = require('express');
const router = express.Router();
const passport = require('passport');
const organizationController = require('../controllers/organization.controller');
const { validateOrganizationCreation, validateOrganizationUpdate } = require('../utils/validators');
const { requireOrganizationAdmin } = require('../middleware/authorization');

/**
 * Organization Routes
 * Manages all organization-related endpoints
 * Following REST principles and separation of responsibilities
 */

const authenticate = passport.authenticate('jwt', { session: false });

/**
 * Search organizations with filters
 * GET /api/organizations/search
 * Query params: name, industry, size, status, page, limit, sortBy, sortOrder
 */
router.get('/search', authenticate, organizationController.searchOrganizations);

/**
 * Get organizations of the authenticated user
 * GET /api/organizations/my-organizations
 */
router.get('/my-organizations', authenticate, organizationController.getMyOrganizations);

/**
 * Create a new organization
 * POST /api/organizations
 * Body: { name, description, contact, address, industry, size, ... }
 */
router.post(
  '/',
  authenticate,
  validateOrganizationCreation,
  organizationController.createOrganization
);

/**
 * Get an organization by ID
 * GET /api/organizations/:id
 * Query params: includeEmployees (boolean)
 */
router.get('/:id', authenticate, organizationController.getOrganization);

/**
 * Update an organization
 * PUT /api/organizations/:id
 * Body: { name, description, contact, address, ... }
 */
router.put(
  '/:id',
  authenticate,
  requireOrganizationAdmin,
  validateOrganizationUpdate,
  organizationController.updateOrganization
);

/**
 * Deactivate an organization
 * PATCH /api/organizations/:id/deactivate
 */
router.patch('/:id/deactivate', authenticate, requireOrganizationAdmin, organizationController.deactivateOrganization);

/**
 * Activate an organization
 * PATCH /api/organizations/:id/activate
 */
router.patch('/:id/activate', authenticate, requireOrganizationAdmin, organizationController.activateOrganization);

/**
 * Update organization settings
 * PATCH /api/organizations/:id/settings
 * Body: { allowPublicCVSubmission, requireApproval, notifyOnCVSubmission, ... }
 */
router.patch('/:id/settings', authenticate, requireOrganizationAdmin, organizationController.updateSettings);

/**
 * Get organization statistics
 * GET /api/organizations/:id/stats
 */
router.get('/:id/stats', authenticate, organizationController.getStats);

/**
 * Get employees of the organization
 * GET /api/organizations/:id/employees
 * Query params: status, department, position
 */
router.get('/:id/employees', authenticate, organizationController.getEmployees);

/**
 * Add an employee to the organization
 * POST /api/organizations/:id/employees
 * Body: { userId, position, department }
 */
router.post('/:id/employees', authenticate, requireOrganizationAdmin, organizationController.addEmployee);

/**
 * Remove an employee from the organization
 * DELETE /api/organizations/:id/employees/:userId
 */
router.delete('/:id/employees/:userId', authenticate, requireOrganizationAdmin, organizationController.removeEmployee);

/**
 * Update employee status
 * PATCH /api/organizations/:id/employees/:userId/status
 * Body: { status: 'active' | 'inactive' | 'pending' }
 */
router.patch('/:id/employees/:userId/status', authenticate, requireOrganizationAdmin, organizationController.updateEmployeeStatus);

/**
 * Assign or remove project manager role from an employee
 * PATCH /api/organizations/:id/employees/:employeeId/project-manager
 * Body: { isProjectManager: boolean }
 */
router.patch('/:id/employees/:employeeId/project-manager', authenticate, requireOrganizationAdmin, organizationController.setProjectManagerRole);

/**
 * Get all project managers of the organization
 * GET /api/organizations/:id/project-managers
 */
router.get('/:id/project-managers', authenticate, organizationController.getProjectManagers);

/**
 * Add an additional administrator
 * POST /api/organizations/:id/admins
 * Body: { userId }
 */
router.post('/:id/admins', authenticate, requireOrganizationAdmin, organizationController.addAdmin);

/**
 * Get curricula submitted to the organization
 * GET /api/organizations/:id/cvs
 * Query params: status, page, limit
 */
router.get('/:id/cvs', authenticate, requireOrganizationAdmin, require('../controllers/cv.controller').getOrganizationCVs);

/**
 * Get a specific curriculum from the organization
 * GET /api/organizations/:id/cvs/:cvId
 */
router.get('/:id/cvs/:cvId', authenticate, requireOrganizationAdmin, require('../controllers/cv.controller').getOrganizationCV);

/**
 * Update curriculum status
 * PATCH /api/organizations/:id/cvs/:cvId/status
 * Body: { status: 'pending' | 'reviewed' | 'accepted' | 'rejected', notes }
 */
router.patch('/:id/cvs/:cvId/status', authenticate, requireOrganizationAdmin, require('../controllers/cv.controller').updateCVStatus);

/**
 * Get organization projects
 * GET /api/organizations/:id/projects
 * Query params: status, projectManager
 */
router.get('/:id/projects', authenticate, organizationController.getOrganizationProjects);

/**
 * Get organization project statistics
 * GET /api/organizations/:id/projects/statistics
 */
router.get('/:id/projects/statistics', authenticate, organizationController.getProjectStatistics);

/**
 * Get expert rules configuration
 * GET /api/organizations/:id/expert-rules/config
 */
router.get('/:id/expert-rules/config', authenticate, organizationController.getExpertRulesConfig);

/**
 * Update expert rules configuration
 * PUT /api/organizations/:id/expert-rules/config
 * Body: { riskThresholds: {...}, personalityRiskThresholds: {...} }
 * Access: Organization admin only
 */
router.put('/:id/expert-rules/config', authenticate, requireOrganizationAdmin, organizationController.updateExpertRulesConfig);

module.exports = router;
