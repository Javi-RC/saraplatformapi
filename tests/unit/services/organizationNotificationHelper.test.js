jest.mock('../../../src/services/notification.service', () => ({
  create: jest.fn()
}));

describe('OrganizationNotificationHelper - Unit Tests', () => {
  let helper;
  let notificationService;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.resetModules();
    notificationService = require('../../../src/services/notification.service');
    helper = require('../../../src/services/organizationNotificationHelper');

    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('notifyCVSubmitted should do nothing when notifyOnCVSubmission is disabled', async () => {
    const organization = {
      _id: 'org-1',
      name: 'Org',
      admin: 'a1',
      additionalAdmins: [],
      settings: { notifyOnCVSubmission: false }
    };

    await helper.notifyCVSubmitted(organization, { _id: 'u1', email: 'x@y.com' }, { _id: 'cv1' });

    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('notifyCVSubmitted should create notifications for all admins when enabled', async () => {
    notificationService.create.mockResolvedValue({ _id: 'n1' });

    const organization = {
      _id: { toString: () => 'org-1' },
      name: 'Org',
      admin: { _id: { toString: () => 'admin-1' } },
      additionalAdmins: [{ _id: { toString: () => 'admin-2' } }],
      settings: { notifyOnCVSubmission: true }
    };

    const user = { _id: { toString: () => 'user-1' }, name: 'Alice', email: 'alice@test.com' };
    const cv = { _id: { toString: () => 'cv-1' }, submittedToOrganizationAt: new Date('2024-01-01') };

    await helper.notifyCVSubmitted(organization, user, cv);

    expect(notificationService.create).toHaveBeenCalledTimes(2);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'admin-1',
        title: 'New Curriculum Received',
        channels: ['in_app'],
        metadata: expect.objectContaining({ organizationName: 'Org', userEmail: 'alice@test.com', cvId: 'cv-1' })
      })
    );
  });

  it('notifyEmployeeAdded should set pending title when status is pending', async () => {
    notificationService.create.mockResolvedValue({ _id: 'n1' });

    const organization = { _id: 'org-1', name: 'Org' };
    const user = { _id: 'user-1' };

    await helper.notifyEmployeeAdded(organization, user, { status: 'pending' });

    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-1',
        title: 'Link Request Sent',
        metadata: expect.objectContaining({ requiresApproval: true, status: 'pending' })
      })
    );
  });
});
