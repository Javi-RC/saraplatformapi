describe('notification.service - Unit Tests', () => {
  function setup() {
    jest.resetModules();

    const NotificationMock = jest.fn(function NotificationCtor(data) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue(true),
        updateDeliveryStatus: jest.fn().mockResolvedValue(true)
      };
    });

    NotificationMock.find = jest.fn();
    NotificationMock.countDocuments = jest.fn();
    NotificationMock.updateMany = jest.fn();
    NotificationMock.findOne = jest.fn();
    NotificationMock.deleteOne = jest.fn();
    NotificationMock.getUserStats = jest.fn();
    NotificationMock.cleanupOldNotifications = jest.fn();

    const UserMock = {
      findById: jest.fn(),
      find: jest.fn()
    };

    const NotificationChannelFactoryMock = {
      setEmailService: jest.fn(),
      getChannel: jest.fn(),
      clearCache: jest.fn()
    };

    jest.doMock('../../../../src/models/notification.model', () => ({
      Notification: NotificationMock,
      NotificationTypes: { CUSTOM: 'custom', EMAIL_CONFIRMATION: 'email_confirmation' },
      NotificationPriority: { LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent' },
      NotificationStatus: { PENDING: 'pending', SENT: 'sent', DELIVERED: 'delivered', READ: 'read', FAILED: 'failed' },
      NotificationChannels: { IN_APP: 'in_app', EMAIL: 'email', PUSH: 'push' }
    }));

    jest.doMock('../../../../src/models/user.model', () => UserMock);
    jest.doMock('../../../../src/services/notification/channels/NotificationChannelFactory', () => NotificationChannelFactoryMock);
    jest.doMock('../../../../src/services/auth/email.service', () => ({ sendConfirmationEmail: jest.fn() }));

    const notificationService = require('../../../../src/services/notification/notification.service');

    return { notificationService, NotificationMock, UserMock, NotificationChannelFactoryMock };
  }

  it('create should throw AppError when recipient does not exist', async () => {
    const { notificationService, UserMock } = setup();
    UserMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null)
    });

    await expect(
      notificationService.create({
        recipientId: 'u1',
        type: 'custom',
        title: 'T',
        message: 'M',
        channels: ['in_app']
      })
    ).rejects.toMatchObject({ code: 'USER_NOT_FOUND', status: 404 });
  });

  it('create should save and send through channels', async () => {
    const { notificationService, UserMock, NotificationChannelFactoryMock, NotificationMock } = setup();

    UserMock.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: 'u1', isConfirmed: true })
    });

    const channel = {
      canSend: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue({ status: 'delivered' })
    };
    NotificationChannelFactoryMock.getChannel.mockReturnValue(channel);

    const notif = await notificationService.create({
      recipientId: 'u1',
      type: 'custom',
      title: 'T',
      message: 'M',
      channels: ['in_app']
    });

    expect(NotificationMock).toHaveBeenCalledTimes(1);
    expect(notif.save).toHaveBeenCalledTimes(1);
    expect(channel.canSend).toHaveBeenCalledTimes(1);
    expect(channel.send).toHaveBeenCalledTimes(1);
    expect(notif.updateDeliveryStatus).toHaveBeenCalledWith('in_app', 'delivered', undefined);
  });

  it('getUnreadCount should call Notification.countDocuments with unread filters', async () => {
    const { notificationService, NotificationMock } = setup();

    NotificationMock.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(7)
    });

    const count = await notificationService.getUnreadCount('u1');

    expect(count).toBe(7);
    expect(NotificationMock.countDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: 'u1', readAt: null, isArchived: false })
    );
  });
});
