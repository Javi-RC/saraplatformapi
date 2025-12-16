const notificationService = require('./notification.service');
const { NotificationTypes, NotificationPriority, NotificationChannels } = require('../models/notification.model');

/**
 * Project Notification Helper
 * Manages creation of project-specific notifications
 * Following Single Responsibility Principle (SRP)
 */
class ProjectNotificationHelper {
  /**
   * Extract ID from object or return string directly
   * Handles both ObjectIds and populated objects
   * @param {Object|string} obj - Object with _id or string ID
   * @returns {string} ID as string
   */
  _extractId(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj._id) return obj._id.toString();
    return obj.toString();
  }

  /**
   * Notify when a project is created
   * @param {Object} project - Created project
   * @param {Object} organization - Organization owning the project
   */
  async notifyProjectCreated(project, organization) {
    try {
      // Notify organization administrators
      const adminIds = [
        this._extractId(organization.admin),
        ...organization.additionalAdmins.map(admin => this._extractId(admin))
      ].filter(id => id !== null);

      // Filter out the project manager (who created it)
      const projectManagerId = this._extractId(project.projectManager);
      const adminsToNotify = adminIds.filter(adminId => adminId !== projectManagerId);

      if (adminsToNotify.length === 0) {
        console.log('No administrators to notify about project creation');
        return;
      }

      const notificationPromises = adminsToNotify.map(adminId =>
        notificationService.create({
          recipientId: adminId,
          type: NotificationTypes.PROJECT_CREATED,
          title: 'New project created',
          message: `A new project "${project.projectName}" has been created in ${organization.name}`,
          channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
          priority: NotificationPriority.MEDIUM,
          metadata: {
            projectId: this._extractId(project),
            projectName: project.projectName,
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            projectManagerId: projectManagerId,
            projectManagerName: project.projectManager.name || 'Unknown',
            createdAt: project.createdAt
          },
          actionUrl: `/projects/${this._extractId(project)}`,
          actionText: 'View project'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Project creation notifications sent to ${adminsToNotify.length} administrators`);
    } catch (error) {
      console.error('Error notifying project creation:', error);
    }
  }

  /**
   * Notify when a project is updated
   * @param {Object} project - Updated project
   * @param {Object} organization - Organization owning the project
   */
  async notifyProjectUpdated(project, organization) {
    try {
      // Notify organization administrators and assigned employees (not the person who updated)
      const adminIds = [
        this._extractId(organization.admin),
        ...organization.additionalAdmins.map(admin => this._extractId(admin))
      ].filter(id => id !== null);

      const projectManagerId = this._extractId(project.projectManager);
      
      // Get assigned employees IDs
      const assignedEmployeeIds = project.assignedEmployees
        ? project.assignedEmployees.map(emp => this._extractId(emp.user))
        : [];

      // Combine all recipients and remove duplicates
      const allRecipients = [...new Set([...adminIds, projectManagerId, ...assignedEmployeeIds])];

      if (allRecipients.length === 0) {
        return;
      }

      const notificationPromises = allRecipients.map(recipientId =>
        notificationService.create({
          recipientId: recipientId,
          type: NotificationTypes.PROJECT_UPDATED,
          title: 'Project updated',
          message: `Project "${project.projectName}" has been updated`,
          channels: [NotificationChannels.IN_APP],
          priority: NotificationPriority.LOW,
          metadata: {
            projectId: this._extractId(project),
            projectName: project.projectName,
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            updatedAt: project.updatedAt
          },
          actionUrl: `/projects/${this._extractId(project)}`,
          actionText: 'View project'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Project update notifications sent to ${allRecipients.length} users`);
    } catch (error) {
      console.error('Error notifying project update:', error);
    }
  }

  /**
   * Notify when a project is deleted
   * @param {Object} project - Deleted project
   * @param {Object} organization - Organization owning the project
   */
  async notifyProjectDeleted(project, organization) {
    try {
      // Notify project manager and assigned employees
      const projectManagerId = this._extractId(project.projectManager);
      
      const assignedEmployeeIds = project.assignedEmployees
        ? project.assignedEmployees.map(emp => this._extractId(emp.user))
        : [];

      const recipients = [projectManagerId, ...assignedEmployeeIds].filter(id => id !== null);

      if (recipients.length === 0) {
        return;
      }

      const notificationPromises = recipients.map(recipientId =>
        notificationService.create({
          recipientId: recipientId,
          type: NotificationTypes.PROJECT_DELETED,
          title: 'Project deleted',
          message: `Project "${project.projectName}" has been deleted by an administrator`,
          channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
          priority: NotificationPriority.HIGH,
          metadata: {
            projectId: this._extractId(project),
            projectName: project.projectName,
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            deletedAt: new Date()
          }
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Project deletion notifications sent to ${recipients.length} users`);
    } catch (error) {
      console.error('Error notifying project deletion:', error);
    }
  }

  /**
   * Notify when a project is activated
   * @param {Object} project - Activated project
   * @param {Object} organization - Organization owning the project
   */
  async notifyProjectActivated(project, organization) {
    try {
      // Notify organization administrators and assigned employees
      const adminIds = [
        this._extractId(organization.admin),
        ...organization.additionalAdmins.map(admin => this._extractId(admin))
      ].filter(id => id !== null);

      const assignedEmployeeIds = project.assignedEmployees
        ? project.assignedEmployees.map(emp => this._extractId(emp.user))
        : [];

      const recipients = [...new Set([...adminIds, ...assignedEmployeeIds])];

      if (recipients.length === 0) {
        return;
      }

      const notificationPromises = recipients.map(recipientId =>
        notificationService.create({
          recipientId: recipientId,
          type: NotificationTypes.PROJECT_ACTIVATED,
          title: 'Project activated',
          message: `Project "${project.projectName}" is now active`,
          channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
          priority: NotificationPriority.HIGH,
          metadata: {
            projectId: this._extractId(project),
            projectName: project.projectName,
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            activatedAt: project.actualStartDate || new Date()
          },
          actionUrl: `/projects/${this._extractId(project)}`,
          actionText: 'View project'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Project activation notifications sent to ${recipients.length} users`);
    } catch (error) {
      console.error('Error notifying project activation:', error);
    }
  }

  /**
   * Notify when a project is completed
   * @param {Object} project - Completed project
   * @param {Object} organization - Organization owning the project
   */
  async notifyProjectCompleted(project, organization) {
    try {
      // Notify organization administrators, project manager, and assigned employees
      const adminIds = [
        this._extractId(organization.admin),
        ...organization.additionalAdmins.map(admin => this._extractId(admin))
      ].filter(id => id !== null);

      const projectManagerId = this._extractId(project.projectManager);
      
      const assignedEmployeeIds = project.assignedEmployees
        ? project.assignedEmployees.map(emp => this._extractId(emp.user))
        : [];

      const recipients = [...new Set([...adminIds, projectManagerId, ...assignedEmployeeIds])];

      if (recipients.length === 0) {
        return;
      }

      const notificationPromises = recipients.map(recipientId =>
        notificationService.create({
          recipientId: recipientId,
          type: NotificationTypes.PROJECT_COMPLETED,
          title: 'Project completed',
          message: `Project "${project.projectName}" has been successfully completed`,
          channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
          priority: NotificationPriority.HIGH,
          metadata: {
            projectId: this._extractId(project),
            projectName: project.projectName,
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            completedAt: project.actualEndDate || new Date()
          },
          actionUrl: `/projects/${this._extractId(project)}`,
          actionText: 'View project'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Project completion notifications sent to ${recipients.length} users`);
    } catch (error) {
      console.error('Error notifying project completion:', error);
    }
  }

  /**
   * Notify when a project is cancelled
   * @param {Object} project - Cancelled project
   * @param {Object} organization - Organization owning the project
   */
  async notifyProjectCancelled(project, organization) {
    try {
      // Notify all involved parties
      const adminIds = [
        this._extractId(organization.admin),
        ...organization.additionalAdmins.map(admin => this._extractId(admin))
      ].filter(id => id !== null);

      const projectManagerId = this._extractId(project.projectManager);
      
      const assignedEmployeeIds = project.assignedEmployees
        ? project.assignedEmployees.map(emp => this._extractId(emp.user))
        : [];

      const recipients = [...new Set([...adminIds, projectManagerId, ...assignedEmployeeIds])];

      if (recipients.length === 0) {
        return;
      }

      const notificationPromises = recipients.map(recipientId =>
        notificationService.create({
          recipientId: recipientId,
          type: NotificationTypes.PROJECT_CANCELLED,
          title: 'Project cancelled',
          message: `Project "${project.projectName}" has been cancelled`,
          channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
          priority: NotificationPriority.HIGH,
          metadata: {
            projectId: this._extractId(project),
            projectName: project.projectName,
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            cancelledAt: new Date()
          },
          actionUrl: `/projects/${this._extractId(project)}`,
          actionText: 'View project'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Project cancellation notifications sent to ${recipients.length} users`);
    } catch (error) {
      console.error('Error notifying project cancellation:', error);
    }
  }

  /**
   * Notify when an employee is assigned to a project
   * @param {Object} project - Project
   * @param {Object} employee - Employee assigned
   * @param {Object} organization - Organization owning the project
   */
  async notifyEmployeeAssigned(project, employee, organization) {
    try {
      const employeeId = this._extractId(employee);

      await notificationService.create({
        recipientId: employeeId,
        type: NotificationTypes.ASSIGNED_TO_PROJECT,
        title: 'Assigned to project',
        message: `You have been assigned to project "${project.projectName}"`,
        channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
        priority: NotificationPriority.HIGH,
        metadata: {
          projectId: this._extractId(project),
          projectName: project.projectName,
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          projectManagerId: this._extractId(project.projectManager),
          projectManagerName: project.projectManager.name || 'Unknown',
          assignedAt: new Date()
        },
        actionUrl: `/projects/${this._extractId(project)}`,
        actionText: 'View project'
      });

      console.log(`Assignment notification sent to employee ${employee.name || employee.email}`);
    } catch (error) {
      console.error('Error notifying employee assignment:', error);
    }
  }

  /**
   * Notify when an employee is removed from a project
   * @param {Object} project - Project
   * @param {Object} employee - Employee removed
   * @param {Object} organization - Organization owning the project
   */
  async notifyEmployeeRemoved(project, employee, organization) {
    try {
      const employeeId = this._extractId(employee);

      await notificationService.create({
        recipientId: employeeId,
        type: NotificationTypes.REMOVED_FROM_PROJECT,
        title: 'Removed from project',
        message: `You have been removed from project "${project.projectName}"`,
        channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          projectId: this._extractId(project),
          projectName: project.projectName,
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          removedAt: new Date()
        }
      });

      console.log(`Removal notification sent to employee ${employee.name || employee.email}`);
    } catch (error) {
      console.error('Error notifying employee removal:', error);
    }
  }
}

module.exports = new ProjectNotificationHelper();
