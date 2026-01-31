jest.mock('../../../src/services/notification.service', () => ({
  create: jest.fn()
}));

describe('BFI44NotificationHelper - Unit Tests', () => {
  let helper;

  beforeEach(() => {
    jest.resetModules();
    helper = require('../../../src/services/bfi44NotificationHelper');
    jest.clearAllMocks();
  });

  it('notifyMultipleEmployeesPending should call notifyTestPending for each user', async () => {
    const spy = jest.spyOn(helper, 'notifyTestPending').mockResolvedValue(undefined);

    await helper.notifyMultipleEmployeesPending(['u1', 'u2'], ['Ana', 'Bob']);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 'u1', 'Ana');
    expect(spy).toHaveBeenNthCalledWith(2, 'u2', 'Bob');
  });

  it('notifyTestPending should create a notification with actionUrl to the test', async () => {
    const notificationService = require('../../../src/services/notification.service');
    notificationService.create.mockResolvedValue({ _id: 'n1' });

    await helper.notifyTestPending('user-1', 'Alice');

    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-1',
        title: 'Complete Your Personality Profile',
        actionUrl: '/bfi-44/test',
        channels: ['in_app'],
        metadata: expect.objectContaining({ event: 'bfi44_test_pending', testType: 'BFI-44' })
      })
    );
  });
});
