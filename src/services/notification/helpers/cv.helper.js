const notificationService = require('../notification.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../../../models/notification.model');
const { extractId } = require('../../../utils/idHelper');

/**
 * Helper for sending curriculum-related notifications
 */
class CVNotificationHelper {
  /**
   * Notifies the user that their curriculum has been uploaded
   */
  async notifyCVUploaded(userId, userName, cvId, cvFileName) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
        type: NotificationTypes.CV_UPLOADED,
        title: 'Curriculum Uploaded',
        message: `Hi ${userName}, your curriculum "${cvFileName}" has been successfully uploaded and is being processed.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.MEDIUM,
        metadata: {
          cvId: extractId(cvId),
          fileName: cvFileName,
          event: 'cv_uploaded'
        }
      });
    } catch (error) {
      console.error('Error sending uploaded curriculum notification:', error);
    }
  }

  /**
   * Notifies the user that their curriculum has been processed
   */
  async notifyCVProcessed(userId, userName, cvId) {
    try {
      const cvIdStr = extractId(cvId);
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending processed curriculum notification:', error);
    }
  }

  /**
   * Notifies the user that their curriculum analysis is ready
   */
  async notifyCVAnalysisReady(userId, userName, cvId, analysisId, summary) {
    try {
      const cvIdStr = extractId(cvId);
      const analysisIdStr = extractId(analysisId);
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending ready analysis notification:', error);
    }
  }

  /**
   * Notifies the user that there was an error processing their curriculum
   */
  async notifyCVAnalysisFailed(userId, userName, cvId, errorMessage) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
        type: NotificationTypes.CV_ANALYSIS_FAILED,
        title: 'Error Processing Curriculum',
        message: `${userName}, there was a problem processing your curriculum. Please check the file and try again. ${errorMessage ? `Error: ${errorMessage}` : ''}`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        actionUrl: '/cv/upload',
        actionText: 'Upload New Curriculum',
        metadata: {
          cvId: extractId(cvId),
          error: errorMessage,
          event: 'cv_analysis_failed'
        }
      });
    } catch (error) {
      console.error('Error sending failed analysis notification:', error);
    }
  }

  /**
   * Notifies the user about curriculum improvement recommendations
   */
  async notifyCVRecommendations(userId, userName, cvId, recommendations) {
    try {
      const recommendationCount = recommendations?.length || 0;
      const cvIdStr = extractId(cvId);
      
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending recommendations notification:', error);
    }
  }

  /**
   * Notifies the user that their curriculum has been deleted
   */
  async notifyCVDeleted(userId, userName, cvFileName) {
    try {
      await notificationService.create({
        recipientId: extractId(userId),
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
      console.error('Error sending deleted curriculum notification:', error);
    }
  }
}

module.exports = new CVNotificationHelper();
