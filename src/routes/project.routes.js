const express = require('express');
const router = express.Router();
const passport = require('passport');
const projectController = require('../controllers/project.controller');
const { body } = require('express-validator');
const { requireOrgAdminOrProjectManager } = require('../middleware/authorization');

/**
 * Project Routes
 * Manages all endpoints related to projects
 * Following REST principles and separation of concerns
 */

const authenticate = passport.authenticate('jwt', { session: false });

const validateProjectCreation = [
  body('organizationId')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isMongoId()
    .withMessage('Invalid organization ID'),
  
  body('projectName')
    .notEmpty()
    .withMessage('Project name is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Project name must be between 2 and 200 characters'),
  
  body('briefDescription')
    .notEmpty()
    .withMessage('Brief description is required')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('estimatedStartDate')
    .notEmpty()
    .withMessage('Estimated start date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('estimatedEndDate')
    .notEmpty()
    .withMessage('Estimated end date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  // expectedDuration is now a virtual field calculated automatically
  
  body('requiresSynchronousCommunication')
    .optional()
    .isIn(['yes', 'no', 'only_critical_moments'])
    .withMessage('Invalid value for synchronous communication'),
  
  body('realTimeCommunicationLevel')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid real-time communication level'),
  
  body('weeklyMeetingsCount')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Weekly meetings count must be 0 or greater'),
  
  body('requiredExperienceLevel')
    .optional()
    .isIn(['junior', 'mid', 'senior', 'expert'])
    .withMessage('Invalid experience level'),
  
  body('documentationLevel')
    .optional()
    .isIn(['complete', 'partial', 'minimal', 'none'])
    .withMessage('Invalid documentation level'),
  
  body('managementMethod')
    .optional()
    .isIn(['scrum', 'kanban', 'waterfall', 'hybrid', 'other'])
    .withMessage('Invalid management method')
];

const validateProjectUpdate = [
  body('projectName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Project name must be between 2 and 200 characters'),
  
  body('briefDescription')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('estimatedStartDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('estimatedEndDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

const validateEmployeeAssignment = [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid employee ID'),
  
  body('assignedRole')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Assigned role cannot exceed 200 characters')
];

/**
 * Get projects managed by current user
 * GET /api/projects/my-projects
 * Query params: status, organizationId
 */
router.get('/my-projects', authenticate, projectController.getMyProjects);

/**
 * Get projects where current user is assigned
 * GET /api/projects/assigned-to-me
 */
router.get('/assigned-to-me', authenticate, projectController.getAssignedProjects);
// PROJECT MANAGEMENT ROUTES

/**
 * Create a new project
 * POST /api/projects
 * Body: { organizationId, projectName, briefDescription, ... }
 */
router.post(
  '/',
  authenticate,
  requireOrgAdminOrProjectManager,
  validateProjectCreation,
  projectController.createProject
);

/**
 * Get a project by ID
 * GET /api/projects/:id
 * Query params: includeEmployees (boolean)
 */
router.get('/:id', authenticate, projectController.getProject);

/**
 * Update a project
 * PUT /api/projects/:id
 * Body: { projectName, briefDescription, ... }
 */
router.put(
  '/:id',
  authenticate,
  requireOrgAdminOrProjectManager,
  validateProjectUpdate,
  projectController.updateProject
);

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
router.delete('/:id', authenticate, requireOrgAdminOrProjectManager, projectController.deleteProject);

/**
 * Activate a project (change from draft to active)
 * PATCH /api/projects/:id/activate
 */
router.patch('/:id/activate', authenticate, requireOrgAdminOrProjectManager, projectController.activateProject);

/**
 * Complete a project
 * PATCH /api/projects/:id/complete
 */
router.patch('/:id/complete', authenticate, requireOrgAdminOrProjectManager, projectController.completeProject);

/**
 * Cancel a project
 * PATCH /api/projects/:id/cancel
 */
router.patch('/:id/cancel', authenticate, requireOrgAdminOrProjectManager, projectController.cancelProject);

/**
 * Assign an employee to a project
 * POST /api/projects/:id/assign
 * Body: { employeeId, assignedRole }
 */
router.post(
  '/:id/assign',
  authenticate,
  requireOrgAdminOrProjectManager,
  validateEmployeeAssignment,
  projectController.assignEmployee
);

/**
 * Remove an employee from a project
 * DELETE /api/projects/:id/employees/:employeeId
 */
router.delete('/:id/employees/:employeeId', authenticate, requireOrgAdminOrProjectManager, projectController.removeEmployee);

/**
 * Suggest optimal team based on project requirements
 * POST /api/projects/suggest-team
 * Body: { organizationId, projectRequirements, teamSize }
 */
router.post(
  '/suggest-team',
  authenticate,
  [
    body('organizationId')
      .notEmpty()
      .withMessage('Organization ID is required')
      .isMongoId()
      .withMessage('Invalid organization ID'),
    body('projectRequirements')
      .notEmpty()
      .withMessage('Project requirements are required'),
    body('teamSize')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Team size must be between 1 and 20')
  ],
  projectController.suggestTeam
);

/**
 * Get team analysis for a specific project
 * GET /api/projects/:id/team-analysis
 * 
 * Devuelve:
 * - currentTeam: Análisis del equipo actual (si hay empleados asignados)
 * - suggestions: Empleados sugeridos para completar el equipo
 * - teamStatus: Estado del equipo (tamaño actual vs objetivo)
 * 
 * Permite al PM construir el equipo gradualmente, asignando uno por uno
 */
router.get(
  '/:id/team-analysis',
  authenticate,
  projectController.getTeamAnalysis
);

/**
 * Get detailed personality synergy analysis for project team
 * GET /api/projects/:id/team-synergy
 * 
 * Returns:
 * - synergy: Complete synergy analysis with metrics
 * - hiringRecommendations: Personality profiles to complement team
 * - explanation: Human-readable insights about team dynamics
 * 
 * Requires: Project must have assigned team members with BFI-44 profiles
 */
router.get(
  '/:id/team-synergy',
  authenticate,
  projectController.getTeamSynergy
);

/**
 * Candidate Pool Size (Top N) Endpoint
 * Dedicated endpoint for PM or Org Admin to configure how many top candidates
 * from Phase 1 advance to Phase 2 personality optimization
 */

/**
 * Get current candidate pool size configuration
 * GET /api/projects/:id/candidate-pool-size
 * 
 * Returns the candidatePoolMultiplier and effective top N value
 * Accessible by project manager or organization admin
 */
router.get(
  '/:id/candidate-pool-size',
  authenticate,
  projectController.getCandidatePoolSize
);

/**
 * Update candidate pool size (Top N)
 * PATCH /api/projects/:id/candidate-pool-size
 * 
 * Body: { candidatePoolMultiplier: number (1-10) }
 * Sets how many top candidates from Phase 1 pass to Phase 2
 * Accessible by project manager or organization admin
 */
router.patch(
  '/:id/candidate-pool-size',
  authenticate,
  requireOrgAdminOrProjectManager,
  body('candidatePoolMultiplier')
    .isFloat({ min: 1, max: 10 })
    .withMessage('candidatePoolMultiplier must be a number between 1 and 10'),
  projectController.updateCandidatePoolSize
);

/**
 * Team Selection Configuration Endpoints
 * Allow PM to customize team generation algorithm parameters
 */

/**
 * Get team selection configuration
 * GET /api/projects/:id/team-config
 * 
 * Returns current configuration with defaults
 * Only accessible by project manager
 */
router.get(
  '/:id/team-config',
  authenticate,
  projectController.getTeamConfig
);

/**
 * Update complete team selection configuration
 * PUT /api/projects/:id/team-config
 * 
 * Updates all configuration sections at once
 * Only accessible by project manager
 */
router.put(
  '/:id/team-config',
  authenticate,
  requireOrgAdminOrProjectManager,
  projectController.updateTeamConfig
);

/**
 * Update Phase 1 configuration (Technical Matching)
 * PATCH /api/projects/:id/team-config/phase1
 * 
 * Updates only Phase 1 weights and parameters
 * Only accessible by project manager
 */
router.patch(
  '/:id/team-config/phase1',
  authenticate,
  requireOrgAdminOrProjectManager,
  projectController.updatePhase1Config
);

/**
 * Update Phase 2 configuration (Personality Optimization)
 * PATCH /api/projects/:id/team-config/phase2
 * 
 * Updates only Phase 2 personality settings
 * Only accessible by project manager
 */
router.patch(
  '/:id/team-config/phase2',
  authenticate,
  requireOrgAdminOrProjectManager,
  projectController.updatePhase2Config
);

/**
 * Update CBR configuration
 * PATCH /api/projects/:id/team-config/cbr
 * 
 * Updates CBR dimension weights and parameters
 * Only accessible by project manager
 */
router.patch(
  '/:id/team-config/cbr',
  authenticate,
  requireOrgAdminOrProjectManager,
  projectController.updateCBRConfig
);

/**
 * Update Decision Tree configuration
 * PATCH /api/projects/:id/team-config/decision-tree
 * 
 * Updates risk detection thresholds
 * Only accessible by project manager
 */
router.patch(
  '/:id/team-config/decision-tree',
  authenticate,
  requireOrgAdminOrProjectManager,
  projectController.updateDecisionTreeConfig
);

/**
 * Reset configuration to defaults
 * POST /api/projects/:id/team-config/reset
 * 
 * Removes custom configuration and reverts to system defaults
 * Only accessible by project manager
 */
router.post(
  '/:id/team-config/reset',
  authenticate,
  requireOrgAdminOrProjectManager,
  projectController.resetTeamConfig
);

/**
 * Get configuration summary (human-readable)
 * GET /api/projects/:id/team-config/summary
 * 
 * Returns formatted, easy-to-understand configuration summary
 * Only accessible by project manager
 */
router.get(
  '/:id/team-config/summary',
  authenticate,
  projectController.getTeamConfigSummary
);

/**
 * Validate a configuration
 * POST /api/projects/:id/team-config/validate
 * 
 * Validates configuration without saving it
 * Useful for frontend validation before submission
 */
router.post(
  '/:id/team-config/validate',
  authenticate,
  projectController.validateTeamConfigEndpoint
);

module.exports = router;
