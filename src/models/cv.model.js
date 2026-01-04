const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Organización a la que se envía el CV (opcional)
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  
  // Estado del CV en relación a la organización
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
  
  // 1. Información de contacto
  contact: {
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/[\w.-]+@[\w.-]+\.\w+/, 'Email inválido']
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

  // 2. Educación
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

  // 3. Experiencia laboral
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

  // 4. Habilidades técnicas
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
        enum: ['básico', 'intermedio', 'avanzado', 'experto', ''],
        default: ''
      },
      category: {
        type: String,
        enum: ['lenguaje', 'framework', 'herramienta', 'base_datos', 'cloud', 'runtime', 'devops', 'testing', 'mobile', 'frontend', 'backend', 'seguridad', 'ia_ml', 'otro'],
        default: 'otro'
      }
    }],
    soft: [String]
  },

  // 5. Idiomas
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['nativo', 'bilingüe', 'fluido', 'avanzado', 'intermedio', 'básico', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
      required: true
    }
  }],

  // 6. Proyectos
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

  // 7. Certificaciones
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

  // 8. Publicaciones / Logros / Premios
  achievements: {
    publications: [{
      title: String,
      type: {
        type: String,
        enum: ['artículo', 'conferencia', 'libro', 'blog', 'otro']
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

  // 9. Experiencia multicultural
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

  // 10. Experiencia en trabajo remoto
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

  // 11. Habilidades de comunicación y gestión del conocimiento
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

// Middleware para actualizar lastUpdated
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
