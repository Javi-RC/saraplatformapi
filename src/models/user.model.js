const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function() {
      return !this.oauthProvider;
    },
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  passwordHash: {
    type: String,
    required: function() {
      return !this.oauthProvider;
    },
    select: false
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'github'],
    default: undefined
  },
  oauthId: {
    type: String
  },
  role: {
    type: String,
    enum: ['employee', 'org_admin', 'unassigned'],
    default: 'unassigned'
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  isConfirmed: {
    type: Boolean,
    default: function() {
      return !!this.oauthProvider;
    }
  },
  confirmationToken: String,
  confirmationTokenExpiry: Date,
  verificationTokenExpiry: {
    type: Date,
    default: () => Date.now() + 24 * 60 * 60 * 1000
  },
  registrationAttempts: {
    type: Number,
    default: 0
  },
  
  // Login attempts tracking for brute force protection
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  avatar: String,
  
  country: {
    type: String,
    trim: true
  },
  
  timezone: {
    type: String,
    trim: true
  },
  
  preferredLanguage: {
    type: String,
    enum: ['es', 'en'],
    default: 'es',
    trim: true
  },
  
  flexibleSchedule: {
    type: Boolean,
    default: false
  },
  
  preferredWorkingHours: {
    start: {
      type: String,
      trim: true
    },
    end: {
      type: String,
      trim: true
    }
  },
  
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    }
  },

  // Historial de colaboraciones con otros empleados
  // Se actualiza automáticamente al completar proyectos
  collaborationHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    projectCount: {
      type: Number,
      default: 1,
      min: 1
    },
    lastCollaboration: {
      type: Date,
      default: Date.now
    }
  }],

  cvProcessingConsent: {
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date
    },
    version: {
      type: String,
      default: '1.0'
    },
    ipAddress: {
      type: String
    },
    details: {
      aiProcessing: {
        type: Boolean,
        default: false
      },
      thirdPartySharing: {
        type: Boolean,
        default: false
      },
      dataRetention: {
        type: Boolean,
        default: false
      }
    }
  },

  personalityDataConsent: {
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date
    },
    version: {
      type: String,
      default: '1.0'
    },
    ipAddress: {
      type: String
    },
    details: {
      personalityProfiling: {
        type: Boolean,
        default: false
      },
      dataRetention: {
        type: Boolean,
        default: false
      }
    }
  }
});

userSchema.index(
  { oauthProvider: 1, oauthId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      oauthProvider: { $type: 'string' },
      oauthId: { $type: 'string' }
    }
  }
);

userSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 172800,
    partialFilterExpression: { isConfirmed: false }
  }
);

userSchema.methods.isProfileComplete = function() {
  return this.role !== 'unassigned';
};

userSchema.methods.hasCVProcessingConsent = function() {
  return this.cvProcessingConsent?.accepted === true && 
         this.cvProcessingConsent?.details?.aiProcessing === true;
};

userSchema.methods.hasPersonalityDataConsent = function() {
  return this.personalityDataConsent?.accepted === true &&
         this.personalityDataConsent?.details?.personalityProfiling === true;
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.confirmationToken;
  delete user.confirmationTokenExpiry;
  return user;
};

module.exports = mongoose.model('User', userSchema);