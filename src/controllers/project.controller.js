const projectService = require('../services/project.service');
const { validationResult } = require('express-validator');

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
      // Validate request
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
}

module.exports = new ProjectController();
