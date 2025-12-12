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
        title: 'Completa tu Perfil de Personalidad',
        message: `Hola ${userName}, te invitamos a completar el cuestionario BFI-44 para conocer mejor tu perfil de personalidad. Solo te tomará unos minutos.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/bfi-44/test',
        actionText: 'Completar Test',
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
        title: 'Test BFI-44 Completado',
        message: `¡Felicidades ${userName}! Has completado exitosamente el cuestionario BFI-44. Tus resultados ya están disponibles.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: '/bfi-44/my-profile',
        actionText: 'Ver Resultados',
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
        title: 'Empleados sin Test BFI-44',
        message: `${adminName}, actualmente hay ${employeeCount} empleado(s) en ${organizationName} que aún no han completado el test BFI-44.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.LOW,
        actionUrl: '/admin/bfi-44/pending',
        actionText: 'Ver Detalles',
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
        title: 'Recordatorio: Test BFI-44 Pendiente',
        message: `Hola ${userName}, te recordamos que aún tienes pendiente el cuestionario BFI-44. Complétalo para obtener insights sobre tu personalidad profesional.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: '/bfi-44/test',
        actionText: 'Completar Ahora',
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
