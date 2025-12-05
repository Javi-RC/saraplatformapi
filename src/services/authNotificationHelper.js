const notificationService = require('./notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');

/**
 * Helper para enviar notificaciones relacionadas con autenticación
 */
class AuthNotificationHelper {
  /**
   * Notifica al usuario que su cuenta ha sido creada
   */
  async notifyAccountCreated(userId, userName) {
    try {
      await notificationService.create({
        recipientId: userId,
        type: NotificationTypes.EMAIL_CONFIRMATION,
        title: '¡Bienvenido!',
        message: `Hola ${userName}, tu cuenta ha sido creada exitosamente. Por favor, confirma tu email para comenzar.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        metadata: {
          event: 'account_created'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de cuenta creada:', error);
    }
  }

  /**
   * Notifica al usuario que su cuenta ha sido confirmada
   */
  async notifyAccountConfirmed(userId, userName) {
    try {
      await notificationService.create({
        recipientId: userId,
        type: NotificationTypes.EMAIL_CONFIRMATION,
        title: 'Cuenta Confirmada',
        message: `¡Felicidades ${userName}! Tu cuenta ha sido confirmada exitosamente. Ya puedes acceder a todas las funcionalidades.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/dashboard',
        actionText: 'Ir al Dashboard',
        metadata: {
          event: 'account_confirmed'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de cuenta confirmada:', error);
    }
  }

  /**
   * Notifica al usuario sobre un cambio en su rol
   */
  async notifyRoleChanged(userId, userName, newRole, oldRole) {
    try {
      const roleNames = {
        employee: 'Empleado',
        org_admin: 'Administrador',
        unassigned: 'Sin asignar'
      };

      await notificationService.create({
        recipientId: userId,
        type: NotificationTypes.ROLE_CHANGED,
        title: 'Rol Actualizado',
        message: `Hola ${userName}, tu rol ha sido actualizado de ${roleNames[oldRole]} a ${roleNames[newRole]}.`,
        channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
        priority: NotificationPriority.HIGH,
        metadata: {
          event: 'role_changed',
          oldRole,
          newRole
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de cambio de rol:', error);
    }
  }

  /**
   * Notifica al usuario sobre la actualización de su cuenta
   */
  async notifyAccountUpdated(userId, userName, changes) {
    try {
      const changesList = Object.keys(changes).join(', ');
      
      await notificationService.create({
        recipientId: userId,
        type: NotificationTypes.ACCOUNT_UPDATED,
        title: 'Cuenta Actualizada',
        message: `Hola ${userName}, tu perfil ha sido actualizado. Campos modificados: ${changesList}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/profile',
        actionText: 'Ver Perfil',
        metadata: {
          event: 'account_updated',
          changes
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de cuenta actualizada:', error);
    }
  }

  /**
   * Notifica al usuario sobre un inicio de sesión sospechoso
   */
  async notifySuspiciousLogin(userId, userName, loginDetails) {
    try {
      await notificationService.create({
        recipientId: userId,
        type: NotificationTypes.ACCOUNT_UPDATED,
        title: '⚠️ Inicio de Sesión Detectado',
        message: `Se ha detectado un inicio de sesión en tu cuenta desde ${loginDetails.location || 'ubicación desconocida'}. Si fuiste tú, puedes ignorar este mensaje.`,
        channels: [NotificationChannels.IN_APP, NotificationChannels.EMAIL],
        priority: NotificationPriority.URGENT,
        actionUrl: '/security',
        actionText: 'Revisar Seguridad',
        metadata: {
          event: 'suspicious_login',
          ...loginDetails
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de inicio de sesión sospechoso:', error);
    }
  }
}

module.exports = new AuthNotificationHelper();
