const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Organización a la que se envía el currículo (opcional)
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  
  // Estado del currículo en relación a la organización
  organizationStatus: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  
  // Fecha de envío a la organización
  submittedToOrganizationAt: {
    type: Date
  },
  
  // Notas del administrador de la organización
  organizationNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  contact: {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/[\w.-]+@[\w.-]+\.\w+/, 'Invalid email']
    },
    phones: [{
      number: String,
      type: {
        type: String,
        enum: ['mobile', 'home', 'work'],
        default: 'mobile'
      }
    }],
    links: {
      linkedin: String,
      github: String,
      portfolio: String,
      other: [String]
    },
    location: {
      city: String,
      country: String,
      fullLocation: String
    }
  },
  education: [{
    institution: {
      type: String,
      required: true,
      trim: true
    },
    degree: {
      type: String,
      required: true,
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
    startDate: {
      type: String,
      trim: true
    },
    endDate: {
      type: String,
      trim: true
    },
    current: {
      type: Boolean,
      default: false
    },
    achievements: [String]
  }],
  experience: [{
    company: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: String,
      trim: true
    },
    endDate: {
      type: String,
      trim: true
    },
    current: {
      type: Boolean,
      default: false
    },
    description: String,
    responsibilities: [String],
    technologies: [String]
  }],
  skills: {
    technical: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      normalizedName: {
        type: String,
        lowercase: true,
        trim: true
      },
      level: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced', 'expert', ''],
        default: ''
      },
      category: {
        type: String,
        enum: ['language', 'framework', 'tool', 'database', 'cloud', 'runtime', 'devops', 'testing', 'mobile', 'frontend', 'backend', 'security', 'ai_ml', 'other'],
        default: 'other'
      }
    }],
    soft: [String]
  },
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['native', 'bilingual', 'fluent', 'advanced', 'intermediate', 'basic', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      required: true
    }
  }],
  projects: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    technologies: [String],
    url: String,
    repositoryUrl: String,
    startDate: String,
    endDate: String
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuer: {
      type: String,
      trim: true
    },
    dateObtained: String,
    expirationDate: String,
    credentialId: String,
    url: String
  }],
  achievements: {
    publications: [{
      title: String,
      type: {
        type: String,
        enum: ['article', 'conference', 'book', 'blog', 'other']
      },
      date: String,
      url: String
    }],
    awards: [{
      name: String,
      issuer: String,
      date: String,
      description: String
    }],
    hackathons: [{
      name: String,
      position: String,
      date: String,
      description: String
    }]
  },
  crossCulturalExperience: {
    hasExperience: {
      type: Boolean,
      default: false
    },
    countriesWorkedWith: [{
      type: String,
      trim: true
    }],
    multiculturalProjects: {
      type: Number,
      default: 0,
      min: 0
    },
    mediationSkills: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  remoteWorkExperience: {
    yearsRemote: {
      type: Number,
      default: 0,
      min: 0
    },
    distributedTeamsExperience: {
      type: Boolean,
      default: false
    },
    timezoneFlexibility: {
      type: Boolean,
      default: false
    },
    preferredTimezones: [{
      type: String,
      trim: true
    }],
    remoteWorkTools: [{
      type: String,
      trim: true
    }]
  },
  communicationSkills: {
    knowledgeManagementTools: [{
      type: String,
      trim: true
    }],
    documentationExperience: {
      type: Boolean,
      default: false
    },
    asyncCommunicationTools: [{
      type: String,
      trim: true
    }],
    presentationSkills: {
      type: Boolean,
      default: false
    },
    technicalWriting: {
      type: Boolean,
      default: false
    }
  },

  // Availability Information
  availability: {
    immediate: {
      type: Boolean,
      default: false,
      description: 'Whether the employee can start immediately'
    },
    startDate: {
      type: Date,
      description: 'Earliest date the employee can start working'
    },
    willingToTravel: {
      type: Boolean,
      default: false,
      description: 'Whether the employee is willing to travel for work'
    },
    travelFrequency: {
      type: String,
      enum: ['none', 'occasionally', 'frequently', 'always'],
      default: 'none',
      description: 'How often the employee is willing to travel'
    },
    willingToRelocate: {
      type: Boolean,
      default: false,
      description: 'Whether the employee is willing to relocate'
    },
    willingToWorkOffHours: {
      type: Boolean,
      default: false,
      description: 'Whether the employee is willing to work outside regular hours'
    },
    overtimeAvailability: {
      type: String,
      enum: ['none', 'limited', 'flexible', 'full'],
      default: 'none',
      description: 'How much overtime the employee can work'
    },
    weekendAvailability: {
      type: Boolean,
      default: false,
      description: 'Whether the employee can work on weekends if needed'
    },
    onCallAvailability: {
      type: Boolean,
      default: false,
      description: 'Whether the employee is available for on-call duties'
    }
  },

  // Metadata
  originalFileName: String,
  rawText: String,
  processingDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas
cvSchema.index({ 'userId': 1 });
cvSchema.index({ 'organization': 1, 'organizationStatus': 1 });
cvSchema.index({ 'skills.technical.normalizedName': 1 });
cvSchema.index({ 'experience.technologies': 1 });
cvSchema.index({ 'languages.language': 1 });
cvSchema.index({ 'submittedToOrganizationAt': -1 });

cvSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Método para obtener resumen
cvSchema.methods.getSummary = function() {
  return {
    id: this._id,
    userId: this.userId,
    contact: this.contact,
    totalExperience: this.experience?.length || 0,
    totalEducation: this.education?.length || 0,
    totalSkills: this.skills?.technical?.length || 0,
    languages: this.languages?.map(l => `${l.language} (${l.level})`) || [],
    lastUpdated: this.lastUpdated
  };
};

module.exports = mongoose.model('CV', cvSchema);
