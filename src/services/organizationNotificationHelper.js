const notificationService = require('./notification.service');
const { NotificationTypes, NotificationPriority, NotificationChannels } = require('../models/notification.model');

/**
 * Helper de Notificaciones para Organizaciones
 * Gestiona la creación de notificaciones específicas del módulo de organizaciones
 * Siguiendo principio de responsabilidad única (SRP)
 */
class OrganizationNotificationHelper {
  /**
   * Extrae el ID de un objeto o retorna el string directamente
   * Maneja tanto ObjectIds como objetos poblados
   * @param {Object|string} obj - Objeto con _id o string ID
   * @returns {string} ID como string
   */
  _extractId(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj._id) return obj._id.toString();
    return obj.toString();
  }

  /**
   * Notifica a los administradores cuando un empleado envía su CV
   * @param {Object} organization - Organización a la que se envió el CV
   * @param {Object} user - Usuario que envió el CV
   * @param {Object} cv - CV enviado
   */
  async notifyCVSubmitted(organization, user, cv) {
    try {
      // Lista de administradores a notificar (manejar objetos poblados)
      const adminIds = [
        this._extractId(organization.admin),
        ...organization.additionalAdmins.map(admin => this._extractId(admin))
      ].filter(id => id !== null);

      // Verificar configuración de notificaciones
      if (!organization.settings?.notifyOnCVSubmission) {
        return;
      }

      // Crear notificación para cada administrador
      const notificationPromises = adminIds.map(adminId =>
        notificationService.create({
          recipientId: adminId,
          type: NotificationTypes.CV_SUBMITTED_TO_ORG,
          title: 'New CV Received',
          message: `${user.name || user.email} has submitted their CV to ${organization.name}`,
          channels: [NotificationChannels.IN_APP],
          priority: NotificationPriority.HIGH,
          metadata: {
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            userId: this._extractId(user),
            userName: user.name,
            userEmail: user.email,
            cvId: this._extractId(cv),
            submittedAt: cv.submittedToOrganizationAt || new Date()
          },
          actionUrl: `/organizations/${this._extractId(organization)}/cvs/${this._extractId(cv)}`,
          actionText: 'View CV'
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error al notificar CV enviado:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Notifica al empleado cuando su CV ha sido revisado
   * @param {Object} cv - CV revisado
   * @param {Object} organization - Organización que revisó el CV
   * @param {string} status - Nuevo estado del CV
   */
  async notifyCVReviewed(cv, organization, status) {
    try {
      const statusMessages = {
        reviewed: 'has been reviewed',
        accepted: 'has been accepted',
        rejected: 'has been reviewed'
      };

      const message = `Your CV submitted to ${organization.name} ${statusMessages[status] || 'has been updated'}`;

      await notificationService.create({
        recipientId: this._extractId(cv.userId),
        type: NotificationTypes.CV_REVIEWED,
        title: 'CV Update',
        message,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          cvId: this._extractId(cv),
          status: status,
          reviewedAt: new Date()
        },
        actionUrl: `/my-cvs/${this._extractId(cv)}`,
        actionText: 'View details'
      });

    } catch (error) {
      console.error('Error al notificar CV revisado:', error);
    }
  }

  /**
   * Notifica cuando cambia el estado del CV
   * @param {Object} cv - CV con estado actualizado
   * @param {Object} organization - Organización
   * @param {string} oldStatus - Estado anterior
   * @param {string} newStatus - Nuevo estado
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
        recipientId: this._extractId(cv.userId),
        type: NotificationTypes.CV_STATUS_CHANGED,
        title: 'CV Status Updated',
        message: `The status of your CV at ${organization.name} has changed to: ${statusLabels[newStatus]}`,
        channels: [NotificationChannels.IN_APP],
        priority: newStatus === 'accepted' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          cvId: this._extractId(cv),
          oldStatus,
          newStatus,
          statusLabel: statusLabels[newStatus]
        },
        actionUrl: `/my-cvs/${this._extractId(cv)}`,
        actionText: 'View CV'
      });

    } catch (error) {
      console.error('Error al notificar cambio de estado de CV:', error);
    }
  }

  /**
   * Notifica cuando un empleado es agregado a la organización
   * @param {Object} organization - Organización
   * @param {Object} user - Usuario agregado
   * @param {Object} employeeData - Datos del empleado
   */
  async notifyEmployeeAdded(organization, user, employeeData) {
    try {
      const status = employeeData?.status || 'pending';
      const requiresApproval = status === 'pending';

      await notificationService.create({
        recipientId: this._extractId(user),
        type: NotificationTypes.ORG_EMPLOYEE_ADDED,
        title: requiresApproval ? 'Link Request Sent' : 'Linked to Organization',
        message: requiresApproval
          ? `Your request to join ${organization.name} is pending approval`
          : `You have been added as an employee of ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          position: employeeData?.position,
          department: employeeData?.department,
          status: status,
          requiresApproval
        },
        actionUrl: `/organizations/${this._extractId(organization)}`,
        actionText: 'View organization'
      });

    } catch (error) {
      console.error('Error al notificar empleado agregado:', error);
    }
  }

  /**
   * Notifica cuando cambia el estado de un empleado
   * @param {Object} organization - Organización
   * @param {Object} user - Usuario afectado
   * @param {string} newStatus - Nuevo estado
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
        recipientId: this._extractId(user),
        type: NotificationTypes.ORG_EMPLOYEE_STATUS_CHANGED,
        title: 'Organization Status Update',
        message: `${statusMessages[newStatus]} ${organization.name} ${statusLabels[newStatus]}`,
        channels: [NotificationChannels.IN_APP],
        priority: newStatus === 'active' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          newStatus
        },
        actionUrl: `/organizations/${this._extractId(organization)}`,
        actionText: 'View details'
      });

    } catch (error) {
      console.error('Error al notificar cambio de estado de empleado:', error);
    }
  }

  /**
   * Notifica cuando se remueve un empleado
   * @param {Object} organization - Organización
   * @param {Object} user - Usuario removido
   */
  async notifyEmployeeRemoved(organization, user) {
    try {
      await notificationService.create({
        recipientId: this._extractId(user),
        type: NotificationTypes.ORG_EMPLOYEE_REMOVED,
        title: 'Organization Link Ended',
        message: `You have been removed from ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          removedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error al notificar empleado removido:', error);
    }
  }

  /**
   * Notifica cuando se agrega un administrador adicional
   * @param {Object} organization - Organización
   * @param {Object} user - Usuario promovido a admin
   */
  async notifyAdminAdded(organization, user) {
    try {
      await notificationService.create({
        recipientId: this._extractId(user),
        type: NotificationTypes.ORG_ADMIN_ADDED,
        title: 'Promoted to Administrator',
        message: `You have been added as an administrator of ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          promotedAt: new Date()
        },
        actionUrl: `/organizations/${this._extractId(organization)}/admin`,
        actionText: 'Go to admin panel'
      });

    } catch (error) {
      console.error('Error al notificar admin agregado:', error);
    }
  }

  /**
   * Notifica cuando se asigna o remueve el rol de jefe de proyecto
   * @param {Object} organization - Organización
   * @param {Object} employee - Empleado afectado
   * @param {boolean} isProjectManager - True si se asignó, false si se removió
   */
  async notifyProjectManagerRoleChanged(organization, employee, isProjectManager) {
    try {
      const employeeId = this._extractId(employee);

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
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          isProjectManager,
          changedAt: new Date()
        },
        actionUrl: `/organizations/${this._extractId(organization)}`,
        actionText: 'View organization'
      });

    } catch (error) {
      console.error('Error al notificar cambio de rol de jefe de proyecto:', error);
    }
  }

  /**
   * Notifica a todos los administradores de la organización
   * @param {Object} organization - Organización
   * @param {string} title - Título de la notificación
   * @param {string} message - Mensaje
   * @param {Object} options - Opciones adicionales
   */
  async notifyAllAdmins(organization, title, message, options = {}) {
    try {
      const adminIds = [
        this._extractId(organization.admin),
        ...organization.additionalAdmins.map(admin => this._extractId(admin))
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
            organizationId: this._extractId(organization),
            organizationName: organization.name,
            ...metadata
          },
          actionUrl,
          actionText
        })
      );

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error al notificar a administradores:', error);
    }
  }
}

module.exports = new OrganizationNotificationHelper();
