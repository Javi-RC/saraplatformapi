const projectService = require('../../../src/services/project.service');
const AppError = require('../../../src/utils/AppError');
const {
  projectRepository,
  organizationRepository,
  userRepository,
  caseBaseRepository
} = require('../../../src/repositories');

jest.mock('../../../src/repositories');
jest.mock('../../../src/services/projectNotificationHelper');
jest.mock('../../../src/services/teamSynergy.service');

const projectNotificationHelper = require('../../../src/services/projectNotificationHelper');
const teamSynergyService = require('../../../src/services/teamSynergy.service');

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const organizationId = 'org-123';
      const projectManagerId = 'pm-123';
      const projectData = { projectName: 'Test Project', description: 'Test Description' };

      const mockOrganization = {
        _id: organizationId,
        name: 'Test Org',
        isProjectManager: jest.fn().mockReturnValue(true)
      };

      const mockProjectManager = {
        _id: projectManagerId,
        name: 'John Doe',
        email: 'john@test.com'
      };

      const mockProject = {
        _id: 'project-123',
        ...projectData,
        organization: organizationId,
        projectManager: projectManagerId,
        status: 'draft',
        isProjectManager: jest.fn().mockReturnValue(true)
      };

      organizationRepository.findById.mockResolvedValueOnce(mockOrganization);
      userRepository.findById.mockResolvedValueOnce(mockProjectManager);
      projectRepository.create.mockResolvedValueOnce(mockProject);
      mockProject.populate = jest.fn().mockResolvedValue(mockProject);
      projectNotificationHelper.notifyProjectCreated.mockResolvedValue();

      const result = await projectService.createProject(projectData, projectManagerId, organizationId);

      expect(result).toBe(mockProject);
      expect(organizationRepository.findById).toHaveBeenCalledWith(organizationId);
      expect(userRepository.findById).toHaveBeenCalledWith(projectManagerId);
      expect(projectRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...projectData,
          organization: organizationId,
          projectManager: projectManagerId,
          status: 'draft'
        })
      );
    });

    it('should throw error if organization not found', async () => {
      organizationRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.createProject({}, 'pm-123', 'org-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user is not project manager', async () => {
      const mockOrganization = {
        isProjectManager: jest.fn().mockReturnValue(false)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);

      await expect(
        projectService.createProject({}, 'pm-123', 'org-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if project manager not found', async () => {
      const mockOrganization = {
        isProjectManager: jest.fn().mockReturnValue(true)
      };

      organizationRepository.findById.mockResolvedValue(mockOrganization);
      userRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.createProject({}, 'pm-123', 'org-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProjectById', () => {
    it('should get project by id without assigned employees', async () => {
      const mockProject = {
        _id: 'project-123',
        projectName: 'Test Project',
        status: 'active'
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      const result = await projectService.getProjectById('project-123', false);

      expect(result).toBe(mockProject);
      expect(projectRepository.findById).toHaveBeenCalledWith('project-123', expect.any(Object));
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.getProjectById('project-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const projectId = 'project-123';
      const userId = 'pm-123';
      const updateData = { projectName: 'Updated Project' };

      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        _id: projectId,
        projectName: 'Test Project',
        organization: 'org-123',
        isProjectManager: jest.fn().mockReturnValue(true),
        save: jest.fn().mockImplementation(function() {
          this.projectName = updateData.projectName;
          return Promise.resolve(this);
        }),
        lastActivityAt: Date.now()
      };
      
      mockProject.populate = jest.fn().mockResolvedValue(mockProject);

      projectRepository.findById.mockResolvedValueOnce(mockProject);
      organizationRepository.findById.mockResolvedValueOnce(mockOrganization);
      projectNotificationHelper.notifyProjectUpdated.mockResolvedValue();

      const result = await projectService.updateProject(projectId, updateData, userId);

      expect(result.projectName).toBe('Updated Project');
      expect(mockProject.save).toHaveBeenCalled();
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.updateProject('project-123', {}, 'user-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user has no permission', async () => {
      const mockProject = {
        organization: 'org-123',
        isProjectManager: jest.fn().mockReturnValue(false)
      };

      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      projectRepository.findById.mockResolvedValueOnce(mockProject);
      organizationRepository.findById.mockResolvedValueOnce(mockOrganization);

      await expect(
        projectService.updateProject('project-123', {}, 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const projectId = 'project-123';
      const userId = 'admin-123';

      const mockProject = {
        _id: projectId,
        organization: 'org-123'
      };

      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(true)
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      organizationRepository.findById.mockResolvedValue(mockOrganization);
      projectRepository.deleteById.mockResolvedValue(true);
      projectNotificationHelper.notifyProjectDeleted.mockResolvedValue();

      const result = await projectService.deleteProject(projectId, userId);

      expect(result.projectId).toBe(projectId);
      expect(projectRepository.deleteById).toHaveBeenCalledWith(projectId);
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.deleteProject('project-123', 'user-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user is not admin', async () => {
      const mockProject = {
        organization: 'org-123'
      };

      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      organizationRepository.findById.mockResolvedValue(mockOrganization);

      await expect(
        projectService.deleteProject('project-123', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProjectsByOrganization', () => {
    it('should get all projects for an organization', async () => {
      const organizationId = 'org-123';
      const mockProjects = [
        { _id: 'project-1', projectName: 'Project 1' },
        { _id: 'project-2', projectName: 'Project 2' }
      ];

      projectRepository.find.mockResolvedValue(mockProjects);

      const result = await projectService.getProjectsByOrganization(organizationId);

      expect(result).toEqual(mockProjects);
      expect(projectRepository.find).toHaveBeenCalledWith(
        { organization: organizationId },
        expect.any(Object)
      );
    });

    it('should apply filters when provided', async () => {
      const organizationId = 'org-123';
      const filters = { status: 'active', projectManager: 'pm-123' };

      projectRepository.find.mockResolvedValue([]);

      await projectService.getProjectsByOrganization(organizationId, filters);

      expect(projectRepository.find).toHaveBeenCalledWith(
        {
          organization: organizationId,
          status: 'active',
          projectManager: 'pm-123'
        },
        expect.any(Object)
      );
    });
  });

  describe('getProjectsByManager', () => {
    it('should get all projects managed by a user', async () => {
      const userId = 'pm-123';
      const mockProjects = [
        { _id: 'project-1', projectName: 'Project 1' }
      ];

      projectRepository.find.mockResolvedValueOnce(mockProjects);

      const result = await projectService.getProjectsByManager(userId);

      expect(result).toEqual(mockProjects);
      expect(projectRepository.find).toHaveBeenCalledWith(
        { projectManager: userId },
        expect.any(Object)
      );
    });
  });

  describe('getProjectsByAssignedEmployee', () => {
    it('should get all projects where user is assigned', async () => {
      const userId = 'emp-123';
      const mockProjects = [
        { _id: 'project-1', projectName: 'Project 1' }
      ];

      projectRepository.findByAssignedUser.mockResolvedValue(mockProjects);

      const result = await projectService.getProjectsByAssignedEmployee(userId);

      expect(result).toEqual(mockProjects);
      expect(projectRepository.findByAssignedUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('assignEmployeeToProject', () => {
    it('should assign employee to project successfully', async () => {
      const projectId = 'project-123';
      const employeeId = 'emp-123';
      const assignedRole = 'developer';
      const requesterId = 'pm-123';

      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(false),
        isEmployee: jest.fn().mockReturnValue(true)
      };

      const mockProject = {
        _id: projectId,
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(true),
        assignEmployee: jest.fn().mockResolvedValue(true)
      };
      // Asegurar que populate retorna el mismo objeto con sus métodos
      mockProject.populate = jest.fn().mockResolvedValue(mockProject);

      const mockEmployee = {
        _id: employeeId,
        name: 'John Doe'
      };

      projectRepository.findById.mockResolvedValueOnce(mockProject);
      userRepository.findById.mockResolvedValueOnce(mockEmployee);
      teamSynergyService.invalidateCache.mockResolvedValue();
      projectNotificationHelper.notifyEmployeeAssigned.mockResolvedValue();

      const result = await projectService.assignEmployeeToProject(projectId, employeeId, assignedRole, requesterId);

      expect(result).toBe(mockProject);
      expect(mockProject.assignEmployee).toHaveBeenCalledWith(employeeId, assignedRole);
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.assignEmployeeToProject('project-123', 'emp-123', 'developer', 'pm-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user has no permission', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(false)
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.assignEmployeeToProject('project-123', 'emp-123', 'developer', 'user-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if employee not in organization', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false),
        isEmployee: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(true)
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.assignEmployeeToProject('project-123', 'emp-123', 'developer', 'pm-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('removeEmployeeFromProject', () => {
    it('should remove employee from project successfully', async () => {
      const projectId = 'project-123';
      const employeeId = 'emp-123';
      const requesterId = 'pm-123';

      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        _id: projectId,
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(true),
        removeEmployee: jest.fn().mockResolvedValue(true)
      };
      
      mockProject.populate = jest.fn().mockResolvedValue(mockProject);

      const mockEmployee = {
        _id: employeeId,
        name: 'John Doe'
      };

      projectRepository.findById.mockResolvedValueOnce(mockProject);
      userRepository.findById.mockResolvedValueOnce(mockEmployee);
      teamSynergyService.invalidateCache.mockResolvedValue();
      projectNotificationHelper.notifyEmployeeRemoved.mockResolvedValue();

      const result = await projectService.removeEmployeeFromProject(projectId, employeeId, requesterId);

      expect(result).toBe(mockProject);
      expect(mockProject.removeEmployee).toHaveBeenCalledWith(employeeId);
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.removeEmployeeFromProject('project-123', 'emp-123', 'pm-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user has no permission', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(false)
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.removeEmployeeFromProject('project-123', 'emp-123', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('activateProject', () => {
    it('should activate project successfully', async () => {
      const projectId = 'project-123';
      const userId = 'pm-123';

      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        _id: projectId,
        status: 'draft',
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(true),
        activate: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      projectNotificationHelper.notifyProjectActivated.mockResolvedValue();

      const result = await projectService.activateProject(projectId, userId);

      expect(result).toBe(mockProject);
      expect(mockProject.activate).toHaveBeenCalled();
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.activateProject('project-123', 'pm-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user has no permission', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(false),
        status: 'draft'
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.activateProject('project-123', 'user-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if project is not in draft status', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        status: 'active',
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(true)
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.activateProject('project-123', 'pm-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('completeProject', () => {
    it('should complete project successfully', async () => {
      const projectId = 'project-123';
      const userId = 'pm-123';

      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        _id: projectId,
        status: 'active',
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(true),
        complete: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      projectNotificationHelper.notifyProjectCompleted.mockResolvedValue();
      caseBaseRepository.findOne.mockResolvedValue(null);

      const result = await projectService.completeProject(projectId, userId);

      expect(result).toBe(mockProject);
      expect(mockProject.complete).toHaveBeenCalled();
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.completeProject('project-123', 'pm-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if project is not active', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        status: 'draft',
        organization: mockOrganization,
        isProjectManager: jest.fn().mockReturnValue(true)
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.completeProject('project-123', 'pm-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('cancelProject', () => {
    it('should cancel project successfully', async () => {
      const projectId = 'project-123';
      const userId = 'admin-123';

      const mockOrganization = {
        _id: 'org-123',
        isAdmin: jest.fn().mockReturnValue(true)
      };

      const mockProject = {
        _id: projectId,
        status: 'active',
        organization: mockOrganization,
        cancel: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      projectNotificationHelper.notifyProjectCancelled.mockResolvedValue();

      const result = await projectService.cancelProject(projectId, userId);

      expect(result).toBe(mockProject);
      expect(mockProject.cancel).toHaveBeenCalled();
    });

    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        projectService.cancelProject('project-123', 'admin-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user is not admin', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(false)
      };

      const mockProject = {
        status: 'active',
        organization: mockOrganization
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.cancelProject('project-123', 'user-123')
      ).rejects.toThrow(AppError);
    });

    it('should throw error if project is already completed or cancelled', async () => {
      const mockOrganization = {
        isAdmin: jest.fn().mockReturnValue(true)
      };

      const mockProject = {
        status: 'completed',
        organization: mockOrganization
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        projectService.cancelProject('project-123', 'admin-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProjectStatistics', () => {
    it('should get project statistics for an organization', async () => {
      const organizationId = 'org-123';
      const mockProjects = [
        { status: 'draft', assignedEmployeesCount: 2 },
        { status: 'active', assignedEmployeesCount: 5 },
        { status: 'completed', assignedEmployeesCount: 3 }
      ];

      projectRepository.findByOrganization.mockResolvedValue(mockProjects);

      const result = await projectService.getProjectStatistics(organizationId);

      expect(result.total).toBe(3);
      expect(result.byStatus.draft).toBe(1);
      expect(result.byStatus.active).toBe(1);
      expect(result.byStatus.completed).toBe(1);
      expect(result.totalAssignedEmployees).toBe(10);
    });

    it('should handle empty project list', async () => {
      projectRepository.findByOrganization.mockResolvedValue([]);

      const result = await projectService.getProjectStatistics('org-123');

      expect(result.total).toBe(0);
      expect(result.totalAssignedEmployees).toBe(0);
    });
  });
});
