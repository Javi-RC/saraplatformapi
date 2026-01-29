const mongoose = require('mongoose');
const { Notification, NotificationTypes, NotificationPriority, NotificationStatus, NotificationChannels } = require('../../../src/models/notification.model');
const mongodbHelper = require('../../setup/mongodb-helper');

// Back-compat for earlier test assumptions
// The model does not expose an INFO type; map it to a valid enum value.
NotificationTypes.INFO = NotificationTypes.CUSTOM;

describe('Notification Model', () => {
  let mockRecipientId;

  beforeAll(async () => {
    await mongodbHelper.connect();
  }, 60000);

  afterAll(async () => {
    // No cerrar el servidor aquí, se comparte entre tests
    await mongodbHelper.disconnect();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    mockRecipientId = new mongoose.Types.ObjectId();
  });

  describe('Schema Validation', () => {
    it('should create a valid notification', async () => {
      const validNotification = {
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test Notification',
        message: 'This is a test notification',
        channels: [NotificationChannels.IN_APP]
      };

      const notification = new Notification(validNotification);
      const saved = await notification.save();

      expect(saved._id).toBeDefined();
      expect(saved.recipient.toString()).toBe(mockRecipientId.toString());
      expect(saved.type).toBe(NotificationTypes.INFO);
      expect(saved.title).toBe('Test Notification');
    });

    it('should require recipient', async () => {
      const notificationWithoutRecipient = {
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message'
      };

      const notification = new Notification(notificationWithoutRecipient);

      await expect(notification.save()).rejects.toThrow();
    });

    it('should require type', async () => {
      const notificationWithoutType = {
        recipient: mockRecipientId,
        title: 'Test',
        message: 'Message'
      };

      const notification = new Notification(notificationWithoutType);

      await expect(notification.save()).rejects.toThrow();
    });

    it('should require title', async () => {
      const notificationWithoutTitle = {
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        message: 'Message'
      };

      const notification = new Notification(notificationWithoutTitle);

      await expect(notification.save()).rejects.toThrow();
    });

    it('should require message', async () => {
      const notificationWithoutMessage = {
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test'
      };

      const notification = new Notification(notificationWithoutMessage);

      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Notification Types', () => {
    it('should accept all valid notification types', async () => {
      const validTypes = Object.values(NotificationTypes);

      for (const type of validTypes) {
        const notification = new Notification({
          recipient: new mongoose.Types.ObjectId(),
          type,
          title: `Test ${type}`,
          message: 'Test message',
          channels: [NotificationChannels.IN_APP]
        });

        const saved = await notification.save();
        expect(saved.type).toBe(type);
      }
    });

    it('should reject invalid notification type', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: 'INVALID_TYPE',
        title: 'Test',
        message: 'Message'
      });

      await expect(notification.save()).rejects.toThrow();
    });
  });

  describe('Priority', () => {
    it('should default to MEDIUM priority', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP]
      });

      const saved = await notification.save();
      expect(saved.priority).toBe(NotificationPriority.MEDIUM);
    });

    it('should accept all valid priorities', async () => {
      const validPriorities = Object.values(NotificationPriority);

      for (const priority of validPriorities) {
        const notification = new Notification({
          recipient: new mongoose.Types.ObjectId(),
          type: NotificationTypes.INFO,
          title: 'Test',
          message: 'Message',
          channels: [NotificationChannels.IN_APP],
          priority
        });

        const saved = await notification.save();
        expect(saved.priority).toBe(priority);
      }
    });
  });

  describe('Status', () => {
    it('should default to PENDING status', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP]
      });

      const saved = await notification.save();
      expect(saved.status).toBe(NotificationStatus.PENDING);
    });

    it('should accept all valid statuses', async () => {
      const validStatuses = Object.values(NotificationStatus);

      for (const status of validStatuses) {
        const notification = new Notification({
          recipient: new mongoose.Types.ObjectId(),
          type: NotificationTypes.INFO,
          title: 'Test',
          message: 'Message',
          channels: [NotificationChannels.IN_APP],
          status
        });

        const saved = await notification.save();
        expect(saved.status).toBe(status);
      }
    });
  });

  describe('Channels', () => {
    it('should default channels to empty array', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message'
      });

      const saved = await notification.save();
      expect(saved.channels).toEqual([]);
    });

    it('should accept multiple channels', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [
          NotificationChannels.IN_APP,
          NotificationChannels.EMAIL,
          NotificationChannels.PUSH
        ]
      });

      const saved = await notification.save();
      expect(saved.channels).toHaveLength(3);
      expect(saved.channels).toContain(NotificationChannels.EMAIL);
      expect(saved.channels).toContain(NotificationChannels.PUSH);
    });

    it('should accept all valid channel types', async () => {
      const validChannels = Object.values(NotificationChannels);

      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: validChannels
      });

      const saved = await notification.save();
      expect(saved.channels).toHaveLength(validChannels.length);
    });
  });

  describe('Read Status', () => {
    it('should default isRead to false', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP]
      });

      const saved = await notification.save();
      expect(saved.isRead).toBe(false);
      expect(saved.readAt).toBeUndefined();
    });

    it('should allow marking as read', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP],
        isRead: true,
        readAt: new Date()
      });

      const saved = await notification.save();
      expect(saved.isRead).toBe(true);
      expect(saved.readAt).toBeDefined();
    });
  });

  describe('Metadata', () => {
    it('should allow storing additional metadata', async () => {
      const metadata = {
        projectId: 'project123',
        userId: 'user456',
        customField: 'customValue'
      };

      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.PROJECT_CREATED,
        title: 'New Project',
        message: 'A new project has been created',
        channels: [NotificationChannels.IN_APP],
        metadata
      });

      const saved = await notification.save();
      expect(saved.metadata).toMatchObject(metadata);
      expect(saved.metadata.projectId).toBe('project123');
    });
  });

  describe('Action URL and Text', () => {
    it('should allow action URL and text', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP],
        actionUrl: '/projects/123',
        actionText: 'View Project'
      });

      const saved = await notification.save();
      expect(saved.actionUrl).toBe('/projects/123');
      expect(saved.actionText).toBe('View Project');
    });
  });

  describe('Expiration', () => {
    it('should allow setting expiration date', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP],
        expiresAt
      });

      const saved = await notification.save();
      expect(saved.expiresAt).toBeDefined();
      expect(saved.expiresAt.getTime()).toBe(expiresAt.getTime());
    });
  });

  describe('Delivery Status', () => {
    it('should track delivery status per channel', async () => {
      const inAppSentAt = new Date();
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
        deliveryInfo: {
          [NotificationChannels.IN_APP]: {
            status: NotificationStatus.SENT,
            sentAt: inAppSentAt
          },
          [NotificationChannels.EMAIL]: {
            status: NotificationStatus.PENDING
          }
        }
      });

      const saved = await notification.save();
      expect(saved.deliveryInfo).toBeDefined();
      expect(saved.deliveryInfo.get(NotificationChannels.IN_APP).status).toBe(NotificationStatus.SENT);
      expect(saved.deliveryInfo.get(NotificationChannels.IN_APP).sentAt.getTime()).toBe(inAppSentAt.getTime());
      expect(saved.deliveryInfo.get(NotificationChannels.EMAIL).status).toBe(NotificationStatus.PENDING);
    });
  });

  describe('Sender', () => {
    it('should allow specifying sender', async () => {
      const senderId = new mongoose.Types.ObjectId();

      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP],
        sender: senderId
      });

      const saved = await notification.save();
      expect(saved.sender.toString()).toBe(senderId.toString());
    });
  });

  describe('Timestamps', () => {
    it('should automatically add createdAt and updatedAt', async () => {
      const notification = new Notification({
        recipient: mockRecipientId,
        type: NotificationTypes.INFO,
        title: 'Test',
        message: 'Message',
        channels: [NotificationChannels.IN_APP]
      });

      const saved = await notification.save();
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });
  });
});
