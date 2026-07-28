const organizationNotificationHelper = require('../notification/helpers/organization.helper');
const bfi44NotificationHelper = require('../notification/helpers/bfi44.helper');
const { toStableBfi44Profile } = require('../../utils/bfi44ProfileMapper');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../config/roles');

// Import repositories instead of models
const {
  organizationRepository,
  userRepository,
  bfi44Repository
} = require('../../repositories');

/**
 * Organization Management Service
 * Implements business logic for organization management
 * Following SOLID principles:
 * - Single Responsibility: Exclusive organization management
 * - Dependency Inversion: Depends on abstractions (repositories)
 */
class OrganizationService {
  /**
   * Creates a new organization
   * @param {Object} organizationData - Organization data
   * @param {string} adminId - ID of the admin user
   * @returns {Promise<Object>} Created organization
   */
  async createOrganization(organizationData, adminId) {
    const admin = await userRepository.findById(adminId);
    if (!admin) {
      throw AppError.notFound('USER_NOT_FOUND', 'Admin user not found');
    }

    const existingOrg = await organizationRepository.findOne({
      admin: adminId,
      status: 'active'
    });

    if (existingOrg) {
      throw AppError.conflict('USER_ALREADY_ADMIN', 'User already administers an active organization');
    }

    // Check for duplicate name
    if (organizationData.name) {
      const existingByName = await organizationRepository.findOne({
        name: organizationData.name.trim()
      });
      if (existingByName) {
        throw AppError.conflict('ORGANIZATION_NAME_ALREADY_EXISTS', 'ORGANIZATION_NAME_ALREADY_EXISTS');
      }
    }

    // Create the organization
    const organization = await organizationRepository.create({
      ...organizationData,
      admin: adminId,
      status: 'active',
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    });

    // Update user role and assign organization
    admin.role = ROLES.ORG_ADMIN;
    admin.organization = organization._id;
    await admin.save();

    // Populate admin data
    await organization.populate('admin', 'name email avatar');

    return organization;
  }

  /**
   * Gets an organization by its ID
   * @param {string} organizationId - ID of the organization
   * @param {boolean} includeEmployees - Include employee data
   * @param {string} userId - ID of the requesting user (optional, for permission validation)
   * @returns {Promise<Object>} Found organization
   */
  async getOrganizationById(organizationId, includeEmployees = false, userId = null) {
    const populateOptions = [
      { path: 'admin', select: 'name email avatar role' },
      { path: 'additionalAdmins', select: 'name email avatar role' }
    ];

    if (includeEmployees) {
      populateOptions.push({ path: 'employees.user', select: 'name email avatar' });
    }

    const organization = await organizationRepository.findById(organizationId, {
      populate: populateOptions
    });

    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    // If userId is provided, validate that the user has permission to view the organization
    if (userId) {
      const isAdmin = organization.isAdmin(userId);
      const isEmployee = organization.isEmployee(userId);
      
      if (!isAdmin && !isEmployee) {
        throw AppError.forbidden('UNAUTHORIZED_ACCESS', 'UNAUTHORIZED_ACCESS');
      }
    }

    return organization;
  }

  /**
   * Updates organization data
   * @param {string} organizationId - ID of the organization
   * @param {Object} updateData - Data to update
   * @param {string} userId - ID of the user performing the update
   * @returns {Promise<Object>} Updated organization
   */
  async updateOrganization(organizationId, updateData, userId) {
    const organization = await organizationRepository.findById(organizationId);

    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    if (!organization.isAdmin(userId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to update this organization');
    }

    const protectedFields = ['admin', 'employees', 'additionalAdmins', 'createdAt'];
    protectedFields.forEach(field => delete updateData[field]);

    // Update allowed fields
    Object.assign(organization, updateData);
    organization.lastActivityAt = Date.now();

    await organization.save();
    await organization.populate('admin', 'name email avatar');
    await organization.populate('additionalAdmins', 'name email avatar');

    return organization;
  }

  /**
   * Gets all organizations managed by a user
   * @param {string} userId - ID of the user
   * @returns {Promise<Array>} List of organizations
   */
  async getOrganizationsByAdmin(userId) {
    const organizations = await organizationRepository.findByAdmin(userId);
    return organizations;
  }

  /**
   * Gets organizations where a user is an employee
   * @param {string} userId - ID of the user
   * @returns {Promise<Array>} List of organizations
   */
  async getOrganizationsByEmployee(userId) {
    const organizations = await organizationRepository.find({ 'employees.user': userId });
    return organizations;
  }

  /**
   * Adds an employee to the organization
   * @param {string} organizationId - ID of the organization
   * @param {string} userId - ID of the user to add
   * @param {Object} employeeData - Employee data
   * @param {string} adminId - ID of the admin performing the action
   * @returns {Promise<Object>} Updated organization
   */
  async addEmployee(organizationId, userId, employeeData, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Check permissions
    if (!organization.isAdmin(adminId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to add employees');
    }

    // Verify that the user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('USER_NOT_FOUND', 'User not found');
    }

    // Add the employee
    await organization.addEmployee(userId, employeeData);

    // If user has unassigned role, update it to employee
    if (user.role === ROLES.UNASSIGNED) {
      user.role = ROLES.EMPLOYEE;
      await user.save();
    }

    // Send notification to the added employee
    organizationNotificationHelper.notifyEmployeeAdded(organization, user, employeeData).catch(err => {
      console.error('Error sending employee added notification:', err);
    });

    // Notify about BFI-44 test if not completed
    const hasProfile = await bfi44Repository.userHasCompleted(user._id);
    if (!hasProfile) {
      bfi44NotificationHelper.notifyTestPending(user._id, user.name).catch(err => {
        console.error('Error sending BFI-44 test notification:', err);
      });
    }

    return organization;
  }

  /**
   * Removes an employee from the organization
   * @param {string} organizationId - ID of the organization
   * @param {string} userId - ID of the user to remove
   * @param {string} adminId - ID of the admin performing the action
   * @returns {Promise<Object>} Updated organization
   */
  async removeEmployee(organizationId, userId, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    if (!organization.isAdmin(adminId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to remove employees');
    }

    const user = await userRepository.findById(userId);

    await organization.removeEmployee(userId);

    // Send notification to the removed employee
    if (user) {
      organizationNotificationHelper.notifyEmployeeRemoved(organization, user).catch(err => {
        console.error('Error sending employee removed notification:', err);
      });
    }

    return organization;
  }

  /**
   * Updates an employee's status
   * @param {string} organizationId - ID of the organization
   * @param {string} userId - ID of the user
   * @param {string} newStatus - New status
   * @param {string} adminId - ID of the admin performing the action
   * @returns {Promise<Object>} Updated organization
   */
  async updateEmployeeStatus(organizationId, userId, newStatus, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    if (!organization.isAdmin(adminId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to update employee status');
    }

    await organization.updateEmployeeStatus(userId, newStatus);

    const user = await userRepository.findById(userId);
    if (user) {
      organizationNotificationHelper.notifyEmployeeStatusChanged(organization, user, newStatus).catch(err => {
        console.error('Error sending status change notification:', err);
      });
    }

    return organization;
  }

  /**
   * Adds an additional admin to the organization
   * @param {string} organizationId - ID of the organization
   * @param {string} newAdminId - ID of the user to promote
   * @param {string} currentAdminId - ID of the current admin
   * @returns {Promise<Object>} Updated organization
   */
  async addAdditionalAdmin(organizationId, newAdminId, currentAdminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Only the main admin can add additional admins
    if (organization.admin.toString() !== currentAdminId.toString()) {
      throw AppError.forbidden('ONLY_MAIN_ADMIN', 'Only the main admin can add additional admins');
    }

    // Verify that the user exists
    const user = await userRepository.findById(newAdminId);
    if (!user) {
      throw AppError.notFound('USER_NOT_FOUND', 'User not found');
    }

    await organization.addAdmin(newAdminId);

    // Update user role
    if (user.role === ROLES.EMPLOYEE || user.role === ROLES.UNASSIGNED) {
      user.role = ROLES.ORG_ADMIN;
      await user.save();
    }

    await organization.populate('additionalAdmins', 'name email avatar');

    // Send notification to the new admin
    organizationNotificationHelper.notifyAdminAdded(organization, user).catch(err => {
      console.error('Error sending admin added notification:', err);
    });

    return organization;
  }

  /**
   * Gets organization employees with filters
   * @param {string} organizationId - ID of the organization
   * @param {Object} filters - Search filters
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Array>} List of employees
   */
  async getEmployees(organizationId, filters = {}, userId) {
    const { cvRepository } = require('../../repositories');
    const organization = await this.getOrganizationById(organizationId, true);

    if (!organization.isAdmin(userId) && !organization.isEmployee(userId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to view employees of this organization');
    }

    // Filter out employees with null user (deleted users)
    let employees = organization.employees.filter(emp => emp.user != null);

    // Apply filters
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

    const employeeUserIds = employees.map(emp => emp.user._id);
    const cvs = await cvRepository.find({
      userId: { $in: employeeUserIds },
      organization: organizationId,
      organizationStatus: 'accepted'
    });

    const bfi44Responses = await bfi44Repository.find(
      { user: { $in: employeeUserIds } },
      { select: 'user results completedAt' }
    );

    // Create a userId -> CV map for quick lookup
    const cvMap = new Map();
    cvs.forEach(cv => {
      cvMap.set(cv.userId.toString(), cv);
    });

    // Create a userId -> latest BFI-44 profile map (by completedAt)
    const bfi44Map = new Map();
    for (const response of bfi44Responses) {
      const key = response.user.toString();
      const existing = bfi44Map.get(key);
      if (!existing) {
        bfi44Map.set(key, response);
        continue;
      }
      const existingCompletedAt = existing.completedAt ? new Date(existing.completedAt).getTime() : 0;
      const candidateCompletedAt = response.completedAt ? new Date(response.completedAt).getTime() : 0;
      if (candidateCompletedAt >= existingCompletedAt) {
        bfi44Map.set(key, response);
      }
    }

    // Add CV to each employee
    const employeesWithCV = employees.map(emp => {
      const employeeObj = emp.toObject ? emp.toObject() : emp;
      const cv = cvMap.get(emp.user._id.toString());
      const stableProfile = toStableBfi44Profile(bfi44Map.get(emp.user._id.toString())?.results || null);
      
      return {
        ...employeeObj,
        user: employeeObj.user
          ? {
              ...employeeObj.user,
              bfi44Profile: stableProfile
            }
          : employeeObj.user,
        cv: cv || null,
        hasCv: !!cv
      };
    });

    // Apply pagination if requested
    if (filters.page || filters.limit) {
      const page = Math.max(1, parseInt(filters.page) || 1);
      const limit = Math.min(100, parseInt(filters.limit) || 50);
      const total = employeesWithCV.length;
      const start = (page - 1) * limit;
      return {
        data: employeesWithCV.slice(start, start + limit),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      };
    }

    return { data: employeesWithCV };
  }

  /**
   * Searches organizations with filters and pagination
   * @param {Object} filters - Search filters
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Result with organizations and metadata
   */
  async searchOrganizations(filters = {}, pagination = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const query = {};

    // Apply filters
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
      const escaped = filters.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: escaped, $options: 'i' };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [organizations, total] = await Promise.all([
      organizationRepository.find(
        query,
        {
          populate: [{ path: 'admin', select: 'name email avatar' }],
          sort: sortOptions,
          skip,
          limit
        }
      ),
      organizationRepository.count(query)
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
   * Deactivates an organization
   * @param {string} organizationId - ID of the organization
   * @param {string} adminId - ID of the admin
   * @returns {Promise<Object>} Updated organization
   */
  async deactivateOrganization(organizationId, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Only the main admin can deactivate
    if (organization.admin.toString() !== adminId.toString()) {
      throw AppError.forbidden('ONLY_MAIN_ADMIN', 'Only the main administrator can deactivate the organization');
    }

    organization.status = 'inactive';
    organization.lastActivityAt = Date.now();
    await organization.save();

    return organization;
  }

  /**
   * Reactivates an organization
   * @param {string} organizationId - ID of the organization
   * @param {string} adminId - ID of the admin
   * @returns {Promise<Object>} Updated organization
   */
  async activateOrganization(organizationId, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Only the main admin can reactivate
    if (organization.admin.toString() !== adminId.toString()) {
      throw AppError.forbidden('ONLY_MAIN_ADMIN', 'Only the main administrator can reactivate the organization');
    }

    organization.status = 'active';
    organization.lastActivityAt = Date.now();
    await organization.save();

    return organization;
  }

  /**
   * Updates organization settings
   * @param {string} organizationId - ID of the organization
   * @param {Object} settings - New settings
   * @param {string} adminId - ID of the admin
   * @returns {Promise<Object>} Updated organization
   */
  async updateSettings(organizationId, settings, adminId) {
    const organization = await this.getOrganizationById(organizationId);

    // Check permissions
    if (!organization.isAdmin(adminId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to update the configuration');
    }

    // Update only the provided settings fields
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
   * Gets organization statistics
   * @param {string} organizationId - ID of the organization
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Object>} Statistics
   */
  async getOrganizationStats(organizationId, userId) {
    const organization = await this.getOrganizationById(organizationId, true);

    // Check permissions
    if (!organization.isAdmin(userId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to view the statistics');
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
   * Assigns or removes the project manager role from an employee
   * @param {string} organizationId - ID of the organization
   * @param {string} employeeId - ID of the employee
   * @param {boolean} isProjectManager - True to assign, false to remove
   * @param {string} adminId - ID of the admin performing the action
   * @returns {Promise<Object>} Updated organization
   */
  async setProjectManagerRole(organizationId, employeeId, isProjectManager, adminId) {
    const organization = await organizationRepository.findById(organizationId);

    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    if (!organization.isAdmin(adminId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to assign project managers');
    }

    if (!organization.isEmployee(employeeId)) {
      throw AppError.badRequest('EMPLOYEE_NOT_IN_ORG', 'Employee does not belong to this organization');
    }

    await organization.setProjectManagerRole(employeeId, isProjectManager);

    await organization.populate('admin', 'name email avatar');
    await organization.populate('additionalAdmins', 'name email avatar');
    await organization.populate('employees.user', 'name email avatar');

    // Send notification to the employee
    try {
      const employee = await userRepository.findById(employeeId);
      if (employee) {
        await organizationNotificationHelper.notifyProjectManagerRoleChanged(
          organization,
          employee,
          isProjectManager
        );
      }
    } catch (notificationError) {
      console.error('Error sending role change notification:', notificationError);
    }

    return organization;
  }

  /**
   * Gets all project managers of an organization
   * @param {string} organizationId - ID of the organization
   * @returns {Promise<Array>} List of project managers
   */
  async getProjectManagers(organizationId) {
    const organization = await organizationRepository.findById(
      organizationId,
      { populate: [{ path: 'employees.user', select: 'name email avatar' }] }
    );

    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
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
