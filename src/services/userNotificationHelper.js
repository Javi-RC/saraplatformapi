const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { NotificationTypes, NotificationChannels, NotificationPriority } = require('../models/notification.model');

/**
 * User Notification Helper
 * Handles notifications related to user account operations
 * Following SOLID principles: Single Responsibility
 */
class UserNotificationHelper {
  /**
   * Extracts ID from object or returns string directly
   * @private
   */
  _extractId(obj) {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    if (obj._id) return obj._id.toString();
    return obj.toString();
  }

  /**
   * Notifies user that their account deletion request has been processed
   * Sends both in-app notification and email
   * @param {string} userId - User ID
   * @param {string} userName - User name
   * @param {string} userEmail - User email
   */
  async notifyAccountDeleted(userId, userName, userEmail) {
    try {
      // Create in-app notification
      await notificationService.create({
        recipientId: this._extractId(userId),
        type: NotificationTypes.ACCOUNT_UPDATED,
        title: 'Account Deletion Confirmed',
        message: `${userName}, your account has been successfully deleted. All your personal data has been removed from our system.`,
        channels: [NotificationChannels.IN_APP],
        priority: NotificationPriority.HIGH,
        metadata: {
          event: 'account_deleted',
          timestamp: new Date()
        }
      });

      // Send confirmation email
      if (userEmail) {
        await emailService.sendEmail({
          to: userEmail,
          subject: 'Account Deletion Confirmation',
          html: this._buildDeletionEmail(userName)
        });
      }

    } catch (error) {
      // Don't throw error - notification failure shouldn't block deletion
      console.error('Error sending account deletion notification:', error);
    }
  }

  /**
   * Builds HTML email for account deletion confirmation
   * @param {string} userName - User name
   * @returns {string} HTML email content
   * @private
   */
  _buildDeletionEmail(userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #dc3545;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .info-box {
            background-color: white;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #6c757d;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Account Deletion Confirmed</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          
          <p>This email confirms that your account has been permanently deleted from our system.</p>
          
          <div class="info-box">
            <h3>What has been deleted:</h3>
            <ul>
              <li>Your account and profile information</li>
              <li>All uploaded curricula and documents</li>
              <li>Your personality assessment (BFI-44) results</li>
              <li>All notifications and personal communications</li>
              <li>Your preferences and settings</li>
            </ul>
          </div>

          <div class="info-box">
            <h3>What has been preserved:</h3>
            <ul>
              <li>Historical project data has been anonymized (no personal identifiers)</li>
              <li>Your contributions to completed projects remain as "Deleted User"</li>
            </ul>
          </div>

          <p><strong>Important:</strong> This action is permanent and cannot be undone. If you wish to use our services again in the future, you will need to create a new account.</p>

          <p>If you did not request this deletion or believe this was done in error, please contact our support team immediately at <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@example.com'}">${process.env.SUPPORT_EMAIL || 'support@example.com'}</a>.</p>

          <p>Thank you for being part of our community.</p>

          <p>Best regards,<br>
          The Team</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notifies user about deletion prerequisites
   * Used when user checks if they can delete their account
   * @param {string} userId - User ID
   * @param {Object} prerequisites - Prerequisites information
   */
  async notifyDeletionPrerequisites(userId, prerequisites) {
    try {
      if (!prerequisites.canDelete && prerequisites.blockers.length > 0) {
        const blockerMessages = prerequisites.blockers
          .map(b => b.message)
          .join('; ');

        await notificationService.create({
          recipientId: this._extractId(userId),
          type: NotificationTypes.ACCOUNT_UPDATED,
          title: 'Account Deletion Requirements',
          message: `Before you can delete your account: ${blockerMessages}`,
          channels: [NotificationChannels.IN_APP],
          priority: NotificationPriority.MEDIUM,
          metadata: {
            event: 'deletion_prerequisites_checked',
            blockers: prerequisites.blockers
          }
        });
      }
    } catch (error) {
      console.error('Error sending deletion prerequisites notification:', error);
    }
  }
}

module.exports = new UserNotificationHelper();
