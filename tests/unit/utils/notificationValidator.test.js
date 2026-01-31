const NotificationValidator = require('../../../src/utils/notificationValidator');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../../../src/models/notification.model');

describe('NotificationValidator - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('validateCreateNotification', () => {
    it('should pass validation with valid data', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'project_created',
        title: 'Test Notification',
        message: 'This is a test message',
        channels: ['in_app'],
        priority: 'medium'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when recipientId is missing', () => {
      req.body = {
        type: 'custom',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation errors',
          details: expect.arrayContaining([
            expect.stringContaining('recipientId')
          ])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail when type is missing', () => {
      req.body = {
        recipientId: 'user-123',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.stringContaining('type is required')
          ])
        })
      );
    });

    it('should fail when type is invalid', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'invalid_type',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when title is missing', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        message: 'Message'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.stringContaining('title is required')
          ])
        })
      );
    });

    it('should fail when title is empty string', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        title: '   ',
        message: 'Message'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when title exceeds 200 characters', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        title: 'a'.repeat(201),
        message: 'Message'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when message is missing', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        title: 'Test'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.stringContaining('message is required')
          ])
        })
      );
    });

    it('should fail when message exceeds 1000 characters', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        title: 'Test',
        message: 'a'.repeat(1001)
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when channels is not an array', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        title: 'Test',
        message: 'Message',
        channels: 'invalid'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when channels contains invalid values', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        title: 'Test',
        message: 'Message',
        channels: ['invalid-channel']
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when priority is invalid', () => {
      req.body = {
        recipientId: 'user-123',
        type: 'custom',
        title: 'Test',
        message: 'Message',
        priority: 'invalid-priority'
      };

      NotificationValidator.validateCreateNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateBulkNotification', () => {
    it('should pass validation with valid data', () => {
      req.body = {
        recipientIds: ['user-1', 'user-2', 'user-3'],
        type: 'custom',
        title: 'Bulk Notification',
        message: 'This is a bulk message'
      };

      NotificationValidator.validateBulkNotification(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when recipientIds is missing', () => {
      req.body = {
        type: 'custom',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateBulkNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when recipientIds is not an array', () => {
      req.body = {
        recipientIds: 'not-an-array',
        type: 'custom',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateBulkNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when recipientIds is empty', () => {
      req.body = {
        recipientIds: [],
        type: 'custom',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateBulkNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when recipientIds exceeds 1000 items', () => {
      req.body = {
        recipientIds: Array(1001).fill('user-id'),
        type: 'custom',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateBulkNotification(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateSendToRole', () => {
    it('should pass validation with valid data', () => {
      req.body = {
        role: 'employee',
        type: 'admin_announcement',
        title: 'Role Notification',
        message: 'This is a role-based message'
      };

      NotificationValidator.validateSendToRole(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when role is missing', () => {
      req.body = {
        type: 'custom',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateSendToRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when role is invalid', () => {
      req.body = {
        role: 'invalid_role',
        type: 'custom',
        title: 'Test',
        message: 'Message'
      };

      NotificationValidator.validateSendToRole(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept valid roles', () => {
      const validRoles = ['employee', 'org_admin', 'unassigned'];

      validRoles.forEach(role => {
        jest.clearAllMocks();
        req.body = {
          role,
          type: 'custom',
          title: 'Test',
          message: 'Message'
        };

        NotificationValidator.validateSendToRole(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('validateGetNotifications', () => {
    it('should pass validation with valid query params', () => {
      req.query = {
        page: '1',
        limit: '20',
        status: 'pending',
        type: 'custom'
      };

      NotificationValidator.validateGetNotifications(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when page is less than 1', () => {
      req.query = {
        page: '0'
      };

      NotificationValidator.validateGetNotifications(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when page is not a number', () => {
      req.query = {
        page: 'not-a-number'
      };

      NotificationValidator.validateGetNotifications(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when limit is less than 1', () => {
      req.query = {
        limit: '0'
      };

      NotificationValidator.validateGetNotifications(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when limit exceeds 100', () => {
      req.query = {
        limit: '101'
      };

      NotificationValidator.validateGetNotifications(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when status is invalid', () => {
      req.query = {
        status: 'invalid_status'
      };

      NotificationValidator.validateGetNotifications(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept valid statuses', () => {
      const validStatuses = ['pending', 'sent', 'delivered', 'read', 'failed'];

      validStatuses.forEach(status => {
        jest.clearAllMocks();
        req.query = { status };

        NotificationValidator.validateGetNotifications(req, res, next);

        expect(next).toHaveBeenCalled();
      });
    });

    it('should pass with empty query', () => {
      req.query = {};

      NotificationValidator.validateGetNotifications(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

