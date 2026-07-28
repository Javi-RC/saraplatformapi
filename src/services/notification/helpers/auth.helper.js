const notificationService = require('../notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../../../models/notification.model');
const { extractId } = require('../../../utils/idHelper');

/**
 * Helper for sending authentication-related notifications
 */
class AuthNotificationHelper {
  /**
   * Notifies the user that their account has been created
   */
  async notifyAccountCreated(userId, userName) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending account created notification:', error);
    }
  }

  /**
   * Notifies the user that their account has been confirmed
   */
  async notifyAccountConfirmed(userId, userName) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending account confirmed notification:', error);
    }
  }

  /**
   * Notifies the user about a role change
   */
  async notifyRoleChanged(userId, userName, newRole, oldRole) {
    try {
      const roleNames = {
        employee: 'Employee',
        org_admin: 'Administrator',
        unassigned: 'Unassigned'
      };

      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending role changed notification:', error);
    }
  }

  /**
   * Notifies the user about their account update
   */
  async notifyAccountUpdated(userId, userName, changes) {
    try {
      const changesList = Object.keys(changes).join(', ');
      
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending account updated notification:', error);
    }
  }

  /**
   * Notifies the user about a suspicious login
   */
  async notifySuspiciousLogin(userId, userName, loginDetails) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
        type: NotificationTypes.ACCOUNT_UPDATED,
        title: 'Login Detected',
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
      console.error('Error sending suspicious login notification:', error);
    }
  }
}

module.exports = new AuthNotificationHelper();
