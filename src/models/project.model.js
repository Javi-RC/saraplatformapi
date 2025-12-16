const mongoose = require('mongoose');

/**
 * Model: Project
 * Represents a project managed by a project manager within an organization
 * Following SOLID principles: Single Responsibility Principle
 */
const projectSchema = new mongoose.Schema({
  // ============================================
  // 1. General Project Information
  // ============================================
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    minlength: [2, 'Project name must be at least 2 characters'],
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  
  briefDescription: {
    type: String,
    required: [true, 'Brief description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  estimatedStartDate: {
    type: Date,
    required: [true, 'Estimated start date is required']
  },
  
  estimatedEndDate: {
    type: Date,
    required: [true, 'Estimated end date is required'],
    validate: {
      validator: function(value) {
        return value > this.estimatedStartDate;
      },
      message: 'End date must be after start date'
    }
  },
  
  expectedDuration: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      required: true
    }
  },
  
  // ============================================
  // 2. Collaboration and Communication Requirements
  // ============================================
  requiresSynchronousCommunication: {
    type: String,
    enum: ['yes', 'no', 'only_critical_moments'],
    required: [true, 'Synchronous communication requirement is required'],
    default: 'no'
  },
  
  realTimeCommunicationLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'Real-time communication level is required'],
    default: 'low'
  },
  
  weeklyMeetingsCount: {
    type: Number,
    required: [true, 'Weekly meetings count is required'],
    min: 0,
    default: 0
  },
  
  averageMeetingDuration: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ['minutes', 'hours'],
      required: true,
      default: 'minutes'
    }
  },
  
  requiredAvailabilitySchedule: {
    type: String,
    trim: true,
    maxlength: [200, 'Schedule cannot exceed 200 characters']
  },
  
  requiredLanguages: [{
    type: String,
    trim: true
  }],
  
  minimumLanguageProficiency: {
    type: String,
    enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native', 'bilingual'],
    default: 'B1'
  },
  
  // ============================================
  // 3. Technical Requirements
  // ============================================
  mainTechnologies: [{
    type: String,
    trim: true
  }],
  
  requiredExperienceLevel: {
    type: String,
    enum: ['junior', 'mid', 'senior', 'expert'],
    required: [true, 'Experience level is required'],
    default: 'mid'
  },
  
  systemComplexity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: [true, 'System complexity is required'],
    default: 'medium'
  },
  
  sharedInfrastructureDependency: {
    type: String,
    trim: true,
    maxlength: [500, 'Infrastructure dependency description cannot exceed 500 characters']
  },
  
  requiresSpecializedTools: {
    needed: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Tools description cannot exceed 500 characters']
    }
  },
  
  documentationLevel: {
    type: String,
    enum: ['complete', 'partial', 'minimal', 'none'],
    required: [true, 'Documentation level is required'],
    default: 'partial'
  },
  
  // ============================================
  // 4. Team Geographic Distribution
  // ============================================
  teamRegions: [{
    type: String,
    trim: true
  }],
  
  distributedWorkExperienceLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  expectedTimeOverlap: {
    value: {
      type: Number,
      min: 0,
      max: 24
    },
    unit: {
      type: String,
      enum: ['hours'],
      default: 'hours'
    }
  },
  
  culturalDiversityLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // ============================================
  // 5. Roles and Responsibilities
  // ============================================
  keyRoles: [{
    roleName: {
      type: String,
      required: true,
      trim: true
    },
    responsibilities: {
      type: String,
      trim: true,
      maxlength: [1000, 'Responsibilities cannot exceed 1000 characters']
    },
    clarityLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  }],
  
  criticalDependencies: [{
    type: String,
    trim: true,
    maxlength: [500, 'Dependency description cannot exceed 500 characters']
  }],
  
  // ============================================
  // 6. Availability Requirements
  // ============================================
  weeklyHoursPerMember: {
    type: Number,
    required: [true, 'Weekly hours per member is required'],
    min: 1,
    max: 168
  },
  
  requiresAfterHoursAvailability: {
    type: String,
    enum: ['yes', 'no', 'occasional'],
    default: 'no'
  },
  
  highLoadPeriods: [{
    description: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    }
  }],
  
  // ============================================
  // 7. Coordination and Management Needs
  // ============================================
  managementMethod: {
    type: String,
    enum: ['scrum', 'kanban', 'waterfall', 'hybrid', 'other'],
    required: [true, 'Management method is required'],
    default: 'scrum'
  },
  
  followUpFrequency: {
    standups: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'none'],
        default: 'daily'
      }
    },
    reviews: {
      frequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly', 'none'],
        default: 'weekly'
      }
    },
    retrospectives: {
      frequency: {
        type: String,
        enum: ['weekly', 'biweekly', 'monthly', 'none'],
        default: 'biweekly'
      }
    }
  },
  
  communicationTools: [{
    type: String,
    trim: true
  }],
  
  taskManagementTools: [{
    type: String,
    trim: true
  }],
  
  documentationStandardization: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  // ============================================
  // 8. Team Collaboration Intensity
  // ============================================
  involvedTeams: [{
    teamName: {
      type: String,
      required: true,
      trim: true
    },
    dependencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  
  informationFlow: {
    type: String,
    enum: ['unidirectional', 'bidirectional', 'multiple'],
    default: 'bidirectional'
  },
  
  criticalExchanges: [{
    type: String,
    trim: true,
    maxlength: [500, 'Exchange description cannot exceed 500 characters']
  }],
  
  // ============================================
  // 10. Organizational Maturity Level
  // ============================================
  hasOnboardingProcesses: {
    type: String,
    enum: ['yes', 'no', 'partial'],
    default: 'partial'
  },
  
  hasVersionControlAndCICD: {
    type: String,
    enum: ['yes', 'no', 'partial'],
    default: 'partial'
  },
  
  internalToolsFragmentation: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // ============================================
  // Metadata and Relationships
  // ============================================
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization is required'],
    index: true
  },
  
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project manager is required'],
    index: true
  },
  
  assignedEmployees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedRole: {
      type: String,
      trim: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  actualStartDate: {
    type: Date
  },
  
  actualEndDate: {
    type: Date
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// Indexes
// ============================================
projectSchema.index({ organization: 1, status: 1 });
projectSchema.index({ projectManager: 1, status: 1 });
projectSchema.index({ 'assignedEmployees.user': 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ estimatedStartDate: 1, estimatedEndDate: 1 });

// ============================================
// Virtuals
// ============================================
projectSchema.virtual('assignedEmployeesCount').get(function() {
  return this.assignedEmployees ? this.assignedEmployees.length : 0;
});

projectSchema.virtual('durationInDays').get(function() {
  if (this.estimatedStartDate && this.estimatedEndDate) {
    const diff = this.estimatedEndDate - this.estimatedStartDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return 0;
});

projectSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// ============================================
// Instance Methods
// ============================================

/**
 * Check if a user is the project manager
 */
projectSchema.methods.isProjectManager = function(userId) {
  const pmId = this.projectManager._id 
    ? this.projectManager._id.toString() 
    : this.projectManager.toString();
  return pmId === userId.toString();
};

/**
 * Check if a user is assigned to the project
 */
projectSchema.methods.isAssignedEmployee = function(userId) {
  const userIdStr = userId.toString();
  return this.assignedEmployees.some(emp => {
    const empUserId = emp.user._id 
      ? emp.user._id.toString() 
      : emp.user.toString();
    return empUserId === userIdStr;
  });
};

/**
 * Assign an employee to the project
 */
projectSchema.methods.assignEmployee = function(userId, assignedRole = '') {
  // Check if already assigned
  if (this.isAssignedEmployee(userId)) {
    throw new Error('User is already assigned to this project');
  }
  
  this.assignedEmployees.push({
    user: userId,
    assignedRole,
    assignedAt: Date.now()
  });
  
  this.lastActivityAt = Date.now();
  return this.save();
};

/**
 * Remove an employee from the project
 */
projectSchema.methods.removeEmployee = function(userId) {
  const index = this.assignedEmployees.findIndex(emp => {
    const empUserId = emp.user._id 
      ? emp.user._id.toString() 
      : emp.user.toString();
    return empUserId === userId.toString();
  });
  
  if (index === -1) {
    throw new Error('User is not assigned to this project');
  }
  
  this.assignedEmployees.splice(index, 1);
  this.lastActivityAt = Date.now();
  return this.save();
};

/**
 * Activate the project
 */
projectSchema.methods.activate = function() {
  this.status = 'active';
  if (!this.actualStartDate) {
    this.actualStartDate = Date.now();
  }
  this.lastActivityAt = Date.now();
  return this.save();
};

/**
 * Complete the project
 */
projectSchema.methods.complete = function() {
  this.status = 'completed';
  this.actualEndDate = Date.now();
  this.lastActivityAt = Date.now();
  return this.save();
};

/**
 * Cancel the project
 */
projectSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.lastActivityAt = Date.now();
  return this.save();
};

// ============================================
// Middleware
// ============================================

// Update timestamps before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate dates consistency
projectSchema.pre('save', function(next) {
  if (this.actualStartDate && this.actualEndDate) {
    if (this.actualEndDate < this.actualStartDate) {
      return next(new Error('Actual end date must be after actual start date'));
    }
  }
  next();
});

// ============================================
// Static Methods
// ============================================

/**
 * Find projects by organization
 */
projectSchema.statics.findByOrganization = function(organizationId, status = null) {
  const query = { organization: organizationId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('projectManager', 'name email avatar')
    .populate('assignedEmployees.user', 'name email avatar')
    .sort({ createdAt: -1 });
};

/**
 * Find projects by project manager
 */
projectSchema.statics.findByProjectManager = function(userId, status = null) {
  const query = { projectManager: userId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('organization', 'name')
    .populate('assignedEmployees.user', 'name email avatar')
    .sort({ createdAt: -1 });
};

/**
 * Find projects where user is assigned
 */
projectSchema.statics.findByAssignedEmployee = function(userId) {
  return this.find({
    'assignedEmployees.user': userId
  })
    .populate('organization', 'name')
    .populate('projectManager', 'name email avatar')
    .sort({ createdAt: -1 });
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
