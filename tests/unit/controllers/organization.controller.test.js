const organizationController = require('../../../src/controllers/organization.controller');
const organizationService = require('../../../src/services/core/organization.service');
const projectService = require('../../../src/services/core/project.service');

jest.mock('../../../src/services/core/organization.service');
jest.mock('../../../src/services/core/project.service');

describe('Organization Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'admin123',
        role: 'org_admin'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should create organization successfully', async () => {
      req.body = {
        name: 'Test Org',
        industry: 'Tech',
        size: 'medium'
      };

      const mockOrganization = {
        _id: 'org123',
        name: 'Test Org',
        admins: ['admin123']
      };
      organizationService.createOrganization.mockResolvedValue(mockOrganization);

      await organizationController.createOrganization(req, res);

      expect(organizationService.createOrganization).toHaveBeenCalledWith(
        req.body,
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Organization created successfully',
        data: mockOrganization
      });
    });

    it('should return 409 when admin already manages organization', async () => {
      req.body = { name: 'Test Org' };
      const error = new Error('El usuario ya administra una organización');
      organizationService.createOrganization.mockRejectedValue(error);

      await organizationController.createOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });

    it('should return 400 for other errors', async () => {
      req.body = { name: 'Test Org' };
      const error = new Error('Validation error');
      organizationService.createOrganization.mockRejectedValue(error);

      await organizationController.createOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getOrganization', () => {
    it('should get organization successfully', async () => {
      req.params.id = 'org123';
      const mockOrganization = {
        _id: 'org123',
        name: 'Test Org'
      };
      organizationService.getOrganizationById.mockResolvedValue(mockOrganization);

      await organizationController.getOrganization(req, res);

      expect(organizationService.getOrganizationById).toHaveBeenCalledWith('org123', false, 'admin123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrganization
      });
    });

    it('should include employees when requested', async () => {
      req.params.id = 'org123';
      req.query.includeEmployees = 'true';
      const mockOrganization = { _id: 'org123', employees: [] };
      organizationService.getOrganizationById.mockResolvedValue(mockOrganization);

      await organizationController.getOrganization(req, res);

      expect(organizationService.getOrganizationById).toHaveBeenCalledWith('org123', true, 'admin123');
    });

    it('should return 404 when organization not found', async () => {
      req.params.id = 'org123';
      const error = new Error('Organización no encontrada');
      organizationService.getOrganizationById.mockRejectedValue(error);

      await organizationController.getOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Database error');
      organizationService.getOrganizationById.mockRejectedValue(error);

      await organizationController.getOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      req.params.id = 'org123';
      req.body = { name: 'Updated Org' };
      const mockOrganization = { _id: 'org123', name: 'Updated Org' };
      organizationService.updateOrganization.mockResolvedValue(mockOrganization);

      await organizationController.updateOrganization(req, res);

      expect(organizationService.updateOrganization).toHaveBeenCalledWith(
        'org123',
        req.body,
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Organization updated successfully',
        data: mockOrganization
      });
    });

    it('should return 403 for permission errors', async () => {
      req.params.id = 'org123';
      req.body = { name: 'Updated Org' };
      const error = new Error('No tienes permisos');
      organizationService.updateOrganization.mockRejectedValue(error);

      await organizationController.updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 404 when organization not found', async () => {
      req.params.id = 'org123';
      const error = new Error('Organización no encontrada');
      organizationService.updateOrganization.mockRejectedValue(error);

      await organizationController.updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'org123';
      req.body = { name: 'Updated Org' };
      const error = new Error('Unexpected error');
      organizationService.updateOrganization.mockRejectedValue(error);

      await organizationController.updateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected error'
      });
    });
  });

  describe('getMyOrganizations', () => {
    it('should return organizations for org_admin', async () => {
      req.user.role = 'org_admin';
      const mockOrganizations = [
        { _id: 'org1', name: 'Org 1' },
        { _id: 'org2', name: 'Org 2' }
      ];
      organizationService.getOrganizationsByAdmin.mockResolvedValue(mockOrganizations);

      await organizationController.getMyOrganizations(req, res);

      expect(organizationService.getOrganizationsByAdmin).toHaveBeenCalledWith('admin123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrganizations
      });
    });

    it('should return organizations for employee', async () => {
      req.user.role = 'employee';
      const mockOrganizations = [{ _id: 'org1', name: 'Org 1' }];
      organizationService.getOrganizationsByEmployee.mockResolvedValue(mockOrganizations);

      await organizationController.getMyOrganizations(req, res);

      expect(organizationService.getOrganizationsByEmployee).toHaveBeenCalledWith('admin123');
    });

    it('should return empty array for unknown role', async () => {
      req.user.role = 'unknown';

      await organizationController.getMyOrganizations(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    it('should handle errors', async () => {
      req.user.role = 'org_admin';
      const error = new Error('Service error');
      organizationService.getOrganizationsByAdmin.mockRejectedValue(error);

      await organizationController.getMyOrganizations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('addEmployee', () => {
    it('should add employee successfully', async () => {
      req.params.id = 'org123';
      req.body = {
        userId: 'user123',
        position: 'Developer',
        department: 'Engineering'
      };
      const mockOrganization = { _id: 'org123', employees: ['user123'] };
      organizationService.addEmployee.mockResolvedValue(mockOrganization);

      await organizationController.addEmployee(req, res);

      expect(organizationService.addEmployee).toHaveBeenCalledWith(
        'org123',
        'user123',
        { position: 'Developer', department: 'Engineering' },
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Employee added successfully',
        data: mockOrganization
      });
    });

    it('should return error when userId is missing', async () => {
      req.params.id = 'org123';
      req.body = { position: 'Developer' };

      await organizationController.addEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User ID is required'
      });
    });

    it('should return 403 for permission errors', async () => {
      req.params.id = 'org123';
      req.body = { userId: 'user123' };
      const error = new Error('No tienes permisos');
      organizationService.addEmployee.mockRejectedValue(error);

      await organizationController.addEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'org123';
      req.body = { userId: 'user123' };
      const error = new Error('Unknown error');
      organizationService.addEmployee.mockRejectedValue(error);

      await organizationController.addEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown error'
      });
    });
  });

  describe('removeEmployee', () => {
    it('should remove employee successfully', async () => {
      req.params.id = 'org123';
      req.params.userId = 'user123';
      const mockOrganization = { _id: 'org123', employees: [] };
      organizationService.removeEmployee.mockResolvedValue(mockOrganization);

      await organizationController.removeEmployee(req, res);

      expect(organizationService.removeEmployee).toHaveBeenCalledWith(
        'org123',
        'user123',
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle not found errors', async () => {
      req.params.id = 'org123';
      req.params.userId = 'user123';
      const error = new Error('Usuario no encontrado');
      organizationService.removeEmployee.mockRejectedValue(error);

      await organizationController.removeEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'org123';
      req.params.userId = 'user123';
      const error = new Error('Unexpected remove error');
      organizationService.removeEmployee.mockRejectedValue(error);

      await organizationController.removeEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected remove error'
      });
    });
  });

  describe('updateEmployeeStatus', () => {
    it('should update employee status successfully', async () => {
      req.params.id = 'org123';
      req.params.userId = 'user123';
      req.body.status = 'active';
      const mockOrganization = { _id: 'org123' };
      organizationService.updateEmployeeStatus.mockResolvedValue(mockOrganization);

      await organizationController.updateEmployeeStatus(req, res);

      expect(organizationService.updateEmployeeStatus).toHaveBeenCalledWith(
        'org123',
        'user123',
        'active',
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return error when status is missing', async () => {
      req.params.id = 'org123';
      req.params.userId = 'user123';
      req.body = {};

      await organizationController.updateEmployeeStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'New status is required'
      });
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'org123';
      req.params.userId = 'user123';
      req.body.status = 'active';
      const error = new Error('Unexpected status error');
      organizationService.updateEmployeeStatus.mockRejectedValue(error);

      await organizationController.updateEmployeeStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unexpected status error'
      });
    });
  });

  describe('addAdmin', () => {
    it('should add admin successfully', async () => {
      req.params.id = 'org123';
      req.body.userId = 'newAdmin123';
      const mockOrganization = { _id: 'org123', admins: ['admin123', 'newAdmin123'] };
      organizationService.addAdditionalAdmin.mockResolvedValue(mockOrganization);

      await organizationController.addAdmin(req, res);

      expect(organizationService.addAdditionalAdmin).toHaveBeenCalledWith(
        'org123',
        'newAdmin123',
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return error when userId is missing', async () => {
      req.params.id = 'org123';
      req.body = {};

      await organizationController.addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 403 for non-principal admin', async () => {
      req.params.id = 'org123';
      req.body.userId = 'newAdmin123';
      const error = new Error('Solo el administrador principal puede añadir administradores');
      organizationService.addAdditionalAdmin.mockRejectedValue(error);

      await organizationController.addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEmployees', () => {
    it('should get employees successfully', async () => {
      req.params.id = 'org123';
      const mockEmployees = [
        { _id: 'user1', name: 'User 1' },
        { _id: 'user2', name: 'User 2' }
      ];
      organizationService.getEmployees.mockResolvedValue(mockEmployees);

      await organizationController.getEmployees(req, res);

      expect(organizationService.getEmployees).toHaveBeenCalledWith(
        'org123',
        {
          status: undefined,
          department: undefined,
          position: undefined
        },
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockEmployees
      });
    });

    it('should apply filters when provided', async () => {
      req.params.id = 'org123';
      req.query = {
        status: 'active',
        department: 'Engineering',
        position: 'Developer'
      };
      organizationService.getEmployees.mockResolvedValue([]);

      await organizationController.getEmployees(req, res);

      expect(organizationService.getEmployees).toHaveBeenCalledWith(
        'org123',
        {
          status: 'active',
          department: 'Engineering',
          position: 'Developer'
        },
        'admin123'
      );
    });
  });

  describe('searchOrganizations', () => {
    it('should search organizations with filters', async () => {
      req.query = {
        status: 'active',
        industry: 'Tech',
        size: 'large',
        name: 'Test',
        page: '2',
        limit: '10',
        sortBy: 'name',
        sortOrder: 'asc'
      };

      const mockResult = {
        organizations: [{ _id: 'org1', name: 'Test Org' }],
        pagination: { page: 2, limit: 10, total: 1 }
      };
      organizationService.searchOrganizations.mockResolvedValue(mockResult);

      await organizationController.searchOrganizations(req, res);

      expect(organizationService.searchOrganizations).toHaveBeenCalledWith(
        {
          status: 'active',
          industry: 'Tech',
          size: 'large',
          name: 'Test'
        },
        {
          page: 2,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc'
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should use default pagination values', async () => {
      req.query = {};
      organizationService.searchOrganizations.mockResolvedValue({ organizations: [] });

      await organizationController.searchOrganizations(req, res);

      expect(organizationService.searchOrganizations).toHaveBeenCalledWith(
        expect.any(Object),
        {
          page: 1,
          limit: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      );
    });
  });

  describe('deactivateOrganization', () => {
    it('should deactivate organization successfully', async () => {
      req.params.id = 'org123';
      const mockOrganization = { _id: 'org123', status: 'inactive' };
      organizationService.deactivateOrganization.mockResolvedValue(mockOrganization);

      await organizationController.deactivateOrganization(req, res);

      expect(organizationService.deactivateOrganization).toHaveBeenCalledWith(
        'org123',
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 403 for non-principal admin', async () => {
      req.params.id = 'org123';
      const error = new Error('Solo el administrador principal puede desactivar');
      organizationService.deactivateOrganization.mockRejectedValue(error);

      await organizationController.deactivateOrganization(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('activateOrganization', () => {
    it('should activate organization successfully', async () => {
      req.params.id = 'org123';
      const mockOrganization = { _id: 'org123', status: 'active' };
      organizationService.activateOrganization.mockResolvedValue(mockOrganization);

      await organizationController.activateOrganization(req, res);

      expect(organizationService.activateOrganization).toHaveBeenCalledWith(
        'org123',
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', async () => {
      req.params.id = 'org123';
      req.body = { theme: 'dark', notifications: true };
      const mockOrganization = { _id: 'org123', settings: req.body };
      organizationService.updateSettings.mockResolvedValue(mockOrganization);

      await organizationController.updateSettings(req, res);

      expect(organizationService.updateSettings).toHaveBeenCalledWith(
        'org123',
        req.body,
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle permission errors', async () => {
      req.params.id = 'org123';
      req.body = { theme: 'dark' };
      const error = new Error('No tienes permisos');
      organizationService.updateSettings.mockRejectedValue(error);

      await organizationController.updateSettings(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getStats', () => {
    it('should get organization stats successfully', async () => {
      req.params.id = 'org123';
      const mockStats = {
        totalEmployees: 50,
        activeProjects: 10,
        completedProjects: 20
      };
      organizationService.getOrganizationStats.mockResolvedValue(mockStats);

      await organizationController.getStats(req, res);

      expect(organizationService.getOrganizationStats).toHaveBeenCalledWith(
        'org123',
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle permission errors', async () => {
      req.params.id = 'org123';
      const error = new Error('No tienes permisos');
      organizationService.getOrganizationStats.mockRejectedValue(error);

      await organizationController.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('setProjectManagerRole', () => {
    it('should assign project manager role successfully', async () => {
      req.params.id = 'org123';
      req.params.employeeId = 'user123';
      req.body.isProjectManager = true;
      const mockOrganization = { _id: 'org123' };
      organizationService.setProjectManagerRole.mockResolvedValue(mockOrganization);

      await organizationController.setProjectManagerRole(req, res);

      expect(organizationService.setProjectManagerRole).toHaveBeenCalledWith(
        'org123',
        'user123',
        true,
        'admin123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Employee assigned as project manager successfully',
        data: mockOrganization
      });
    });

    it('should remove project manager role successfully', async () => {
      req.params.id = 'org123';
      req.params.employeeId = 'user123';
      req.body.isProjectManager = false;
      const mockOrganization = { _id: 'org123' };
      organizationService.setProjectManagerRole.mockResolvedValue(mockOrganization);

      await organizationController.setProjectManagerRole(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project manager role removed successfully',
        data: mockOrganization
      });
    });

    it('should return error when isProjectManager is not boolean', async () => {
      req.params.id = 'org123';
      req.params.employeeId = 'user123';
      req.body.isProjectManager = 'yes';

      await organizationController.setProjectManagerRole(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'isProjectManager must be a boolean value'
      });
    });

    it('should return 404 when employee not found', async () => {
      req.params.id = 'org123';
      req.params.employeeId = 'user123';
      req.body.isProjectManager = true;
      const error = new Error('Organización no encontrada');
      organizationService.setProjectManagerRole.mockRejectedValue(error);

      await organizationController.setProjectManagerRole(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getProjectManagers', () => {
    it('should get project managers successfully', async () => {
      req.params.id = 'org123';
      const mockManagers = [
        { _id: 'user1', name: 'Manager 1' },
        { _id: 'user2', name: 'Manager 2' }
      ];
      organizationService.getProjectManagers.mockResolvedValue(mockManagers);

      await organizationController.getProjectManagers(req, res);

      expect(organizationService.getProjectManagers).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockManagers
      });
    });

    it('should handle not found errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Organización no encontrada');
      organizationService.getProjectManagers.mockRejectedValue(error);

      await organizationController.getProjectManagers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getOrganizationProjects', () => {
    it('should get organization projects successfully', async () => {
      req.params.id = 'org123';
      const mockProjects = [
        { _id: 'proj1', name: 'Project 1' },
        { _id: 'proj2', name: 'Project 2' }
      ];
      projectService.getProjectsByOrganization.mockResolvedValue(mockProjects);

      await organizationController.getOrganizationProjects(req, res);

      expect(projectService.getProjectsByOrganization).toHaveBeenCalledWith('org123', {
        status: undefined,
        projectManager: undefined
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockProjects
      });
    });

    it('should apply filters when provided', async () => {
      req.params.id = 'org123';
      req.query = { status: 'active', projectManager: 'pm123' };
      projectService.getProjectsByOrganization.mockResolvedValue([]);

      await organizationController.getOrganizationProjects(req, res);

      expect(projectService.getProjectsByOrganization).toHaveBeenCalledWith('org123', {
        status: 'active',
        projectManager: 'pm123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: []
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Database error');
      projectService.getProjectsByOrganization.mockRejectedValue(error);

      await organizationController.getOrganizationProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getProjectStatistics', () => {
    it('should get project statistics successfully', async () => {
      req.params.id = 'org123';
      const mockStats = {
        totalProjects: 10,
        activeProjects: 5,
        completedProjects: 3
      };
      projectService.getProjectStatistics.mockResolvedValue(mockStats);

      await organizationController.getProjectStatistics(req, res);

      expect(projectService.getProjectStatistics).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle errors', async () => {
      req.params.id = 'org123';
      const error = new Error('Database error');
      projectService.getProjectStatistics.mockRejectedValue(error);

      await organizationController.getProjectStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
