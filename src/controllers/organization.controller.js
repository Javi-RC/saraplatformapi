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
        message: 'Organización creada exitosamente',
        data: organization
      });
    } catch (error) {
      console.error('Error al crear organización:', error);
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
      const includeEmployees = req.query.includeEmployees === 'true';

      const organization = await organizationService.getOrganizationById(
        id,
        includeEmployees
      );

      return res.status(200).json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Error al obtener organización:', error);
      const statusCode = error.message.includes('no encontrada') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message
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
        message: 'Organización actualizada exitosamente',
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
          error: 'Se requiere el ID del usuario'
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
        message: 'Empleado agregado exitosamente',
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
        message: 'Empleado removido exitosamente',
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
        message: 'Estado del empleado actualizado exitosamente',
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
          error: 'Se requiere el ID del usuario'
        });
      }

      const organization = await organizationService.addAdditionalAdmin(
        id,
        userId,
        currentAdminId
      );

      return res.status(201).json({
        success: true,
        message: 'Administrador agregado exitosamente',
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
        message: 'Organización desactivada exitosamente',
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
        message: 'Organización activada exitosamente',
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
        message: 'Configuración actualizada exitosamente',
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
}

module.exports = new OrganizationController();
