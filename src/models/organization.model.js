const mongoose = require('mongoose');

/**
 * Organization Model
 * Represents a company or organization within the system
 * Following SOLID principles: Single Responsibility
 */
const organizationSchema = new mongoose.Schema({
  // Basic organization information
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
    unique: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  defaultLanguage: {
    type: String,
    enum: ['es', 'en'],
    default: 'es',
    trim: true
  },
  
  // Tax/legal identification
  taxId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null values but unique non-null values
    index: true
  },
  
  // Contact information
  contact: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  // Physical address
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  
  // Industry/Sector
  industry: {
    type: String,
    trim: true,
    enum: [
      'software_development',
      'web_development',
      'mobile_development',
      'devops_cloud',
      'data_science',
      'cybersecurity',
      'ai_machine_learning',
      'blockchain',
      'game_development',
      'qa_testing',
      'consulting',
      'fintech',
      'healthtech',
      'edtech',
      'ecommerce',
      'saas',
      'other'
    ]
  },
  
  // Organization size
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10'
  },
  
  // Main organization administrator
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'An administrator is required'],
    index: true
  },
  
  // Additional administrative team members
  additionalAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Employees associated with the organization
  employees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    position: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    },
    isProjectManager: {
      type: Boolean,
      default: false
    }
  }],
  
  // Organization settings
  settings: {
    allowPublicCVSubmission: {
      type: Boolean,
      default: true,
      description: 'Allow external employees to submit curricula'
    },
    requireApproval: {
      type: Boolean,
      default: true,
      description: 'Requires administrator approval for new employees'
    },
    notifyOnCVSubmission: {
      type: Boolean,
      default: true,
      description: 'Notify administrators when a curriculum is received'
    },
    autoProcessCV: {
      type: Boolean,
      default: true,
      description: 'Automatically process curricula with AI'
    }
  },
  // Work Mode Policy
  workModePolicy: {
    type: String,
    enum: [
      'office_mode',        // 100% on-site
      'office_first',       // On-site with occasional remote
      'office_remote_mix',  // Free alternation
      'remote_first',       // Remote with exceptional on-site
      'remote_mode'         // 100% remote
    ],
    default: 'office_mode',
    description: 'Default work mode policy for the organization'
  },
  
  // Remote Work and Support Configuration
  remoteWorkConfiguration: {
    hasRemoteWorkPolicy: {
      type: Boolean,
      default: false
    },
    policyDocument: {
      type: String,
      trim: true
    },
    providesTechSupport: {
      type: Boolean,
      default: false
    },
    remoteWorkTools: [{
      type: String,
      trim: true
    }],
    vpnAccess: {
      type: Boolean,
      default: false
    },
    equipmentProvision: {
      type: Boolean,
      default: false
    }
  },
  // Process Maturity and Development Practices
  developmentPractices: {
    hasOnboarding: {
      type: Boolean,
      default: false
    },
    onboardingDuration: {
      type: Number,
      min: 0
    },
    hasVersionControl: {
      type: Boolean,
      default: false
    },
    versionControlSystems: [{
      type: String,
      trim: true
    }],
    hasCICD: {
      type: Boolean,
      default: false
    },
    cicdTools: [{
      type: String,
      trim: true
    }],
    codeReviewProcess: {
      type: Boolean,
      default: false
    },
    testingCoverage: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'none'
    }
  },
  // Knowledge Management
  knowledgeManagement: {
    hasKnowledgeBase: {
      type: Boolean,
      default: false
    },
    knowledgeBaseTools: [{
      type: String,
      trim: true
    }],
    documentationStandards: {
      type: Boolean,
      default: false
    },
    hasTemplates: {
      type: Boolean,
      default: false
    }
  },
  // Organizational Maturity
  maturityLevel: {
    overall: {
      type: String,
      enum: ['initial', 'managed', 'defined', 'quantitatively_managed', 'optimizing'],
      default: 'initial'
    },
    processMaturity: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    technicalMaturity: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    },
    culturalMaturity: {
      type: Number,
      min: 1,
      max: 5,
      default: 1
    }
  },
  
  // Organization status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // Organization logo
  logo: {
    type: String,
    trim: true
  },
  
  // Custom additional data
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Expert rules configuration (decision tree thresholds for risk prediction)
  expertRulesConfig: {
    riskThresholds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      description: 'Risk detection threshold values'
    },
    personalityRiskThresholds: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      description: 'Personality-based risk thresholds'
    }
  },

  // Audit metadata
  
  // Last activity
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for query optimization
organizationSchema.index({ admin: 1, status: 1 });
organizationSchema.index({ 'employees.user': 1 });
organizationSchema.index({ createdAt: -1 });

// Virtual: Total active employees
organizationSchema.virtual('activeEmployeesCount').get(function() {
  return this.employees ? this.employees.filter(emp => emp.status === 'active').length : 0;
});

// Virtual: Total employees
organizationSchema.virtual('totalEmployeesCount').get(function() {
  return this.employees ? this.employees.length : 0;
});

// Virtual: Check if organization is fully configured
organizationSchema.virtual('isFullyConfigured').get(function() {
  return !!(
    this.name &&
    this.contact.email &&
    this.admin &&
    this.industry
  );
});

// Method: Check if a user is an administrator
organizationSchema.methods.isAdmin = function(userId) {
  const userIdStr = userId.toString();
  
  // Handle case where admin is populated (is an object) or not populated (is ObjectId)
  const adminId = this.admin._id ? this.admin._id.toString() : this.admin.toString();
  
  if (adminId === userIdStr) {
    return true;
  }
  
  return this.additionalAdmins ? this.additionalAdmins.some(admin => {
    const additionalAdminId = admin._id ? admin._id.toString() : admin.toString();
    return additionalAdminId === userIdStr;
  }) : false;
};

// Method: Check if a user is an employee
organizationSchema.methods.isEmployee = function(userId) {
  if (!this.employees) return false;
  const userIdStr = userId.toString();
  return this.employees.some(emp => {
    // Skip if emp.user is null (deleted user)
    if (!emp.user) return false;
    
    // Handle case where emp.user is populated or not
    const empUserId = emp.user._id ? emp.user._id.toString() : emp.user.toString();
    return empUserId === userIdStr && emp.status === 'active';
  });
};

// Method: Check if a user is a project manager
organizationSchema.methods.isProjectManager = function(userId) {
  if (!this.employees) return false;
  const userIdStr = userId.toString();
  const employee = this.employees.find(emp => {
    // Skip if emp.user is null (deleted user)
    if (!emp.user) return false;
    
    const empUserId = emp.user._id ? emp.user._id.toString() : emp.user.toString();
    return empUserId === userIdStr && emp.status === 'active';
  });
  return employee ? employee.isProjectManager : false;
};

// Method: Add employee
organizationSchema.methods.addEmployee = function(userId, employeeData = {}) {
  // Initialize employees if it doesn't exist
  if (!this.employees) {
    this.employees = [];
  }
  
  const existingEmployee = this.employees.find(
    emp => emp.user && emp.user.toString() === userId.toString()
  );
  
  if (existingEmployee) {
    throw new Error('Employee is already associated with this organization');
  }
  
  this.employees.push({
    user: userId,
    position: employeeData.position,
    department: employeeData.department,
    status: this.settings.requireApproval ? 'pending' : 'active',
    isProjectManager: employeeData.isProjectManager || false
  });
  
  this.lastActivityAt = Date.now();
  return this.save();
};

// Method: Remove employee
organizationSchema.methods.removeEmployee = function(userId) {
  if (!this.employees) {
    throw new Error('Employee not found in the organization');
  }
  
  const index = this.employees.findIndex(
    emp => emp.user && emp.user.toString() === userId.toString()
  );
  
  if (index === -1) {
    throw new Error('Employee not found in the organization');
  }
  
  this.employees.splice(index, 1);
  this.lastActivityAt = Date.now();
  return this.save();
};

// Method: Update employee status
organizationSchema.methods.updateEmployeeStatus = function(userId, newStatus) {
  if (!this.employees) {
    throw new Error('Employee not found in the organization');
  }
  
  const employee = this.employees.find(
    emp => emp.user && emp.user.toString() === userId.toString()
  );
  
  if (!employee) {
    throw new Error('Employee not found in the organization');
  }
  
  employee.status = newStatus;
  this.lastActivityAt = Date.now();
  return this.save();
};

// Method: Assign/unassign project manager role
organizationSchema.methods.setProjectManagerRole = function(userId, isProjectManager) {
  if (!this.employees) {
    throw new Error('Employee not found in the organization');
  }
  
  const employee = this.employees.find(
    emp => emp.user && emp.user.toString() === userId.toString()
  );
  
  if (!employee) {
    throw new Error('Employee not found in the organization');
  }
  
  if (employee.status !== 'active') {
    throw new Error('Project manager role can only be assigned to active employees');
  }
  
  employee.isProjectManager = isProjectManager;
  this.lastActivityAt = Date.now();
  return this.save();
};

// Method: Add additional administrator
organizationSchema.methods.addAdmin = function(userId) {
  const userIdStr = userId.toString();
  
  if (this.admin.toString() === userIdStr) {
    throw new Error('User is already the main administrator');
  }
  
  if (this.additionalAdmins.some(adminId => adminId.toString() === userIdStr)) {
    throw new Error('User is already an additional administrator');
  }
  
  this.additionalAdmins.push(userId);
  this.lastActivityAt = Date.now();
  return this.save();
};

organizationSchema.pre('save', function(next) {
  if (this.admin && this.additionalAdmins.length > 0) {
    const adminStr = this.admin.toString();
    this.additionalAdmins = this.additionalAdmins.filter(
      id => id.toString() !== adminStr
    );
  }
  next();
});

// Static method: Find organizations by administrator
organizationSchema.statics.findByAdmin = function(adminId) {
  return this.find({
    $or: [
      { admin: adminId },
      { additionalAdmins: adminId }
    ]
  }).populate('admin', 'name email avatar')
    .populate('additionalAdmins', 'name email avatar');
};

// Static method: Find organizations where the user is an employee
organizationSchema.statics.findByEmployee = function(userId) {
  return this.find({
    'employees.user': userId,
    'employees.status': 'active'
  }).populate('admin', 'name email avatar');
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
