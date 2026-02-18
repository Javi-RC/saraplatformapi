const projectService = require('../services/project.service');
const { validationResult } = require('express-validator');
const { 
  getTeamSelectionConfig, 
  getConfigSection,
  validateTeamSelectionConfig, 
  getConfigurationSummary,
  DEFAULT_TEAM_SELECTION_CONFIG 
} = require('../config/teamSelectionDefaults');
const Project = require('../models/project.model');
const { toStableBfi44Profile } = require('../utils/bfi44ProfileMapper');
const { getLanguageFromRequest, translateSynergyObject, translateSynergyValidation, translateSynergyValidations, translateHiringRecommendations } = require('../i18n/i18n.service');

/**
 * Project Controller
 * Handles HTTP requests related to projects
 * Following SOLID principles: Single Responsibility
 */
class ProjectController {
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
      
      let statusCode = 400;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('not authorized')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      const statusCode = error.message.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 400;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('permission')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 400;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('administrators')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
        projectManager: req.query.projectManager
      };

      const projects = await projectService.getProjectsByOrganization(
        organizationId,
        filters
      );

      return res.status(200).json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (error) {
      console.error('Error getting organization projects:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
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
      return res.status(400).json({
        success: false,
        error: error.message
      });
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
      return res.status(400).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 400;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('permission')) {
        statusCode = 403;
      } else if (error.message.includes('already assigned')) {
        statusCode = 409;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 400;
      if (error.message.includes('not found') || error.message.includes('not assigned')) {
        statusCode = 404;
      } else if (error.message.includes('permission')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 400;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('permission')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 400;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('permission')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      
      let statusCode = 400;
      if (error.message.includes('not found')) {
        statusCode = 404;
      } else if (error.message.includes('administrators')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
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
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  /**
   * Get optimal team for a project based on Manhattan distance
   * Enhanced with personality-based optimization
   * POST /api/projects/suggest-team
   */
  async suggestTeam(req, res) {
    try {
      const teamSelectionService = require('../services/teamSelection.service');
      
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
      return res.status(400).json({
        success: false,
        error: error.message
      });
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
      const teamSelectionService = require('../services/teamSelection.service');
      const teamSynergyService = require('../services/teamSynergy.service');
      const Project = require('../models/project.model');
      const CV = require('../models/cv.model');
      const BFI44 = require('../models/bfi44.model');
      
      const { id } = req.params;

      const project = await Project.findById(id)
        .populate('assignedEmployees.user', 'name email avatar')
        .populate('organization', 'name');

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      // Ensure organization is populated
      if (!project.organization) {
        return res.status(400).json({
          success: false,
          error: 'Project organization not found'
        });
      }

      const organizationId = project.organization._id || project.organization;
      // Use team size from project (set by PM during project creation)
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

      const phase2Config = getConfigSection(project, 'phase2');
      const lang = getLanguageFromRequest(req);
      const synergyRequirements = {
        projectType: project.projectType,
        requiredExperienceLevel: project.requiredExperienceLevel,
        expectedDuration: project.expectedDuration,
        isInnovative: project.isInnovative,
        isMaintenance: project.isMaintenance,
        synergyWeights: phase2Config?.synergyWeights
      };

      // CASO 1: Hay equipo asignado - Analizar equipo actual
      if (currentTeamSize > 0) {
        const phase1Config = getConfigSection(project, 'phase1');

        const userIds = project.assignedEmployees
          .filter(emp => emp.user != null)
          .map(emp => emp.user._id);
        const cvs = await CV.find({
          userId: { $in: userIds },
          organization: organizationId,
          organizationStatus: 'accepted'
        }).populate('userId', 'name email avatar');

        // Filter out curricula where userId populate failed (deleted users)
        const validCvs = cvs.filter(cv => cv.userId != null);

        // Obtener perfiles BFI-44 del equipo actual
        const currentBfi44Profiles = await BFI44.find({
          userId: { $in: validCvs.map(cv => cv.userId._id) }
        });
        
        const currentBfi44Map = new Map(
          currentBfi44Profiles.map(profile => [profile.userId.toString(), profile])
        );

        // Analizar cada miembro actual
        const teamMembers = await Promise.all(
          validCvs.map(async cv => {
            const score = await teamSelectionService.calculateEmployeeScore(
              cv,
              (project.mainTechnologies || []).map(t => 
                teamSelectionService.normalizeTechnology(t)
              ),
              project.requiredExperienceLevel || 'mid',
              project.weeklyHoursPerMember || 40,
              phase1Config
            );
            
            const matchScore = teamSelectionService.calculateMatchScore(score.total, score.details);
            
            // Agregar perfil BFI-44 si existe
            const bfi44Profile = currentBfi44Map.get(cv.userId._id.toString());
            
            return {
              userId: cv.userId._id,
              user: {
                ...cv.userId.toObject(),
                bfi44Profile: bfi44Profile ? toStableBfi44Profile(bfi44Profile.results) : null
              },
              cv: cv,
              score: score.total,
              matchScore: matchScore,
              details: score.details,
              matchedSkills: score.matchedSkills,
              missingSkills: score.missingSkills
            };
          })
        );

        const currentTeamSummary = teamSelectionService.getTeamSummary(teamMembers);
        
        response.data.currentTeam = teamMembers;
        response.data.currentTeamSummary = currentTeamSummary;

        // Phase 2: Personality synergy analysis (role diversity, complementarity, project fit, conflict risk, balance)
        try {
          const rawSynergy = await teamSynergyService.explainTeamSynergy(
            project.assignedEmployees,
            synergyRequirements
          );
          response.data.currentTeamSynergy = translateSynergyObject(rawSynergy, lang);
        } catch (synergyError) {
          console.error('Error calculating current team synergy:', synergyError);
        }
      }

      // CASO 2: Sugerir empleados complementarios (siempre, salvo que esté completo)
      if (remainingSlots > 0) {
        const currentUserIds = project.assignedEmployees
          ?.filter(emp => emp.user != null)
          .map(emp => emp.user._id) || [];
        
        const result = await teamSelectionService.selectComplementaryTeam(
          project,
          organizationId,
          currentUserIds,
          remainingSlots
        );

        // Obtener perfiles BFI-44 de las sugerencias
        const suggestionsBfi44Profiles = await BFI44.find({
          userId: { $in: result.suggestions.map(s => s.userId) }
        });
        
        const suggestionsBfi44Map = new Map(
          suggestionsBfi44Profiles.map(profile => [profile.userId.toString(), profile])
        );

        // Agregar matchScore y BFI-44 a las sugerencias (con bonus de sinergia si aplicable)
        result.suggestions = result.suggestions.map(suggestion => {
          const synergyValidation = result.synergyValidation?.find(
            v => v.userId.toString() === suggestion.userId.toString()
          );
          const synergyBonus = teamSelectionService.calculateSynergyBonus(synergyValidation);
          const matchScore = teamSelectionService.calculateMatchScore(
            suggestion.score, 
            suggestion.details, 
            synergyBonus
          );
          
          // Agregar perfil BFI-44 si existe
          const bfi44Profile = suggestionsBfi44Map.get(suggestion.userId.toString());
          
          return {
            ...suggestion,
            user: {
              ...suggestion.user,
              bfi44Profile: bfi44Profile ? toStableBfi44Profile(bfi44Profile.results) : null
            },
            matchScore,
            synergyBonus
          };
        });

        const suggestionsSummary = teamSelectionService.getTeamSummary(result.suggestions, result.metadata);
        const risks = teamSelectionService.generateTeamRisks(result.metadata, suggestionsSummary, project);

        response.data.suggestions = result.suggestions;
        response.data.suggestionsSummary = suggestionsSummary;
        response.data.suggestionsMetadata = result.metadata;
        response.data.synergyValidation = result.synergyValidation
          ? translateSynergyValidations(result.synergyValidation, lang)
          : undefined;

        // Phase 2: Projected team synergy if suggested members are added
        try {
          const projectedTeamMembers = [
            ...(project.assignedEmployees || []),
            ...(result.suggestions || []).map(s => ({ user: s.userId }))
          ];

          response.data.projectedTeamSynergy = translateSynergyObject(
            await teamSynergyService.explainTeamSynergy(
              projectedTeamMembers,
              synergyRequirements
            ),
            lang
          );
        } catch (synergyError) {
          console.error('Error calculating projected team synergy:', synergyError);
        }
        
        if (risks.length > 0) {
          response.data.risks = risks;
        }

        // Mensaje contextual
        if (currentTeamSize === 0) {
          response.data.message = `Proyecto sin equipo. Sugerimos ${result.suggestions.length} empleado(s) para comenzar.`;
        } else {
          response.data.message = `Equipo actual: ${currentTeamSize}/${targetTeamSize}. Sugerimos ${result.suggestions.length} empleado(s) para completar el equipo.`;
        }
      } else {
        // Equipo completo
        response.data.message = 'The team is complete.';
      }

      // CASO 3: Calcular scores para TODOS los empleados disponibles (no asignados)
      try {
        const Organization = require('../models/organization.model');
        const personalityOptimizer = require('../services/personalityOptimizer.service');
        const organization = await Organization.findById(organizationId);
        
        if (organization) {
          const phase1Config = getConfigSection(project, 'phase1');
          
          // Obtener IDs de empleados ya considerados (current team + suggestions)
          const consideredUserIds = new Set([
            ...(project.assignedEmployees || [])
              .filter(emp => emp.user != null)
              .map(emp => emp.user._id.toString()),
            ...(response.data.suggestions || []).map(s => s.userId.toString())
          ]);

          // Obtener todos los empleados activos de la organización
          const allEmployeeIds = organization.employees
            .filter(emp => emp.status === 'active')
            .map(emp => emp.user)
            .filter(userId => !consideredUserIds.has(userId.toString()));

          if (allEmployeeIds.length > 0) {
            // Obtener currículos aceptados de empleados disponibles
            const availableCvs = await CV.find({
              userId: { $in: allEmployeeIds },
              organization: organizationId,
              organizationStatus: 'accepted'
            }).populate('userId', 'name email avatar');

            const validAvailableCvs = availableCvs.filter(cv => cv.userId != null);

            // Obtener perfiles BFI-44 de todos los empleados disponibles
            const bfi44Profiles = await BFI44.find({
              userId: { $in: validAvailableCvs.map(cv => cv.userId._id) }
            });
            
            const bfi44Map = new Map(
              bfi44Profiles.map(profile => [profile.userId.toString(), profile])
            );

            // Calcular score técnico para cada empleado disponible
            const availableEmployeesWithScores = await Promise.all(
              validAvailableCvs.map(async cv => {
                const score = await teamSelectionService.calculateEmployeeScore(
                  cv,
                  (project.mainTechnologies || []).map(t => 
                    teamSelectionService.normalizeTechnology(t)
                  ),
                  project.requiredExperienceLevel || 'mid',
                  project.weeklyHoursPerMember || 40,
                  phase1Config
                );
                
                // Agregar perfil BFI-44 si existe
                const bfi44Profile = bfi44Map.get(cv.userId._id.toString());
                
                return {
                  userId: cv.userId._id,
                  user: {
                    ...cv.userId.toObject(),
                    bfi44Profile: bfi44Profile ? toStableBfi44Profile(bfi44Profile.results) : null
                  },
                  cv: cv,
                  score: score.total,
                  details: score.details,
                  matchedSkills: score.matchedSkills,
                  missingSkills: score.missingSkills
                };
              })
            );

            // FASE 2: Evaluar personalidad con el equipo actual
            if (currentTeamSize > 0) {
              try {
                // Obtener el equipo actual para validación de personalidad
                const currentTeam = await CV.find({
                  userId: { $in: project.assignedEmployees
                    .filter(emp => emp.user != null)
                    .map(emp => emp.user._id) 
                  },
                  organization: organizationId,
                  organizationStatus: 'accepted'
                }).populate('userId', 'name email avatar');
                // Calcular validación de personalidad para cada available employee
                let validatedCount = 0;
                let skippedCount = 0;
                
                for (const employee of availableEmployeesWithScores) {
                  try {
                    // Solo validar si el empleado tiene perfil BFI-44
                    if (!employee.user.bfi44Profile) {
                      employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
                      employee.synergyBonus = 0;
                      skippedCount++;
                      continue;
                    }

                    const validation = await personalityOptimizer.validateTeamAddition(
                      currentTeam,
                      employee,
                      project
                    );
                    
                    const synergyBonus = teamSelectionService.calculateSynergyBonus(validation);
                    const matchScore = teamSelectionService.calculateMatchScore(
                      employee.score, 
                      employee.details, 
                      synergyBonus
                    );
                    
                    employee.synergyBonus = synergyBonus;
                    employee.matchScore = matchScore;
                    employee.synergyValidation = {
                      recommended: validation.recommended,
                      improvement: validation.improvement,
                      message: translateSynergyValidation(
                        { synergyImpact: validation.improvement, message: validation.message },
                        lang
                      ).message
                    };
                    validatedCount++;
                  } catch (error) {
                    // Si falla la validación de personalidad, usar solo score técnico
                    employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
                    employee.synergyBonus = 0;
                    skippedCount++;
                  }
                }
              } catch (error) {
                console.error('❌ Error in personality validation block:', error);
                // Si falla completamente, calcular matchScore sin bonus
                availableEmployeesWithScores.forEach(employee => {
                  employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
                  employee.synergyBonus = 0;
                });
              }
            } else {
              // Sin equipo actual, calcular matchScore solo con score técnico
              availableEmployeesWithScores.forEach(employee => {
                employee.matchScore = teamSelectionService.calculateMatchScore(employee.score, employee.details);
                employee.synergyBonus = 0;
              });
            }

            // Ordenar por mejor matchScore (mayor es mejor)
            availableEmployeesWithScores.sort((a, b) => b.matchScore - a.matchScore);

            response.data.availableEmployees = availableEmployeesWithScores;
            response.data.availableEmployeesCount = availableEmployeesWithScores.length;
          } else {
            response.data.availableEmployees = [];
            response.data.availableEmployeesCount = 0;
          }
        }
      } catch (error) {
        console.error('Error calculating scores for available employees:', error);
        // No fallar la respuesta completa, solo no incluir availableEmployees
      }

      return res.status(200).json(response);
    } catch (error) {
      console.error('Error analyzing team:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Debug endpoint - Get detailed technical match information
   * GET /api/projects/:id/debug-technical-match
   * 
   * Returns detailed information about:
   * - Project technologies
   * - Team skills
   * - Technical match analysis
   */
  async debugTechnicalMatch(req, res) {
    try {
      const { id } = req.params;
      const Project = require('../models/project.model');
      const CV = require('../models/cv.model');
      const teamAnalysisService = require('../services/teamAnalysis.service');

      const project = await Project.findById(id)
        .populate('assignedEmployees.user', 'name email')
        .populate('organization', 'name');

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }

      const organizationId = project.organization._id || project.organization;
      const teamMemberIds = project.assignedEmployees
        .filter(emp => emp.user != null)
        .map(emp => emp.user._id);

      // Get curricula
      const cvs = await CV.find({
        userId: { $in: teamMemberIds },
        organization: organizationId,
        organizationStatus: 'accepted'
      }).populate('userId', 'name email');

      // Extract team skills
      const teamSkills = teamAnalysisService.extractTeamSkills(cvs);

      const technicalMatch = teamAnalysisService.analyzeTechnicalMatch(cvs, project);

      const debugInfo = {
        success: true,
        data: {
          project: {
            id: project._id,
            name: project.projectName,
            mainTechnologies: project.mainTechnologies || [],
            technologiesCount: (project.mainTechnologies || []).length,
            hasTechnologies: (project.mainTechnologies || []).length > 0
          },
          team: {
            size: project.assignedEmployees.length,
            members: project.assignedEmployees.map(emp => ({
              name: emp.user?.name,
              email: emp.user?.email,
              role: emp.role
            })),
            cvsFound: cvs.length,
            cvsWithSkills: cvs.filter(cv => 
              cv.skills?.technical && 
              Array.isArray(cv.skills.technical) && 
              cv.skills.technical.length > 0
            ).length
          },
          teamSkills: {
            totalSkills: teamSkills.count,
            allSkills: teamSkills.all,
            categories: {
              programming: teamSkills.categories.programming,
              frameworks: teamSkills.categories.frameworks,
              databases: teamSkills.categories.databases,
              tools: teamSkills.categories.tools,
              cloud: teamSkills.categories.cloud,
              other: teamSkills.categories.other
            },
            levels: teamSkills.levels
          },
          technicalMatch: {
            ...technicalMatch,
            diagnosis: {
              canCompare: !technicalMatch.noProjectTechnologies && !technicalMatch.noTeamSkills,
              issue: technicalMatch.noProjectTechnologies 
                ? 'Project has no technologies defined in mainTechnologies field'
                : technicalMatch.noTeamSkills 
                  ? 'Team has no technical skills in their curricula'
                  : null,
              recommendation: technicalMatch.noProjectTechnologies
                ? 'Add technologies to the project using PUT /api/projects/:id with mainTechnologies array'
                : technicalMatch.noTeamSkills
                  ? 'Ensure team members have uploaded curricula with technical skills'
                  : 'Comparison is valid'
            }
          },
          individualCVs: cvs.map(cv => ({
            userId: cv.userId?._id,
            userName: cv.userId?.name,
            hasSkills: cv.skills?.technical && Array.isArray(cv.skills.technical),
            technicalSkillsCount: cv.skills?.technical ? cv.skills.technical.length : 0,
            technicalSkills: cv.skills?.technical?.map(skill => ({
              name: skill.name,
              level: skill.level,
              category: skill.category
            })) || []
          }))
        }
      };

      return res.status(200).json(debugInfo);
    } catch (error) {
      console.error('Error in debug technical match:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Get detailed personality synergy analysis for a project team
   * GET /api/projects/:id/team-synergy
   * OPTIMIZED: Uses cache for better performance
   */
  async getTeamSynergy(req, res) {
    try {
      const teamSynergyService = require('../services/teamSynergy.service');
      const personalityOptimizer = require('../services/personalityOptimizer.service');
      const Project = require('../models/project.model');

      const { id } = req.params;
      const { refresh } = req.query; // Optional query param to force refresh

      const project = await Project.findById(id)
        .populate('assignedEmployees.user', 'name email avatar')
        .populate('organization', 'name');

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
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get team selection configuration
   * GET /api/projects/:id/team-config
   */
  async getTeamConfig(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      // Verify permissions: only PM can view configuration
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can view team selection configuration'
        });
      }
      
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update complete team selection configuration
   * PUT /api/projects/:id/team-config
   */
  async updateTeamConfig(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      // Verify permissions
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can modify team selection configuration'
        });
      }
      
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
      project.teamSelectionConfig = req.body;
      await project.save();
      
      return res.status(200).json({
        success: true,
        message: 'Team selection configuration updated successfully',
        data: {
          config: project.teamSelectionConfig
        }
      });
    } catch (error) {
      console.error('Error updating team config:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update Phase 1 configuration only
   * PATCH /api/projects/:id/team-config/phase1
   */
  async updatePhase1Config(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can modify configuration'
        });
      }
      
      // Ensure teamSelectionConfig exists
      if (!project.teamSelectionConfig) {
        project.teamSelectionConfig = { ...DEFAULT_TEAM_SELECTION_CONFIG };
      }
      
      // Initialize phase1 if it doesn't exist
      if (!project.teamSelectionConfig.phase1) {
        project.teamSelectionConfig.phase1 = { ...DEFAULT_TEAM_SELECTION_CONFIG.phase1 };
      }
      
      // Deep merge for Phase 1 configuration
      const currentPhase1 = project.teamSelectionConfig.phase1;
      const updates = req.body;
      
      // Create merged object
      const mergedPhase1 = {
        ...DEFAULT_TEAM_SELECTION_CONFIG.phase1,
        ...currentPhase1,
        ...updates
      };
      
      // Deep merge nested objects
      if (updates.availabilityComponents) {
        mergedPhase1.availabilityComponents = {
          ...(currentPhase1.availabilityComponents || DEFAULT_TEAM_SELECTION_CONFIG.phase1.availabilityComponents),
          ...updates.availabilityComponents
        };
      }
      
      if (updates.complexityFactors) {
        mergedPhase1.complexityFactors = {
          ...(currentPhase1.complexityFactors || DEFAULT_TEAM_SELECTION_CONFIG.phase1.complexityFactors),
          ...updates.complexityFactors
        };
      }
      
      // Assign complete object and mark as modified
      project.teamSelectionConfig.phase1 = mergedPhase1;
      project.markModified('teamSelectionConfig.phase1');
      
      // Validate the full config
      const validation = validateTeamSelectionConfig(project.teamSelectionConfig);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid configuration after update', 
          validationErrors: validation.errors 
        });
      }
      
      await project.save();
      
      return res.status(200).json({
        success: true,
        message: 'Phase 1 configuration updated successfully',
        data: {
          phase1: project.teamSelectionConfig.phase1
        }
      });
    } catch (error) {
      console.error('Error updating phase1 config:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update Phase 2 configuration only
   * PATCH /api/projects/:id/team-config/phase2
   */
  async updatePhase2Config(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can modify configuration'
        });
      }
      
      if (!project.teamSelectionConfig) {
        project.teamSelectionConfig = { ...DEFAULT_TEAM_SELECTION_CONFIG };
      }
      
      // Initialize phase2 if it doesn't exist
      if (!project.teamSelectionConfig.phase2) {
        project.teamSelectionConfig.phase2 = { ...DEFAULT_TEAM_SELECTION_CONFIG.phase2 };
      }
      
      // Deep merge for Phase 2 configuration
      const currentPhase2 = project.teamSelectionConfig.phase2;
      const updates = req.body;
      
      // Create merged object
      const mergedPhase2 = {
        ...DEFAULT_TEAM_SELECTION_CONFIG.phase2,
        ...currentPhase2,
        ...updates
      };
      
      // Deep merge nested objects
      if (updates.synergyWeights) {
        mergedPhase2.synergyWeights = {
          ...(currentPhase2.synergyWeights || DEFAULT_TEAM_SELECTION_CONFIG.phase2.synergyWeights),
          ...updates.synergyWeights
        };
      }
      
      if (updates.projectProfiles) {
        mergedPhase2.projectProfiles = {
          ...(currentPhase2.projectProfiles || DEFAULT_TEAM_SELECTION_CONFIG.phase2.projectProfiles),
          ...updates.projectProfiles
        };
      }
      
      // Assign complete object and mark as modified
      project.teamSelectionConfig.phase2 = mergedPhase2;
      project.markModified('teamSelectionConfig.phase2');
      
      const validation = validateTeamSelectionConfig(project.teamSelectionConfig);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid configuration after update', 
          validationErrors: validation.errors 
        });
      }
      
      await project.save();
      
      return res.status(200).json({
        success: true,
        message: 'Phase 2 configuration updated successfully',
        data: {
          phase2: project.teamSelectionConfig.phase2
        }
      });
    } catch (error) {
      console.error('Error updating phase2 config:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update CBR configuration only
   * PATCH /api/projects/:id/team-config/cbr
   */
  async updateCBRConfig(req, res) {
    try {
      const { id } = req.params;
      console.log('\n🔧 === UPDATE CBR CONFIG ===');
      console.log('📝 Project ID:', id);
      console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
      
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can modify configuration'
        });
      }
      
      console.log('📊 BEFORE Update - teamSelectionConfig exists?', !!project.teamSelectionConfig);
      console.log('📊 BEFORE Update - CBR config:', JSON.stringify(project.teamSelectionConfig?.cbr, null, 2));
      
      if (!project.teamSelectionConfig) {
        console.log('⚠️  Creating new teamSelectionConfig from defaults');
        project.teamSelectionConfig = { ...DEFAULT_TEAM_SELECTION_CONFIG };
      }
      
      // Initialize CBR config if it doesn't exist
      if (!project.teamSelectionConfig.cbr) {
        console.log('⚠️  Creating new CBR config from defaults');
        project.teamSelectionConfig.cbr = { ...DEFAULT_TEAM_SELECTION_CONFIG.cbr };
      }
      
      // Deep merge for CBR configuration
      const currentCBR = project.teamSelectionConfig.cbr || {};
      const updates = req.body;
      
      console.log('🔍 Current CBR BEFORE merge:', JSON.stringify(currentCBR, null, 2));
      console.log('🔍 Updates to apply:', JSON.stringify(updates, null, 2));
      
      // Start with defaults, then merge current values, then merge updates
      const mergedCBR = {
        ...DEFAULT_TEAM_SELECTION_CONFIG.cbr,
        ...currentCBR,
        ...updates
      };
      
      // Deep merge dimensionWeights if provided
      if (updates.dimensionWeights) {
        console.log('📊 Merging dimensionWeights...');
        const baseDimWeights = currentCBR.dimensionWeights || DEFAULT_TEAM_SELECTION_CONFIG.cbr.dimensionWeights;
        console.log('   Current dimensionWeights:', JSON.stringify(baseDimWeights, null, 2));
        mergedCBR.dimensionWeights = {
          ...baseDimWeights,
          ...updates.dimensionWeights
        };
        console.log('   ✅ After merge:', JSON.stringify(mergedCBR.dimensionWeights, null, 2));
      } else if (!mergedCBR.dimensionWeights) {
        // Ensure dimensionWeights always exists
        mergedCBR.dimensionWeights = DEFAULT_TEAM_SELECTION_CONFIG.cbr.dimensionWeights;
      }
      
      console.log('🔍 mergedCBR object:', JSON.stringify(mergedCBR, null, 2));
      
      // Assign the complete merged object (this ensures Mongoose detects the change)
      project.teamSelectionConfig.cbr = mergedCBR;
      project.markModified('teamSelectionConfig.cbr');
      
      console.log('✅ Final CBR config BEFORE validation:', JSON.stringify(project.teamSelectionConfig.cbr, null, 2));
      
      const validation = validateTeamSelectionConfig(project.teamSelectionConfig);
      if (!validation.valid) {
        console.log('❌ Validation FAILED:', validation.errors);
        return res.status(400).json({ 
          success: false,
          error: 'Invalid configuration after update', 
          validationErrors: validation.errors 
        });
      }
      
      console.log('✅ Validation passed, saving to database...');
      await project.save();
      console.log('✅ Saved successfully!');
      
      console.log('📤 Response CBR config:', JSON.stringify(project.teamSelectionConfig.cbr, null, 2));
      console.log('🔧 === END UPDATE CBR CONFIG ===\n');
      
      return res.status(200).json({
        success: true,
        message: 'CBR configuration updated successfully',
        data: {
          cbr: project.teamSelectionConfig.cbr
        }
      });
    } catch (error) {
      console.error('❌ Error updating CBR config:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update Decision Tree configuration only
   * PATCH /api/projects/:id/team-config/decision-tree
   */
  async updateDecisionTreeConfig(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can modify configuration'
        });
      }
      
      if (!project.teamSelectionConfig) {
        project.teamSelectionConfig = { ...DEFAULT_TEAM_SELECTION_CONFIG };
      }
      
      // Initialize decisionTree if it doesn't exist
      if (!project.teamSelectionConfig.decisionTree) {
        project.teamSelectionConfig.decisionTree = { ...DEFAULT_TEAM_SELECTION_CONFIG.decisionTree };
      }
      
      // Deep merge for Decision Tree configuration
      const currentDT = project.teamSelectionConfig.decisionTree;
      const updates = req.body;

      // Normalize frontend inputs: some thresholds are ratios (0..1) but UI often uses percentages (0..100).
      // We only normalize a safe, explicit allowlist to avoid corrupting non-ratio thresholds like
      // timelineBufferPercentage (which is an actual percentage, e.g., 30 not 0.30).
      const normalizeRatio = (rawValue) => {
        const numericValue = typeof rawValue === 'string' ? Number(rawValue) : rawValue;
        if (!Number.isFinite(numericValue)) return rawValue;
        if (numericValue > 1 && numericValue <= 100) return numericValue / 100;
        return numericValue;
      };

      const ratioThresholdKeys = new Set([
        // Skill gap ratios
        'skillGapCritical',
        'skillGapMajor',
        'maxJuniorRatio',

        // Resource availability ratios
        'keyPersonDependencyThreshold',
        'backupCoverageRequired',
        'documentationComplianceThreshold',

        // Remote / onboarding / isolation ratios
        'remoteWorkPercentageThreshold',
        'newMembersPercentageThreshold',
        'remoteWorkPercentageForIsolation'
      ]);

      const normalizedUpdates = { ...updates };
      if (updates?.riskThresholds && typeof updates.riskThresholds === 'object') {
        const normalizedRiskThresholds = { ...updates.riskThresholds };

        Object.keys(normalizedRiskThresholds).forEach((key) => {
          if (!ratioThresholdKeys.has(key)) return;
          normalizedRiskThresholds[key] = normalizeRatio(normalizedRiskThresholds[key]);
        });

        normalizedUpdates.riskThresholds = normalizedRiskThresholds;
      }
      
      // Create merged object
      const mergedDT = {
        ...DEFAULT_TEAM_SELECTION_CONFIG.decisionTree,
        ...currentDT,
        ...normalizedUpdates
      };
      
      // Deep merge nested objects
      if (normalizedUpdates.riskThresholds) {
        mergedDT.riskThresholds = {
          ...(currentDT.riskThresholds || DEFAULT_TEAM_SELECTION_CONFIG.decisionTree.riskThresholds),
          ...normalizedUpdates.riskThresholds
        };
      }
      
      if (normalizedUpdates.personalityRiskThresholds) {
        mergedDT.personalityRiskThresholds = {
          ...(currentDT.personalityRiskThresholds || DEFAULT_TEAM_SELECTION_CONFIG.decisionTree.personalityRiskThresholds),
          ...normalizedUpdates.personalityRiskThresholds
        };
      }
      
      // Assign complete object and mark as modified
      project.teamSelectionConfig.decisionTree = mergedDT;
      project.markModified('teamSelectionConfig.decisionTree');
      
      const validation = validateTeamSelectionConfig(project.teamSelectionConfig);
      if (!validation.valid) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid configuration after update', 
          validationErrors: validation.errors 
        });
      }
      
      await project.save();
      
      return res.status(200).json({
        success: true,
        message: 'Decision Tree configuration updated successfully',
        data: {
          decisionTree: project.teamSelectionConfig.decisionTree
        }
      });
    } catch (error) {
      console.error('Error updating Decision Tree config:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Reset configuration to defaults
   * POST /api/projects/:id/team-config/reset
   */
  async resetTeamConfig(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can modify configuration'
        });
      }
      
      // Remove custom configuration
      project.teamSelectionConfig = undefined;
      await project.save();
      
      return res.status(200).json({
        success: true,
        message: 'Configuration reset to defaults successfully',
        data: {
          config: DEFAULT_TEAM_SELECTION_CONFIG
        }
      });
    } catch (error) {
      console.error('Error resetting team config:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get configuration summary (human-readable)
   * GET /api/projects/:id/team-config/summary
   */
  async getTeamConfigSummary(req, res) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found'
        });
      }
      
      if (!project.isProjectManager(req.user.id)) {
        return res.status(403).json({
          success: false,
          error: 'Only the project manager can view configuration'
        });
      }
      
      const summary = getConfigurationSummary(project);
      
      return res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting config summary:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      const project = await Project.findById(id).populate('organization');

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
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      const project = await Project.findById(id).populate('organization');

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

      project.teamSelectionConfig.phase1.candidatePoolMultiplier = multiplier;
      project.markModified('teamSelectionConfig.phase1');
      await project.save();

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
      return res.status(500).json({
        success: false,
        error: error.message
      });
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
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }}

module.exports = new ProjectController();