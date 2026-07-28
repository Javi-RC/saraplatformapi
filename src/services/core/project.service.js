const projectNotificationHelper = require('../notification/helpers/project.helper');
const teamSelectionService = require('../team/teamSelection.service');
const AppError = require('../../utils/AppError');
const { toStableBfi44Profile } = require('../../utils/bfi44ProfileMapper');

// Import repositories instead of models
const {
  projectRepository,
  organizationRepository,
  userRepository,
  cvRepository,
  bfi44Repository,
  riskRepository,
  caseBaseRepository
} = require('../../repositories');

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
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw AppError.notFound('ORGANIZATION_NOT_FOUND', 'Organization not found');
    }

    if (!organization.isProjectManager(projectManagerId)) {
      throw AppError.forbidden('NOT_PROJECT_MANAGER', 'User is not authorized as a project manager in this organization');
    }

    const projectManager = await userRepository.findById(projectManagerId);
    if (!projectManager) {
      throw AppError.notFound('PROJECT_MANAGER_NOT_FOUND', 'Project manager not found');
    }

    const project = await projectRepository.create({
      ...projectData,
      organization: organizationId,
      projectManager: projectManagerId,
      status: 'draft',
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    });

    // Do not auto-assign team
    // The PM must request recommendations using:
    // - GET /api/projects/:id/team-analysis (to view team suggestion)
    // - POST /api/projects/suggest-team (to view options before creating)
    // - POST /api/projects/:id/assign (to manually assign each employee)

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
    const populateOptions = [
      { path: 'organization', select: 'name' },
      { path: 'projectManager', select: 'name email avatar' }
    ];

    if (includeAssignedEmployees) {
      populateOptions.push({ path: 'assignedEmployees.user', select: 'name email avatar' });
    }

    const project = await projectRepository.findById(projectId, {
      populate: populateOptions
    });

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // If employees are requested, load curricula and BFI44 profiles
    if (includeAssignedEmployees && project.assignedEmployees && project.assignedEmployees.length > 0) {
      const teamMemberIds = project.assignedEmployees
        .filter(emp => emp.user != null)
        .map(emp => emp.user._id || emp.user);
      
      // Get team member curricula
      const cvs = await cvRepository.find({ 
        userId: { $in: teamMemberIds },
        organizationStatus: 'accepted'
      });
      
      // Get team member BFI44 profiles
      const bfi44Profiles = await bfi44Repository.find({
        userId: { $in: teamMemberIds }
      });
      
      // Create maps for quick access
      const cvMap = new Map();
      cvs.forEach(cv => cvMap.set(cv.userId.toString(), cv.toObject()));
      
      const bfi44Map = new Map();
      bfi44Profiles.forEach(profile => bfi44Map.set(profile.userId.toString(), profile));
      
      // Convert project to plain object for modification
      const projectObj = project.toObject();
      
      // Add curricula and BFI44 profiles to users
      projectObj.assignedEmployees = projectObj.assignedEmployees.map(emp => {
        if (emp.user) {
          const userId = (emp.user._id || emp.user).toString();
          const stableProfile = toStableBfi44Profile(bfi44Map.get(userId)?.results || null);
          
          return {
            ...emp,
            user: {
              ...emp.user,
              cv: cvMap.get(userId) || null,
              bfi44Profile: stableProfile
            }
          };
        }
        return emp;
      });
      
      return projectObj;
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
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions: only project manager or organization admin
    const organization = await organizationRepository.findById(project.organization);
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
    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions: only organization admin can delete
    const organization = await organizationRepository.findById(project.organization);
    if (!organization.isAdmin(userId)) {
      throw AppError.forbidden('ADMIN_ONLY', 'Only organization administrators can delete projects');
    }

    // Send notification before deletion
    try {
      await projectNotificationHelper.notifyProjectDeleted(project, organization);
    } catch (notificationError) {
      console.error('Error sending project deletion notification:', notificationError);
    }

    await projectRepository.deleteById(projectId);

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

    const paginate = filters.page || filters.limit;
    const page = Math.max(1, parseInt(filters.page) || 1);
    const limit = Math.min(100, parseInt(filters.limit) || 50);

    const queryOpts = {
      populate: [
        { path: 'projectManager', select: 'name email avatar' },
        { path: 'assignedEmployees.user', select: 'name email avatar' }
      ],
      sort: { createdAt: -1 }
    };

    if (paginate) {
      queryOpts.skip = (page - 1) * limit;
      queryOpts.limit = limit;
    }

    const [projects, total] = await Promise.all([
      projectRepository.find(query, queryOpts),
      paginate ? projectRepository.count(query) : Promise.resolve(null)
    ]);

    if (paginate) {
      return {
        data: projects,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      };
    }

    return { data: projects };
  }

  /**
   * Get all projects managed by a user
   * Also includes projects from organizations where the user is an administrator
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of projects
   */
  async getProjectsByManager(userId, filters = {}) {
    // First, get projects where user is the project manager
    const query = { projectManager: userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.organizationId) {
      query.organization = filters.organizationId;
    }

    const managedProjects = await projectRepository.find(query, {
      populate: [
        { path: 'organization', select: 'name' },
        { path: 'assignedEmployees.user', select: 'name email avatar' }
      ],
      sort: { createdAt: -1 }
    });

    // Get organizations where user is admin (primary or additional)
    const organizations = await organizationRepository.find({
      $or: [
        { admin: userId },
        { additionalAdmins: userId }
      ]
    });

    // If no organizations where user is admin, return only managed projects
    if (organizations.length === 0) {
      return managedProjects;
    }

    // Get all projects from organizations where user is admin
    const organizationIds = organizations.map(org => org._id);
    
    const adminQuery = {
      organization: { $in: organizationIds },
      projectManager: { $ne: userId } // Exclude projects already in managedProjects
    };

    if (filters.status) {
      adminQuery.status = filters.status;
    }

    if (filters.organizationId) {
      adminQuery.organization = filters.organizationId;
    }

    const adminProjects = await projectRepository.find(adminQuery, {
      populate: [
        { path: 'organization', select: 'name' },
        { path: 'assignedEmployees.user', select: 'name email avatar' }
      ],
      sort: { createdAt: -1 }
    });

    // Combine and return all projects
    return [...managedProjects, ...adminProjects];
  }

  /**
   * Get all projects where user is assigned
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of projects
   */
  async getProjectsByAssignedEmployee(userId) {
    const projects = await projectRepository.findByAssignedUser(userId);
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
    const project = await projectRepository.findById(projectId, {
      populate: [
        'organization',
        { path: 'projectManager', select: 'name email avatar' }
      ]
    });

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

    // OPTIMIZATION: Invalidate synergy cache (will recalculate on next request)
    // This is lightweight and doesn't block the response
    const teamSynergyService = require('../team/teamSynergy.service');
    teamSynergyService.invalidateCache(projectId).catch(err => {
      console.error('Error invalidating synergy cache:', err);
    });

    // Send notification
    try {
      const employee = await userRepository.findById(employeeId);
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
    const project = await projectRepository.findById(projectId, {
      populate: [
        'organization',
        { path: 'projectManager', select: 'name email avatar' }
      ]
    });

    if (!project) {
      throw AppError.notFound('PROJECT_NOT_FOUND', 'Project not found');
    }

    // Verify permissions
    if (!project.isProjectManager(requesterId) && !project.organization.isAdmin(requesterId)) {
      throw AppError.forbidden('NO_PERMISSION', 'You do not have permission to remove employees from this project');
    }

    // Send notification before removal
    try {
      const employee = await userRepository.findById(employeeId);
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

    // OPTIMIZATION: Invalidate synergy cache after removal
    const teamSynergyService = require('../team/teamSynergy.service');
    teamSynergyService.invalidateCache(projectId).catch(err => {
      console.error('Error invalidating synergy cache:', err);
    });

    return project;
  }

  /**
   * Activate a project (change from draft to active)
   * @param {string} projectId - Project ID
   * @param {string} userId - ID of user activating the project
   * @returns {Promise<Object>} Activated project
   */
  async activateProject(projectId, userId) {
    const project = await projectRepository.findById(projectId, {
      populate: [
        'organization',
        { path: 'projectManager', select: 'name email avatar' }
      ]
    });

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
   * Auto-save manual risks to CBR when project is completed
   * This ensures manual risks are captured even if post-project form is not filled
   * @param {string} projectId - Project ID
   */
  async autoSaveManualRisksToCBR(projectId) {
    const cbrService = require('../risk/cbr.service');

    // Check if case already exists (avoid duplicates)
    const existingCase = await caseBaseRepository.findOne({ caseId: projectId });
    if (existingCase) {
      return;
    }

    // Get project with all necessary data
    const project = await projectRepository.findById(projectId, {
      populate: 'organization'
    });

    if (!project || !project.organization) {
      return;
    }

    // Get all relevant risks: manual + predicted that occurred
    const allRisks = await riskRepository.find({
      project: projectId,
      $or: [
        { source: 'manual' },
        { source: { $ne: 'manual' }, occurred: true }
      ]
    });

    if (allRisks.length === 0) {
      return;
    }

    // Transform risks to actualized risks format with originalSource tracking
    const actualizedRisks = allRisks.map(risk => ({
      type: risk.type,
      title: risk.title,
      occurred: risk.occurred !== false,
      severity: risk.severity,
      description: risk.description,
      rootCause: risk.rootCause,
      originalSource: risk.source,
      mitigationStrategies: risk.mitigationStrategies || []
    }));

    // Calculate basic metrics
    const delayDays = project.actualEndDate && project.estimatedEndDate
      ? Math.max(0, Math.ceil((project.actualEndDate - project.estimatedEndDate) / (1000 * 60 * 60 * 24)))
      : 0;

    // Create minimal post-project data for CBR
    const postProjectData = {
      completed: true,
      onTime: delayDays === 0,
      delayDays,
      budgetOverrun: 0,
      qualityScore: 3,
      clientSatisfaction: 3,
      teamMorale: 3,
      actualRisks: actualizedRisks,
      metrics: {},
      completedAt: project.actualEndDate || new Date(),
      lessonsLearned: [],
      successfulPractices: [],
      unsuccessfulPractices: [],
      recommendations: []
    };

    // Save to CBR
    await cbrService.retainCase(project, postProjectData, project.organization);
  }

  /**
   * Complete a project
   * @param {string} projectId - Project ID
   * @param {string} userId - ID of user completing the project
   * @returns {Promise<Object>} Completed project
   */
  async completeProject(projectId, userId) {
    const project = await projectRepository.findById(projectId, {
      populate: [
        'organization',
        { path: 'projectManager', select: 'name email avatar' }
      ]
    });

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

    // Automatically save manual risks to CBR when completing project
    try {
      await this.autoSaveManualRisksToCBR(projectId);
    } catch (cbrError) {
      console.error('Error auto-saving manual risks to CBR:', cbrError);
      // Don't block project completion if CBR save fails
    }

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
    const project = await projectRepository.findById(projectId, {
      populate: [
        'organization',
        { path: 'projectManager', select: 'name email avatar' }
      ]
    });

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
    const projects = await projectRepository.findByOrganization(organizationId);

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
