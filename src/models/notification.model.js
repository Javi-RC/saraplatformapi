const mongoose = require('mongoose');

/**
 * Notification types available in the system
 */
const NotificationTypes = {
  // Authentication notifications
  EMAIL_CONFIRMATION: 'email_confirmation',
  PASSWORD_RESET: 'password_reset',
  
  // Account notifications
  ACCOUNT_UPDATED: 'account_updated',
  ACCOUNT_DELETION_CONFIRMED: 'account_deletion_confirmed',
  ACCOUNT_DELETION_REQUIREMENTS: 'account_deletion_requirements',
  ROLE_CHANGED: 'role_changed',
  
  // Curriculum notifications
  CV_UPLOADED: 'cv_uploaded',
  CV_PROCESSED: 'cv_processed',
  CV_ANALYSIS_READY: 'cv_analysis_ready',
  CV_ANALYSIS_FAILED: 'cv_analysis_failed',
  CV_SUBMITTED_TO_ORG: 'cv_submitted_to_org',
  CV_REVIEWED: 'cv_reviewed',
  CV_STATUS_CHANGED: 'cv_status_changed',
  
  // Organization notifications
  ORG_EMPLOYEE_ADDED: 'org_employee_added',
  ORG_EMPLOYEE_REMOVED: 'org_employee_removed',
  ORG_EMPLOYEE_STATUS_CHANGED: 'org_employee_status_changed',
  ORG_ADMIN_ADDED: 'org_admin_added',
  ORG_SETTINGS_UPDATED: 'org_settings_updated',
  
  // Project notifications
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_ACTIVATED: 'project_activated',
  PROJECT_COMPLETED: 'project_completed',
  PROJECT_CANCELLED: 'project_cancelled',
  ASSIGNED_TO_PROJECT: 'assigned_to_project',
  REMOVED_FROM_PROJECT: 'removed_from_project',
  
  // BFI-44 notifications
  BFI44_COMPLETED: 'bfi44_completed',
  BFI44_REMINDER: 'bfi44_reminder',
  
  // Administrative notifications
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  SYSTEM_UPDATE: 'system_update',
  
  // Generic notifications
  CUSTOM: 'custom'
};

/**
 * Notification priorities
 */
const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Notification statuses
 */
const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

/**
 * Notification delivery channels
 */
const NotificationChannels = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  PUSH: 'push'
};

const notificationSchema = new mongoose.Schema({
  // Notification recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification type
  type: {
    type: String,
    enum: Object.values(NotificationTypes),
    required: true,
    index: true
  },
  
  // Notification title
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Notification message
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Additional data in JSON format
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Notification priority
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
    index: true
  },
  
  // Notification status
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true
  },
  
  // Channels through which the notification will be/has been sent
  channels: [{
    type: String,
    enum: Object.values(NotificationChannels),
    required: true
  }],
  
  // Delivery information per channel
  deliveryInfo: {
    type: Map,
    of: {
      status: {
        type: String,
        enum: Object.values(NotificationStatus)
      },
      sentAt: Date,
      deliveredAt: Date,
      error: String
    },
    default: {}
  },
  
  // Optional action URL
  actionUrl: {
    type: String,
    trim: true
  },
  
  // Optional action button text
  actionText: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Read date (only for in-app notifications)
  readAt: {
    type: Date
  },
  
  // Optional expiration date
  expiresAt: {
    type: Date
  },
  
  // Notification sender (can be the system or an admin user)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Whether the notification is archived (only for in-app)
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for frequent queries
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1, isArchived: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// Virtual to check if the notification is read
notificationSchema.virtual('isRead').get(function() {
  return !!this.readAt;
});

// Virtual to check if the notification has expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.readAt) {
    this.readAt = new Date();
    this.status = NotificationStatus.READ;
    await this.save();
  }
  return this;
};

// Method to archive
notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  await this.save();
  return this;
};

// Method to update delivery status per channel
notificationSchema.methods.updateDeliveryStatus = async function(channel, status, error = null) {
  if (!this.deliveryInfo) {
    this.deliveryInfo = new Map();
  }
  
  const currentInfo = this.deliveryInfo.get(channel) || {};
  
  this.deliveryInfo.set(channel, {
    ...currentInfo,
    status,
    sentAt: currentInfo.sentAt || (status === NotificationStatus.SENT ? new Date() : undefined),
    deliveredAt: status === NotificationStatus.DELIVERED ? new Date() : currentInfo.deliveredAt,
    error
  });
  
  // Update overall status if all channels are in the same state
  const allStatuses = Array.from(this.deliveryInfo.values()).map(info => info.status);
  if (allStatuses.every(s => s === status)) {
    this.status = status;
  } else if (allStatuses.includes(NotificationStatus.FAILED)) {
    this.status = NotificationStatus.FAILED;
  } else if (allStatuses.includes(NotificationStatus.DELIVERED)) {
    this.status = NotificationStatus.DELIVERED;
  } else if (allStatuses.includes(NotificationStatus.SENT)) {
    this.status = NotificationStatus.SENT;
  }
  
  await this.save();
  return this;
};

// Static method to clean up old notifications
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isArchived: true
  });
};

// Static method to get notification statistics for a user
notificationSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { recipient: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    unread: 0,
    read: 0,
    failed: 0
  };
  
  stats.forEach(stat => {
    result.total += stat.count;
    if (stat._id === NotificationStatus.READ) {
      result.read = stat.count;
    } else if (stat._id === NotificationStatus.FAILED) {
      result.failed = stat.count;
    } else {
      result.unread += stat.count;
    }
  });
  
  return result;
};

notificationSchema.pre('save', function(next) {
  if (this.actionUrl && !this.actionText) {
    this.actionText = 'See more';
  }
  
  // If the notification is read, ensure it has a read date
  if (this.status === NotificationStatus.READ && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = {
  Notification,
  NotificationTypes,
  NotificationPriority,
  NotificationStatus,
  NotificationChannels
};
