jest.mock('../../../../../src/services/notification/notification.service', () => ({
  create: jest.fn()
}));

describe('AuthNotificationHelper - Unit Tests', () => {
  let helper;
  let notificationService;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.resetModules();
    notificationService = require('../../../../../src/services/notification/notification.service');
    helper = require('../../../../../src/services/notification/helpers/auth.helper');

    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('notifyAccountCreated should create an IN_APP notification', async () => {
    notificationService.create.mockResolvedValue({ _id: 'n1' });

    await helper.notifyAccountCreated('user-1', 'Alice');

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-1',
        title: 'Welcome!',
        message: expect.stringContaining('Alice'),
        channels: ['in_app'],
        priority: 'high',
        metadata: expect.objectContaining({ event: 'account_created' })
      })
    );
  });

  it('notifyAccountConfirmed should not throw if notificationService fails', async () => {
    notificationService.create.mockRejectedValue(new Error('fail'));

    await expect(helper.notifyAccountConfirmed('user-1', 'Alice')).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('extractId should handle string and object with _id', () => {
    const { extractId } = require('../../../../../src/utils/idHelper');
    expect(extractId('abc')).toBe('abc');
    expect(extractId({ _id: { toString: () => 'id-1' } })).toBe('id-1');
  });
});
