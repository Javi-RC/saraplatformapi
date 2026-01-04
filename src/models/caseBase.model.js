const mongoose = require('mongoose');

/**
 * Model: CaseBase
 * Stores historical project cases for CBR (Case-Based Reasoning)
 * Each case represents a completed project with its characteristics and outcomes
 */
const caseBaseSchema = new mongoose.Schema({
  // ============================================
  // 1. Case Identification
  // ============================================
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
    index: true
  },
  
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  
  type: {
    type: String,
    enum: ['real', 'seed', 'synthetic'],
    required: true,
    default: 'real',
    index: true
  },
  
  source: {
    type: String,
    enum: ['completed_project', 'literature', 'expert_knowledge', 'imported'],
    default: 'completed_project'
  },
  
  // ============================================
  // 2. PROBLEM: Project Characteristics
  // ============================================
  problem: {
    // General info
    projectName: String,
    briefDescription: String,
    estimatedDuration: {
      value: Number,
      unit: String
    },
    
    // Features for similarity calculation
    features: {
      // Coordination (weight: 0.25)
      coordination: {
        teamRegions: [String],
        timeOverlap: Number, // hours
        requiresSyncComm: String,
        weeklyMeetings: Number,
        culturalDiversity: String,
        realTimeCommunicationLevel: String
      },
      
      // Technical (weight: 0.30)
      technical: {
        mainTechnologies: [String],
        experienceLevel: String,
        systemComplexity: String,
        documentationLevel: String,
        requiresSpecializedTools: Boolean,
        sharedInfrastructureDependency: String
      },
      
      // Team (weight: 0.20)
      team: {
        size: Number,
        weeklyHours: Number,
        distributedExperience: String,
        requiredLanguages: [String],
        languageProficiency: String
      },
      
      // Management (weight: 0.15)
      management: {
        methodology: String,
        hasOnboarding: String,
        hasCICD: String,
        toolsFragmentation: String,
        clarityOfRequirements: String
      },
      
      // Organizational (weight: 0.10)
      organizational: {
        involvedTeams: Number,
        criticalDependencies: Number,
        informationFlow: String,
        stakeholdersCount: Number
      }
    }
  },
  
  // ============================================
  // 3. SOLUTION: What Actually Happened
  // ============================================
  solution: {
    // Outcome metrics
    completed: {
      type: Boolean,
      required: true
    },
    
    onTime: Boolean,
    
    delayDays: {
      type: Number,
      default: 0
    },
    
    budgetOverrun: {
      type: Number, // percentage
      default: 0
    },
    
    qualityScore: {
      type: Number,
      min: 1,
      max: 5
    },
    
    clientSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    },
    
    teamMorale: {
      type: Number,
      min: 1,
      max: 5
    },
    
    // Risks that materialized
    actualRisks: [{
      type: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      description: String,
      impact: String,
      detectedAt: Date,
      mitigatedAt: Date,
      rootCause: String,
      actualImpact: {
        scheduleDelayDays: Number,
        budgetOverrunPercent: Number,
        qualityImpact: String
      }
    }],
    
    // Metrics during project
    metrics: {
      avgVelocity: Number, // story points or tasks
      bugRate: Number, // bugs per unit of work
      meetingEfficiency: Number, // 1-5 rating
      teamMoraleProgression: [Number], // tracked over time
      deploymentFrequency: String,
      codeReviewTimeAvg: Number, // days
      cicdStability: Number // 1-5
    }
  },
  
  // ============================================
  // 4. RESULT: Lessons Learned
  // ============================================
  result: {
    lessonsLearned: [{
      type: String,
      trim: true,
      maxlength: [1000, 'Lesson cannot exceed 1000 characters']
    }],
    
    successfulPractices: [{
      practice: String,
      impact: String,
      replicable: Boolean
    }],
    
    unsuccessfulPractices: [{
      practice: String,
      impact: String,
      reason: String
    }],
    
    recommendations: [{
      type: String,
      trim: true,
      maxlength: [1000, 'Recommendation cannot exceed 1000 characters']
    }],
    
    keySuccessFactors: [String],
    keyFailureFactors: [String]
  },
  
  // ============================================
  // 5. Metadata and Statistics
  // ============================================
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    
    completedAt: Date,
    
    lastRevisited: Date,
    
    timesReused: {
      type: Number,
      default: 0
    },
    
    usefulnessScore: {
      type: Number,
      min: 1,
      max: 5
    },
    
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1.0
    },
    
    isGeneric: {
      type: Boolean,
      default: false
    },
    
    tags: [String],
    
    basedOn: String, // Literature reference if seed case
    
    // Accuracy tracking
    predictionAccuracy: {
      timesUsedForPrediction: Number,
      correctPredictions: Number,
      falsePositives: Number,
      avgAccuracyScore: Number
    }
  },
  
  // ============================================
  // 6. Similarity Indexing (for faster retrieval)
  // ============================================
  similarityIndex: {
    coordinationSignature: String,
    technicalSignature: String,
    teamSignature: String,
    managementSignature: String,
    organizationalSignature: String
  },
  
  // ============================================
  // 7. Feedback and Continuous Learning
  // ============================================
  feedback: [{
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    wasUseful: Boolean,
    accuracyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    providedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    providedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ============================================
// Indexes for Fast Retrieval
// ============================================
caseBaseSchema.index({ organization: 1, type: 1 });
caseBaseSchema.index({ 'metadata.tags': 1 });
caseBaseSchema.index({ 'metadata.timesReused': -1 });
caseBaseSchema.index({ 'metadata.usefulnessScore': -1 });
caseBaseSchema.index({ 'problem.features.technical.mainTechnologies': 1 });
caseBaseSchema.index({ 'problem.features.coordination.teamRegions': 1 });
caseBaseSchema.index({ 'similarityIndex.technicalSignature': 1 });

// ============================================
// Methods
// ============================================

/**
 * Mark case as reused (increment counter)
 */
caseBaseSchema.methods.markAsReused = function() {
  this.metadata.timesReused++;
  this.metadata.lastRevisited = new Date();
  return this.save();
};

/**
 * Update usefulness score with new feedback
 */
caseBaseSchema.methods.updateUsefulnessScore = function(newScore) {
  if (!this.metadata.usefulnessScore) {
    this.metadata.usefulnessScore = newScore;
  } else {
    // Weighted average: 70% old, 30% new
    this.metadata.usefulnessScore = 
      this.metadata.usefulnessScore * 0.7 + newScore * 0.3;
  }
  return this.save();
};

/**
 * Add feedback from a project that used this case
 */
caseBaseSchema.methods.addFeedback = function(projectId, feedbackData) {
  this.feedback.push({
    projectId,
    wasUseful: feedbackData.wasUseful,
    accuracyRating: feedbackData.accuracyRating,
    comments: feedbackData.comments,
    providedBy: feedbackData.providedBy,
    providedAt: new Date()
  });
  
  // Update overall usefulness score
  if (feedbackData.accuracyRating) {
    this.updateUsefulnessScore(feedbackData.accuracyRating);
  }
  
  // Update prediction accuracy stats
  if (!this.metadata.predictionAccuracy) {
    this.metadata.predictionAccuracy = {
      timesUsedForPrediction: 0,
      correctPredictions: 0,
      falsePositives: 0,
      avgAccuracyScore: 0
    };
  }
  
  this.metadata.predictionAccuracy.timesUsedForPrediction++;
  if (feedbackData.wasUseful) {
    this.metadata.predictionAccuracy.correctPredictions++;
  } else {
    this.metadata.predictionAccuracy.falsePositives++;
  }
  
  // Calculate average accuracy
  const { correctPredictions, timesUsedForPrediction } = this.metadata.predictionAccuracy;
  this.metadata.predictionAccuracy.avgAccuracyScore = 
    timesUsedForPrediction > 0 ? correctPredictions / timesUsedForPrediction : 0;
  
  return this.save();
};

/**
 * Generate similarity signature for indexing
 */
caseBaseSchema.methods.generateSimilaritySignature = function() {
  const features = this.problem.features;
  
  this.similarityIndex = {
    coordinationSignature: [
      features.coordination.teamRegions?.length || 0,
      features.coordination.timeOverlap || 0,
      features.coordination.culturalDiversity || 'medium'
    ].join('|'),
    
    technicalSignature: [
      features.technical.mainTechnologies?.join(',') || '',
      features.technical.systemComplexity || 'medium'
    ].join('|'),
    
    teamSignature: [
      features.team.size || 0,
      features.team.distributedExperience || 'medium'
    ].join('|'),
    
    managementSignature: [
      features.management.methodology || 'agile',
      features.management.hasOnboarding || 'partial',
      features.management.hasCICD || 'partial'
    ].join('|'),
    
    organizationalSignature: [
      features.organizational.involvedTeams || 0,
      features.organizational.criticalDependencies || 0
    ].join('|')
  };
  
  return this;
};

/**
 * Get case quality score (for filtering low-quality cases)
 */
caseBaseSchema.methods.getQualityScore = function() {
  let score = 0;
  let factors = 0;
  
  // Factor 1: Usefulness score
  if (this.metadata.usefulnessScore) {
    score += this.metadata.usefulnessScore / 5; // normalize to 0-1
    factors++;
  }
  
  // Factor 2: Times reused (popularity)
  if (this.metadata.timesReused > 0) {
    score += Math.min(this.metadata.timesReused / 10, 1); // cap at 1
    factors++;
  }
  
  // Factor 3: Confidence
  score += this.metadata.confidence;
  factors++;
  
  // Factor 4: Completeness of data
  const hasOutcome = this.solution.completed !== undefined;
  const hasRisks = this.solution.actualRisks && this.solution.actualRisks.length > 0;
  const hasLessons = this.result.lessonsLearned && this.result.lessonsLearned.length > 0;
  const completeness = (hasOutcome ? 0.4 : 0) + (hasRisks ? 0.3 : 0) + (hasLessons ? 0.3 : 0);
  score += completeness;
  factors++;
  
  // Factor 5: Recency (cases from last year are more relevant)
  if (this.metadata.completedAt) {
    const ageMonths = (Date.now() - this.metadata.completedAt) / (1000 * 60 * 60 * 24 * 30);
    const recencyScore = Math.max(0, 1 - (ageMonths / 36)); // decay over 3 years
    score += recencyScore;
    factors++;
  }
  
  return factors > 0 ? score / factors : 0.5;
};

// ============================================
// Statics
// ============================================

/**
 * Get all cases for an organization
 */
caseBaseSchema.statics.getOrganizationCases = function(organizationId, options = {}) {
  const query = { organization: organizationId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.minQuality) {
    // This requires calculating quality score, so we'll filter in memory
  }
  
  return this.find(query)
    .sort({ 'metadata.usefulnessScore': -1, 'metadata.timesReused': -1 });
};

/**
 * Get seed cases (generic cases from literature)
 */
caseBaseSchema.statics.getSeedCases = function() {
  return this.find({ type: 'seed' });
};

/**
 * Get statistics about the case base
 */
caseBaseSchema.statics.getCaseBaseStats = async function(organizationId) {
  const cases = await this.find({ organization: organizationId });
  
  const stats = {
    total: cases.length,
    byType: {
      real: cases.filter(c => c.type === 'real').length,
      seed: cases.filter(c => c.type === 'seed').length,
      synthetic: cases.filter(c => c.type === 'synthetic').length
    },
    avgUsefulnessScore: 0,
    avgTimesReused: 0,
    totalReuses: 0,
    avgQualityScore: 0,
    casesByAge: {
      recent: 0, // < 6 months
      medium: 0, // 6-18 months
      old: 0     // > 18 months
    },
    diversityIndex: 0
  };
  
  if (cases.length === 0) return stats;
  
  // Calculate averages
  let usefulnessSum = 0;
  let usefulnessCount = 0;
  let qualitySum = 0;
  
  const now = Date.now();
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
  const eighteenMonths = 18 * 30 * 24 * 60 * 60 * 1000;
  
  cases.forEach(caseDoc => {
    // Usefulness
    if (caseDoc.metadata.usefulnessScore) {
      usefulnessSum += caseDoc.metadata.usefulnessScore;
      usefulnessCount++;
    }
    
    // Times reused
    stats.avgTimesReused += caseDoc.metadata.timesReused;
    stats.totalReuses += caseDoc.metadata.timesReused;
    
    // Quality score
    qualitySum += caseDoc.getQualityScore();
    
    // Age distribution
    if (caseDoc.metadata.completedAt) {
      const age = now - caseDoc.metadata.completedAt;
      if (age < sixMonths) {
        stats.casesByAge.recent++;
      } else if (age < eighteenMonths) {
        stats.casesByAge.medium++;
      } else {
        stats.casesByAge.old++;
      }
    }
  });
  
  stats.avgUsefulnessScore = usefulnessCount > 0 ? usefulnessSum / usefulnessCount : 0;
  stats.avgTimesReused = stats.avgTimesReused / cases.length;
  stats.avgQualityScore = qualitySum / cases.length;
  
  // Calculate diversity index (how varied are the cases)
  const uniqueTechs = new Set();
  const uniqueRegions = new Set();
  const uniqueComplexities = new Set();
  
  cases.forEach(caseDoc => {
    caseDoc.problem.features.technical.mainTechnologies?.forEach(tech => 
      uniqueTechs.add(tech)
    );
    caseDoc.problem.features.coordination.teamRegions?.forEach(region => 
      uniqueRegions.add(region)
    );
    uniqueComplexities.add(caseDoc.problem.features.technical.systemComplexity);
  });
  
  // Diversity = average of unique values across dimensions
  stats.diversityIndex = (
    Math.min(uniqueTechs.size / 10, 1) +
    Math.min(uniqueRegions.size / 5, 1) +
    Math.min(uniqueComplexities.size / 3, 1)
  ) / 3;
  
  return stats;
};

/**
 * Find similar cases based on features
 */
caseBaseSchema.statics.findSimilar = async function(projectFeatures, organizationId, limit = 5) {
  // This is a simplified version - actual similarity calculation
  // would be done in the CBR service with proper weighted similarity
  
  const cases = await this.find({
    organization: organizationId,
    type: { $in: ['real', 'seed'] }
  });
  
  // Filter by minimum quality
  const qualityCases = cases.filter(c => c.getQualityScore() > 0.4);
  
  return qualityCases.slice(0, limit);
};

// ============================================
// Pre-save hook
// ============================================
caseBaseSchema.pre('save', function(next) {
  // Generate similarity signature if not exists
  if (!this.similarityIndex || !this.similarityIndex.technicalSignature) {
    this.generateSimilaritySignature();
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

module.exports = mongoose.model('CaseBase', caseBaseSchema);
