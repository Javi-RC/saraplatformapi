// Mock model constants used for validation
jest.mock('../../../src/models/notification.model', () => ({
  Notification: class MockNotification {},
  NotificationTypes: {
    SYSTEM: 'system',
    TEAM: 'team'
  },
  NotificationChannels: {
    IN_APP: 'in_app',
    EMAIL: 'email'
  },
  NotificationPriority: {
    LOW: 'low',
    HIGH: 'high'
  }
}));

jest.mock('../../../src/config/roles', () => ({
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ORG_ADMIN: 'org_admin',
    EMPLOYEE: 'employee',
    ADMIN: 'admin'
  }
}));

jest.mock('../../../src/services/notification/notification.service');

const notificationController = require('../../../src/controllers/notification.controller');
const notificationService = require('../../../src/services/notification/notification.service');

describe('Notification Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    
    req = {
      user: { id: 'user123', role: 'org_admin' },
      query: {},
      params: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('debería obtener notificaciones del usuario', async () => {
      const mockNotifications = {
        notifications: [
          { id: '1', title: 'Test 1' },
          { id: '2', title: 'Test 2' }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      };

      notificationService.getUserNotifications.mockResolvedValue(mockNotifications);

      await notificationController.getNotifications(req, res);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          page: 1,
          limit: 20
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotifications,
        message: 'Notificaciones obtenidas correctamente'
      });
    });

    it('debería aplicar filtros de query params', async () => {
      req.query = {
        page: '2',
        limit: '10',
        unreadOnly: 'true',
        includeArchived: 'false'
      };

      notificationService.getUserNotifications.mockResolvedValue({ notifications: [], total: 0 });

      await notificationController.getNotifications(req, res);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          page: 2,
          limit: 10,
          unreadOnly: true,
          includeArchived: false
        })
      );
    });

    it('debería manejar errores', async () => {
      notificationService.getUserNotifications.mockRejectedValue(new Error('Service error'));

      await notificationController.getNotifications(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service error'
      });
    });

    it('debería usar valores por defecto para page y limit', async () => {
      req.query = {};

      notificationService.getUserNotifications.mockResolvedValue({ notifications: [] });

      await notificationController.getNotifications(req, res);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          page: 1,
          limit: 20
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      notificationService.getUnreadCount.mockResolvedValue(5);

      await notificationController.getUnreadCount(req, res);

      expect(notificationService.getUnreadCount).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 5 },
        message: 'Conteo obtenido correctamente'
      });
    });

    it('should handle errors', async () => {
      notificationService.getUnreadCount.mockRejectedValue(new Error('boom'));

      await notificationController.getUnreadCount(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'boom'
      });
    });
  });

  describe('getStats', () => {
    it('should return stats', async () => {
      const mockStats = { unread: 1, total: 10 };
      notificationService.getUserStats.mockResolvedValue(mockStats);

      await notificationController.getStats(req, res);

      expect(notificationService.getUserStats).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
        message: 'Estadísticas obtenidas correctamente'
      });
    });

    it('should handle errors', async () => {
      notificationService.getUserStats.mockRejectedValue(new Error('boom'));

      await notificationController.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'boom'
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      req.params.id = 'n1';
      const mockNotification = { id: 'n1', read: true, priority: undefined };
      notificationService.markAsRead.mockResolvedValue(mockNotification);

      await notificationController.markAsRead(req, res);

      expect(notificationService.markAsRead).toHaveBeenCalledWith('n1', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: 'Notificación marcada como leída'
      });
    });

    it('should return 404 when notification is not found', async () => {
      req.params.id = 'n1';
      notificationService.markAsRead.mockRejectedValue(new Error('Notification not found'));

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found'
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'n1';
      notificationService.markAsRead.mockRejectedValue(new Error('boom'));

      await notificationController.markAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'boom'
      });
    });
  });

  describe('markMultipleAsRead', () => {
    it('should validate request body', async () => {
      req.body = { notificationIds: [] };

      await notificationController.markMultipleAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Se requiere un array de IDs de notificaciones'
      });
    });

    it('should mark multiple as read', async () => {
      req.body = { notificationIds: ['n1', 'n2'] };
      notificationService.markMultipleAsRead.mockResolvedValue(2);

      await notificationController.markMultipleAsRead(req, res);

      expect(notificationService.markMultipleAsRead).toHaveBeenCalledWith(['n1', 'n2'], 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 2 },
        message: '2 notificaciones marcadas como leídas'
      });
    });

    it('should handle errors', async () => {
      req.body = { notificationIds: ['n1'] };
      notificationService.markMultipleAsRead.mockRejectedValue(new Error('boom'));

      await notificationController.markMultipleAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'boom'
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', async () => {
      notificationService.markAllAsRead.mockResolvedValue(3);

      await notificationController.markAllAsRead(req, res);

      expect(notificationService.markAllAsRead).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 3 },
        message: '3 notificaciones marcadas como leídas'
      });
    });

    it('should handle errors', async () => {
      notificationService.markAllAsRead.mockRejectedValue(new Error('boom'));

      await notificationController.markAllAsRead(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'boom'
      });
    });
  });

  describe('archive', () => {
    it('should archive notification', async () => {
      req.params.id = 'n1';
      const mockNotification = { id: 'n1', archived: true, priority: undefined };
      notificationService.archive.mockResolvedValue(mockNotification);

      await notificationController.archive(req, res);

      expect(notificationService.archive).toHaveBeenCalledWith('n1', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockNotification,
        message: 'Notificación archivada'
      });
    });

    it('should return 404 when notification is not found', async () => {
      req.params.id = 'n1';
      notificationService.archive.mockRejectedValue(new Error('Notification not found'));

      await notificationController.archive(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notification not found'
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'n1';
      notificationService.archive.mockRejectedValue(new Error('boom'));

      await notificationController.archive(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'boom'
      });
    });
  });

  describe('delete', () => {
    it('should delete notification', async () => {
      req.params.id = 'n1';
      notificationService.delete.mockResolvedValue(true);

      await notificationController.delete(req, res);

      expect(notificationService.delete).toHaveBeenCalledWith('n1', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Notificación eliminada correctamente'
      });
    });

    it('should return 404 when delete returns false', async () => {
      req.params.id = 'n1';
      notificationService.delete.mockResolvedValue(false);

      await notificationController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Notificación no encontrada'
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'n1';
      notificationService.delete.mockRejectedValue(new Error('boom'));

      await notificationController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'boom'
      });
    });
  });

  describe('create', () => {
    it('should validate required fields', async () => {
      req.body = { title: 'x' };

      await notificationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'recipientId, type, title y message son requeridos'
      });
    });

    it('should validate notification type', async () => {
      req.body = {
        recipientId: 'u2',
        type: 'invalid',
        title: 'Hello',
        message: 'World'
      };

      await notificationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Tipo de notificación inválido'
      });
    });

    it('should create notification successfully', async () => {
      req.body = {
        recipientId: 'u2',
        type: 'system',
        title: 'Hello',
        message: 'World'
      };

      const created = { id: 'n1', priority: undefined };
      notificationService.create.mockResolvedValue(created);

      await notificationController.create(req, res);

      expect(notificationService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: 'u2',
          type: 'system',
          title: 'Hello',
          message: 'World',
          senderId: 'user123'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: created,
        message: 'Notificación creada correctamente'
      });
    });

    it('should map Recipient user not found to 404', async () => {
      req.body = {
        recipientId: 'u2',
        type: 'system',
        title: 'Hello',
        message: 'World'
      };

      notificationService.create.mockRejectedValue(new Error('Recipient user not found'));

      await notificationController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recipient user not found'
      });
    });
  });

  describe('sendBulk', () => {
    it('should validate recipientIds', async () => {
      req.body = { recipientIds: [], type: 'system', title: 't', message: 'm' };

      await notificationController.sendBulk(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Se requiere un array de recipientIds'
      });
    });

    it('should validate required fields', async () => {
      req.body = { recipientIds: ['u1'] };

      await notificationController.sendBulk(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'type, title y message son requeridos'
      });
    });

    it('should send bulk notifications', async () => {
      req.body = {
        recipientIds: ['u1', 'u2'],
        type: 'system',
        title: 't',
        message: 'm'
      };

      notificationService.sendBulkNotifications.mockResolvedValue([{ id: 'n1', priority: undefined }, { id: 'n2', priority: undefined }]);

      await notificationController.sendBulk(req, res);

      expect(notificationService.sendBulkNotifications).toHaveBeenCalledWith(
        ['u1', 'u2'],
        expect.objectContaining({
          type: 'system',
          title: 't',
          message: 'm',
          senderId: 'user123'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 2, notifications: [{ id: 'n1', priority: undefined }, { id: 'n2', priority: undefined }] },
        message: '2 notificaciones enviadas correctamente'
      });
    });
  });

  describe('sendToRole', () => {
    it('should validate required fields', async () => {
      req.body = { type: 'system', title: 't', message: 'm' };

      await notificationController.sendToRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'role, type, title y message son requeridos'
      });
    });

    it('should send notifications to role', async () => {
      req.body = { role: 'org_admin', type: 'system', title: 't', message: 'm' };
      notificationService.sendToRole.mockResolvedValue([{ id: 'n1' }]);

      await notificationController.sendToRole(req, res);

      expect(notificationService.sendToRole).toHaveBeenCalledWith(
        'org_admin',
        expect.objectContaining({ senderId: 'user123' })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 1 },
        message: '1 notificaciones enviadas al rol org_admin'
      });
    });
  });

  describe('sendToAll', () => {
    it('should validate required fields', async () => {
      req.body = { title: 't' };

      await notificationController.sendToAll(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'type, title y message son requeridos'
      });
    });

    it('should send notifications to all users', async () => {
      req.body = { type: 'system', title: 't', message: 'm' };
      notificationService.sendToAll.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }]);

      await notificationController.sendToAll(req, res);

      expect(notificationService.sendToAll).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system',
          title: 't',
          message: 'm',
          senderId: 'user123'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { count: 2 },
        message: '2 notificaciones enviadas a todos los usuarios'
      });
    });
  });
});
