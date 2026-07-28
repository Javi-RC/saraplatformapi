jest.mock('../../../../../src/services/notification/notification.service', () => ({
  create: jest.fn()
}));

describe('ProjectNotificationHelper - Unit Tests', () => {
  let helper;
  let notificationService;

  beforeEach(() => {
    jest.resetModules();
    notificationService = require('../../../../../src/services/notification/notification.service');
    helper = require('../../../../../src/services/notification/helpers/project.helper');
    jest.clearAllMocks();
  });

  it('notifyProjectCreated should return early when there are no admins to notify', async () => {
    const project = {
      _id: 'p1',
      projectName: 'Project X',
      projectManager: { _id: 'pm-1', name: 'PM' },
      createdAt: new Date('2024-01-01')
    };

    const organization = {
      _id: 'org-1',
      name: 'Org',
      admin: { _id: 'pm-1' },
      additionalAdmins: []
    };

    await helper.notifyProjectCreated(project, organization);

    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('notifyProjectCreated should notify admins excluding the project manager', async () => {
    notificationService.create.mockResolvedValue({ _id: 'n1' });

    const project = {
      _id: { toString: () => 'p1' },
      projectName: 'Project X',
      projectManager: { _id: { toString: () => 'pm-1' }, name: 'PM' },
      createdAt: new Date('2024-01-01')
    };

    const organization = {
      _id: { toString: () => 'org-1' },
      name: 'Org',
      admin: { _id: { toString: () => 'admin-1' } },
      additionalAdmins: [{ _id: { toString: () => 'pm-1' } }, { _id: { toString: () => 'admin-2' } }]
    };

    await helper.notifyProjectCreated(project, organization);

    expect(notificationService.create).toHaveBeenCalledTimes(2);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'admin-1',
        type: 'project_created',
        channels: ['in_app', 'email'],
        metadata: expect.objectContaining({ projectId: 'p1', organizationId: 'org-1', projectManagerId: 'pm-1' })
      })
    );
  });

  it('notifyProjectUpdated should notify admins, PM, and assigned employees (deduped)', async () => {
    notificationService.create.mockResolvedValue({ _id: 'n1' });

    const project = {
      _id: 'p1',
      projectName: 'Project X',
      projectManager: 'pm-1',
      assignedEmployees: [{ user: 'e-1' }, { user: 'e-1' }, { user: 'e-2' }],
      updatedAt: new Date('2024-01-02')
    };

    const organization = {
      _id: 'org-1',
      name: 'Org',
      admin: 'admin-1',
      additionalAdmins: ['admin-2']
    };

    await helper.notifyProjectUpdated(project, organization);

    // Unique recipients: admin-1, admin-2, pm-1, e-1, e-2
    expect(notificationService.create).toHaveBeenCalledTimes(5);
  });
});
