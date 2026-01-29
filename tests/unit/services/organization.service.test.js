const organizationService = require('../../../src/services/organization.service');
const {
  organizationRepository,
  userRepository,
  bfi44Repository
} = require('../../../src/repositories');

jest.mock('../../../src/repositories');
jest.mock('../../../src/services/organizationNotificationHelper');
jest.mock('../../../src/services/bfi44NotificationHelper');

const organizationNotificationHelper = require('../../../src/services/organizationNotificationHelper');
const bfi44NotificationHelper = require('../../../src/services/bfi44NotificationHelper');

describe('OrganizationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create an organization successfully', async () => {
      const adminId = 'admin-123';
      const organizationData = { name: 'Test Organization' };

      const mockAdmin = {
        _id: adminId,
        name: 'John Doe',
        role: 'unassigned',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockOrganization = {
        _id: 'org-123',
        ...organizationData,
        admin: adminId,
        status: 'active',
        populate: jest.fn().mockReturnThis()
      };

      userRepository.findById.mockResolvedValue(mockAdmin);
      organizationRepository.findOne.mockResolvedValue(null);
      organizationRepository.create.mockResolvedValue(mockOrganization);

      const result = await organizationService.createOrganization(organizationData, adminId);

      expect(result).toBe(mockOrganization);
      expect(mockAdmin.role).toBe('org_admin');
      expect(mockAdmin.save).toHaveBeenCalled();
    });

    it('should throw error if admin not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        organizationService.createOrganization({}, 'admin-123')
      ).rejects.toThrow('Usuario administrador no encontrado');
    });

    it('should throw error if user already administers an active organization', async () => {
      const mockAdmin = { _id: 'admin-123', role: 'org_admin' };
      const existingOrg = { _id: 'org-456', status: 'active' };

      userRepository.findById.mockResolvedValue(mockAdmin);
      organizationRepository.findOne.mockResolvedValue(existingOrg);

      await expect(
        organizationService.createOrganization({}, 'admin-123')
      ).rejects.toThrow('User already administers an active organization');
    });
  });

  describe('getOrganizationById', () => {
    it('should get organization by id', async () => {
      const organizationId = 'org-123';
      const mockOrganization = {
        _id: organizationId,
        name: 'Test Org',
        isAdmin: jest.fn().mockReturnValue(false),
        isEmployee: jest.fn().mockReturnValue(false)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);

      const result = await organizationService.getOrganizationById(organizationId);

      expect(result).toBe(mockOrganization);
    });

    it('should throw error if organization not found', async () => {
      organizationRepository.findById.mockResolvedValue(null);

      await expect(
        organizationService.getOrganizationById('org-123')
      ).rejects.toThrow('Organization not found');
    });

    it('should throw error if user has no access', async () => {
      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(false),
        isEmployee: jest.fn().mockReturnValue(false)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);

      await expect(
        organizationService.getOrganizationById('org-123', false, 'user-456')
      ).rejects.toThrow('UNAUTHORIZED_ACCESS');
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const organizationId = 'org-123';
      const userId = 'admin-123';
      const updateData = { name: 'Updated Organization' };

      const mockOrganization = {
        _id: organizationId,
        name: 'Test Org',
        isAdmin: jest.fn().mockReturnValue(true),
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis(),
        lastActivityAt: Date.now()
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);

      const result = await organizationService.updateOrganization(organizationId, updateData, userId);

      expect(result.name).toBe('Updated Organization');
      expect(mockOrganization.save).toHaveBeenCalled();
    });

    it('should throw error if organization not found', async () => {
      organizationRepository.findById.mockResolvedValue(null);

      await expect(
        organizationService.updateOrganization('org-123', {}, 'admin-123')
      ).rejects.toThrow('Organization not found');
    });

    it('should throw error if user is not admin', async () => {
      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(false)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);

      await expect(
        organizationService.updateOrganization('org-123', {}, 'user-456')
      ).rejects.toThrow('No tienes permisos para actualizar esta organización');
    });
  });

  describe('getOrganizationsByAdmin', () => {
    it('should get all organizations managed by a user', async () => {
      const userId = 'admin-123';
      const mockOrganizations = [
        { _id: 'org-1', name: 'Org 1' },
        { _id: 'org-2', name: 'Org 2' }
      ];

      organizationRepository.findByAdmin.mockResolvedValue(mockOrganizations);

      const result = await organizationService.getOrganizationsByAdmin(userId);

      expect(result).toEqual(mockOrganizations);
      expect(organizationRepository.findByAdmin).toHaveBeenCalledWith(userId);
    });
  });

  describe('getOrganizationsByEmployee', () => {
    it('should get all organizations where user is employee', async () => {
      const userId = 'emp-123';
      const mockOrganizations = [
        { _id: 'org-1', name: 'Org 1' }
      ];

      organizationRepository.find.mockResolvedValue(mockOrganizations);

      const result = await organizationService.getOrganizationsByEmployee(userId);

      expect(result).toEqual(mockOrganizations);
      expect(organizationRepository.find).toHaveBeenCalledWith({ 'employees.user': userId });
    });
  });

  describe('addEmployee', () => {
    it('should add employee successfully', async () => {
      const organizationId = 'org-123';
      const userId = 'user-456';
      const adminId = 'admin-123';
      const employeeData = { position: 'Developer' };

      const mockOrganization = {
        _id: organizationId,
        isAdmin: jest.fn().mockReturnValue(true),
        addEmployee: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        _id: userId,
        name: 'Jane Doe',
        role: 'unassigned',
        save: jest.fn().mockResolvedValue(true)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(mockOrganization);
      userRepository.findById.mockResolvedValue(mockUser);
      bfi44Repository.userHasCompleted.mockResolvedValue(false);
      organizationNotificationHelper.notifyEmployeeAdded.mockResolvedValue();
      bfi44NotificationHelper.notifyTestPending.mockResolvedValue();

      const result = await organizationService.addEmployee(organizationId, userId, employeeData, adminId);

      expect(result).toBe(mockOrganization);
      expect(mockUser.role).toBe('employee');
      expect(mockOrganization.addEmployee).toHaveBeenCalledWith(userId, employeeData);
    });

    it('should throw error if user is not admin', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(mockOrganization);

      await expect(
        organizationService.addEmployee('org-123', 'user-456', {}, 'user-789')
      ).rejects.toThrow('No tienes permisos para agregar empleados');
    });

    it('should throw error if user not found', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(true)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(mockOrganization);
      userRepository.findById.mockResolvedValue(null);

      await expect(
        organizationService.addEmployee('org-123', 'user-456', {}, 'admin-123')
      ).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('removeEmployee', () => {
    it('should remove employee successfully', async () => {
      const organizationId = 'org-123';
      const userId = 'user-456';
      const adminId = 'admin-123';

      const mockOrganization = {
        _id: organizationId,
        isAdmin: jest.fn().mockReturnValue(true),
        removeEmployee: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        _id: userId,
        name: 'Jane Doe'
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(mockOrganization);
      userRepository.findById.mockResolvedValue(mockUser);
      organizationNotificationHelper.notifyEmployeeRemoved.mockResolvedValue();

      const result = await organizationService.removeEmployee(organizationId, userId, adminId);

      expect(result).toBe(mockOrganization);
      expect(mockOrganization.removeEmployee).toHaveBeenCalledWith(userId);
    });

    it('should throw error if user is not admin', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(mockOrganization);

      await expect(
        organizationService.removeEmployee('org-123', 'user-456', 'user-789')
      ).rejects.toThrow('No tienes permisos para remover empleados');
    });
  });

  describe('updateEmployeeStatus', () => {
    it('should update employee status successfully', async () => {
      const organizationId = 'org-123';
      const userId = 'user-456';
      const adminId = 'admin-123';
      const newStatus = 'inactive';

      const mockOrganization = {
        _id: organizationId,
        isAdmin: jest.fn().mockReturnValue(true),
        updateEmployeeStatus: jest.fn().mockResolvedValue(true)
      };

      const mockUser = {
        _id: userId,
        name: 'Jane Doe'
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(mockOrganization);
      userRepository.findById.mockResolvedValue(mockUser);
      organizationNotificationHelper.notifyEmployeeStatusChanged.mockResolvedValue();

      const result = await organizationService.updateEmployeeStatus(organizationId, userId, newStatus, adminId);

      expect(result).toBe(mockOrganization);
      expect(mockOrganization.updateEmployeeStatus).toHaveBeenCalledWith(userId, newStatus);
    });

    it('should throw error if user is not admin', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      organizationService.getOrganizationById = jest.fn().mockResolvedValue(mockOrganization);

      await expect(
        organizationService.updateEmployeeStatus('org-123', 'user-456', 'inactive', 'user-789')
      ).rejects.toThrow('No tienes permisos para actualizar el estado de empleados');
    });
  });
});
