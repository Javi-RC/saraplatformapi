const organizationService = require('../services/organization.service');

/**
 * Controlador de Organizaciones
 * Maneja las peticiones HTTP relacionadas con organizaciones
 * Siguiendo principios SOLID: Single Responsibility
 */
class OrganizationController {
  /**
   * Crea una nueva organización
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
      console.error('Error al crear organización:', error);

      const duplicateNameMessage = 'An organization with that name already exists';

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: duplicateNameMessage
        });
      }

      if (error.message === 'ORGANIZATION_NAME_ALREADY_EXISTS') {
        return res.status(409).json({
          success: false,
          error: duplicateNameMessage
        });
      }

      const statusCode = error.message.includes('ya administra') ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtiene una organización por ID
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
      console.error('Error al obtener organización:', error);
      
      const errorMessages = {
        'Organization not found': 'Organización no encontrada',
        'UNAUTHORIZED_ACCESS': 'No tienes permisos para ver esta organización'
      };
      
      const statusCodes = {
        'Organization not found': 404,
        'UNAUTHORIZED_ACCESS': 403
      };
      
      const message = errorMessages[error.message] || error.message;
      const statusCode = statusCodes[error.message] || 400;
      
      return res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }

  /**
   * Actualiza una organización
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
      console.error('Error al actualizar organización:', error);
      const statusCode = error.message.includes('permisos') ? 403 : 
                         error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtiene las organizaciones del usuario autenticado
   * GET /api/organizations/my-organizations
   */
  async getMyOrganizations(req, res) {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      let organizations;
      if (role === 'org_admin') {
        organizations = await organizationService.getOrganizationsByAdmin(userId);
      } else if (role === 'employee') {
        organizations = await organizationService.getOrganizationsByEmployee(userId);
      } else {
        organizations = [];
      }

      return res.status(200).json({
        success: true,
        data: organizations
      });
    } catch (error) {
      console.error('Error al obtener organizaciones del usuario:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Agrega un empleado a la organización
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
      console.error('Error al agregar empleado:', error);
      const statusCode = error.message.includes('permisos') ? 403 : 
                         error.message.includes('no encontrad') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Remueve un empleado de la organización
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
      console.error('Error al remover empleado:', error);
      const statusCode = error.message.includes('permisos') ? 403 : 
                         error.message.includes('no encontrad') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Actualiza el estado de un empleado
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
          error: 'Se requiere el nuevo estado'
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
      console.error('Error al actualizar estado del empleado:', error);
      const statusCode = error.message.includes('permisos') ? 403 : 
                         error.message.includes('no encontrad') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Agrega un administrador adicional
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
      console.error('Error al agregar administrador:', error);
      const statusCode = error.message.includes('Solo el administrador principal') ? 403 : 
                         error.message.includes('no encontrad') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtiene los empleados de la organización
   * GET /api/organizations/:id/employees
   */
  async getEmployees(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const filters = {
        status: req.query.status,
        department: req.query.department,
        position: req.query.position
      };

      const employees = await organizationService.getEmployees(id, filters, userId);

      return res.status(200).json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      const statusCode = error.message.includes('permisos') ? 403 : 
                         error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Busca organizaciones con filtros
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
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await organizationService.searchOrganizations(filters, pagination);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error al buscar organizaciones:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Desactiva una organización
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
      console.error('Error al desactivar organización:', error);
      const statusCode = error.message.includes('Solo el administrador principal') ? 403 : 
                         error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Activa una organización
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
      console.error('Error al activar organización:', error);
      const statusCode = error.message.includes('Solo el administrador principal') ? 403 : 
                         error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Actualiza la configuración de la organización
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
      console.error('Error al actualizar configuración:', error);
      const statusCode = error.message.includes('permisos') ? 403 : 
                         error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtiene estadísticas de la organización
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
      console.error('Error al obtener estadísticas:', error);
      const statusCode = error.message.includes('permisos') ? 403 : 
                         error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Asigna o remueve el rol de jefe de proyecto a un empleado
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
      console.error('Error al asignar rol de jefe de proyecto:', error);
      
      let statusCode = 400;
      if (error.message.includes('no encontrada') || error.message.includes('no pertenece')) {
        statusCode = 404;
      } else if (error.message.includes('permisos')) {
        statusCode = 403;
      }

      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtiene todos los jefes de proyecto de una organización
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
      console.error('Error al obtener jefes de proyecto:', error);
      const statusCode = error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtiene todos los proyectos de una organización
   * GET /api/organizations/:id/projects
   */
  async getOrganizationProjects(req, res) {
    try {
      const { id } = req.params;
      const filters = {
        status: req.query.status,
        projectManager: req.query.projectManager
      };

      // Importar el controlador de proyectos para reutilizar su lógica
      const projectController = require('./project.controller');
      req.params.organizationId = id;
      
      return await projectController.getOrganizationProjects(req, res);
    } catch (error) {
      console.error('Error al obtener proyectos de la organización:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Obtiene estadísticas de proyectos de una organización
   * GET /api/organizations/:id/projects/statistics
   */
  async getProjectStatistics(req, res) {
    try {
      const { id } = req.params;

      // Importar el controlador de proyectos para reutilizar su lógica
      const projectController = require('./project.controller');
      req.params.organizationId = id;
      
      return await projectController.getProjectStatistics(req, res);
    } catch (error) {
      console.error('Error al obtener estadísticas de proyectos:', error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new OrganizationController();
