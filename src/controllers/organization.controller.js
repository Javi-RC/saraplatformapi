const organizationService = require('../services/core/organization.service');
const projectService = require('../services/core/project.service');
const { handleErrorCatch } = require('../utils/errorHelper');
const { ROLES } = require('../config/roles');

/**
 * Organization Controller
 * Handles HTTP requests related to organizations
 * Following SOLID principles: Single Responsibility
 */
class OrganizationController {
  /**
   * Creates a new organization
   * POST /api/organizations
   */
  async createOrganization(req, res) {
    try {
      const organizationData = req.body;
      const adminId = req.user.id;

      const organization = await organizationService.createOrganization(
        organizationData,
        adminId
      );

      return res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error creating organization:', error);

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'An organization with that name already exists'
        });
      }

      if (error.message === 'ORGANIZATION_NAME_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          error: 'An organization with that name already exists'
        });
      }

      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets an organization by ID
   * GET /api/organizations/:id
   */
  async getOrganization(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const includeEmployees = req.query.includeEmployees === 'true';

      const organization = await organizationService.getOrganizationById(
        id,
        includeEmployees,
        userId
      );

      return res.status(200).json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Error getting organization:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Updates an organization
   * PUT /api/organizations/:id
   */
  async updateOrganization(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const organization = await organizationService.updateOrganization(
        id,
        updateData,
        userId
      );

      return res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets the authenticated user's organizations
   * GET /api/organizations/my-organizations
   */
  async getMyOrganizations(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      let organizations;
      if (role === ROLES.ORG_ADMIN) {
        organizations = await organizationService.getOrganizationsByAdmin(userId);
      } else if (role === ROLES.EMPLOYEE) {
        organizations = await organizationService.getOrganizationsByEmployee(userId);
      } else {
        organizations = [];
      }

      return res.status(200).json({
        success: true,
        data: organizations
      });
    } catch (error) {
      console.error('Error getting user organizations:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Adds an employee to the organization
   * POST /api/organizations/:id/employees
   */
  async addEmployee(req, res) {
    try {
      const { id } = req.params;
      const { userId, position, department } = req.body;
      const adminId = req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const organization = await organizationService.addEmployee(
        id,
        userId,
        { position, department },
        adminId
      );

      return res.status(201).json({
        success: true,
        message: 'Employee added successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Removes an employee from the organization
   * DELETE /api/organizations/:id/employees/:userId
   */
  async removeEmployee(req, res) {
    try {
      const { id, userId } = req.params;
      const adminId = req.user.id;

      const organization = await organizationService.removeEmployee(
        id,
        userId,
        adminId
      );

      return res.status(200).json({
        success: true,
        message: 'Employee removed successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error removing employee:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Updates an employee's status
   * PATCH /api/organizations/:id/employees/:userId/status
   */
  async updateEmployeeStatus(req, res) {
    try {
      const { id, userId } = req.params;
      const { status } = req.body;
      const adminId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'New status is required'
        });
      }

      const organization = await organizationService.updateEmployeeStatus(
        id,
        userId,
        status,
        adminId
      );

      return res.status(200).json({
        success: true,
        message: 'Employee status updated successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error updating employee status:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Adds an additional administrator
   * POST /api/organizations/:id/admins
   */
  async addAdmin(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const currentAdminId = req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const organization = await organizationService.addAdditionalAdmin(
        id,
        userId,
        currentAdminId
      );

      return res.status(201).json({
        success: true,
        message: 'Administrator added successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error adding administrator:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets the organization's employees
   * GET /api/organizations/:id/employees
   */
  async getEmployees(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        department: req.query.department,
        position: req.query.position,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await organizationService.getEmployees(id, filters, userId);

      return res.status(200).json({
        success: true,
        ...result.pagination ? { pagination: result.pagination } : {},
        count: result.data.length,
        data: result.data
      });
    } catch (error) {
      console.error('Error getting employees:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Searches organizations with filters
   * GET /api/organizations/search
   */
  async searchOrganizations(req, res) {
    try {
      const filters = {
        status: req.query.status,
        industry: req.query.industry,
        size: req.query.size,
        name: req.query.name
      };

      const pagination = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await organizationService.searchOrganizations(filters, pagination);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error searching organizations:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Deactivates an organization
   * PATCH /api/organizations/:id/deactivate
   */
  async deactivateOrganization(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const organization = await organizationService.deactivateOrganization(id, adminId);

      return res.status(200).json({
        success: true,
        message: 'Organization deactivated successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error deactivating organization:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Activates an organization
   * PATCH /api/organizations/:id/activate
   */
  async activateOrganization(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const organization = await organizationService.activateOrganization(id, adminId);

      return res.status(200).json({
        success: true,
        message: 'Organization activated successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error activating organization:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Updates the organization settings
   * PATCH /api/organizations/:id/settings
   */
  async updateSettings(req, res) {
    try {
      const { id } = req.params;
      const settings = req.body;
      const adminId = req.user.id;

      const organization = await organizationService.updateSettings(
        id,
        settings,
        adminId
      );

      return res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets organization statistics
   * GET /api/organizations/:id/stats
   */
  async getStats(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const stats = await organizationService.getOrganizationStats(id, userId);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Assigns or removes the project manager role from an employee
   * PATCH /api/organizations/:id/employees/:employeeId/project-manager
   */
  async setProjectManagerRole(req, res) {
    try {
      const { id, employeeId } = req.params;
      const { isProjectManager } = req.body;
      const adminId = req.user.id;

      if (typeof isProjectManager !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isProjectManager must be a boolean value'
        });
      }

      const organization = await organizationService.setProjectManagerRole(
        id,
        employeeId,
        isProjectManager,
        adminId
      );

      return res.status(200).json({
        success: true,
        message: isProjectManager 
          ? 'Employee assigned as project manager successfully'
          : 'Project manager role removed successfully',
        data: organization
      });
    } catch (error) {
      console.error('Error assigning project manager role:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets all project managers of an organization
   * GET /api/organizations/:id/project-managers
   */
  async getProjectManagers(req, res) {
    try {
      const { id } = req.params;

      const projectManagers = await organizationService.getProjectManagers(id);

      return res.status(200).json({
        success: true,
        count: projectManagers.length,
        data: projectManagers
      });
    } catch (error) {
      console.error('Error getting project managers:', error);
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets all projects of an organization
   * GET /api/organizations/:id/projects
   */
  async getOrganizationProjects(req, res) {
    try {
      const { id } = req.params;
      const filters = {
        status: req.query.status,
        projectManager: req.query.projectManager,
        page: req.query.page,
        limit: req.query.limit
      };

      const result = await projectService.getProjectsByOrganization(id, filters);

      return res.status(200).json({
        success: true,
        ...result.pagination ? { pagination: result.pagination } : {},
        count: result.data.length,
        data: result.data
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }

  /**
   * Gets project statistics for an organization
   * GET /api/organizations/:id/projects/statistics
   */
  async getProjectStatistics(req, res) {
    try {
      const { id } = req.params;

      const statistics = await projectService.getProjectStatistics(id);

      return res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      return handleErrorCatch(error, res);
    }
  }
}

module.exports = new OrganizationController();
