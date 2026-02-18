jest.mock('../../../src/services/notification.service', () => ({
  create: jest.fn()
}));

describe('CVNotificationHelper - Unit Tests', () => {
  let helper;
  let notificationService;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.resetModules();
    notificationService = require('../../../src/services/notification.service');
    helper = require('../../../src/services/cvNotificationHelper');

    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('notifyCVProcessed should include actionUrl with cvId', async () => {
    notificationService.create.mockResolvedValue({ _id: 'n1' });

    await helper.notifyCVProcessed('user-1', 'Alice', 'cv-123');

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-1',
        title: 'Curriculum Processed',
        actionUrl: '/cv/cv-123',
        actionText: 'View Curriculum',
        channels: ['in_app'],
        priority: 'high',
        metadata: expect.objectContaining({ cvId: 'cv-123', event: 'cv_processed' })
      })
    );
  });

  it('notifyCVUploaded should not throw if notificationService fails', async () => {
    notificationService.create.mockRejectedValue(new Error('fail'));

    await expect(helper.notifyCVUploaded('user-1', 'Alice', 'cv-123', 'cv.pdf')).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
