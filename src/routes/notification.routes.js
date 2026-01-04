const { Router } = require('express');
const router = Router();
const notificationController = require('../controllers/notification.controller');
const { authMiddleware } = require('../utils/jwt');
const NotificationValidator = require('../utils/notificationValidator');

/**
 * Middleware para verificar que el usuario sea administrador
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'org_admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator permissions are required.'
    });
  }
  next();
};

// ============================================
// Rutas públicas para usuarios autenticados
// ============================================

/**
 * GET /api/notifications
 * Obtiene las notificaciones del usuario autenticado
 * Query params: page, limit, status, type, unreadOnly, includeArchived
 */
router.get('/', authMiddleware, NotificationValidator.validateGetNotifications, notificationController.getNotifications);

/**
 * GET /api/notifications/unread-count
 * Obtiene el conteo de notificaciones no leídas
 */
router.get('/unread-count', authMiddleware, notificationController.getUnreadCount);

/**
 * GET /api/notifications/stats
 * Obtiene estadísticas de notificaciones del usuario
 */
router.get('/stats', authMiddleware, notificationController.getStats);

/**
 * PATCH /api/notifications/:id/read
 * Marca una notificación como leída
 */
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);

/**
 * PATCH /api/notifications/read-multiple
 * Marca múltiples notificaciones como leídas
 * Body: { notificationIds: [string] }
 */
router.patch('/read-multiple', authMiddleware, notificationController.markMultipleAsRead);

/**
 * PATCH /api/notifications/read-all
 * Marca todas las notificaciones como leídas
 */
router.patch('/read-all', authMiddleware, notificationController.markAllAsRead);

/**
 * PATCH /api/notifications/:id/archive
 * Archiva una notificación
 */
router.patch('/:id/archive', authMiddleware, notificationController.archive);

/**
 * DELETE /api/notifications/:id
 * Elimina una notificación
 */
router.delete('/:id', authMiddleware, notificationController.delete);

// ============================================
// Rutas administrativas (solo para org_admin)
// ============================================

/**
 * POST /api/notifications
 * Crea una notificación individual
 * Body: { recipientId, type, title, message, channels?, metadata?, priority?, actionUrl?, actionText?, expiresAt? }
 */
router.post('/', authMiddleware, isAdmin, NotificationValidator.validateCreateNotification, notificationController.create);

/**
 * POST /api/notifications/bulk
 * Envía notificaciones masivas a múltiples usuarios
 * Body: { recipientIds: [string], type, title, message, channels?, metadata?, priority?, actionUrl?, actionText? }
 */
router.post('/bulk', authMiddleware, isAdmin, NotificationValidator.validateBulkNotification, notificationController.sendBulk);

/**
 * POST /api/notifications/send-to-role
 * Envía notificación a todos los usuarios con un rol específico
 * Body: { role, type, title, message, channels?, metadata?, priority?, actionUrl?, actionText? }
 */
router.post('/send-to-role', authMiddleware, isAdmin, NotificationValidator.validateSendToRole, notificationController.sendToRole);

/**
 * POST /api/notifications/send-to-all
 * Envía notificación a todos los usuarios confirmados
 * Body: { type, title, message, channels?, metadata?, priority?, actionUrl?, actionText? }
 */
router.post('/send-to-all', authMiddleware, isAdmin, notificationController.sendToAll);

module.exports = router;
