const notificationService = require('./notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');

/**
 * Helper para enviar notificaciones relacionadas con currículo
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
   * Notifica al usuario que su currículo ha sido subido
   */
  async notifyCVUploaded(userId, userName, cvId, cvFileName) {
    try {
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_UPLOADED,
        title: 'Curriculum Uploaded',
        message: `Hi ${userName}, your curriculum "${cvFileName}" has been successfully uploaded and is being processed.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          cvId: this._extractId(cvId),
          fileName: cvFileName,
          event: 'cv_uploaded'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de currículo subido:', error);
    }
  }

  /**
   * Notifica al usuario que su currículo ha sido procesado
   */
  async notifyCVProcessed(userId, userName, cvId) {
    try {
      const cvIdStr = this._extractId(cvId);
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_PROCESSED,
        title: 'Curriculum Processed',
        message: `Good news ${userName}! Your curriculum has been successfully processed and analyzed.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: `/cv/${cvIdStr}`,
        actionText: 'View Curriculum',
        metadata: {
          cvId: cvIdStr,
          event: 'cv_processed'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de currículo procesado:', error);
    }
  }

  /**
   * Notifica al usuario que el análisis de su currículo está listo
   */
  async notifyCVAnalysisReady(userId, userName, cvId, analysisId, summary) {
    try {
      const cvIdStr = this._extractId(cvId);
      const analysisIdStr = this._extractId(analysisId);
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_ANALYSIS_READY,
        title: 'Curriculum Analysis Complete',
        message: `${userName}, the detailed analysis of your curriculum is ready. ${summary || 'Review the results to improve your professional profile.'}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: `/cv/${cvIdStr}/analysis/${analysisIdStr}`,
        actionText: 'View Analysis',
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
        title: 'Error Processing Curriculum',
        message: `${userName}, there was a problem processing your curriculum. Please check the file and try again. ${errorMessage ? `Error: ${errorMessage}` : ''}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: '/cv/upload',
        actionText: 'Upload New Curriculum',
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
   * Notifica al usuario sobre recomendaciones de mejora de su currículo
   */
  async notifyCVRecommendations(userId, userName, cvId, recommendations) {
    try {
      const recommendationCount = recommendations?.length || 0;
      const cvIdStr = this._extractId(cvId);
      
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.CV_ANALYSIS_READY,
        title: 'Recommendations for Your Curriculum',
        message: `${userName}, we have ${recommendationCount} recommendations to improve your curriculum and stand out more in searches.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        actionUrl: `/cv/${cvIdStr}/recommendations`,
        actionText: 'View Recommendations',
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
        title: 'Curriculum Deleted',
        message: `${userName}, your curriculum "${cvFileName}" has been deleted from the system.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.LOW,
        metadata: {
          fileName: cvFileName,
          event: 'cv_deleted'
        }
      });
    } catch (error) {
      console.error('Error enviando notificación de currículo eliminado:', error);
    }
  }
}

module.exports = new CVNotificationHelper();
