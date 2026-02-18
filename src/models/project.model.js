const mongoose = require('mongoose');

/**
 * Model: Project
 * Represents a project managed by a project manager within an organization
 * Following SOLID principles: Single Responsibility Principle
 */
const projectSchema = new mongoose.Schema({
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
  
  teamSize: {
    type: Number,
    required: [true, 'Team size is required'],
    min: [1, 'Team size must be at least 1'],
    max: [100, 'Team size cannot exceed 100'],
    default: 5
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
  
  criticalDependencies: [{
    type: String,
    trim: true,
    maxlength: [500, 'Dependency description cannot exceed 500 characters']
  }],
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
  
  workMode: {
    type: String,
    enum: [
      'inherit_from_organization', // Hereda de la política organizacional
      'office_mode',               // 100% presencial
      'office_first',              // Presencial con remoto puntual
      'office_remote_mix',         // Alternancia libre
      'remote_first',              // Remoto con presencial excepcional
      'remote_mode'                // 100% remoto
    ],
    default: 'inherit_from_organization',
    description: 'Work mode for this specific project'
  },
  
  workModeDetails: {
    type: String,
    trim: true,
    maxlength: [500, 'Work mode details cannot exceed 500 characters'],
    description: 'Additional details or clarifications about the work mode'
  },
  
  knowledgeManagementSystem: {
    type: String,
    trim: true
  },

  knowledgeManagementTools: [{
    type: String,
    trim: true
  }],

  documentationProcesses: {
    hasStandardization: {
      type: Boolean,
      default: false
    },
    templates: {
      type: Boolean,
      default: false
    },
    reviewProcess: {
      type: Boolean,
      default: false
    }
  },
  hasOrganizationalChart: {
    type: Boolean,
    default: false
  },

  taskTrackingSystem: {
    type: String,
    trim: true
  },

  rolesAndResponsibilities: [{
    roleName: {
      type: String,
      required: true,
      trim: true
    },
    responsibilities: [{
      type: String,
      trim: true
    }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    clarityScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  }],
  hasStandardizedProcedures: {
    type: Boolean,
    default: false
  },

  requiresRegulatoryCompliance: {
    type: Boolean,
    default: false
  },

  complianceStandards: [{
    type: String,
    trim: true
  }],

  standardsDocumentation: {
    type: String,
    trim: true,
    maxlength: [2000, 'Standards documentation cannot exceed 2000 characters']
  },
  
  coreHours: {
    start: {
      type: String,
      trim: true
    },
    end: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      trim: true
    }
  },

  meetingRotationPolicy: {
    type: Boolean,
    default: false
  },

  timezoneConsiderations: {
    type: String,
    trim: true,
    maxlength: [1000, 'Timezone considerations cannot exceed 1000 characters']
  },

  requiresOffHoursReporting: {
    type: Boolean,
    default: false
  },

  asyncCommunicationStrategy: {
    type: String,
    trim: true,
    maxlength: [1000, 'Async strategy cannot exceed 1000 characters']
  },

  // New Risk Calculation Fields (Hofstede-based)
  involvedCountries: [{
    type: String,
    trim: true,
    description: 'List of countries involved in the project (e.g., "Spain", "United States", "Germany")'
  }],

  requiredAutonomyLevel: {
    type: Number,
    min: 1,
    max: 5,
    description: 'Required team autonomy level: 1=Not needed, 2=Somewhat needed, 3=Moderately needed, 4=Quite needed, 5=Completely needed'
  },

  requiredScheduleFlexibility: {
    type: Number,
    min: 1,
    max: 5,
    description: 'Required schedule flexibility: 1=Not needed, 2=Somewhat needed, 3=Moderately needed, 4=Quite needed, 5=Completely needed'
  },

  requiredTravelAvailability: {
    type: Number,
    min: 1,
    max: 5,
    description: 'Required travel availability: 1=Not needed, 2=Somewhat needed, 3=Moderately needed, 4=Quite needed, 5=Completely needed'
  },

  // Metadata and Relationships
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
  },
  // Risk Prediction (CBR System)
  riskPredictions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Risk'
  }],
  
  riskPredictionMetadata: {
    lastPredictionDate: Date,
    caseBaseSize: Number,
    systemPhase: {
      type: Number,
      min: 1,
      max: 5
    },
    treeWeight: Number,
    cbrWeight: Number,
    similarCasesUsed: Number
  },
  // Team Selection Configuration (Customizable by PM)
  teamSelectionConfig: {
    // Phase 1: Technical Matching (Manhattan Distance Weights)
    phase1: {
      // Main components weights for Manhattan distance calculation
      skillsWeight: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.4,
        description: 'Weight for technical skills matching'
      },
      experienceWeight: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.3,
        description: 'Weight for experience level matching'
      },
      complexityWeight: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.2,
        description: 'Weight for system complexity matching'
      },
      availabilityWeight: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.1,
        description: 'Weight for availability and workload'
      },
      
      // Detailed availability sub-components
      availabilityComponents: {
        hoursWeight: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.5,
          description: 'Weight for weekly hours availability'
        },
        startDateWeight: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.2,
          description: 'Weight for project start date availability'
        },
        travelWeight: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.15,
          description: 'Weight for travel willingness'
        },
        offHoursWeight: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.15,
          description: 'Weight for after-hours availability'
        }
      },
      
      // Thresholds and factors
      skillMatchPenalty: {
        type: Number,
        min: 0,
        default: 5,
        description: 'Penalty distance for missing required skill'
      },
      experienceNormalizationFactor: {
        type: Number,
        min: 0.1,
        default: 2,
        description: 'Factor to normalize experience distance'
      },
      complexityMultiplier: {
        type: Number,
        min: 0.1,
        default: 1.5,
        description: 'Multiplier for complexity mismatch'
      },
      
      // Complexity estimation factors
      complexityFactors: {
        certificationsBonus: {
          type: Number,
          default: 0.5,
          description: 'Score bonus per certification (min 2)'
        },
        advancedSkillsBonus: {
          type: Number,
          default: 0.5,
          description: 'Score bonus for advanced skills (min 5)'
        },
        projectsBonus: {
          type: Number,
          default: 0.5,
          description: 'Score bonus for completed projects (min 3)'
        },
        experienceBonus: {
          type: Number,
          default: 0.5,
          description: 'Score bonus for years of experience (min 5)'
        }
      },
      
      // Candidate pool size multiplier
      candidatePoolMultiplier: {
        type: Number,
        min: 1,
        default: 2,
        description: 'Multiplier for candidate pool size (teamSize * multiplier)'
      }
    },
    
    // Phase 2: Personality Optimization
    phase2: {
      enabled: {
        type: Boolean,
        default: true,
        description: 'Enable personality-based optimization'
      },
      
      // Project profile weights by personality trait
      projectProfiles: {
        innovation: {
          Openness: { min: { type: Number, default: 3.5 }, optimal: { type: Number, default: 4.0 }, weight: { type: Number, default: 0.35 } },
          Extraversion: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.20 } },
          Conscientiousness: { min: { type: Number, default: 2.5 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.20 } },
          Agreeableness: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.15 } },
          Neuroticism: { max: { type: Number, default: 3.5 }, optimal: { type: Number, default: 2.5 }, weight: { type: Number, default: 0.10 } }
        },
        maintenance: {
          Conscientiousness: { min: { type: Number, default: 4.0 }, optimal: { type: Number, default: 4.5 }, weight: { type: Number, default: 0.40 } },
          Agreeableness: { min: { type: Number, default: 3.5 }, optimal: { type: Number, default: 4.0 }, weight: { type: Number, default: 0.25 } },
          Neuroticism: { max: { type: Number, default: 3.0 }, optimal: { type: Number, default: 2.5 }, weight: { type: Number, default: 0.15 } },
          Openness: { min: { type: Number, default: 2.5 }, optimal: { type: Number, default: 3.0 }, weight: { type: Number, default: 0.10 } },
          Extraversion: { min: { type: Number, default: 2.5 }, optimal: { type: Number, default: 3.0 }, weight: { type: Number, default: 0.10 } }
        },
        crisis: {
          Conscientiousness: { min: { type: Number, default: 4.0 }, optimal: { type: Number, default: 4.5 }, weight: { type: Number, default: 0.35 } },
          Neuroticism: { max: { type: Number, default: 2.5 }, optimal: { type: Number, default: 2.0 }, weight: { type: Number, default: 0.30 } },
          Extraversion: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.20 } },
          Agreeableness: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.10 } },
          Openness: { min: { type: Number, default: 2.5 }, optimal: { type: Number, default: 3.0 }, weight: { type: Number, default: 0.05 } }
        },
        research: {
          Openness: { min: { type: Number, default: 4.0 }, optimal: { type: Number, default: 4.5 }, weight: { type: Number, default: 0.40 } },
          Conscientiousness: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.25 } },
          Neuroticism: { max: { type: Number, default: 3.0 }, optimal: { type: Number, default: 2.5 }, weight: { type: Number, default: 0.15 } },
          Extraversion: { min: { type: Number, default: 2.5 }, optimal: { type: Number, default: 3.0 }, weight: { type: Number, default: 0.10 } },
          Agreeableness: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.10 } }
        },
        standard: {
          Conscientiousness: { min: { type: Number, default: 3.5 }, optimal: { type: Number, default: 4.0 }, weight: { type: Number, default: 0.30 } },
          Openness: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.25 } },
          Agreeableness: { min: { type: Number, default: 3.0 }, optimal: { type: Number, default: 3.5 }, weight: { type: Number, default: 0.20 } },
          Extraversion: { min: { type: Number, default: 2.5 }, optimal: { type: Number, default: 3.0 }, weight: { type: Number, default: 0.15 } },
          Neuroticism: { max: { type: Number, default: 3.5 }, optimal: { type: Number, default: 3.0 }, weight: { type: Number, default: 0.10 } }
        }
      },
      
      // Synergy calculation weights
      synergyWeights: {
        roleDiversityWeight: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.30,
          description: 'Weight for role diversity in team'
        },
        projectFitWeight: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.40,
          description: 'Weight for project profile fit'
        },
        previousCollaborationsWeight: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.30,
          description: 'Weight for previous collaborations between team members'
        }
      }
    },
    
    // CBR (Case-Based Reasoning) Configuration
    cbr: {
      // Dimension weights for similarity calculation
      // NOTE: Must be in schema, otherwise Mongoose (strict) will strip it on save.
      dimensionWeights: {
        coordination: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.25,
          description: 'Weight for coordination dimension'
        },
        technical: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.30,
          description: 'Weight for technical dimension'
        },
        team: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.20,
          description: 'Weight for team dimension'
        },
        management: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.15,
          description: 'Weight for management dimension'
        },
        organizational: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.10,
          description: 'Weight for organizational dimension'
        }
      },

      // CBR parameters
      kSimilarCases: {
        type: Number,
        min: 1,
        max: 20,
        default: 5,
        description: 'Number of similar cases to retrieve'
      },
      minSimilarityThreshold: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.3,
        description: 'Minimum similarity threshold to consider a case'
      }
    },
    
    // Decision Tree Configuration (Expert Rules)
    decisionTree: {
      // Risk detection thresholds
      riskThresholds: {
        // Skill Gap Thresholds
        skillGapCritical: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.5,
          description: 'Tech match ratio for critical risk (e.g., 0.5 = <50%)'
        },
        skillGapMajor: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.7,
          description: 'Tech match ratio for major risk (e.g., 0.7 = <70%)'
        },
        minTechnologiesThreshold: {
          type: Number,
          min: 1,
          default: 3,
          description: 'Minimum missing technologies to trigger risk'
        },
        maxJuniorRatio: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.6,
          description: 'Max ratio of juniors in complex projects (e.g., 0.6 = 60%)'
        },
        minProficiencyThreshold: {
          type: Number,
          min: 1,
          max: 5,
          default: 2.0,
          description: 'Min avg proficiency for complex projects (1-5 scale)'
        },
        // Communication Risk Thresholds
        minTimeOverlapHours: {
          type: Number,
          min: 0,
          max: 8,
          default: 2,
          description: 'Minimum hours of time overlap before async tools are required'
        },
        normalOverlapHours: {
          type: Number,
          min: 2,
          max: 8,
          default: 6,
          description: 'Minimum hours for normal overlap (all tools acceptable)'
        },
        // Overload Thresholds
        overloadCritical: {
          type: Number,
          min: 40,
          default: 60,
          description: 'Weekly hours threshold for critical overload'
        },
        overloadHigh: {
          type: Number,
          min: 40,
          default: 50,
          description: 'Weekly hours threshold for high overload'
        },
        overloadAverageHours: {
          type: Number,
          min: 30,
          default: 45,
          description: 'Average hours/week threshold for team overload risk'
        },
        maxConcurrentProjectsThreshold: {
          type: Number,
          min: 1,
          default: 2,
          description: 'Max concurrent projects per member before overload risk (e.g., 2 = risk if >2)'
        },
        // Dependency Risk Thresholds
        minCriticalDependencies: {
          type: Number,
          min: 1,
          default: 3,
          description: 'Minimum critical dependencies to trigger risk'
        },
        minInvolvedTeams: {
          type: Number,
          min: 1,
          default: 2,
          description: 'Minimum involved teams to trigger "multiple teams" condition'
        },
        riskScoreThresholdHigh: {
          type: Number,
          min: 1,
          default: 6,
          description: 'Risk score threshold for HIGH severity in dependency risk'
        },
        riskScoreThresholdMedium: {
          type: Number,
          min: 1,
          default: 4,
          description: 'Risk score threshold for MEDIUM severity in dependency risk'
        },
        timelineBufferPercentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 30,
          description: 'Timeline buffer percentage for dependency integration (e.g., 30%)'
        },
        // Scope Creep Thresholds
        minDescriptionLength: {
          type: Number,
          min: 100,
          default: 500,
          description: 'Minimum description length to avoid scope creep risk'
        },
        minKeyRoles: {
          type: Number,
          min: 1,
          default: 3,
          description: 'Minimum key roles to define (e.g., 3 = Product Owner, Tech Lead, Architect)'
        },
        clarityScoreCritical: {
          type: Number,
          min: 0,
          max: 3,
          default: 1,
          description: 'Clarity score threshold for CRITICAL/HIGH (e.g., < 1)'
        },
        clarityScoreMajor: {
          type: Number,
          min: 0,
          max: 3,
          default: 1.5,
          description: 'Clarity score threshold for MEDIUM (e.g., < 1.5)'
        },
        clientTimeOverlapHours: {
          type: Number,
          min: 0,
          max: 8,
          default: 4,
          description: 'Minimum hours of time overlap with client/stakeholders'
        },
        // Process Mismatch Thresholds
        maturityScoreLow: {
          type: Number,
          min: 0,
          max: 10,
          default: 1.5,
          description: 'Maturity score threshold for HIGH severity (e.g., < 1.5)'
        },
        maturityScoreMedium: {
          type: Number,
          min: 0,
          max: 10,
          default: 2.5,
          description: 'Maturity score threshold for MEDIUM severity (e.g., < 2.5)'
        },
        // Quality Degradation Thresholds
        lowDisciplineRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score increment for low team discipline'
        },
        overloadQualityRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score increment for overloaded team'
        },
        juniorComplexityRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score increment for junior team + high complexity'
        },
        qualityRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 6,
          description: 'Quality risk score threshold for HIGH severity'
        },
        qualityRiskScoreMediumHigh: {
          type: Number,
          min: 1,
          default: 4,
          description: 'Quality risk score threshold for MEDIUM-HIGH severity'
        },
        // Knowledge Management Thresholds
        maxTeamSizeForKM: {
          type: Number,
          min: 2,
          default: 5,
          description: 'Maximum team size before knowledge management risk (e.g., > 5 = risk)'
        },
        kmToolsRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score increment for missing KM tools'
        },
        kmDocRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score increment for minimal documentation'
        },
        kmRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 6,
          description: 'KM risk score threshold for HIGH severity'
        },
        kmRiskScoreMediumHigh: {
          type: Number,
          min: 1,
          default: 4,
          description: 'KM risk score threshold for MEDIUM-HIGH severity'
        },
        // Remote Work Support Gap Thresholds
        remoteWorkPercentageThreshold: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.5,
          description: 'Remote work percentage threshold for risk activation (e.g., 0.5 = 50%)'
        },
        noPolicyRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score for missing remote work policies'
        },
        noToolsRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score for missing collaborative tools'
        },
        noTechSupportRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score for missing tech support'
        },
        remoteRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 6,
          description: 'Remote work risk score threshold for HIGH severity'
        },
        // Role Clarity Gap Thresholds
        minTeamSizeForRoleClarity: {
          type: Number,
          min: 2,
          default: 8,
          description: 'Minimum team size before role clarity becomes critical (e.g., > 8)'
        },
        noOrgChartRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score for missing organizational chart'
        },
        noRolesRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score for roles not defined for team members'
        },
        roleRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 6,
          description: 'Role clarity risk score threshold for HIGH severity'
        },
        roleRiskScoreMediumHigh: {
          type: Number,
          min: 1,
          default: 4,
          description: 'Role clarity risk score threshold for MEDIUM-HIGH severity'
        },
        // Timezone Scheduling Gap Thresholds
        minTimeOverlapHoursThreshold: {
          type: Number,
          min: 0,
          max: 12,
          default: 3,
          description: 'Minimum overlap hours required (e.g., 3 = <3h triggers risk)'
        },
        minTimezonesForRisk: {
          type: Number,
          min: 1,
          default: 3,
          description: 'Minimum timezones to trigger risk (e.g., >= 3)'
        },
        lowOverlapRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score for low time overlap'
        },
        multipleTimezonesRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score for multiple timezones'
        },
        frequentMeetingsRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score for frequent meetings required'
        },
        timezoneRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 6,
          description: 'Timezone risk score threshold for HIGH severity'
        },
        
        // Risk 19: Change Resistance
        lowOpennessThreshold: {
          type: Number,
          min: 1,
          max: 5,
          default: 2.5,
          description: 'Openness score below this triggers change resistance risk'
        },
        highComplexityRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score for high complexity projects'
        },
        specializedToolsRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score when specialized tools required'
        },
        missingTechRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score per missing technology'
        },
        experienceGapRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score when experience gap detected'
        },
        changeResistanceRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 7,
          description: 'Change resistance risk score threshold for HIGH severity'
        },
        
        // Risk 20: Burnout Susceptibility
        highNeuroticismThreshold: {
          type: Number,
          min: 1,
          max: 5,
          default: 3.5,
          description: 'Neuroticism score above this triggers burnout risk'
        },
        overloadRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when team is overloaded'
        },
        highWorkloadHoursThreshold: {
          type: Number,
          min: 40,
          max: 80,
          default: 45,
          description: 'Weekly hours threshold for high workload'
        },
        moderateWorkloadRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score for moderate-high workload (40-45h)'
        },
        lowSyncOverlapRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score for sync required with low overlap'
        },
        burnoutRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 7,
          description: 'Burnout risk score threshold for HIGH severity'
        },
        
        // Risk 22: Onboarding Issues
        newMembersPercentageThreshold: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.3,
          description: 'Percentage of new members that triggers risk (0.3 = 30%)'
        },
        noMentoringRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when no mentoring program'
        },
        noOnboardingDocsRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when missing onboarding documentation'
        },
        noIntroMeetingsRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score when no introductory meetings'
        },
        remoteOnboardingRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score for remote onboarding without structure'
        },
        onboardingRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 7,
          description: 'Onboarding risk score threshold for HIGH severity'
        },
        
        // Risk 23: Social Isolation
        remoteWorkPercentageForIsolation: {
          type: Number,
          min: 0,
          max: 1,
          default: 0.7,
          description: 'Remote work percentage threshold for isolation risk (0.7 = 70%)'
        },
        fullRemoteIsolationRiskScore: {
          type: Number,
          min: 0,
          default: 4,
          description: 'Risk score for 100% remote work'
        },
        noTeamBuildingRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when no team building activities'
        },
        noFaceToFaceMeetingRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when no annual face-to-face meeting'
        },
        noSocialChannelsRiskScore: {
          type: Number,
          min: 0,
          default: 1,
          description: 'Risk score when no social communication channels'
        },
        isolationRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 8,
          description: 'Social isolation risk score threshold for HIGH severity'
        },
        
        // Risk 24: Digital Fatigue
        excessiveMeetingsThreshold: {
          type: Number,
          min: 5,
          max: 30,
          default: 15,
          description: 'Weekly meetings count threshold for excessive meetings'
        },
        longMeetingDurationThreshold: {
          type: Number,
          min: 30,
          max: 180,
          default: 90,
          description: 'Meeting duration in minutes threshold for long meetings'
        },
        excessiveMeetingsRiskScore: {
          type: Number,
          min: 0,
          default: 4,
          description: 'Risk score for excessive weekly meetings (>15)'
        },
        longMeetingsRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score for very long meetings (>90 min)'
        },
        noDisconnectionPolicyRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when no digital disconnection policy'
        },
        digitalFatigueRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 9,
          description: 'Digital fatigue risk score threshold for HIGH severity'
        },
        
        // Risk 25: Work-Life Boundary Blur
        fullyRemoteBoundaryRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score for 100% remote work mode'
        },
        noTimeOffPolicyRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score when no time-off/disconnection policy'
        },
        longProjectDurationThreshold: {
          type: Number,
          min: 1,
          max: 24,
          default: 6,
          description: 'Project duration in months threshold for long projects'
        },
        strictDeadlineRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when project has strict deadline'
        },
        boundaryBlurRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 8,
          description: 'Work-life boundary blur risk score threshold for HIGH severity'
        },
        
        // Risk 26: Meeting Fatigue
        meetingFatigueThreshold: {
          type: Number,
          min: 5,
          max: 30,
          default: 15,
          description: 'Weekly meetings count threshold for meeting fatigue'
        },
        excessiveMeetingsWithRemoteRiskScore: {
          type: Number,
          min: 0,
          default: 4,
          description: 'Risk score for excessive meetings in remote mode'
        },
        multipleTeamsRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score when multiple teams involved (>=3)'
        },
        noAsyncPolicyRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score when no async-first policy'
        },
        meetingFatigueRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 8,
          description: 'Meeting fatigue risk score threshold for HIGH severity'
        },
        
        // Risk 27: Technostress Overload
        highToolCountThreshold: {
          type: Number,
          min: 3,
          max: 20,
          default: 5,
          description: 'Number of tools threshold for technostress risk'
        },
        excessiveToolsRiskScore: {
          type: Number,
          min: 0,
          default: 4,
          description: 'Risk score for excessive number of tools (>10)'
        },
        noToolTrainingRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score when no tool training provided'
        },
        frequentTechChangesRiskScore: {
          type: Number,
          min: 0,
          default: 2,
          description: 'Risk score for frequent technology changes'
        },
        technostressRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 9,
          description: 'Technostress risk score threshold for HIGH severity'
        },
        
        // Risk 31: Tool Fragmentation
        toolFragmentationThreshold: {
          type: Number,
          min: 3,
          max: 20,
          default: 5,
          description: 'Number of main tools threshold for fragmentation risk'
        },
        manyToolsFragmentationRiskScore: {
          type: Number,
          min: 0,
          default: 4,
          description: 'Risk score for too many tools (>12)'
        },
        noToolIntegrationRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score when tools are not integrated'
        },
        noSingleSourceOfTruthRiskScore: {
          type: Number,
          min: 0,
          default: 3,
          description: 'Risk score when no single source of truth'
        },
        fragmentationRiskScoreHigh: {
          type: Number,
          min: 1,
          default: 9,
          description: 'Tool fragmentation risk score threshold for HIGH severity'
        }
      },
      
      // Personality-based risk thresholds
      personalityRiskThresholds: {
        agreeablenessLow: {
          type: Number,
          min: 1,
          max: 5,
          default: 2.5,
          description: 'Low agreeableness threshold for conflict risk'
        },
        agreeablenessVarianceHigh: {
          type: Number,
          min: 0,
          default: 1.5,
          description: 'High variance threshold for conflict risk'
        },
        neuroticismHigh: {
          type: Number,
          min: 1,
          max: 5,
          default: 3.5,
          description: 'High neuroticism threshold for stress risk'
        }
      }
    }
  },
  
  // Team Synergy Cache (Performance Optimization)
  synergyCache: {
    lastCalculatedAt: {
      type: Date,
      index: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    teamSize: {
      type: Number
    },
    profilesCovered: {
      type: Number
    },
    expiresAt: {
      type: Date,
      index: true
    },
    version: {
      type: Number,
      default: 1
    }
  },
  // Project Outcome (Post-Completion)
  projectOutcome: {
    actualDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months']
      }
    },
    actualBudget: Number,
    finalQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    completionReason: {
      type: String,
      enum: ['successful', 'cancelled', 'partial_delivery']
    },
    actualRisks: [{
      riskType: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      description: String,
      mitigationActions: [String],
      impact: String
    }],
    teamFeedback: {
      satisfactionLevel: {
        type: Number,
        min: 1,
        max: 5
      },
      workloadLevel: {
        type: Number,
        min: 1,
        max: 5
      },
      communicationQuality: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String
    },
    lessonsLearned: [String],
    successfulPractices: [String],
    unsuccessfulPractices: [String],
    recommendations: [String],
    capturedAt: Date,
    capturedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

projectSchema.index({ organization: 1, status: 1 });
projectSchema.index({ projectManager: 1, status: 1 });
projectSchema.index({ 'assignedEmployees.user': 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ estimatedStartDate: 1, estimatedEndDate: 1 });

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
// Instance Methods

/**
 * Check if a user is the project manager
 */
projectSchema.methods.isProjectManager = function(userId) {
  if (!this.projectManager) return false;
  
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
    if (!emp.user) return false;
    
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
    if (!emp.user) return false;
    
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

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

projectSchema.pre('save', function(next) {
  if (this.actualStartDate && this.actualEndDate) {
    if (this.actualEndDate < this.actualStartDate) {
      return next(new Error('Actual end date must be after actual start date'));
    }
  }
  next();
});

// Virtual field: expectedDuration
// Automatically calculated from estimatedStartDate and estimatedEndDate
projectSchema.virtual('expectedDuration').get(function() {
  if (!this.estimatedStartDate || !this.estimatedEndDate) {
    return { value: 0, unit: 'days' };
  }
  
  const diffMs = this.estimatedEndDate - this.estimatedStartDate;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  // Convert to most appropriate unit
  if (diffDays >= 365) {
    const years = Math.round((diffDays / 365) * 10) / 10; // Round to 1 decimal
    return { value: years, unit: 'years' };
  } else if (diffDays >= 30) {
    const months = Math.round((diffDays / 30) * 10) / 10;
    return { value: months, unit: 'months' };
  } else if (diffDays >= 7) {
    const weeks = Math.round((diffDays / 7) * 10) / 10;
    return { value: weeks, unit: 'weeks' };
  } else {
    return { value: diffDays, unit: 'days' };
  }
});

// Ensure virtuals are included in JSON output
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// Static Methods

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
