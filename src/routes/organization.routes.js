const express = require('express');
const router = express.Router();
const passport = require('passport');
const organizationController = require('../controllers/organization.controller');
const { validateOrganizationCreation, validateOrganizationUpdate } = require('../utils/validators');

/**
 * Rutas de Organizaciones
 * Gestiona todos los endpoints relacionados con organizaciones
 * Siguiendo principios REST y separación de responsabilidades
 */

const authenticate = passport.authenticate('jwt', { session: false });

/**
 * Buscar organizaciones con filtros
 * GET /api/organizations/search
 * Query params: name, industry, size, status, page, limit, sortBy, sortOrder
 */
router.get('/search', authenticate, organizationController.searchOrganizations);

/**
 * Obtener las organizaciones del usuario autenticado
 * GET /api/organizations/my-organizations
 */
router.get('/my-organizations', authenticate, organizationController.getMyOrganizations);

/**
 * Crear una nueva organización
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
 * Obtener una organización por ID
 * GET /api/organizations/:id
 * Query params: includeEmployees (boolean)
 */
router.get('/:id', authenticate, organizationController.getOrganization);

/**
 * Actualizar una organización
 * PUT /api/organizations/:id
 * Body: { name, description, contact, address, ... }
 */
router.put(
  '/:id',
  authenticate,
  validateOrganizationUpdate,
  organizationController.updateOrganization
);

/**
 * Desactivar una organización
 * PATCH /api/organizations/:id/deactivate
 */
router.patch('/:id/deactivate', authenticate, organizationController.deactivateOrganization);

/**
 * Activar una organización
 * PATCH /api/organizations/:id/activate
 */
router.patch('/:id/activate', authenticate, organizationController.activateOrganization);

/**
 * Actualizar configuración de la organización
 * PATCH /api/organizations/:id/settings
 * Body: { allowPublicCVSubmission, requireApproval, notifyOnCVSubmission, ... }
 */
router.patch('/:id/settings', authenticate, organizationController.updateSettings);

/**
 * Obtener estadísticas de la organización
 * GET /api/organizations/:id/stats
 */
router.get('/:id/stats', authenticate, organizationController.getStats);

/**
 * Obtener empleados de la organización
 * GET /api/organizations/:id/employees
 * Query params: status, department, position
 */
router.get('/:id/employees', authenticate, organizationController.getEmployees);

/**
 * Agregar un empleado a la organización
 * POST /api/organizations/:id/employees
 * Body: { userId, position, department }
 */
router.post('/:id/employees', authenticate, organizationController.addEmployee);

/**
 * Remover un empleado de la organización
 * DELETE /api/organizations/:id/employees/:userId
 */
router.delete('/:id/employees/:userId', authenticate, organizationController.removeEmployee);

/**
 * Actualizar estado de un empleado
 * PATCH /api/organizations/:id/employees/:userId/status
 * Body: { status: 'active' | 'inactive' | 'pending' }
 */
router.patch('/:id/employees/:userId/status', authenticate, organizationController.updateEmployeeStatus);

/**
 * Asignar o remover rol de jefe de proyecto a un empleado
 * PATCH /api/organizations/:id/employees/:employeeId/project-manager
 * Body: { isProjectManager: boolean }
 */
router.patch('/:id/employees/:employeeId/project-manager', authenticate, organizationController.setProjectManagerRole);

/**
 * Obtener todos los jefes de proyecto de la organización
 * GET /api/organizations/:id/project-managers
 */
router.get('/:id/project-managers', authenticate, organizationController.getProjectManagers);

/**
 * Agregar un administrador adicional
 * POST /api/organizations/:id/admins
 * Body: { userId }
 */
router.post('/:id/admins', authenticate, organizationController.addAdmin);

/**
 * Obtener CVs enviados a la organización
 * GET /api/organizations/:id/cvs
 * Query params: status, page, limit
 */
router.get('/:id/cvs', authenticate, require('../controllers/cv.controller').getOrganizationCVs);

/**
 * Obtener un CV específico de la organización
 * GET /api/organizations/:id/cvs/:cvId
 */
router.get('/:id/cvs/:cvId', authenticate, require('../controllers/cv.controller').getOrganizationCV);

/**
 * Actualizar estado de un CV
 * PATCH /api/organizations/:id/cvs/:cvId/status
 * Body: { status: 'pending' | 'reviewed' | 'accepted' | 'rejected', notes }
 */
router.patch('/:id/cvs/:cvId/status', authenticate, require('../controllers/cv.controller').updateCVStatus);

/**
 * Obtener proyectos de la organización
 * GET /api/organizations/:id/projects
 * Query params: status, projectManager
 */
router.get('/:id/projects', authenticate, organizationController.getOrganizationProjects);

/**
 * Obtener estadísticas de proyectos de la organización
 * GET /api/organizations/:id/projects/statistics
 */
router.get('/:id/projects/statistics', authenticate, organizationController.getProjectStatistics);

module.exports = router;
