const projectService = require('../services/core/project.service');
const { validationResult } = require('express-validator');
const { 
  getTeamSelectionConfig, 
  getConfigSection,
  validateTeamSelectionConfig, 
  getConfigurationSummary,
  DEFAULT_TEAM_SELECTION_CONFIG 
} = require('../config/teamSelectionDefaults');
const { projectRepository, cvRepository } = require('../repositories');
const { getLanguageFromRequest, translateSynergyObject, translateHiringRecommendations } = require('../i18n/i18n.service');
const teamSelectionService = require('../services/team/teamSelection.service');
const teamSynergyService = require('../services/team/teamSynergy.service');
const personalityOptimizer = require('../services/team/personalityOptimizer.service');
const teamAnalysisService = require('../services/team/teamAnalysis.service');
const teamAnalysisOrchestrator = require('../services/team/teamAnalysisOrchestrator.service');

const { handleErrorCatch } = require('../utils/errorHelper');
const AppError = require('../utils/AppError');

/**
 * Project Controller
 * Handles HTTP requests related to projects
 * Following SOLID principles: Single Responsibility
 */
class ProjectController {
  async _getProjectAndVerifyPM(projectId, userId) {
    const project = await projectRepository.findById(projectId, {
      populate: [
        { path: 'assignedEmployees.user', select: 'name email avatar' },
        { path: 'organization', select: 'name' }
      ]
    });
    if (!project) {
      throw new AppError('PROJECT_NOT_FOUND', 404, 'Project not found');
    }
    if (!project.isProjectManager(userId)) {
      throw new AppError('NOT_PROJECT_MANAGER', 403, 'Only project manager can perform this action');
    }
    return project;
  }

  async _updateConfigSection(req, res, sectionName, { deepMergeKeys = [], preProcess, validateFn = validateTeamSelectionConfig } = {}) {
    try {
      const { id } = req.params;
      const project = await this._getProjectAndVerifyPM(id, req.user.id);

      if (!project.teamSelectionConfig) {
        project.teamSelectionConfig = { ...DEFAULT_TEAM_SELECTION_CONFIG };
      }
      if (!project.teamSelectionConfig[sectionName]) {
        project.teamSelectionConfig[sectionName] = { ...DEFAULT_TEAM_SELECTION_CONFIG[sectionName] };
      }

      const currentSection = project.teamSelectionConfig[sectionName];
      let updates = req.body;
      if (preProcess) {
        updates = preProcess(updates);
      }

      const merged = {
        ...DEFAULT_TEAM_SELECTION_CONFIG[sectionName],
        ...currentSection,
        ...updates
      };

      for (const key of deepMergeKeys) {
        if (updates[key]) {
          merged[key] = {
            ...(currentSection[key] || DEFAULT_TEAM_SELECTION_CONFIG[sectionName][key]),
            ...updates[key]
          };
        }
      }

      const validation = validateFn({ ...project.teamSelectionConfig, [sectionName]: merged });
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration after update',
          validationErrors: validation.errors
        });
      }

      await projectRepository.updateById(id, { [`teamSelectionConfig.${sectionName}`]: merged });

      const displayNames = { phase1: 'Phase 1', phase2: 'Phase 2', cbr: 'CBR', decisionTree: 'Decision Tree' };
      const displayName = displayNames[sectionName] || sectionName;

      return res.status(200).json({
        success: true,
        message: `${displayName} configuration updated successfully`,
        data: {
          [sectionName]: merged
        }
      });
    } catch (error) {
      console.error('Error updating %s config:', sectionName, error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Create a new project
   * POST /api/projects
   */
  async createProject(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const projectData = req.body;
      const projectManagerId = req.user.id;
      const { organizationId } = req.body;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required'
        });
      }

      const project = await projectService.createProject(
        projectData,
        projectManagerId,
        organizationId
      );

      return res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
      });
    } catch (error) {
      console.error('Error creating project:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get a project by ID
   * GET /api/projects/:id
   */
  async getProject(req, res) {
    try {
      const { id } = req.params;
      const includeAssignedEmployees = req.query.includeEmployees === 'true';

      const project = await projectService.getProjectById(
        id,
        includeAssignedEmployees
      );

      return res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Error getting project:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Update a project
   * PUT /api/projects/:id
   */
  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const project = await projectService.updateProject(id, updateData, userId);

      return res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project
      });
    } catch (error) {
      console.error('Error updating project:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await projectService.deleteProject(id, userId);

      return res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get all projects for an organization
   * GET /api/organizations/:organizationId/projects
   */
  async getOrganizationProjects(req, res) {
    try {
      const { organizationId } = req.params;
      const filters = {
        status: req.query.status,
        projectManager: req.query.projectManager,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await projectService.getProjectsByOrganization(
        organizationId,
        filters
      );

      return res.status(200).json({
        success: true,
        ...result.pagination ? { pagination: result.pagination } : {},
        count: result.data.length,
        data: result.data
      });
    } catch (error) {
      console.error('Error getting organization projects:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get all projects managed by current user
   * GET /api/projects/my-projects
   */
  async getMyProjects(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        organizationId: req.query.organizationId
      };

      const projects = await projectService.getProjectsByManager(userId, filters);

      return res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (error) {
      console.error('Error getting user projects:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get all projects where current user is assigned
   * GET /api/projects/assigned-to-me
   */
  async getAssignedProjects(req, res) {
    try {
      const userId = req.user.id;

      const projects = await projectService.getProjectsByAssignedEmployee(userId);

      return res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (error) {
      console.error('Error getting assigned projects:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Assign an employee to a project
   * POST /api/projects/:id/assign
   */
  async assignEmployee(req, res) {
    try {
      const { id } = req.params;
      const { employeeId, assignedRole } = req.body;
      const requesterId = req.user.id;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID is required'
        });
      }

      const project = await projectService.assignEmployeeToProject(
        id,
        employeeId,
        assignedRole || '',
        requesterId
      );

      return res.status(200).json({
        success: true,
        message: 'Employee assigned successfully',
        data: project
      });
    } catch (error) {
      console.error('Error assigning employee:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Remove an employee from a project
   * DELETE /api/projects/:id/employees/:employeeId
   */
  async removeEmployee(req, res) {
    try {
      const { id, employeeId } = req.params;
      const requesterId = req.user.id;

      const project = await projectService.removeEmployeeFromProject(
        id,
        employeeId,
        requesterId
      );

      return res.status(200).json({
        success: true,
        message: 'Employee removed successfully',
        data: project
      });
    } catch (error) {
      console.error('Error removing employee:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Activate a project
   * PATCH /api/projects/:id/activate
   */
  async activateProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await projectService.activateProject(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Project activated successfully',
        data: project
      });
    } catch (error) {
      console.error('Error activating project:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Complete a project
   * PATCH /api/projects/:id/complete
   */
  async completeProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await projectService.completeProject(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Project completed successfully',
        data: project
      });
    } catch (error) {
      console.error('Error completing project:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Cancel a project
   * PATCH /api/projects/:id/cancel
   */
  async cancelProject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const project = await projectService.cancelProject(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Project cancelled successfully',
        data: project
      });
    } catch (error) {
      console.error('Error cancelling project:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get project statistics for an organization
   * GET /api/organizations/:organizationId/projects/statistics
   */
  async getProjectStatistics(req, res) {
    try {
      const { organizationId } = req.params;

      const statistics = await projectService.getProjectStatistics(organizationId);

      return res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error getting project statistics:', error);
      return handleErrorCatch(error, res);
    }
  }
  /**
   * Get optimal team for a project based on Manhattan distance
   * Enhanced with personality-based optimization
   * POST /api/projects/suggest-team
   */
  async suggestTeam(req, res) {
    try {
      const { 
        projectRequirements, 
        organizationId, 
        teamSize = 5,
        enablePersonalityOptimization = true 
      } = req.body;

      if (!projectRequirements || !organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Project requirements and organization ID are required'
        });
      }

      const result = await teamSelectionService.selectOptimalTeam(
        projectRequirements,
        organizationId,
        teamSize,
        enablePersonalityOptimization
      );

      const summary = teamSelectionService.getTeamSummary(result.team, result.metadata);
      const risks = teamSelectionService.generateTeamRisks(result.metadata, summary, projectRequirements);

      return res.status(200).json({
        success: true,
        data: {
          team: result.team,
          summary,
          metadata: result.metadata,
          synergy: result.synergy || undefined,
          optimization: result.optimization || undefined,
          risks: risks.length > 0 ? risks : undefined
        }
      });
    } catch (error) {
      console.error('Error suggesting team:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get team analysis for a specific project
   * GET /api/projects/:id/team-analysis
   * 
   * Devuelve:
   * - Análisis del equipo actual (si existe)
   * - Sugerencias complementarias para completar el equipo
   * - Permite construir el equipo gradualmente, uno por uno
   */
  async getTeamAnalysis(req, res) {
    try {
      const { id } = req.params;
      const lang = getLanguageFromRequest(req);

      const project = await projectRepository.findById(id, {
        populate: [
          { path: 'assignedEmployees.user', select: 'name email avatar' },
          { path: 'organization', select: 'name' }
        ]
      });

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (!project.organization) {
        return res.status(400).json({ success: false, error: 'Project organization not found' });
      }

      const organizationId = project.organization._id || project.organization;
      const currentTeamSize = project.assignedEmployees?.length || 0;
      const targetTeamSize = project.teamSize || 5;
      const remainingSlots = Math.max(0, targetTeamSize - currentTeamSize);

      const response = {
        success: true,
        data: {
          project: {
            id: project._id,
            name: project.projectName,
            mainTechnologies: project.mainTechnologies,
            requiredExperienceLevel: project.requiredExperienceLevel,
            teamSize: targetTeamSize
          },
          teamStatus: {
            currentSize: currentTeamSize,
            targetSize: targetTeamSize,
            remainingSlots,
            isComplete: currentTeamSize >= targetTeamSize
          }
        }
      };

      if (currentTeamSize > 0) {
        const currentTeamResult = await teamAnalysisOrchestrator.analyzeCurrentTeam(project, organizationId, lang);
        response.data.currentTeam = currentTeamResult.teamMembers;
        response.data.currentTeamSummary = currentTeamResult.teamSummary;
        response.data.currentTeamSynergy = currentTeamResult.synergy;
      }

      let suggestionsResult = null;
      if (remainingSlots > 0) {
        suggestionsResult = await teamAnalysisOrchestrator.suggestComplementary(project, organizationId, lang);
        if (suggestionsResult) {
          response.data.suggestions = suggestionsResult.suggestions;
          response.data.suggestionsSummary = suggestionsResult.suggestionsSummary;
          response.data.suggestionsMetadata = suggestionsResult.suggestionsMetadata;
          response.data.synergyValidation = suggestionsResult.synergyValidation;
          response.data.projectedTeamSynergy = suggestionsResult.projectedTeamSynergy;
          if (suggestionsResult.risks.length > 0) {
            response.data.risks = suggestionsResult.risks;
          }
          response.data.message = suggestionsResult.message;
        }
      } else {
        response.data.message = 'The team is complete.';
      }

      const suggestionUserIds = suggestionsResult?.suggestions?.map(s => s.userId.toString()) || [];
      const availableResult = await teamAnalysisOrchestrator.scoreAvailableEmployees(project, organizationId, suggestionUserIds, lang);
      response.data.availableEmployees = availableResult.availableEmployees;
      response.data.availableEmployeesCount = availableResult.count;

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error analyzing team:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get detailed personality synergy analysis for a project team
   * GET /api/projects/:id/team-synergy
   * OPTIMIZED: Uses cache for better performance
   */
  async getTeamSynergy(req, res) {
    try {
      const { id } = req.params;
      const { refresh } = req.query; // Optional query param to force refresh

      const project = await projectRepository.findById(id, {
        populate: [
          { path: 'assignedEmployees.user', select: 'name email avatar' },
          { path: 'organization', select: 'name' }
        ]
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      if (!project.assignedEmployees || project.assignedEmployees.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Project has no assigned team members'
        });
      }

      // OPTIMIZATION: Use cached synergy or calculate (lazy loading)
      const forceRefresh = refresh === 'true';
      const rawSynergyAnalysis = await teamSynergyService.getCachedOrCalculate(id, forceRefresh);
      const lang = getLanguageFromRequest(req);
      const synergyAnalysis = translateSynergyObject(rawSynergyAnalysis, lang);

      // Get hiring recommendations (still computed on demand)
      const rawHiringRecommendations = await personalityOptimizer.generateHiringRecommendations(
        project.assignedEmployees,
        {
          projectType: project.projectType,
          requiredExperienceLevel: project.requiredExperienceLevel,
          expectedDuration: project.expectedDuration,
          isInnovative: project.isInnovative,
          isMaintenance: project.isMaintenance
        }
      );
      const hiringRecommendations = translateHiringRecommendations(rawHiringRecommendations, lang);

      return res.status(200).json({
        success: true,
        data: {
          project: {
            id: project._id,
            name: project.projectName,
            teamSize: project.assignedEmployees.length
          },
          synergy: synergyAnalysis,
          hiringRecommendations,
          cached: !forceRefresh && !!project.synergyCache?.lastCalculatedAt
        }
      });
    } catch (error) {
      console.error('Error getting team synergy:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get team selection configuration
   * GET /api/projects/:id/team-config
   */
  async getTeamConfig(req, res) {
    try {
      const { id } = req.params;
      const project = await this._getProjectAndVerifyPM(id, req.user.id);
      
      const config = getTeamSelectionConfig(project);
      
      return res.status(200).json({
        success: true,
        data: {
          projectId: project._id,
          projectName: project.projectName,
          config,
          isCustom: !!project.teamSelectionConfig,
          defaults: DEFAULT_TEAM_SELECTION_CONFIG
        }
      });
    } catch (error) {
      console.error('Error getting team config:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Update complete team selection configuration
   * PUT /api/projects/:id/team-config
   */
  async updateTeamConfig(req, res) {
    try {
      const { id } = req.params;
      const project = await this._getProjectAndVerifyPM(id, req.user.id);
      
      // Validate configuration
      const validation = validateTeamSelectionConfig(req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid configuration', 
          validationErrors: validation.errors 
        });
      }
      
      // Update configuration
      await projectRepository.updateById(id, { teamSelectionConfig: req.body });
      
      return res.status(200).json({
        success: true,
        message: 'Team selection configuration updated successfully',
        data: {
          config: req.body
        }
      });
    } catch (error) {
      console.error('Error updating team config:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Update Phase 1 configuration only
   * PATCH /api/projects/:id/team-config/phase1
   */
  async updatePhase1Config(req, res) {
    return this._updateConfigSection(req, res, 'phase1', {
      deepMergeKeys: ['availabilityComponents', 'complexityFactors']
    });
  }

  /**
   * Update Phase 2 configuration only
   * PATCH /api/projects/:id/team-config/phase2
   */
  async updatePhase2Config(req, res) {
    return this._updateConfigSection(req, res, 'phase2', {
      deepMergeKeys: ['synergyWeights', 'projectProfiles']
    });
  }

  /**
   * Update CBR configuration only
   * PATCH /api/projects/:id/team-config/cbr
   */
  async updateCBRConfig(req, res) {
    return this._updateConfigSection(req, res, 'cbr', {
      deepMergeKeys: ['dimensionWeights']
    });
  }

  /**
   * Update Decision Tree configuration only
   * PATCH /api/projects/:id/team-config/decision-tree
   */
  async updateDecisionTreeConfig(req, res) {
    const normalizeRatio = (rawValue) => {
      const numericValue = typeof rawValue === 'string' ? Number(rawValue) : rawValue;
      if (!Number.isFinite(numericValue)) return rawValue;
      if (numericValue > 1 && numericValue <= 100) return numericValue / 100;
      return numericValue;
    };

    const ratioThresholdKeys = new Set([
      'skillGapCritical', 'skillGapMajor', 'maxJuniorRatio',
      'keyPersonDependencyThreshold', 'backupCoverageRequired', 'documentationComplianceThreshold',
      'remoteWorkPercentageThreshold', 'newMembersPercentageThreshold', 'remoteWorkPercentageForIsolation'
    ]);

    return this._updateConfigSection(req, res, 'decisionTree', {
      deepMergeKeys: ['riskThresholds', 'personalityRiskThresholds'],
      preProcess: (updates) => {
        const normalized = { ...updates };
        if (updates?.riskThresholds && typeof updates.riskThresholds === 'object') {
          const normalizedRiskThresholds = { ...updates.riskThresholds };
          Object.keys(normalizedRiskThresholds).forEach((key) => {
            if (!ratioThresholdKeys.has(key)) return;
            normalizedRiskThresholds[key] = normalizeRatio(normalizedRiskThresholds[key]);
          });
          normalized.riskThresholds = normalizedRiskThresholds;
        }
        return normalized;
      }
    });
  }

  /**
   * Reset configuration to defaults
   * POST /api/projects/:id/team-config/reset
   */
  async resetTeamConfig(req, res) {
    try {
      const { id } = req.params;
      await this._getProjectAndVerifyPM(id, req.user.id);
      
      // Remove custom configuration
      await projectRepository.updateById(id, { $unset: { teamSelectionConfig: '' } });
      
      return res.status(200).json({
        success: true,
        message: 'Configuration reset to defaults successfully',
        data: {
          config: DEFAULT_TEAM_SELECTION_CONFIG
        }
      });
    } catch (error) {
      console.error('Error resetting team config:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get configuration summary (human-readable)
   * GET /api/projects/:id/team-config/summary
   */
  async getTeamConfigSummary(req, res) {
    try {
      const { id } = req.params;
      const project = await this._getProjectAndVerifyPM(id, req.user.id);
      
      const summary = getConfigurationSummary(project);
      
      return res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting config summary:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Get candidate pool size configuration
   * GET /api/projects/:id/candidate-pool-size
   * 
   * Returns the current candidatePoolMultiplier and the effective top N
   * Accessible by project manager or organization admin
   */
  async getCandidatePoolSize(req, res) {
    try {
      const { id } = req.params;
      const project = await projectRepository.findById(id, { populate: 'organization' });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const isPM = project.isProjectManager(req.user.id);
      const isOrgAdmin = project.organization?.isAdmin?.(req.user.id) || false;

      if (!isPM && !isOrgAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager or organization admin can view this configuration'
        });
      }

      const phase1Config = getConfigSection(project, 'phase1');
      const multiplier = phase1Config.candidatePoolMultiplier;
      const teamSize = project.teamSize || 5;

      return res.status(200).json({
        success: true,
        data: {
          projectId: project._id,
          projectName: project.projectName,
          teamSize,
          candidatePoolMultiplier: multiplier,
          effectiveTopN: teamSize * multiplier,
          description: `De los empleados evaluados en la Fase 1, se seleccionan los ${teamSize * multiplier} mejores (teamSize ${teamSize} × multiplicador ${multiplier}) para pasar a la Fase 2 de optimización por personalidad.`
        }
      });
    } catch (error) {
      console.error('Error getting candidate pool size:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Update candidate pool size (Top N) for team selection
   * PATCH /api/projects/:id/candidate-pool-size
   * 
   * Sets how many top candidates from Phase 1 pass to Phase 2
   * Body: { candidatePoolMultiplier: number }
   * Accessible by project manager or organization admin
   */
  async updateCandidatePoolSize(req, res) {
    try {
      const { id } = req.params;
      const { candidatePoolMultiplier } = req.body;
      const project = await projectRepository.findById(id, { populate: 'organization' });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const isPM = project.isProjectManager(req.user.id);
      const isOrgAdmin = project.organization?.isAdmin?.(req.user.id) || false;

      if (!isPM && !isOrgAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager or organization admin can modify this configuration'
        });
      }

      if (candidatePoolMultiplier == null) {
        return res.status(400).json({
          success: false,
          error: 'candidatePoolMultiplier is required'
        });
      }

      const multiplier = Number(candidatePoolMultiplier);
      if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 10) {
        return res.status(400).json({
          success: false,
          error: 'candidatePoolMultiplier must be a number between 1 and 10'
        });
      }

      // Ensure teamSelectionConfig and phase1 exist
      if (!project.teamSelectionConfig) {
        project.teamSelectionConfig = { ...DEFAULT_TEAM_SELECTION_CONFIG };
      }
      if (!project.teamSelectionConfig.phase1) {
        project.teamSelectionConfig.phase1 = { ...DEFAULT_TEAM_SELECTION_CONFIG.phase1 };
      }

      await projectRepository.updateById(id, { 'teamSelectionConfig.phase1.candidatePoolMultiplier': multiplier });

      const teamSize = project.teamSize || 5;

      return res.status(200).json({
        success: true,
        message: `Candidate pool size updated. Top ${teamSize * multiplier} candidates will advance to Phase 2.`,
        data: {
          candidatePoolMultiplier: multiplier,
          teamSize,
          effectiveTopN: teamSize * multiplier,
          description: `De los empleados evaluados en la Fase 1, se seleccionan los ${teamSize * multiplier} mejores (teamSize ${teamSize} × multiplicador ${multiplier}) para pasar a la Fase 2 de optimización por personalidad.`
        }
      });
    } catch (error) {
      console.error('Error updating candidate pool size:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Validate a proposed configuration
   * POST /api/projects/:id/team-config/validate
   */
  async validateTeamConfigEndpoint(req, res) {
    try {
      const validation = validateTeamSelectionConfig(req.body);
      
      if (validation.valid) {
        return res.status(200).json({
          success: true,
          valid: true,
          message: 'Configuration is valid'
        });
      } else {
        return res.status(400).json({
          success: false,
          valid: false,
          errors: validation.errors
        });
      }
    } catch (error) {
      console.error('Error validating config:', error);
      return handleErrorCatch(error, res);
    }
  }}

module.exports = new ProjectController();