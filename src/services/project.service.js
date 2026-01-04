const Project = require('../models/project.model');
const Organization = require('../models/organization.model');
const User = require('../models/user.model');
const projectNotificationHelper = require('./projectNotificationHelper');
const teamSelectionService = require('./teamSelection.service');
const AppError = require('../utils/AppError');

/**
 * Project Service
 * Implements business logic for project management
 * Following SOLID principles:
 * - Single Responsibility: Exclusive project management
 * - Dependency Inversion: Depends on abstractions (models)
 * - Open/Closed: Extensible without modification
 */
class ProjectService {
  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectManagerId - ID of the project manager
   * @param {string} organizationId - ID of the organization
   * @returns {Promise<Object>} Created project
   */
  async createProject(projectData, projectManagerId, organizationId) {
    // Validate organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    // Validate user is a project manager in the organization
    if (!organization.isProjectManager(projectManagerId)) {
      throw AppError.forbidden('NOT_PROJECT_MANAGER', 'User is not authorized as a project manager in this organization');
    }

    // Validate project manager exists
    const projectManager = await User.findById(projectManagerId);
    if (!projectManager) {
      throw AppError.notFound('PROJECT_MANAGER_NOT_FOUND', 'Project manager not found');
    }

    // Create project
    const project = new Project({
      ...projectData,
      organization: organizationId,
      projectManager: projectManagerId,
      status: 'draft',
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    });

    await project.save();

    // NO asignar equipo automáticamente
    // El PM debe solicitar recomendaciones usando:
    // - GET /api/projects/:id/team-analysis (para ver sugerencia de equipo)
    // - POST /api/projects/suggest-team (para ver opciones antes de crear)
    // - POST /api/projects/:id/assign (para asignar manualmente cada empleado)

    // Populate relationships
    await project.populate('organization', 'name');
    await project.populate('projectManager', 'name email avatar');
    await project.populate('assignedEmployees.user', 'name email avatar');

    // Send notification about project creation
    try {
      await projectNotificationHelper.notifyProjectCreated(project, organization);
    } catch (notificationError) {
      console.error('Error sending project creation notification:', notificationError);
    }

    return project;
  }

  /**
   * Get a project by ID
   * @param {string} projectId - Project ID
   * @param {boolean} includeAssignedEmployees - Include assigned employees data
   * @returns {Promise<Object>} Found project
   */
  async getProjectById(projectId, includeAssignedEmployees = false) {
    let query = Project.findById(projectId)
      .populate('organization', 'name')
      .populate('projectManager', 'name email avatar');

    if (includeAssignedEmployees) {
      query = query.populate('assignedEmployees.user', 'name email avatar');
    }

    const project = await query;

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    return project;
  }

  /**
   * Update project data
   * @param {string} projectId - Project ID
   * @param {Object} updateData - Data to update
   * @param {string} userId - ID of user making the update
   * @returns {Promise<Object>} Updated project
   */
  async updateProject(projectId, updateData, userId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions: only project manager or organization admin
    const organization = await Organization.findById(project.organization);
    if (!project.isProjectManager(userId) && !organization.isAdmin(userId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to update this project');
    }

    // Fields that cannot be directly modified
    const restrictedFields = ['_id', 'organization', 'projectManager', 'createdAt'];
    restrictedFields.forEach(field => delete updateData[field]);

    // Update fields
    Object.assign(project, updateData);
    project.lastActivityAt = Date.now();

    await project.save();

    // Populate relationships
    await project.populate('organization', 'name');
    await project.populate('projectManager', 'name email avatar');
    await project.populate('assignedEmployees.user', 'name email avatar');

    // Send notification about project update
    try {
      await projectNotificationHelper.notifyProjectUpdated(project, organization);
    } catch (notificationError) {
      console.error('Error sending project update notification:', notificationError);
    }

    return project;
  }

  /**
   * Delete a project
   * @param {string} projectId - Project ID
   * @param {string} userId - ID of user performing deletion
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProject(projectId, userId) {
    const project = await Project.findById(projectId);

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions: only organization admin can delete
    const organization = await Organization.findById(project.organization);
    if (!organization.isAdmin(userId)) {
      throw AppError.forbidden('ADMIN_ONLY', 'Only organization administrators can delete projects');
    }

    // Send notification before deletion
    try {
      await projectNotificationHelper.notifyProjectDeleted(project, organization);
    } catch (notificationError) {
      console.error('Error sending project deletion notification:', notificationError);
    }

    await Project.findByIdAndDelete(projectId);

    return { message: 'Project successfully deleted', projectId };
  }

  /**
   * Get all projects for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of projects
   */
  async getProjectsByOrganization(organizationId, filters = {}) {
    const query = { organization: organizationId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.projectManager) {
      query.projectManager = filters.projectManager;
    }

    const projects = await Project.find(query)
      .populate('projectManager', 'name email avatar')
      .populate('assignedEmployees.user', 'name email avatar')
      .sort({ createdAt: -1 });

    return projects;
  }

  /**
   * Get all projects managed by a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of projects
   */
  async getProjectsByManager(userId, filters = {}) {
    const query = { projectManager: userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.organizationId) {
      query.organization = filters.organizationId;
    }

    const projects = await Project.find(query)
      .populate('organization', 'name')
      .populate('assignedEmployees.user', 'name email avatar')
      .sort({ createdAt: -1 });

    return projects;
  }

  /**
   * Get all projects where user is assigned
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of projects
   */
  async getProjectsByAssignedEmployee(userId) {
    const projects = await Project.findByAssignedEmployee(userId);
    return projects;
  }

  /**
   * Assign an employee to a project
   * @param {string} projectId - Project ID
   * @param {string} employeeId - Employee ID
   * @param {string} assignedRole - Role to assign
   * @param {string} requesterId - ID of user making the assignment
   * @returns {Promise<Object>} Updated project
   */
  async assignEmployeeToProject(projectId, employeeId, assignedRole, requesterId) {
    const project = await Project.findById(projectId)
      .populate('organization')
      .populate('projectManager', 'name email avatar');

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions: project manager or organization admin
    if (!project.isProjectManager(requesterId) && !project.organization.isAdmin(requesterId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to assign employees to this project');
    }

    // Verify employee belongs to organization
    if (!project.organization.isEmployee(employeeId)) {
      throw AppError.badRequest('NOT_IN_ORGANIZATION', 'Employee does not belong to this organization');
    }

    // Assign employee
    await project.assignEmployee(employeeId, assignedRole);

    // Populate assigned employees
    await project.populate('assignedEmployees.user', 'name email avatar');

    // Send notification
    try {
      const employee = await User.findById(employeeId);
      await projectNotificationHelper.notifyEmployeeAssigned(
        project,
        employee,
        project.organization
      );
    } catch (notificationError) {
      console.error('Error sending assignment notification:', notificationError);
    }

    return project;
  }

  /**
   * Remove an employee from a project
   * @param {string} projectId - Project ID
   * @param {string} employeeId - Employee ID
   * @param {string} requesterId - ID of user making the removal
   * @returns {Promise<Object>} Updated project
   */
  async removeEmployeeFromProject(projectId, employeeId, requesterId) {
    const project = await Project.findById(projectId)
      .populate('organization')
      .populate('projectManager', 'name email avatar');

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions
    if (!project.isProjectManager(requesterId) && !project.organization.isAdmin(requesterId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to remove employees from this project');
    }

    // Send notification before removal
    try {
      const employee = await User.findById(employeeId);
      await projectNotificationHelper.notifyEmployeeRemoved(
        project,
        employee,
        project.organization
      );
    } catch (notificationError) {
      console.error('Error sending removal notification:', notificationError);
    }

    // Remove employee
    await project.removeEmployee(employeeId);

    await project.populate('assignedEmployees.user', 'name email avatar');

    return project;
  }

  /**
   * Activate a project (change from draft to active)
   * @param {string} projectId - Project ID
   * @param {string} userId - ID of user activating the project
   * @returns {Promise<Object>} Activated project
   */
  async activateProject(projectId, userId) {
    const project = await Project.findById(projectId)
      .populate('organization')
      .populate('projectManager', 'name email avatar');

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions
    if (!project.isProjectManager(userId) && !project.organization.isAdmin(userId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to activate this project');
    }

    if (project.status !== 'draft') {
      throw AppError.badRequest('INVALID_STATUS', 'Only draft projects can be activated');
    }

    await project.activate();

    await project.populate('assignedEmployees.user', 'name email avatar');

    // Send notification
    try {
      await projectNotificationHelper.notifyProjectActivated(project, project.organization);
    } catch (notificationError) {
      console.error('Error sending activation notification:', notificationError);
    }

    return project;
  }

  /**
   * Complete a project
   * @param {string} projectId - Project ID
   * @param {string} userId - ID of user completing the project
   * @returns {Promise<Object>} Completed project
   */
  async completeProject(projectId, userId) {
    const project = await Project.findById(projectId)
      .populate('organization')
      .populate('projectManager', 'name email avatar');

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions
    if (!project.isProjectManager(userId) && !project.organization.isAdmin(userId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to complete this project');
    }

    if (project.status !== 'active') {
      throw AppError.badRequest('INVALID_STATUS', 'Only active projects can be completed');
    }

    await project.complete();

    await project.populate('assignedEmployees.user', 'name email avatar');

    // Send notification
    try {
      await projectNotificationHelper.notifyProjectCompleted(project, project.organization);
    } catch (notificationError) {
      console.error('Error sending completion notification:', notificationError);
    }

    return project;
  }

  /**
   * Cancel a project
   * @param {string} projectId - Project ID
   * @param {string} userId - ID of user canceling the project
   * @returns {Promise<Object>} Cancelled project
   */
  async cancelProject(projectId, userId) {
    const project = await Project.findById(projectId)
      .populate('organization')
      .populate('projectManager', 'name email avatar');

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Only organization admin can cancel
    if (!project.organization.isAdmin(userId)) {
      throw AppError.forbidden('ADMIN_ONLY', 'Only organization administrators can cancel projects');
    }

    if (project.status === 'completed' || project.status === 'cancelled') {
      throw AppError.badRequest('INVALID_STATUS', 'Cannot cancel a project that is already completed or cancelled');
    }

    await project.cancel();

    await project.populate('assignedEmployees.user', 'name email avatar');

    // Send notification
    try {
      await projectNotificationHelper.notifyProjectCancelled(project, project.organization);
    } catch (notificationError) {
      console.error('Error sending cancellation notification:', notificationError);
    }

    return project;
  }

  /**
   * Get project statistics for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} Project statistics
   */
  async getProjectStatistics(organizationId) {
    const projects = await Project.find({ organization: organizationId });

    const stats = {
      total: projects.length,
      byStatus: {
        draft: 0,
        active: 0,
        paused: 0,
        completed: 0,
        cancelled: 0
      },
      totalAssignedEmployees: 0
    };

    projects.forEach(project => {
      stats.byStatus[project.status]++;
      stats.totalAssignedEmployees += project.assignedEmployeesCount;
    });

    return stats;
  }
}

module.exports = new ProjectService();
