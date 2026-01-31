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
        title: 'CV Uploaded',
        message: `Hi ${userName}, your CV "${cvFileName}" has been successfully uploaded and is being processed.`,
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
        title: 'CV Processed',
        message: `Good news ${userName}! Your CV has been successfully processed and analyzed.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: `/cv/${cvIdStr}`,
        actionText: 'View CV',
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
        title: 'CV Analysis Complete',
        message: `${userName}, the detailed analysis of your CV is ready. ${summary || 'Review the results to improve your professional profile.'}`,
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
        title: 'Error Processing CV',
        message: `${userName}, there was a problem processing your CV. Please check the file and try again. ${errorMessage ? `Error: ${errorMessage}` : ''}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: '/cv/upload',
        actionText: 'Upload New CV',
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
        title: 'Recommendations for Your CV',
        message: `${userName}, we have ${recommendationCount} recommendations to improve your CV and stand out more in searches.`,
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
        title: 'CV Deleted',
        message: `${userName}, your CV "${cvFileName}" has been deleted from the system.`,
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
