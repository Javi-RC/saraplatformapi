const { Router } = require('express');
const router = Router();
const BFI44Controller = require('../controllers/bfi44.controller');
const { authMiddleware } = require('../utils/jwt');
const { requireRole } = require('../middleware/authorization');

/**
 * BFI-44 Routes
 * Rutas para el Big Five Inventory
 * Todas las rutas requieren autenticación
 */

/**
 * GET /api/bfi-44/questions
 * Obtener el cuestionario completo
 * Acceso: Usuarios autenticados
 */
router.get(
  '/questions',
  authMiddleware,
  BFI44Controller.getQuestions
);

/**
 * POST /api/bfi-44/submit
 * Enviar respuestas del cuestionario
 * Acceso: Usuarios autenticados
 */
router.post(
  '/submit',
  authMiddleware,
  BFI44Controller.submitResponses
);

/**
 * GET /api/bfi-44/my-profile
 * Obtener el perfil BFI-44 del usuario autenticado
 * Acceso: Usuario autenticado
 */
router.get(
  '/my-profile',
  authMiddleware,
  BFI44Controller.getMyProfile
);

/**
 * GET /api/bfi-44/has-profile
 * Verificar si el usuario tiene un perfil BFI-44
 * Acceso: Usuario autenticado
 */
router.get(
  '/has-profile',
  authMiddleware,
  BFI44Controller.hasProfile
);

/**
 * GET /api/bfi-44/profile/:userId
 * Obtener el perfil BFI-44 de un usuario específico
 * Acceso: El propio usuario o administrador de organización
 */
router.get(
  '/profile/:userId',
  authMiddleware,
  BFI44Controller.getProfile
);

/**
 * POST /api/bfi-44/recalculate/:responseId
 * Recalcular resultados de un perfil
 * Acceso: Solo administradores de organización
 */
router.post(
  '/recalculate/:responseId',
  authMiddleware,
  requireRole('org_admin'),
  BFI44Controller.recalculateProfile
);

/**
 * POST /api/bfi-44/notify-pending
 * Notificar a empleados que no han completado el test
 * Acceso: Solo administradores de organización
 */
router.post(
  '/notify-pending',
  authMiddleware,
  requireRole('org_admin'),
  BFI44Controller.notifyPendingEmployees
);

/**
 * GET /api/bfi-44/employees-without-test
 * Obtener lista de empleados sin test
 * Acceso: Solo administradores de organización
 */
router.get(
  '/employees-without-test',
  authMiddleware,
  requireRole('org_admin'),
  BFI44Controller.getEmployeesWithoutTest
);

/**
 * GET /api/bfi-44/organization-stats
 * Obtener estadísticas de test por organización
 * Acceso: Solo administradores de organización
 */
router.get(
  '/organization-stats',
  authMiddleware,
  requireRole('org_admin'),
  BFI44Controller.getOrganizationStats
);

module.exports = router;
