const Organization = require('../models/organization.model');
const User = require('../models/user.model');
const organizationNotificationHelper = require('./organizationNotificationHelper');
const bfi44NotificationHelper = require('./bfi44NotificationHelper');
const BFI44Response = require('../models/bfi44.model');

/**
 * Servicio de Gestión de Organizaciones
 * Implementa la lógica de negocio para la gestión de organizaciones
 * Siguiendo principios SOLID:
 * - Single Responsibility: Gestión exclusiva de organizaciones
 * - Dependency Inversion: Depende de abstracciones (modelos)
 */
class OrganizationService {
  /**
   * Crea una nueva organización
   * @param {Object} organizationData - Datos de la organización
   * @param {string} adminId - ID del usuario administrador
   * @returns {Promise<Object>} Organización creada
   */
  async createOrganization(organizationData, adminId) {
    // Validar que el usuario existe y puede ser administrador
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new Error('Usuario administrador no encontrado');
    }

    // Verificar que el usuario no administre ya otra organización activa
    const existingOrg = await Organization.findOne({
      admin: adminId,
      status: 'active'
    });

    if (existingOrg) {
      throw new Error('El usuario ya administra una organización activa');
    }

    // Crear la organización
    const organization = new Organization({
      ...organizationData,
      admin: adminId,
      status: 'active',
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    });

    await organization.save();

    // Actualizar el rol del usuario a org_admin
    admin.role = 'org_admin';
    await admin.save();

    // Poblar los datos del administrador
    await organization.populate('admin', 'name email avatar');

    return organization;
  }

  /**
   * Obtiene una organización por su ID
   * @param {string} organizationId - ID de la organización
   * @param {boolean} includeEmployees - Incluir datos de empleados
   * @returns {Promise<Object>} Organización encontrada
   */
  async getOrganizationById(organizationId, includeEmployees = false) {
    let query = Organization.findById(organizationId)
      .populate('admin', 'name email avatar role')
      .populate('additionalAdmins', 'name email avatar role');

    if (includeEmployees) {
      query = query.populate('employees.user', 'name email avatar');
    }

    const organization = await query;

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    return organization;
  }

  /**
   * Actualiza los datos de una organización
   * @param {string} organizationId - ID de la organización
   * @param {Object} updateData - Datos a actualizar
   * @param {string} userId - ID del usuario que realiza la actualización
   * @returns {Promise<Object>} Organización actualizada
   */
  async updateOrganization(organizationId, updateData, userId) {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    // Verificar permisos
    if (!organization.isAdmin(userId)) {
      throw new Error('No tienes permisos para actualizar esta organización');
    }

    // Campos que no se pueden actualizar directamente
    const protectedFields = ['admin', 'employees', 'additionalAdmins', 'createdAt'];
    protectedFields.forEach(field => delete updateData[field]);

    // Actualizar campos permitidos
    Object.assign(organization, updateData);
    organization.lastActivityAt = Date.now();

    await organization.save();
    await organization.populate('admin', 'name email avatar');
    await organization.populate('additionalAdmins', 'name email avatar');

    return organization;
  }

  /**
   * Obtiene todas las organizaciones administradas por un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de organizaciones
   */
  async getOrganizationsByAdmin(userId) {
    const organizations = await Organization.findByAdmin(userId);
    return organizations;
  }

  /**
   * Obtiene las organizaciones donde un usuario es empleado
   * @param {string} userId - ID del usuario
   * @returns {Promise<Array>} Lista de organizaciones
   */
  async getOrganizationsByEmployee(userId) {
    const organizations = await Organization.findByEmployee(userId);
    return organizations;
  }

  /**
   * Agrega un empleado a la organización
   * @param {string} organizationId - ID de la organización
   * @param {string} userId - ID del usuario a agregar
   * @param {Object} employeeData - Datos del empleado
   * @param {string} adminId - ID del administrador que realiza la acción
   * @returns {Promise<Object>} Organización actualizada
   */
  async addEmployee(organizationId, userId, employeeData, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Verificar permisos
    if (!organization.isAdmin(adminId)) {
      throw new Error('No tienes permisos para agregar empleados');
    }

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Agregar el empleado
    await organization.addEmployee(userId, employeeData);

    // Si el usuario tiene rol unassigned, actualizarlo a employee
    if (user.role === 'unassigned') {
      user.role = 'employee';
      await user.save();
    }

    // Enviar notificación al empleado agregado
    organizationNotificationHelper.notifyEmployeeAdded(organization, user, employeeData).catch(err => {
      console.error('Error enviando notificación de empleado agregado:', err);
    });

    // Notificar sobre el test BFI-44 si no lo ha completado
    const hasProfile = await BFI44Response.hasProfile(user._id);
    if (!hasProfile) {
      bfi44NotificationHelper.notifyTestPending(user._id, user.name).catch(err => {
        console.error('Error enviando notificación de test BFI-44:', err);
      });
    }

    return organization;
  }

  /**
   * Remueve un empleado de la organización
   * @param {string} organizationId - ID de la organización
   * @param {string} userId - ID del usuario a remover
   * @param {string} adminId - ID del administrador que realiza la acción
   * @returns {Promise<Object>} Organización actualizada
   */
  async removeEmployee(organizationId, userId, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Verificar permisos
    if (!organization.isAdmin(adminId)) {
      throw new Error('No tienes permisos para remover empleados');
    }

    // Obtener usuario antes de remover
    const user = await User.findById(userId);

    await organization.removeEmployee(userId);

    // Enviar notificación al empleado removido
    if (user) {
      organizationNotificationHelper.notifyEmployeeRemoved(organization, user).catch(err => {
        console.error('Error enviando notificación de empleado removido:', err);
      });
    }

    return organization;
  }

  /**
   * Actualiza el estado de un empleado
   * @param {string} organizationId - ID de la organización
   * @param {string} userId - ID del usuario
   * @param {string} newStatus - Nuevo estado
   * @param {string} adminId - ID del administrador que realiza la acción
   * @returns {Promise<Object>} Organización actualizada
   */
  async updateEmployeeStatus(organizationId, userId, newStatus, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Verificar permisos
    if (!organization.isAdmin(adminId)) {
      throw new Error('No tienes permisos para actualizar el estado de empleados');
    }

    await organization.updateEmployeeStatus(userId, newStatus);

    // Obtener usuario para notificar
    const user = await User.findById(userId);
    if (user) {
      organizationNotificationHelper.notifyEmployeeStatusChanged(organization, user, newStatus).catch(err => {
        console.error('Error enviando notificación de cambio de estado:', err);
      });
    }

    return organization;
  }

  /**
   * Agrega un administrador adicional a la organización
   * @param {string} organizationId - ID de la organización
   * @param {string} newAdminId - ID del usuario a promover
   * @param {string} currentAdminId - ID del administrador actual
   * @returns {Promise<Object>} Organización actualizada
   */
  async addAdditionalAdmin(organizationId, newAdminId, currentAdminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Solo el administrador principal puede agregar admins adicionales
    if (organization.admin.toString() !== currentAdminId.toString()) {
      throw new Error('Solo el administrador principal puede agregar administradores adicionales');
    }

    // Verificar que el usuario existe
    const user = await User.findById(newAdminId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await organization.addAdmin(newAdminId);

    // Actualizar el rol del usuario
    if (user.role === 'employee' || user.role === 'unassigned') {
      user.role = 'org_admin';
      await user.save();
    }

    await organization.populate('additionalAdmins', 'name email avatar');

    // Enviar notificación al nuevo administrador
    organizationNotificationHelper.notifyAdminAdded(organization, user).catch(err => {
      console.error('Error enviando notificación de admin agregado:', err);
    });

    return organization;
  }

  /**
   * Obtiene los empleados de una organización con filtros
   * @param {string} organizationId - ID de la organización
   * @param {Object} filters - Filtros de búsqueda
   * @param {string} userId - ID del usuario que solicita la información
   * @returns {Promise<Array>} Lista de empleados
   */
  async getEmployees(organizationId, filters = {}, userId) {
    const organization = await this.getOrganizationById(organizationId, true);

    // Verificar permisos
    if (!organization.isAdmin(userId) && !organization.isEmployee(userId)) {
      throw new Error('No tienes permisos para ver los empleados de esta organización');
    }

    // Filter out employees with null user (deleted users)
    let employees = organization.employees.filter(emp => emp.user != null);

    // Aplicar filtros
    if (filters.status) {
      employees = employees.filter(emp => emp.status === filters.status);
    }

    if (filters.department) {
      employees = employees.filter(emp => 
        emp.department && emp.department.toLowerCase().includes(filters.department.toLowerCase())
      );
    }

    if (filters.position) {
      employees = employees.filter(emp => 
        emp.position && emp.position.toLowerCase().includes(filters.position.toLowerCase())
      );
    }

    return employees;
  }

  /**
   * Busca organizaciones con filtros y paginación
   * @param {Object} filters - Filtros de búsqueda
   * @param {Object} pagination - Opciones de paginación
   * @returns {Promise<Object>} Resultado con organizaciones y metadata
   */
  async searchOrganizations(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const query = {};

    // Aplicar filtros
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.industry) {
      query.industry = filters.industry;
    }

    if (filters.size) {
      query.size = filters.size;
    }

    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }

    // Ejecutar consulta con paginación
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [organizations, total] = await Promise.all([
      Organization.find(query)
        .populate('admin', 'name email avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Organization.countDocuments(query)
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Desactiva una organización
   * @param {string} organizationId - ID de la organización
   * @param {string} adminId - ID del administrador
   * @returns {Promise<Object>} Organización actualizada
   */
  async deactivateOrganization(organizationId, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Solo el administrador principal puede desactivar
    if (organization.admin.toString() !== adminId.toString()) {
      throw new Error('Solo el administrador principal puede desactivar la organización');
    }

    organization.status = 'inactive';
    organization.lastActivityAt = Date.now();
    await organization.save();

    return organization;
  }

  /**
   * Reactiva una organización
   * @param {string} organizationId - ID de la organización
   * @param {string} adminId - ID del administrador
   * @returns {Promise<Object>} Organización actualizada
   */
  async activateOrganization(organizationId, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Solo el administrador principal puede reactivar
    if (organization.admin.toString() !== adminId.toString()) {
      throw new Error('Solo el administrador principal puede reactivar la organización');
    }

    organization.status = 'active';
    organization.lastActivityAt = Date.now();
    await organization.save();

    return organization;
  }

  /**
   * Actualiza la configuración de la organización
   * @param {string} organizationId - ID de la organización
   * @param {Object} settings - Nueva configuración
   * @param {string} adminId - ID del administrador
   * @returns {Promise<Object>} Organización actualizada
   */
  async updateSettings(organizationId, settings, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Verificar permisos
    if (!organization.isAdmin(adminId)) {
      throw new Error('No tienes permisos para actualizar la configuración');
    }

    // Actualizar solo los campos de settings proporcionados
    Object.keys(settings).forEach(key => {
      if (organization.settings[key] !== undefined) {
        organization.settings[key] = settings[key];
      }
    });

    organization.lastActivityAt = Date.now();
    await organization.save();

    return organization;
  }

  /**
   * Obtiene estadísticas de la organización
   * @param {string} organizationId - ID de la organización
   * @param {string} userId - ID del usuario que solicita
   * @returns {Promise<Object>} Estadísticas
   */
  async getOrganizationStats(organizationId, userId) {
    const organization = await this.getOrganizationById(organizationId, true);

    // Verificar permisos
    if (!organization.isAdmin(userId)) {
      throw new Error('No tienes permisos para ver las estadísticas');
    }

    const stats = {
      totalEmployees: organization.employees.length,
      activeEmployees: organization.employees.filter(e => e.status === 'active').length,
      pendingEmployees: organization.employees.filter(e => e.status === 'pending').length,
      inactiveEmployees: organization.employees.filter(e => e.status === 'inactive').length,
      projectManagers: organization.employees.filter(e => e.status === 'active' && e.isProjectManager).length,
      totalAdmins: 1 + organization.additionalAdmins.length,
      departments: [...new Set(organization.employees.map(e => e.department).filter(Boolean))],
      isFullyConfigured: organization.isFullyConfigured,
      status: organization.status,
      createdAt: organization.createdAt,
      lastActivityAt: organization.lastActivityAt
    };

    return stats;
  }

  /**
   * Asigna o remueve el rol de jefe de proyecto a un empleado
   * @param {string} organizationId - ID de la organización
   * @param {string} employeeId - ID del empleado
   * @param {boolean} isProjectManager - True para asignar, false para remover
   * @param {string} adminId - ID del administrador que realiza la acción
   * @returns {Promise<Object>} Organización actualizada
   */
  async setProjectManagerRole(organizationId, employeeId, isProjectManager, adminId) {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    // Verificar permisos - solo administradores pueden asignar jefes de proyecto
    if (!organization.isAdmin(adminId)) {
      throw new Error('No tienes permisos para asignar jefes de proyecto');
    }

    // Verificar que el empleado pertenece a la organización
    if (!organization.isEmployee(employeeId)) {
      throw new Error('El empleado no pertenece a esta organización');
    }

    // Asignar/remover el rol
    await organization.setProjectManagerRole(employeeId, isProjectManager);

    // Poblar los datos
    await organization.populate('admin', 'name email avatar');
    await organization.populate('additionalAdmins', 'name email avatar');
    await organization.populate('employees.user', 'name email avatar');

    // Enviar notificación al empleado
    try {
      const employee = await User.findById(employeeId);
      if (employee) {
        await organizationNotificationHelper.notifyProjectManagerRoleChanged(
          organization,
          employee,
          isProjectManager
        );
      }
    } catch (notificationError) {
      console.error('Error enviando notificación de cambio de rol:', notificationError);
    }

    return organization;
  }

  /**
   * Obtiene todos los jefes de proyecto de una organización
   * @param {string} organizationId - ID de la organización
   * @returns {Promise<Array>} Lista de jefes de proyecto
   */
  async getProjectManagers(organizationId) {
    const organization = await Organization.findById(organizationId)
      .populate('employees.user', 'name email avatar');

    if (!organization) {
      throw new Error('Organización no encontrada');
    }

    const projectManagers = organization.employees
      .filter(emp => emp.status === 'active' && emp.isProjectManager)
      .map(emp => ({
        user: emp.user,
        position: emp.position,
        department: emp.department,
        joinedAt: emp.joinedAt
      }));

    return projectManagers;
  }
}

module.exports = new OrganizationService();
