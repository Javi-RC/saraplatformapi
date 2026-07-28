const notificationService = require('../notification.service');
const { NotificationTypes, NotificationPriority, NotificationChannels } = require('../../../models/notification.model');
const { extractId } = require('../../../utils/idHelper');

/**
 * Notification Helper for Organizations
 * Manages creation of organization-specific notifications
 * Following Single Responsibility Principle (SRP)
 */
class OrganizationNotificationHelper {
  /**
   * Notifies administrators when an employee submits their curriculum
   * @param {Object} organization - Organization the curriculum was submitted to
   * @param {Object} user - User who submitted the curriculum
   * @param {Object} cv - Submitted curriculum
   */
  async notifyCVSubmitted(organization, user, cv) {
    try {
      // List of administrators to notify (handle populated objects)
      const adminIds = [
        extractId(organization.admin),
        ...(organization.additionalAdmins || []).map(admin => extractId(admin))
      ].filter(id => id !== null);

      // Check notification settings
      if (!organization.settings?.notifyOnCVSubmission) {
        return;
      }

      // Create notification for each administrator
      const notificationPromises = adminIds.map(adminId =>
        notificationService.create({
          recipientId: adminId,
          type: NotificationTypes.CV_SUBMITTED_TO_ORG,
          title: 'New Curriculum Received',
          message: `${user.name || user.email} has submitted their curriculum to ${organization.name}`,
          channels: [NotificationChannels.IN_APP],
          priority: NotificationPriority.HIGH,
          metadata: {
            organizationId: extractId(organization),
            organizationName: organization.name,
            userId: extractId(user),
            userName: user.name,
            userEmail: user.email,
            cvId: extractId(cv),
            submittedAt: cv.submittedToOrganizationAt || new Date()
          },
          actionUrl: `/organizations/${extractId(organization)}/cvs/${extractId(cv)}`,
          actionText: 'View Curriculum'
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying submitted curriculum:', error);
      // Do not throw error to avoid interrupting the main flow
    }
  }

  /**
   * Notifies the employee when their curriculum has been reviewed
   * @param {Object} cv - Reviewed curriculum
   * @param {Object} organization - Organization that reviewed the curriculum
   * @param {string} status - New curriculum status
   */
  async notifyCVReviewed(cv, organization, status) {
    try {
      const statusMessages = {
        reviewed: 'has been reviewed',
        accepted: 'has been accepted',
        rejected: 'has been reviewed'
      };

      const message = `Your curriculum submitted to ${organization.name} ${statusMessages[status] || 'has been updated'}`;

      await notificationService.create({
        recipientId: extractId(cv.userId),
        type: NotificationTypes.CV_REVIEWED,
        title: 'Curriculum Update',
        message,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          organizationId: extractId(organization),
          organizationName: organization.name,
          cvId: extractId(cv),
          status: status,
          reviewedAt: new Date()
        },
        actionUrl: `/my-cvs/${extractId(cv)}`,
        actionText: 'View details'
      });

    } catch (error) {
      console.error('Error notifying reviewed curriculum:', error);
    }
  }

  /**
   * Notifies when the curriculum status changes
   * @param {Object} cv - Curriculum with updated status
   * @param {Object} organization - Organization
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   */
  async notifyCVStatusChanged(cv, organization, oldStatus, newStatus) {
    try {
      const statusLabels = {
        pending: 'Pending review',
        reviewed: 'Reviewed',
        accepted: 'Accepted',
        rejected: 'Not selected'
      };

      await notificationService.create({
        recipientId: extractId(cv.userId),
        type: NotificationTypes.CV_STATUS_CHANGED,
        title: 'Curriculum Status Updated',
        message: `The status of your curriculum at ${organization.name} has changed to: ${statusLabels[newStatus]}`,
        channels: [NotificationChannels.IN_APP],
        priority: newStatus === 'accepted' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: {
          organizationId: extractId(organization),
          organizationName: organization.name,
          cvId: extractId(cv),
          oldStatus,
          newStatus,
          statusLabel: statusLabels[newStatus]
        },
        actionUrl: `/my-cvs/${extractId(cv)}`,
        actionText: 'View Curriculum'
      });

    } catch (error) {
      console.error('Error notifying curriculum status change:', error);
    }
  }

  /**
   * Notifies when an employee is added to the organization
   * @param {Object} organization - Organization
   * @param {Object} user - User who was added
   * @param {Object} employeeData - Employee data
   */
  async notifyEmployeeAdded(organization, user, employeeData) {
    try {
      const status = employeeData?.status || 'pending';
      const requiresApproval = status === 'pending';

      await notificationService.create({
        recipientId: extractId(user),
        type: NotificationTypes.ORG_EMPLOYEE_ADDED,
        title: requiresApproval ? 'Link Request Sent' : 'Linked to Organization',
        message: requiresApproval
          ? `Your request to join ${organization.name} is pending approval`
          : `You have been added as an employee of ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          organizationId: extractId(organization),
          organizationName: organization.name,
          position: employeeData?.position,
          department: employeeData?.department,
          status: status,
          requiresApproval
        },
        actionUrl: `/organizations/${extractId(organization)}`,
        actionText: 'View organization'
      });

    } catch (error) {
      console.error('Error notifying added employee:', error);
    }
  }

  /**
   * Notifies when an employee's status changes
   * @param {Object} organization - Organization
   * @param {Object} user - Affected user
   * @param {string} newStatus - New status
   */
  async notifyEmployeeStatusChanged(organization, user, newStatus) {
    try {
      const statusMessages = {
        active: 'Your link with',
        inactive: 'Your link with',
        pending: 'Your request for'
      };

      const statusLabels = {
        active: 'has been approved',
        inactive: 'has been deactivated',
        pending: 'is pending approval'
      };

      await notificationService.create({
        recipientId: extractId(user),
        type: NotificationTypes.ORG_EMPLOYEE_STATUS_CHANGED,
        title: 'Organization Status Update',
        message: `${statusMessages[newStatus]} ${organization.name} ${statusLabels[newStatus]}`,
        channels: [NotificationChannels.IN_APP],
        priority: newStatus === 'active' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: {
          organizationId: extractId(organization),
          organizationName: organization.name,
          newStatus
        },
        actionUrl: `/organizations/${extractId(organization)}`,
        actionText: 'View details'
      });

    } catch (error) {
      console.error('Error notifying employee status change:', error);
    }
  }

  /**
   * Notifies when an employee is removed
   * @param {Object} organization - Organization
   * @param {Object} user - User who was removed
   */
  async notifyEmployeeRemoved(organization, user) {
    try {
      await notificationService.create({
        recipientId: extractId(user),
        type: NotificationTypes.ORG_EMPLOYEE_REMOVED,
        title: 'Organization Link Ended',
        message: `You have been removed from ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          organizationId: extractId(organization),
          organizationName: organization.name,
          removedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error notifying removed employee:', error);
    }
  }

  /**
   * Notifies when an additional administrator is added
   * @param {Object} organization - Organization
   * @param {Object} user - User promoted to admin
   */
  async notifyAdminAdded(organization, user) {
    try {
      await notificationService.create({
        recipientId: extractId(user),
        type: NotificationTypes.ORG_ADMIN_ADDED,
        title: 'Promoted to Administrator',
        message: `You have been added as an administrator of ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        metadata: {
          organizationId: extractId(organization),
          organizationName: organization.name,
          promotedAt: new Date()
        },
        actionUrl: `/organizations/${extractId(organization)}/admin`,
        actionText: 'Go to admin panel'
      });

    } catch (error) {
      console.error('Error notifying added admin:', error);
    }
  }

  /**
   * Notifies when the project manager role is assigned or removed
   * @param {Object} organization - Organization
   * @param {Object} employee - Affected employee
   * @param {boolean} isProjectManager - True if assigned, false if removed
   */
  async notifyProjectManagerRoleChanged(organization, employee, isProjectManager) {
    try {
      const employeeId = extractId(employee);

      await notificationService.create({
        recipientId: employeeId,
        type: NotificationTypes.ROLE_CHANGED,
        title: isProjectManager ? 'Assigned as Project Manager' : 'Project Manager Role Removed',
        message: isProjectManager 
          ? `You have been assigned as a project manager at ${organization.name}. You can now create and manage projects.`
          : `Your project manager role has been removed at ${organization.name}.`,
        channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
        priority: NotificationPriority.HIGH,
        metadata: {
          organizationId: extractId(organization),
          organizationName: organization.name,
          isProjectManager,
          changedAt: new Date()
        },
        actionUrl: `/organizations/${extractId(organization)}`,
        actionText: 'View organization'
      });

    } catch (error) {
      console.error('Error notifying project manager role change:', error);
    }
  }

  /**
   * Notifies all administrators of the organization
   * @param {Object} organization - Organization
   * @param {string} title - Notification title
   * @param {string} message - Message
   * @param {Object} options - Additional options
   */
  async notifyAllAdmins(organization, title, message, options = {}) {
    try {
      const adminIds = [
        extractId(organization.admin),
        ...(organization.additionalAdmins || []).map(admin => extractId(admin))
      ].filter(id => id !== null);

      const {
        type = NotificationTypes.CUSTOM,
        priority = NotificationPriority.MEDIUM,
        metadata = {},
        actionUrl,
        actionText
      } = options;

      const notificationPromises = adminIds.map(adminId =>
        notificationService.create({
          recipientId: adminId,
          type,
          title,
          message,
          channels: [NotificationChannels.IN_APP],
          priority,
          metadata: {
            organizationId: extractId(organization),
            organizationName: organization.name,
            ...metadata
          },
          actionUrl,
          actionText
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error notifying administrators:', error);
    }
  }
}

module.exports = new OrganizationNotificationHelper();
