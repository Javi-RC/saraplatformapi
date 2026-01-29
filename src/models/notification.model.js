const mongoose = require('mongoose');

/**
 * Tipos de notificaciones disponibles en el sistema
 */
const NotificationTypes = {
  // Notificaciones de autenticación
  EMAIL_CONFIRMATION: 'email_confirmation',
  PASSWORD_RESET: 'password_reset',
  
  // Notificaciones de cuenta
  ACCOUNT_UPDATED: 'account_updated',
  ACCOUNT_DELETION_CONFIRMED: 'account_deletion_confirmed',
  ACCOUNT_DELETION_REQUIREMENTS: 'account_deletion_requirements',
  ROLE_CHANGED: 'role_changed',
  
  // Notificaciones de CV
  CV_UPLOADED: 'cv_uploaded',
  CV_PROCESSED: 'cv_processed',
  CV_ANALYSIS_READY: 'cv_analysis_ready',
  CV_ANALYSIS_FAILED: 'cv_analysis_failed',
  CV_SUBMITTED_TO_ORG: 'cv_submitted_to_org',
  CV_REVIEWED: 'cv_reviewed',
  CV_STATUS_CHANGED: 'cv_status_changed',
  
  // Notificaciones de organización
  ORG_EMPLOYEE_ADDED: 'org_employee_added',
  ORG_EMPLOYEE_REMOVED: 'org_employee_removed',
  ORG_EMPLOYEE_STATUS_CHANGED: 'org_employee_status_changed',
  ORG_ADMIN_ADDED: 'org_admin_added',
  ORG_SETTINGS_UPDATED: 'org_settings_updated',
  
  // Notificaciones de proyectos
  PROJECT_CREATED: 'project_created',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_ACTIVATED: 'project_activated',
  PROJECT_COMPLETED: 'project_completed',
  PROJECT_CANCELLED: 'project_cancelled',
  ASSIGNED_TO_PROJECT: 'assigned_to_project',
  REMOVED_FROM_PROJECT: 'removed_from_project',
  
  // Notificaciones de BFI-44
  BFI44_COMPLETED: 'bfi44_completed',
  BFI44_REMINDER: 'bfi44_reminder',
  
  // Notificaciones administrativas
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
  SYSTEM_UPDATE: 'system_update',
  
  // Notificaciones genéricas
  CUSTOM: 'custom'
};

/**
 * Prioridades de las notificaciones
 */
const NotificationPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Estados de las notificaciones
 */
const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

/**
 * Canales de entrega de notificaciones
 */
const NotificationChannels = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  PUSH: 'push'
};

const notificationSchema = new mongoose.Schema({
  // Receptor de la notificación
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Tipo de notificación
  type: {
    type: String,
    enum: Object.values(NotificationTypes),
    required: true,
    index: true
  },
  
  // Título de la notificación
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  // Mensaje de la notificación
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Datos adicionales en formato JSON
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Prioridad de la notificación
  priority: {
    type: String,
    enum: Object.values(NotificationPriority),
    default: NotificationPriority.MEDIUM,
    index: true
  },
  
  // Estado de la notificación
  status: {
    type: String,
    enum: Object.values(NotificationStatus),
    default: NotificationStatus.PENDING,
    index: true
  },
  
  // Canales por los que se enviará/envió la notificación
  channels: [{
    type: String,
    enum: Object.values(NotificationChannels),
    required: true
  }],
  
  // Información de entrega por canal
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
  
  // URL de acción opcional
  actionUrl: {
    type: String,
    trim: true
  },
  
  // Texto del botón de acción opcional
  actionText: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  // Fecha de lectura (solo para notificaciones in-app)
  readAt: {
    type: Date
  },
  
  // Fecha de expiración opcional
  expiresAt: {
    type: Date
  },
  
  // Emisor de la notificación (puede ser el sistema o un usuario admin)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Indica si la notificación está archivada (solo para in-app)
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

// Índices compuestos para consultas frecuentes
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1, isArchived: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// Virtual para verificar si la notificación está leída
notificationSchema.virtual('isRead').get(function() {
  return !!this.readAt;
});

// Virtual para verificar si la notificación ha expirado
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Método para marcar como leída
notificationSchema.methods.markAsRead = async function() {
  if (!this.readAt) {
    this.readAt = new Date();
    this.status = NotificationStatus.READ;
    await this.save();
  }
  return this;
};

// Método para archivar
notificationSchema.methods.archive = async function() {
  this.isArchived = true;
  await this.save();
  return this;
};

// Método para actualizar estado de entrega por canal
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
  
  // Actualizar el estado general si todos los canales están en el mismo estado
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

// Método estático para limpiar notificaciones antiguas
notificationSchema.statics.cleanupOldNotifications = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isArchived: true
  });
};

// Método estático para obtener estadísticas de notificaciones de un usuario
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
    this.actionText = 'Ver más';
  }
  
  // Si la notificación está leída, asegurar que tenga fecha de lectura
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
