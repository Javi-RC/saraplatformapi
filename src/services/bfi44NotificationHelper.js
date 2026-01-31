const notificationService = require('./notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');

/**
 * Helper para enviar notificaciones relacionadas con BFI-44
 * Siguiendo el patrón de los helpers existentes (authNotificationHelper, cvNotificationHelper)
 */
class BFI44NotificationHelper {
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
   * Notifica al empleado que debe completar el test BFI-44
   */
  async notifyTestPending(userId, userName) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CUSTOM,
        title: 'Complete Your Personality Profile',
        message: `Hi ${userName}, we invite you to complete the BFI-44 questionnaire to better understand your personality profile. It will only take a few minutes.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/bfi-44/test',
        actionText: 'Complete Test',
        metadata: {
          event: 'bfi44_test_pending',
          testType: 'BFI-44'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de test pendiente:', error);
    }
  }

  /**
   * Notifica al empleado que ha completado el test
   */
  async notifyTestCompleted(userId, userName) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CUSTOM,
        title: 'BFI-44 Test Completed',
        message: `Congratulations ${userName}! You have successfully completed the BFI-44 questionnaire. Your results are now available.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/bfi-44/my-profile',
        actionText: 'View Results',
        metadata: {
          event: 'bfi44_test_completed',
          testType: 'BFI-44'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de test completado:', error);
    }
  }

  /**
   * Notifica al administrador sobre los empleados sin test
   */
  async notifyAdminEmployeesWithoutTest(adminId, adminName, employeeCount, organizationName) {
    try {
      await notificationService.create({
        recipientId: this._extractId(adminId),
        type: NotificationTypes.CUSTOM,
        title: 'Employees Without BFI-44 Test',
        message: `${adminName}, currently there are ${employeeCount} employee(s) in ${organizationName} who have not yet completed the BFI-44 test.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.LOW,
        actionUrl: '/admin/bfi-44/pending',
        actionText: 'View Details',
        metadata: {
          event: 'bfi44_admin_pending_tests',
          employeeCount,
          organizationName
        }
      });
    } catch (error) {
      console.error('Error enviando notificación a admin sobre empleados sin test:', error);
    }
  }

  /**
   * Recordatorio al empleado (después de X días sin completar)
   */
  async notifyTestReminder(userId, userName, daysPending) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CUSTOM,
        title: 'Reminder: Pending BFI-44 Test',
        message: `Hi ${userName}, we remind you that you still have the BFI-44 questionnaire pending. Complete it to gain insights into your professional personality.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: '/bfi-44/test',
        actionText: 'Complete Now',
        metadata: {
          event: 'bfi44_test_reminder',
          daysPending,
          testType: 'BFI-44'
        }
      });
    } catch (error) {
      console.error('Error enviando recordatorio de test:', error);
    }
  }

  /**
   * Notificar a múltiples empleados sobre test pendiente
   */
  async notifyMultipleEmployeesPending(employeeIds, employeeNames) {
    const promises = employeeIds.map((userId, index) => 
      this.notifyTestPending(userId, employeeNames[index] || 'Usuario')
    );

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error enviando notificaciones masivas:', error);
    }
  }
}

module.exports = new BFI44NotificationHelper();
