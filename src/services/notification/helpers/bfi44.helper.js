const notificationService = require('../notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../../../models/notification.model');
const { extractId } = require('../../../utils/idHelper');

/**
 * Helper for sending BFI-44 related notifications
 * Following the pattern of existing helpers (authNotificationHelper, cvNotificationHelper)
 */
class BFI44NotificationHelper {
  /**
   * Notifies the employee that they need to complete the BFI-44 test
   */
  async notifyTestPending(userId, userName) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending pending test notification:', error);
    }
  }

  /**
   * Notifies the employee that they have completed the test
   */
  async notifyTestCompleted(userId, userName) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending completed test notification:', error);
    }
  }

  /**
   * Notifies the administrator about employees without the test
   */
  async notifyAdminEmployeesWithoutTest(adminId, adminName, employeeCount, organizationName) {
    try {
      await notificationService.create({
        recipientId: extractId(adminId),
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
      console.error('Error sending admin notification about employees without test:', error);
    }
  }

  /**
   * Reminder to the employee (after X days without completing)
   */
  async notifyTestReminder(userId, userName, daysPending) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending test reminder:', error);
    }
  }

  /**
   * Notify multiple employees about pending test
   */
  async notifyMultipleEmployeesPending(employeeIds, employeeNames) {
    const promises = employeeIds.map((userId, index) => 
      this.notifyTestPending(userId, employeeNames[index] || 'User')
    );

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
    }
  }
}

module.exports = new BFI44NotificationHelper();
