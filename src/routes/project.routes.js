const express = require('express');
const router = express.Router();
const passport = require('passport');
const projectController = require('../controllers/project.controller');
const { body } = require('express-validator');

/**
 * Project Routes
 * Manages all endpoints related to projects
 * Following REST principles and separation of concerns
 */

// Authentication middleware
const authenticate = passport.authenticate('jwt', { session: false });

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

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
  
  body('expectedDuration.value')
    .notEmpty()
    .withMessage('Expected duration value is required')
    .isInt({ min: 1 })
    .withMessage('Duration value must be at least 1'),
  
  body('expectedDuration.unit')
    .notEmpty()
    .withMessage('Expected duration unit is required')
    .isIn(['days', 'weeks', 'months', 'years'])
    .withMessage('Invalid duration unit'),
  
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
  
  body('systemComplexity')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid system complexity'),
  
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

// ============================================
// USER PROJECT ROUTES
// ============================================

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

// ============================================
// PROJECT MANAGEMENT ROUTES
// ============================================

/**
 * Create a new project
 * POST /api/projects
 * Body: { organizationId, projectName, briefDescription, ... }
 */
router.post(
  '/',
  authenticate,
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
  validateProjectUpdate,
  projectController.updateProject
);

/**
 * Delete a project
 * DELETE /api/projects/:id
 */
router.delete('/:id', authenticate, projectController.deleteProject);

// ============================================
// PROJECT STATUS ROUTES
// ============================================

/**
 * Activate a project (change from draft to active)
 * PATCH /api/projects/:id/activate
 */
router.patch('/:id/activate', authenticate, projectController.activateProject);

/**
 * Complete a project
 * PATCH /api/projects/:id/complete
 */
router.patch('/:id/complete', authenticate, projectController.completeProject);

/**
 * Cancel a project
 * PATCH /api/projects/:id/cancel
 */
router.patch('/:id/cancel', authenticate, projectController.cancelProject);

// ============================================
// EMPLOYEE ASSIGNMENT ROUTES
// ============================================

/**
 * Assign an employee to a project
 * POST /api/projects/:id/assign
 * Body: { employeeId, assignedRole }
 */
router.post(
  '/:id/assign',
  authenticate,
  validateEmployeeAssignment,
  projectController.assignEmployee
);

/**
 * Remove an employee from a project
 * DELETE /api/projects/:id/employees/:employeeId
 */
router.delete('/:id/employees/:employeeId', authenticate, projectController.removeEmployee);

// ============================================
// TEAM SELECTION ROUTES (Manhattan Distance)
// ============================================

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

module.exports = router;
