const notificationService = require('./notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');

/**
 * Helper para enviar notificaciones relacionadas con CV
 */
class CVNotificationHelper {
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
   * Notifica al usuario que su CV ha sido subido
   */
  async notifyCVUploaded(userId, userName, cvId, cvFileName) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_UPLOADED,
        title: 'CV Subido',
        message: `Hola ${userName}, tu CV "${cvFileName}" ha sido subido exitosamente y está siendo procesado.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          cvId: this._extractId(cvId),
          fileName: cvFileName,
          event: 'cv_uploaded'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de CV subido:', error);
    }
  }

  /**
   * Notifica al usuario que su CV ha sido procesado
   */
  async notifyCVProcessed(userId, userName, cvId) {
    try {
      const cvIdStr = this._extractId(cvId);
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_PROCESSED,
        title: 'CV Procesado',
        message: `¡Buenas noticias ${userName}! Tu CV ha sido procesado y analizado exitosamente.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: `/cv/${cvIdStr}`,
        actionText: 'Ver CV',
        metadata: {
          cvId: cvIdStr,
          event: 'cv_processed'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de CV procesado:', error);
    }
  }

  /**
   * Notifica al usuario que el análisis de su CV está listo
   */
  async notifyCVAnalysisReady(userId, userName, cvId, analysisId, summary) {
    try {
      const cvIdStr = this._extractId(cvId);
      const analysisIdStr = this._extractId(analysisId);
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_ANALYSIS_READY,
        title: 'Análisis de CV Completo',
        message: `${userName}, el análisis detallado de tu CV está listo. ${summary || 'Revisa los resultados para mejorar tu perfil profesional.'}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: `/cv/${cvIdStr}/analysis/${analysisIdStr}`,
        actionText: 'Ver Análisis',
        metadata: {
          cvId: cvIdStr,
          analysisId: analysisIdStr,
          event: 'cv_analysis_ready'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de análisis listo:', error);
    }
  }

  /**
   * Notifica al usuario que hubo un error al procesar su CV
   */
  async notifyCVAnalysisFailed(userId, userName, cvId, errorMessage) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_ANALYSIS_FAILED,
        title: 'Error al Procesar CV',
        message: `${userName}, hubo un problema al procesar tu CV. Por favor, verifica el archivo e intenta nuevamente. ${errorMessage ? `Error: ${errorMessage}` : ''}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: '/cv/upload',
        actionText: 'Subir Nuevo CV',
        metadata: {
          cvId: this._extractId(cvId),
          error: errorMessage,
          event: 'cv_analysis_failed'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de análisis fallido:', error);
    }
  }

  /**
   * Notifica al usuario sobre recomendaciones de mejora de su CV
   */
  async notifyCVRecommendations(userId, userName, cvId, recommendations) {
    try {
      const recommendationCount = recommendations?.length || 0;
      const cvIdStr = this._extractId(cvId);
      
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_ANALYSIS_READY,
        title: 'Recomendaciones para tu CV',
        message: `${userName}, tenemos ${recommendationCount} recomendaciones para mejorar tu CV y destacar más en las búsquedas.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/cv/${cvIdStr}/recommendations`,
        actionText: 'Ver Recomendaciones',
        metadata: {
          cvId: cvIdStr,
          recommendationCount,
          event: 'cv_recommendations'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de recomendaciones:', error);
    }
  }

  /**
   * Notifica al usuario que su CV ha sido eliminado
   */
  async notifyCVDeleted(userId, userName, cvFileName) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_PROCESSED,
        title: 'CV Eliminado',
        message: `${userName}, tu CV "${cvFileName}" ha sido eliminado del sistema.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.LOW,
        metadata: {
          fileName: cvFileName,
          event: 'cv_deleted'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de CV eliminado:', error);
    }
  }
}

module.exports = new CVNotificationHelper();
