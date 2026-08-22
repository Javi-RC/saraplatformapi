jest.mock('../../../src/services/core/project.service');
jest.mock('express-validator');
jest.mock('../../../src/models/project.model');
jest.mock('../../../src/models/cv.model');
jest.mock('../../../src/models/bfi44.model');
jest.mock('../../../src/models/organization.model');
jest.mock('../../../src/services/team/teamSelection.service');
jest.mock('../../../src/services/team/teamSynergy.service');
jest.mock('../../../src/services/team/personalityOptimizer.service');
jest.mock('../../../src/services/team/teamAnalysis.service');
jest.mock('../../../src/services/team/teamAnalysisOrchestrator.service');

jest.mock('../../../src/config/teamSelectionDefaults', () => ({
  getTeamSelectionConfig: jest.fn(() => ({ phase1: { enabled: true } })),
  getConfigSection: jest.fn(() => ({ synergyWeights: {} })),
  validateTeamSelectionConfig: jest.fn(() => ({ valid: true, errors: [] })),
  getConfigurationSummary: jest.fn(() => ({ summary: true })),
  DEFAULT_TEAM_SELECTION_CONFIG: {
    phase1: { enabled: true },
    phase2: { enabled: true },
    cbr: { enabled: true },
    decisionTree: { enabled: true }
  }
}));

const projectController = require('../../../src/controllers/project.controller');
const projectService = require('../../../src/services/core/project.service');
const { validationResult } = require('express-validator');
const Project = require('../../../src/models/project.model');
const CV = require('../../../src/models/cv.model');
const BFI44 = require('../../../src/models/bfi44.model');
const Organization = require('../../../src/models/organization.model');
const teamSelectionService = require('../../../src/services/team/teamSelection.service');
const teamSynergyService = require('../../../src/services/team/teamSynergy.service');
const personalityOptimizer = require('../../../src/services/team/personalityOptimizer.service');
const teamAnalysisService = require('../../../src/services/team/teamAnalysis.service');
const teamAnalysisOrchestrator = require('../../../src/services/team/teamAnalysisOrchestrator.service');
const teamSelectionDefaults = require('../../../src/config/teamSelectionDefaults');

describe('Project Controller - Unit Tests', () => {
  let req, res;

  const createPopulateQuery = (resolvedValue) => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(resolvedValue),
      then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject)
    };
    return query;
  };

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'pm123',
        role: 'project_manager'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
    
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      req.body = {
        projectName: 'Test Project',
        description: 'Test description',
        organizationId: 'org123',
        technologies: ['JavaScript', 'Node.js']
      };

      const mockProject = {
        _id: 'project123',
        projectName: 'Test Project',
        projectManager: 'pm123'
      };
      projectService.createProject.mockResolvedValue(mockProject);

      await projectController.createProject(req, res);

      expect(projectService.createProject).toHaveBeenCalledWith(
        req.body,
        'pm123',
        'org123'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project created successfully',
        data: mockProject
      });
    });

    it('should return validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([
          { msg: 'Project name is required' }
        ])
      });

      await projectController.createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        errors: [{ msg: 'Project name is required' }]
      });
    });

    it('should return error when organizationId is missing', async () => {
      req.body = {
        projectName: 'Test Project'
      };

      await projectController.createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Organization ID is required'
      });
    });

    it('should return 404 when organization not found', async () => {
      req.body = {
        projectName: 'Test Project',
        organizationId: 'org123'
      };
      const error = new Error('Organization not found');
      projectService.createProject.mockRejectedValue(error);

      await projectController.createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when not authorized', async () => {
      req.body = {
        projectName: 'Test Project',
        organizationId: 'org123'
      };
      const error = new Error('User is unauthorized');
      projectService.createProject.mockRejectedValue(error);

      await projectController.createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for other errors', async () => {
      req.body = {
        projectName: 'Test Project',
        organizationId: 'org123'
      };
      const error = new Error('Invalid data');
      projectService.createProject.mockRejectedValue(error);

      await projectController.createProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid data'
      });
    });
  });

  describe('getProject', () => {
    it('should get project successfully', async () => {
      req.params.id = 'project123';
      const mockProject = {
        _id: 'project123',
        projectName: 'Test Project'
      };
      projectService.getProjectById.mockResolvedValue(mockProject);

      await projectController.getProject(req, res);

      expect(projectService.getProjectById).toHaveBeenCalledWith('project123', false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockProject
      });
    });

    it('should include employees when requested', async () => {
      req.params.id = 'project123';
      req.query.includeEmployees = 'true';
      const mockProject = { _id: 'project123' };
      projectService.getProjectById.mockResolvedValue(mockProject);

      await projectController.getProject(req, res);

      expect(projectService.getProjectById).toHaveBeenCalledWith('project123', true);
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      const error = new Error('Project not found');
      projectService.getProjectById.mockRejectedValue(error);

      await projectController.getProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'project123';
      const error = new Error('Service invalid');
      projectService.getProjectById.mockRejectedValue(error);

      await projectController.getProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Service invalid'
      });
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      req.params.id = 'project123';
      req.body = { projectName: 'Updated Project' };
      const mockProject = { _id: 'project123', projectName: 'Updated Project' };
      projectService.updateProject.mockResolvedValue(mockProject);

      await projectController.updateProject(req, res);

      expect(projectService.updateProject).toHaveBeenCalledWith(
        'project123',
        req.body,
        'pm123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project updated successfully',
        data: mockProject
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      req.body = { projectName: 'Updated' };
      const error = new Error('Project not found');
      projectService.updateProject.mockRejectedValue(error);

      await projectController.updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when no permission', async () => {
      req.params.id = 'project123';
      req.body = { projectName: 'Updated' };
      const error = new Error('No permission');
      projectService.updateProject.mockRejectedValue(error);

      await projectController.updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'project123';
      req.body = { projectName: 'Updated' };
      const error = new Error('Invalid update');
      projectService.updateProject.mockRejectedValue(error);

      await projectController.updateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid update'
      });
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      req.params.id = 'project123';
      const mockResult = { message: 'Project deleted successfully' };
      projectService.deleteProject.mockResolvedValue(mockResult);

      await projectController.deleteProject(req, res);

      expect(projectService.deleteProject).toHaveBeenCalledWith('project123', 'pm123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      const error = new Error('Project not found');
      projectService.deleteProject.mockRejectedValue(error);

      await projectController.deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 for admins restriction', async () => {
      req.params.id = 'project123';
      const error = new Error('Only permission administrators can delete');
      projectService.deleteProject.mockRejectedValue(error);

      await projectController.deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 for other errors', async () => {
      req.params.id = 'project123';
      const error = new Error('Invalid delete');
      projectService.deleteProject.mockRejectedValue(error);

      await projectController.deleteProject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid delete'
      });
    });
  });

  describe('getOrganizationProjects', () => {
    it('should get organization projects successfully', async () => {
      req.params.organizationId = 'org123';
      const mockProjects = [
        { _id: 'project1', projectName: 'Project 1' },
        { _id: 'project2', projectName: 'Project 2' }
      ];
      projectService.getProjectsByOrganization.mockResolvedValue({ data: mockProjects });

      await projectController.getOrganizationProjects(req, res);

      expect(projectService.getProjectsByOrganization).toHaveBeenCalledWith(
        'org123',
        { status: undefined, projectManager: undefined }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockProjects
      });
    });

    it('should apply filters when provided', async () => {
      req.params.organizationId = 'org123';
      req.query = {
        status: 'active',
        projectManager: 'pm123'
      };
      projectService.getProjectsByOrganization.mockResolvedValue({ data: [] });

      await projectController.getOrganizationProjects(req, res);

      expect(projectService.getProjectsByOrganization).toHaveBeenCalledWith(
        'org123',
        { status: 'active', projectManager: 'pm123' }
      );
    });

    it('should handle errors', async () => {
      req.params.organizationId = 'org123';
      projectService.getProjectsByOrganization.mockRejectedValue(new Error('Missing configuration'));

      await projectController.getOrganizationProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing configuration'
      });
    });
  });

  describe('getMyProjects', () => {
    it('should get user projects successfully', async () => {
      const mockProjects = [{ _id: 'project1', projectName: 'My Project' }];
      projectService.getProjectsByManager.mockResolvedValue(mockProjects);

      await projectController.getMyProjects(req, res);

      expect(projectService.getProjectsByManager).toHaveBeenCalledWith(
        'pm123',
        { status: undefined, organizationId: undefined }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockProjects
      });
    });

    it('should apply filters', async () => {
      req.query = {
        status: 'completed',
        organizationId: 'org123'
      };
      projectService.getProjectsByManager.mockResolvedValue([]);

      await projectController.getMyProjects(req, res);

      expect(projectService.getProjectsByManager).toHaveBeenCalledWith(
        'pm123',
        { status: 'completed', organizationId: 'org123' }
      );
    });

    it('should handle errors', async () => {
      projectService.getProjectsByManager.mockRejectedValue(new Error('Missing data'));

      await projectController.getMyProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing data'
      });
    });
  });

  describe('getAssignedProjects', () => {
    it('should get assigned projects successfully', async () => {
      const mockProjects = [
        { _id: 'project1', projectName: 'Assigned Project 1' }
      ];
      projectService.getProjectsByAssignedEmployee.mockResolvedValue(mockProjects);

      await projectController.getAssignedProjects(req, res);

      expect(projectService.getProjectsByAssignedEmployee).toHaveBeenCalledWith('pm123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockProjects
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Service missing');
      projectService.getProjectsByAssignedEmployee.mockRejectedValue(error);

      await projectController.getAssignedProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('assignEmployee', () => {
    it('should assign employee successfully', async () => {
      req.params.id = 'project123';
      req.body = {
        employeeId: 'emp123',
        assignedRole: 'Developer'
      };
      const mockProject = {
        _id: 'project123',
        assignedEmployees: ['emp123']
      };
      projectService.assignEmployeeToProject.mockResolvedValue(mockProject);

      await projectController.assignEmployee(req, res);

      expect(projectService.assignEmployeeToProject).toHaveBeenCalledWith(
        'project123',
        'emp123',
        'Developer',
        'pm123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Employee assigned successfully',
        data: mockProject
      });
    });

    it('should use empty string for role if not provided', async () => {
      req.params.id = 'project123';
      req.body = { employeeId: 'emp123' };
      projectService.assignEmployeeToProject.mockResolvedValue({});

      await projectController.assignEmployee(req, res);

      expect(projectService.assignEmployeeToProject).toHaveBeenCalledWith(
        'project123',
        'emp123',
        '',
        'pm123'
      );
    });

    it('should return error when employeeId is missing', async () => {
      req.params.id = 'project123';
      req.body = {};

      await projectController.assignEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Employee ID is required'
      });
    });

    it('should return 404 when not found', async () => {
      req.params.id = 'project123';
      req.body = { employeeId: 'emp123' };
      const error = new Error('Project not found');
      projectService.assignEmployeeToProject.mockRejectedValue(error);

      await projectController.assignEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when no permission', async () => {
      req.params.id = 'project123';
      req.body = { employeeId: 'emp123' };
      const error = new Error('No permission');
      projectService.assignEmployeeToProject.mockRejectedValue(error);

      await projectController.assignEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 409 when already assigned', async () => {
      req.params.id = 'project123';
      req.body = { employeeId: 'emp123' };
      const error = new Error('Employee already exists in this project');
      projectService.assignEmployeeToProject.mockRejectedValue(error);

      await projectController.assignEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('removeEmployee', () => {
    it('should remove employee successfully', async () => {
      req.params.id = 'project123';
      req.params.employeeId = 'emp123';
      const mockProject = {
        _id: 'project123',
        assignedEmployees: []
      };
      projectService.removeEmployeeFromProject.mockResolvedValue(mockProject);

      await projectController.removeEmployee(req, res);

      expect(projectService.removeEmployeeFromProject).toHaveBeenCalledWith(
        'project123',
        'emp123',
        'pm123'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Employee removed successfully',
        data: mockProject
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      req.params.employeeId = 'emp123';
      const error = new Error('Project not found');
      projectService.removeEmployeeFromProject.mockRejectedValue(error);

      await projectController.removeEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when no permission', async () => {
      req.params.id = 'project123';
      req.params.employeeId = 'emp123';
      const error = new Error('No permission');
      projectService.removeEmployeeFromProject.mockRejectedValue(error);

      await projectController.removeEmployee(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('activateProject', () => {
    it('should activate project successfully', async () => {
      req.params.id = 'project123';
      const mockProject = { _id: 'project123', status: 'active' };
      projectService.activateProject.mockResolvedValue(mockProject);

      await projectController.activateProject(req, res);

      expect(projectService.activateProject).toHaveBeenCalledWith('project123', 'pm123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project activated successfully',
        data: mockProject
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      projectService.activateProject.mockRejectedValue(new Error('project not found'));

      await projectController.activateProject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('completeProject', () => {
    it('should complete project successfully', async () => {
      req.params.id = 'project123';
      const mockProject = { _id: 'project123', status: 'completed' };
      projectService.completeProject.mockResolvedValue(mockProject);

      await projectController.completeProject(req, res);

      expect(projectService.completeProject).toHaveBeenCalledWith('project123', 'pm123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project completed successfully',
        data: mockProject
      });
    });

    it('should return 403 when permission error', async () => {
      req.params.id = 'project123';
      projectService.completeProject.mockRejectedValue(new Error('permission denied'));

      await projectController.completeProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('cancelProject', () => {
    it('should cancel project successfully', async () => {
      req.params.id = 'project123';
      const mockProject = { _id: 'project123', status: 'cancelled' };
      projectService.cancelProject.mockResolvedValue(mockProject);

      await projectController.cancelProject(req, res);

      expect(projectService.cancelProject).toHaveBeenCalledWith('project123', 'pm123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Project cancelled successfully',
        data: mockProject
      });
    });

    it('should return 403 when administrators restriction', async () => {
      req.params.id = 'project123';
      projectService.cancelProject.mockRejectedValue(new Error('Only permission administrators can cancel'));

      await projectController.cancelProject(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getProjectStatistics', () => {
    it('should return statistics', async () => {
      req.params.organizationId = 'org123';
      const stats = { total: 10 };
      projectService.getProjectStatistics.mockResolvedValue(stats);

      await projectController.getProjectStatistics(req, res);

      expect(projectService.getProjectStatistics).toHaveBeenCalledWith('org123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });

    it('should handle errors', async () => {
      req.params.organizationId = 'org123';
      projectService.getProjectStatistics.mockRejectedValue(new Error('Missing statistics'));

      await projectController.getProjectStatistics(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Missing statistics' });
    });
  });

  describe('suggestTeam', () => {
    it('should validate required fields', async () => {
      req.body = { organizationId: 'org123' };

      await projectController.suggestTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Project requirements and organization ID are required'
      });
    });

    it('should suggest team successfully', async () => {
      req.body = {
        projectRequirements: { technologies: ['js'] },
        organizationId: 'org123',
        teamSize: 3,
        enablePersonalityOptimization: true
      };

      teamSelectionService.selectOptimalTeam.mockResolvedValue({
        team: [{ id: 'e1' }],
        metadata: { meta: true },
        synergy: { score: 1 },
        optimization: { enabled: true }
      });
      teamSelectionService.getTeamSummary.mockReturnValue({ summary: true });
      teamSelectionService.generateTeamRisks.mockReturnValue([]);

      await projectController.suggestTeam(req, res);

      expect(teamSelectionService.selectOptimalTeam).toHaveBeenCalledWith(
        req.body.projectRequirements,
        'org123',
        3,
        true
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            team: [{ id: 'e1' }],
            summary: { summary: true },
            metadata: { meta: true }
          })
        })
      );
    });

    it('should include risks when present', async () => {
      req.body = {
        projectRequirements: { technologies: ['js'] },
        organizationId: 'org123',
        teamSize: 3
      };

      teamSelectionService.selectOptimalTeam.mockResolvedValue({
        team: [{ id: 'e1' }],
        metadata: { meta: true }
      });
      teamSelectionService.getTeamSummary.mockReturnValue({ summary: true });
      teamSelectionService.generateTeamRisks.mockReturnValue([{ id: 'r1' }]);

      await projectController.suggestTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            risks: [{ id: 'r1' }]
          })
        })
      );
    });

    it('should handle errors', async () => {
      req.body = {
        projectRequirements: { technologies: ['js'] },
        organizationId: 'org123'
      };
      teamSelectionService.selectOptimalTeam.mockRejectedValue(new Error('Invalid requirements'));

      await projectController.suggestTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid requirements'
      });
    });
  });

  describe('getTeamAnalysis', () => {
    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery(null));

      await projectController.getTeamAnalysis(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Project not found'
      });
    });

    it('should return 400 when organization is missing', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        projectName: 'P',
        assignedEmployees: [],
        organization: null
      }));

      await projectController.getTeamAnalysis(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Project organization not found'
      });
    });

    it('should build suggestions for empty team and include risks', async () => {
      req.params.id = 'project123';

      const project = {
        _id: 'project123',
        projectName: 'P',
        mainTechnologies: ['Node.js'],
        requiredExperienceLevel: 'mid',
        estimatedTeamSize: 2,
        assignedEmployees: [],
        organization: { _id: 'org123', name: 'Org' }
      };
      Project.findById.mockReturnValue(createPopulateQuery(project));

      teamAnalysisOrchestrator.suggestComplementary.mockResolvedValue({
        suggestions: [
          {
            userId: 'u1',
            user: { name: 'A' },
            score: 10,
            details: { x: 1 }
          }
        ],
        suggestionsSummary: { summary: true },
        suggestionsMetadata: { meta: true },
        synergyValidation: [{ userId: 'u1' }],
        projectedTeamSynergy: { synergy: true },
        risks: [{ id: 'risk1' }],
        message: 'Proyecto sin equipo: sugerencias de candidatos'
      });
      teamAnalysisOrchestrator.scoreAvailableEmployees.mockResolvedValue({
        availableEmployees: [],
        count: 0
      });

      await projectController.getTeamAnalysis(req, res);

      expect(teamAnalysisOrchestrator.suggestComplementary).toHaveBeenCalledWith(
        project,
        'org123',
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.data.suggestions).toHaveLength(1);
      expect(payload.data.risks).toEqual([{ id: 'risk1' }]);
      expect(payload.data.message).toContain('Proyecto sin equipo');
    });

    it('should set team complete message when no remaining slots', async () => {
      req.params.id = 'project123';

      const project = {
        _id: 'project123',
        projectName: 'P',
        teamSize: 1,
        assignedEmployees: [{ user: { _id: 'u1' } }],
        organization: { _id: 'org123', name: 'Org' }
      };
      Project.findById.mockReturnValue(createPopulateQuery(project));

      teamAnalysisOrchestrator.analyzeCurrentTeam.mockResolvedValue({
        teamMembers: [{ userId: 'u1', name: 'A' }],
        teamSummary: { summary: true },
        synergy: { synergy: true }
      });
      teamAnalysisOrchestrator.scoreAvailableEmployees.mockResolvedValue({
        availableEmployees: [],
        count: 0
      });

      await projectController.getTeamAnalysis(req, res);

      expect(teamAnalysisOrchestrator.suggestComplementary).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.message).toBe('The team is complete.');
    });

    it('should use default team size and fallback organizationId when organization is not populated', async () => {
      req.params.id = 'project123';

      const project = {
        _id: 'project123',
        projectName: 'P',
        assignedEmployees: [],
        organization: 'org123'
      };
      Project.findById.mockReturnValue(createPopulateQuery(project));

      teamAnalysisOrchestrator.suggestComplementary.mockResolvedValue({
        suggestions: [],
        suggestionsSummary: {},
        suggestionsMetadata: {},
        synergyValidation: [],
        projectedTeamSynergy: {},
        risks: [],
        message: 'No suggestions'
      });
      teamAnalysisOrchestrator.scoreAvailableEmployees.mockResolvedValue({
        availableEmployees: [],
        count: 0
      });

      await projectController.getTeamAnalysis(req, res);

      expect(teamAnalysisOrchestrator.suggestComplementary).toHaveBeenCalledWith(
        project,
        'org123',
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should include current team analysis', async () => {
      req.params.id = 'project123';

      const project = {
        _id: 'project123',
        projectName: 'P',
        teamSize: 2,
        mainTechnologies: ['Node.js'],
        assignedEmployees: [{ user: { _id: 'u1' } }],
        organization: { _id: 'org123', name: 'Org' }
      };
      Project.findById.mockReturnValue(createPopulateQuery(project));

      teamAnalysisOrchestrator.analyzeCurrentTeam.mockResolvedValue({
        teamMembers: [{ userId: 'u1', name: 'A', score: 10 }],
        teamSummary: { summary: true },
        synergy: { synergy: true }
      });
      teamAnalysisOrchestrator.suggestComplementary.mockResolvedValue({
        suggestions: [],
        suggestionsSummary: {},
        suggestionsMetadata: {},
        synergyValidation: [],
        projectedTeamSynergy: {},
        risks: [],
        message: 'Equipo actual: 1 miembros'
      });
      teamAnalysisOrchestrator.scoreAvailableEmployees.mockResolvedValue({
        availableEmployees: [],
        count: 0
      });

      await projectController.getTeamAnalysis(req, res);

      expect(teamAnalysisOrchestrator.analyzeCurrentTeam).toHaveBeenCalledWith(
        project,
        'org123',
        expect.any(String)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      const payload = res.json.mock.calls[0][0];
      expect(payload.data.currentTeam).toHaveLength(1);
      expect(payload.data.message).toContain('Equipo actual:');
    });
  });

  describe('getTeamSynergy', () => {
    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery(null));

      await projectController.getTeamSynergy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when no assigned members', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        projectName: 'P',
        assignedEmployees: []
      }));

      await projectController.getTeamSynergy(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Project has no assigned team members'
      });
    });

    it('should return synergy analysis successfully', async () => {
      req.params.id = 'project123';
      req.query.refresh = 'true';

      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        projectName: 'P',
        assignedEmployees: [{ user: { _id: 'u1' } }],
        synergyCache: { lastCalculatedAt: null }
      }));

      teamSynergyService.getCachedOrCalculate.mockResolvedValue({ synergy: true });
      personalityOptimizer.generateHiringRecommendations.mockResolvedValue([{ role: 'Dev' }]);

      await projectController.getTeamSynergy(req, res);

      expect(teamSynergyService.getCachedOrCalculate).toHaveBeenCalledWith('project123', true);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            synergy: { synergy: true },
            hiringRecommendations: [{ role: 'Dev' }],
            cached: false
          })
        })
      );
    });

    it('should set cached=true when refresh is not forced and cache exists', async () => {
      req.params.id = 'project123';
      req.query = {};

      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        projectName: 'P',
        assignedEmployees: [{ user: { _id: 'u1' } }],
        synergyCache: { lastCalculatedAt: new Date().toISOString() }
      }));

      teamSynergyService.getCachedOrCalculate.mockResolvedValue({ synergy: true });
      personalityOptimizer.generateHiringRecommendations.mockResolvedValue([]);

      await projectController.getTeamSynergy(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload.data.cached).toBe(true);
    });
  });

  describe('getTeamConfig', () => {
    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery(null));

      await projectController.getTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when user is not project manager', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        projectName: 'P',
        isProjectManager: jest.fn().mockReturnValue(false)
      }));

      await projectController.getTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only project manager can perform this action'
      });
    });

    it('should return config successfully', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        projectName: 'P',
        isProjectManager: jest.fn().mockReturnValue(true),
        teamSelectionConfig: { phase1: { enabled: true } }
      }));

      await projectController.getTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            projectId: 'project123',
            projectName: 'P'
          })
        })
      );
    });
  });

  describe('updateTeamConfig', () => {
    it('should update config successfully', async () => {
      req.params.id = 'project123';
      req.body = { phase1: { enabled: true } };

      const project = {
        _id: 'project123',
        isProjectManager: jest.fn().mockReturnValue(true)
      };
      Project.findById.mockReturnValue(createPopulateQuery(project));
      Project.findByIdAndUpdate.mockReturnValue(createPopulateQuery(project));

      await projectController.updateTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      req.body = { phase1: { enabled: true } };
      Project.findById.mockReturnValue(createPopulateQuery(null));

      await projectController.updateTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when user is not project manager', async () => {
      req.params.id = 'project123';
      req.body = { phase1: { enabled: true } };
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        isProjectManager: jest.fn().mockReturnValue(false)
      }));

      await projectController.updateTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 400 when configuration is invalid', async () => {
      req.params.id = 'project123';
      req.body = { phase1: { enabled: true } };
      teamSelectionDefaults.validateTeamSelectionConfig.mockReturnValueOnce({
        valid: false,
        errors: ['bad']
      });

      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        isProjectManager: jest.fn().mockReturnValue(true)
      }));

      await projectController.updateTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid configuration',
          validationErrors: ['bad']
        })
      );
    });
  });

  describe('resetTeamConfig', () => {
    it('should reset config to defaults', async () => {
      req.params.id = 'project123';
      const project = {
        _id: 'project123',
        isProjectManager: jest.fn().mockReturnValue(true)
      };
      Project.findById.mockReturnValue(createPopulateQuery(project));
      Project.findByIdAndUpdate.mockReturnValue(createPopulateQuery(project));

      await projectController.resetTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ config: expect.any(Object) })
        })
      );
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery(null));

      await projectController.resetTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when user is not project manager', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        isProjectManager: jest.fn().mockReturnValue(false)
      }));

      await projectController.resetTeamConfig(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getTeamConfigSummary', () => {
    it('should return summary successfully', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        isProjectManager: jest.fn().mockReturnValue(true)
      }));

      await projectController.getTeamConfigSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { summary: true }
      });
    });

    it('should return 404 when project not found', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery(null));

      await projectController.getTeamConfigSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when user is not project manager', async () => {
      req.params.id = 'project123';
      Project.findById.mockReturnValue(createPopulateQuery({
        _id: 'project123',
        isProjectManager: jest.fn().mockReturnValue(false)
      }));

      await projectController.getTeamConfigSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('validateTeamConfigEndpoint', () => {
    it('should return valid config response when valid', async () => {
      req.body = { phase1: { enabled: true } };

      await projectController.validateTeamConfigEndpoint(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        valid: true,
        message: 'Configuration is valid'
      });
    });

    it('should return invalid config response when invalid', async () => {
      req.body = { phase1: { enabled: true } };
      teamSelectionDefaults.validateTeamSelectionConfig.mockReturnValueOnce({
        valid: false,
        errors: ['invalid']
      });

      await projectController.validateTeamConfigEndpoint(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        valid: false,
        errors: ['invalid']
      });
    });
  });
});
