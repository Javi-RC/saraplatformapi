const { Router } = require('express');
const router = Router();
const BFI44Controller = require('../controllers/bfi44.controller');
const { authMiddleware } = require('../utils/jwt');
const { requireRole, requireOrgAdminOrProjectManager } = require('../middleware/authorization');

/**
 * BFI-44 Routes
 * Rutas para el Big Five Inventory
 * Todas las rutas requieren autenticación
 */

/**
 * GET /api/bfi-44/questions
 * Obtener el cuestionario completo
 * Query params: ?language=es (or ?lang=es)
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
 * GET /api/bfi-44/consent-status
 * Verificar si el usuario tiene consentimiento para el BFI-44
 * Acceso: Usuario autenticado
 */
router.get(
  '/consent-status',
  authMiddleware,
  BFI44Controller.getConsentStatus
);

/**
 * POST /api/bfi-44/notify-pending
 * Notificar a empleados que no han completado el test
 * Acceso: Administradores de organización y jefes de proyecto
 */
router.post(
  '/notify-pending',
  authMiddleware,
  requireOrgAdminOrProjectManager,
  BFI44Controller.notifyPendingEmployees
);

/**
 * GET /api/bfi-44/employees-without-test
 * Obtener lista de empleados sin test
 * Acceso: Administradores de organización y jefes de proyecto
 */
router.get(
  '/employees-without-test',
  authMiddleware,
  requireOrgAdminOrProjectManager,
  BFI44Controller.getEmployeesWithoutTest
);

/**
 * POST /api/bfi-44/notify-pending/:userId
 * Notificar a un empleado específico que no ha completado el test
 * Acceso: Administradores de organización y jefes de proyecto
 */
router.post(
  '/notify-pending/:userId',
  authMiddleware,
  requireOrgAdminOrProjectManager,
  BFI44Controller.notifySpecificUser
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

/**
 * GET /api/bfi-44/debug/duplicates/:userId
 * TEMPORAL: Investigar perfiles duplicados
 */
router.get(
  '/debug/duplicates/:userId',
  async (req, res) => {
    try {
      const BFI44Response = require('../models/bfi44.model');
      const User = require('../models/user.model');
      const { userId } = req.params;

      const user = await User.findById(userId);
      const profiles = await BFI44Response.find({ userId }).sort({ createdAt: 1 });

      res.json({
        success: true,
        user: user ? { email: user.email, name: user.name, role: user.role } : null,
        profileCount: profiles.length,
        profiles: profiles.map(p => ({
          _id: p._id.toString(),
          userId: p.userId.toString(),
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          hasResults: !!(p.results && Object.keys(p.results).length > 0),
          results: p.results,
          responsesCount: p.responses?.length || 0
        }))
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;
