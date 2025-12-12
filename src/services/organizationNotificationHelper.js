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
        console.log('Notificaciones de CV deshabilitadas para esta organización');
        return;
      }

      // Crear notificación para cada administrador
      const notificationPromises = adminIds.map(adminId =>
        notificationService.create({
          recipientId: adminId,
          type: NotificationTypes.CV_SUBMITTED_TO_ORG,
          title: 'Nuevo CV recibido',
          message: `${user.name || user.email} ha enviado su CV a ${organization.name}`,
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
          actionText: 'Ver CV'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Notificaciones de CV enviadas a ${adminIds.length} administradores`);
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
        reviewed: 'ha sido revisado',
        accepted: 'ha sido aceptado',
        rejected: 'ha sido revisado'
      };

      const message = `Tu CV enviado a ${organization.name} ${statusMessages[status] || 'ha sido actualizado'}`;

      await notificationService.create({
        recipientId: this._extractId(cv.userId),
        type: NotificationTypes.CV_REVIEWED,
        title: 'Actualización de CV',
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
        actionText: 'Ver detalles'
      });

      console.log(`Notificación de CV revisado enviada al usuario ${this._extractId(cv.userId)}`);
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
        pending: 'Pendiente de revisión',
        reviewed: 'Revisado',
        accepted: 'Aceptado',
        rejected: 'No seleccionado'
      };

      await notificationService.create({
        recipientId: this._extractId(cv.userId),
        type: NotificationTypes.CV_STATUS_CHANGED,
        title: 'Estado de CV actualizado',
        message: `El estado de tu CV en ${organization.name} ha cambiado a: ${statusLabels[newStatus]}`,
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
        actionText: 'Ver CV'
      });

      console.log(`Notificación de cambio de estado enviada al usuario ${this._extractId(cv.userId)}`);
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
        title: requiresApproval ? 'Solicitud de vinculación enviada' : 'Vinculado a organización',
        message: requiresApproval
          ? `Tu solicitud para unirte a ${organization.name} está pendiente de aprobación`
          : `Has sido agregado como empleado de ${organization.name}`,
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
        actionText: 'Ver organización'
      });

      console.log(`Notificación de empleado agregado enviada a ${this._extractId(user)}`);
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
        active: 'Tu vinculación con',
        inactive: 'Tu vinculación con',
        pending: 'Tu solicitud para'
      };

      const statusLabels = {
        active: 'ha sido aprobada',
        inactive: 'ha sido desactivada',
        pending: 'está pendiente de aprobación'
      };

      await notificationService.create({
        recipientId: this._extractId(user),
        type: NotificationTypes.ORG_EMPLOYEE_STATUS_CHANGED,
        title: 'Actualización de estado en organización',
        message: `${statusMessages[newStatus]} ${organization.name} ${statusLabels[newStatus]}`,
        channels: [NotificationChannels.IN_APP],
        priority: newStatus === 'active' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          newStatus
        },
        actionUrl: `/organizations/${this._extractId(organization)}`,
        actionText: 'Ver detalles'
      });

      console.log(`Notificación de cambio de estado enviada a ${this._extractId(user)}`);
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
        title: 'Vinculación con organización finalizada',
        message: `Has sido removido de ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          removedAt: new Date()
        }
      });

      console.log(`Notificación de empleado removido enviada a ${this._extractId(user)}`);
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
        title: 'Promovido a administrador',
        message: `Has sido agregado como administrador de ${organization.name}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        metadata: {
          organizationId: this._extractId(organization),
          organizationName: organization.name,
          promotedAt: new Date()
        },
        actionUrl: `/organizations/${this._extractId(organization)}/admin`,
        actionText: 'Ir al panel de administración'
      });

      console.log(`Notificación de admin agregado enviada a ${this._extractId(user)}`);
    } catch (error) {
      console.error('Error al notificar admin agregado:', error);
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
      console.log(`Notificación enviada a ${adminIds.length} administradores`);
    } catch (error) {
      console.error('Error al notificar a administradores:', error);
    }
  }
}

module.exports = new OrganizationNotificationHelper();
