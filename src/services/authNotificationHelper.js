const notificationService = require('./notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');

/**
 * Helper para enviar notificaciones relacionadas con autenticación
 */
class AuthNotificationHelper {
  /**
   * Extrae el ID de un objeto o retorna el string directamente
   */
  _extractId(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj._id) return obj._id.toString();
    return obj.toString();
  }

  /**
   * Notifica al usuario que su cuenta ha sido creada
   */
  async notifyAccountCreated(userId, userName) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.EMAIL_CONFIRMATION,
        title: 'Welcome!',
        message: `Hi ${userName}, your account has been successfully created. Please confirm your email to get started.`,
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
        recipientId: this._extractId(userId),
        type: NotificationTypes.EMAIL_CONFIRMATION,
        title: 'Account Confirmed',
        message: `Congratulations ${userName}! Your account has been successfully confirmed. You can now access all features.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/dashboard',
        actionText: 'Go to Dashboard',
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
        employee: 'Employee',
        org_admin: 'Administrator',
        unassigned: 'Unassigned'
      };

      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.ROLE_CHANGED,
        title: 'Role Updated',
        message: `Hi ${userName}, your role has been updated from ${roleNames[oldRole]} to ${roleNames[newRole]}.`,
        channels: [NotificationChannels.IN_APP],
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
        recipientId: this._extractId(userId),
        type: NotificationTypes.ACCOUNT_UPDATED,
        title: 'Account Updated',
        message: `Hi ${userName}, your profile has been updated. Modified fields: ${changesList}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/profile',
        actionText: 'View Profile',
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
        recipientId: this._extractId(userId),
        type: NotificationTypes.ACCOUNT_UPDATED,
        title: '⚠️ Login Detected',
        message: `A login to your account has been detected from ${loginDetails.location || 'unknown location'}. If this was you, you can ignore this message.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.URGENT,
        actionUrl: '/security',
        actionText: 'Review Security',
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
