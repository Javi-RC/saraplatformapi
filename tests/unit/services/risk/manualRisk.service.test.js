const manualRiskService = require('../../../../src/services/risk/manualRisk.service');

jest.mock('../../../../src/repositories', () => ({
  projectRepository: {
    findById: jest.fn(),
    updateById: jest.fn()
  },
  riskRepository: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteById: jest.fn(),
    updateById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    getAggregatePipeline: jest.fn()
  }
}));

const { projectRepository, riskRepository } = require('../../../../src/repositories');

describe('ManualRiskService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addManualRisk', () => {
    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        manualRiskService.addManualRisk('project-123', {}, 'user-123')
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if user is not project manager', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'other-user' },
        organization: { _id: 'org-123' }
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        manualRiskService.addManualRisk('project-123', {}, 'user-123')
      ).rejects.toThrow('Not authorized');
    });

    it('should throw error if missing required fields', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        organization: { _id: 'org-123' }
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        manualRiskService.addManualRisk('project-123', { type: 'tech_debt' }, 'user-123')
      ).rejects.toThrow('Missing required fields');
    });

    it('should throw error if similarity out of range', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        organization: { _id: 'org-123' }
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      const riskData = {
        type: 'tech_debt',
        title: 'Test Risk',
        description: 'Test Description',
        similarity: 1.5
      };

      await expect(
        manualRiskService.addManualRisk('project-123', riskData, 'user-123')
      ).rejects.toThrow('Similarity must be between 0 and 1');
    });

    it('should successfully create manual risk', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        organization: { _id: 'org-123' },
        riskPredictions: []
      };

      const mockRisk = {
        _id: 'risk-123'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.create.mockResolvedValue(mockRisk);

      const riskData = {
        type: 'tech_debt',
        title: 'Technical Debt Risk',
        description: 'Accumulated technical debt',
        severity: 'high',
        category: 'technical'
      };

      const result = await manualRiskService.addManualRisk('project-123', riskData, 'user-123');

      expect(result).toBe(mockRisk);
      expect(riskRepository.create).toHaveBeenCalled();
      expect(projectRepository.updateById).toHaveBeenCalledWith('project-123', { $push: { riskPredictions: 'risk-123' } });
    });

    it('should not duplicate risk in project riskPredictions', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        organization: { _id: 'org-123' },
        riskPredictions: ['risk-123']
      };

      const mockRisk = {
        _id: 'risk-123'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.create.mockResolvedValue(mockRisk);

      const riskData = {
        type: 'budget_overrun',
        title: 'Budget Risk',
        description: 'Possible budget overrun'
      };

      await manualRiskService.addManualRisk('project-123', riskData, 'user-123');

      expect(projectRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe('updateRisk', () => {
    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        manualRiskService.updateRisk('project-123', 'risk-123', {}, 'user-123')
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if user is not project manager', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'other-user' }
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        manualRiskService.updateRisk('project-123', 'risk-123', {}, 'user-123')
      ).rejects.toThrow('Not authorized');
    });

    it('should throw error if risk not found', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' }
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(null);

      await expect(
        manualRiskService.updateRisk('project-123', 'risk-123', {}, 'user-123')
      ).rejects.toThrow('Risk not found');
    });

    it('should throw error if risk does not belong to project', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' }
      };

      const mockRisk = {
        _id: 'risk-123',
        project: 'other-project'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(mockRisk);

      await expect(
        manualRiskService.updateRisk('project-123', 'risk-123', {}, 'user-123')
      ).rejects.toThrow('Risk does not belong to this project');
    });

    it('should update basic fields for active project', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'active'
      };

      const mockRisk = {
        _id: 'risk-123',
        project: 'project-123',
        title: 'Old Title'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(mockRisk);
      riskRepository.updateById.mockImplementation((id, data) => Promise.resolve({ ...mockRisk, ...data }));

      const updates = {
        title: 'New Title',
        description: 'New Description',
        severity: 'high'
      };

      const result = await manualRiskService.updateRisk('project-123', 'risk-123', updates, 'user-123');

      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New Description');
      expect(result.severity).toBe('high');
      expect(riskRepository.updateById).toHaveBeenCalled();
    });

    it('should allow marking occurred for completed project', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'completed'
      };

      const mockRisk = {
        _id: 'risk-123',
        project: 'project-123'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(mockRisk);
      riskRepository.updateById.mockImplementation((id, data) => Promise.resolve({ ...mockRisk, ...data }));

      const updates = { occurred: true };

      const result = await manualRiskService.updateRisk('project-123', 'risk-123', updates, 'user-123');

      expect(result.occurred).toBe(true);
      expect(result.status).toBe('occurred');
      expect(riskRepository.updateById).toHaveBeenCalled();
    });

    it('should set status to avoided when occurred is false', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'completed'
      };

      const mockRisk = {
        _id: 'risk-123',
        project: 'project-123'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(mockRisk);
      riskRepository.updateById.mockImplementation((id, data) => Promise.resolve({ ...mockRisk, ...data }));

      const updates = { occurred: false };

      const result = await manualRiskService.updateRisk('project-123', 'risk-123', updates, 'user-123');

      expect(result.occurred).toBe(false);
      expect(result.status).toBe('avoided');
    });
  });

  describe('getProjectManualRisks', () => {
    it('should return all manual risks for a project', async () => {
      const mockRisks = [
        { _id: 'risk-1', source: 'manual', title: 'Risk 1' },
        { _id: 'risk-2', source: 'manual', title: 'Risk 2' }
      ];

      riskRepository.find.mockResolvedValue(mockRisks);

      const result = await manualRiskService.getProjectManualRisks('project-123');

      expect(result).toEqual(mockRisks);
      expect(riskRepository.find).toHaveBeenCalledWith({
        project: 'project-123',
        source: 'manual'
      }, { sort: { createdAt: -1 } });
    });

    it('should return empty array if no manual risks', async () => {
      riskRepository.find.mockResolvedValue([]);

      const result = await manualRiskService.getProjectManualRisks('project-123');

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      riskRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(
        manualRiskService.getProjectManualRisks('project-123')
      ).rejects.toThrow('Failed to get manual risks');
    });
  });

  describe('deleteManualRisk', () => {
    it('should throw error if project not found', async () => {
      projectRepository.findById.mockResolvedValue(null);

      await expect(
        manualRiskService.deleteManualRisk('project-123', 'risk-123', 'user-123')
      ).rejects.toThrow('Project not found');
    });

    it('should throw error if user is not project manager', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'other-user' }
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        manualRiskService.deleteManualRisk('project-123', 'risk-123', 'user-123')
      ).rejects.toThrow('Not authorized');
    });

    it('should throw error if project is completed', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'completed'
      };

      projectRepository.findById.mockResolvedValue(mockProject);

      await expect(
        manualRiskService.deleteManualRisk('project-123', 'risk-123', 'user-123')
      ).rejects.toThrow('Cannot delete risks from completed projects');
    });

    it('should throw error if risk not found', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'active'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(null);

      await expect(
        manualRiskService.deleteManualRisk('project-123', 'risk-123', 'user-123')
      ).rejects.toThrow('Risk not found');
    });

    it('should throw error if risk does not belong to project', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'active'
      };

      const mockRisk = {
        _id: 'risk-123',
        project: 'other-project',
        source: 'manual'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(mockRisk);

      await expect(
        manualRiskService.deleteManualRisk('project-123', 'risk-123', 'user-123')
      ).rejects.toThrow('Risk does not belong to this project');
    });

    it('should throw error if risk is not manual', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'active'
      };

      const mockRisk = {
        _id: 'risk-123',
        project: 'project-123',
        source: 'predicted'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(mockRisk);

      await expect(
        manualRiskService.deleteManualRisk('project-123', 'risk-123', 'user-123')
      ).rejects.toThrow('Can only delete manually added risks');
    });

    it('should successfully delete manual risk', async () => {
      const mockProject = {
        _id: 'project-123',
        projectManager: { _id: 'user-123' },
        status: 'active',
        riskPredictions: ['risk-123', 'risk-456']
      };

      const mockRisk = {
        _id: 'risk-123',
        project: 'project-123',
        source: 'manual'
      };

      projectRepository.findById.mockResolvedValue(mockProject);
      riskRepository.findById.mockResolvedValue(mockRisk);
      riskRepository.deleteById.mockResolvedValue();

      const result = await manualRiskService.deleteManualRisk('project-123', 'risk-123', 'user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Risk deleted successfully');
      expect(projectRepository.updateById).toHaveBeenCalledWith('project-123', { riskPredictions: ['risk-456'] });
      expect(riskRepository.deleteById).toHaveBeenCalledWith('risk-123');
    });
  });
});
