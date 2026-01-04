const mongoose = require('mongoose');

/**
 * Model: Risk
 * Represents a predicted or actual risk for a project
 * Part of the CBR + Decision Tree risk prediction system
 */
const riskSchema = new mongoose.Schema({
  // ============================================
  // 1. Basic Information
  // ============================================
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  
  // ============================================
  // 2. Risk Classification
  // ============================================
  type: {
    type: String,
    enum: [
      'communication_breakdown',
      'skill_gap',
      'team_overload',
      'dependency_blockage',
      'scope_creep',
      'process_mismatch',
      'technical_infrastructure',
      'quality_degradation',
      'vendor_issue',
      'security_compliance',
      'budget_overrun',
      'resource_unavailability',
      // NEW: Enhanced risk types from research [14-21]
      'knowledge_management_gap',
      'remote_work_support_gap',
      'role_clarity_gap',
      'standards_compliance_gap',
      'timezone_scheduling_gap',
      'other'
    ],
    required: true,
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  category: {
    type: String,
    enum: ['coordination', 'technical', 'team', 'management', 'organizational'],
    required: true
  },
  
  // ============================================
  // 3. Prediction Information
  // ============================================
  severity: {
    type: String,
    enum: ['low', 'medium', 'medium-high', 'high', 'critical', 'emerging'],
    required: true
  },
  
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 1;
      },
      message: 'Probability must be between 0 and 1'
    }
  },
  
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    validate: {
      validator: function(value) {
        return value >= 0 && value <= 1;
      },
      message: 'Confidence must be between 0 and 1'
    }
  },
  
  // ============================================
  // 4. Source and Reasoning
  // ============================================
  source: {
    type: String,
    enum: ['expert_rules', 'cbr', 'combined', 'seed_cases', 'emerging_pattern'],
    required: true
  },
  
  reasoning: [{
    type: String,
    trim: true,
    maxlength: [500, 'Reasoning item cannot exceed 500 characters']
  }],
  
  indicators: [{
    type: String,
    trim: true,
    maxlength: [300, 'Indicator cannot exceed 300 characters']
  }],
  
  // ============================================
  // 5. CBR-Specific Data
  // ============================================
  basedOnCases: [{
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CaseBase'
    },
    similarity: {
      type: Number,
      min: 0,
      max: 1
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  }],
  
  similarityBreakdown: {
    coordination: Number,
    technical: Number,
    team: Number,
    management: Number,
    organizational: Number
  },
  
  // ============================================
  // 6. Predictions and Timeline
  // ============================================
  predictedImpact: {
    scheduleDelay: {
      min: Number, // days
      max: Number,
      description: String
    },
    budgetOverrun: {
      min: Number, // percentage
      max: Number,
      description: String
    },
    qualityImpact: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    teamMoraleImpact: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  },
  
  expectedWeek: {
    type: Number,
    min: 1,
    max: 100
  },
  
  expectedWeekRange: {
    min: Number,
    max: Number
  },
  
  // ============================================
  // 7. Recommendations
  // ============================================
  recommendations: [{
    type: String,
    trim: true,
    maxlength: [1000, 'Recommendation cannot exceed 1000 characters']
  }],
  
  mitigationStrategies: [{
    strategy: {
      type: String,
      required: true,
      trim: true
    },
    effectivenessScore: {
      type: Number,
      min: 0,
      max: 1
    },
    basedOnCases: [String], // caseIds where this worked
    effort: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }],
  
  // ============================================
  // 8. Early Warning Signals
  // ============================================
  earlyWarningSignals: [{
    signal: String,
    threshold: String,
    checkFrequency: String
  }],
  
  // ============================================
  // 9. Actual Outcome (Updated Post-Project)
  // ============================================
  occurred: {
    type: Boolean,
    default: null
  },
  
  actualSeverity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', null],
    default: null
  },
  
  detectedAt: {
    type: Date,
    default: null
  },
  
  mitigatedAt: {
    type: Date,
    default: null
  },
  
  actualImpact: {
    scheduleDelayDays: Number,
    budgetOverrunPercent: Number,
    qualityScore: Number,
    description: String
  },
  
  rootCause: {
    type: String,
    trim: true,
    maxlength: [1000, 'Root cause description cannot exceed 1000 characters']
  },
  
  // ============================================
  // 10. Prediction Accuracy
  // ============================================
  predictionAccuracy: {
    severityMatch: Boolean, // predicted severity === actual severity
    occurrenceMatch: Boolean, // predicted to occur === actually occurred
    impactAccuracy: Number, // 0-1 score
    timelineAccuracy: Number, // 0-1 score
    overallScore: Number // 0-1 combined score
  },
  
  // ============================================
  // 11. Feedback and Learning
  // ============================================
  feedback: {
    usefulnessRating: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracyRating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comments cannot exceed 1000 characters']
    },
    providedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    providedAt: Date
  },
  
  // ============================================
  // 12. Metadata
  // ============================================
  status: {
    type: String,
    enum: ['predicted', 'monitoring', 'mitigated', 'occurred', 'avoided', 'false_positive'],
    default: 'predicted'
  },
  
  note: {
    type: String,
    trim: true,
    maxlength: [1000, 'Note cannot exceed 1000 characters']
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ============================================
// Indexes
// ============================================
riskSchema.index({ project: 1, type: 1 });
riskSchema.index({ organization: 1, occurred: 1 });
riskSchema.index({ probability: -1, severity: 1 });
riskSchema.index({ 'basedOnCases.caseId': 1 });

// ============================================
// Methods
// ============================================

/**
 * Mark risk as occurred with actual data
 */
riskSchema.methods.markAsOccurred = function(actualData) {
  this.occurred = true;
  this.actualSeverity = actualData.severity;
  this.detectedAt = actualData.detectedAt || new Date();
  this.actualImpact = actualData.impact;
  this.rootCause = actualData.rootCause;
  this.status = 'occurred';
  
  // Calculate prediction accuracy
  this.predictionAccuracy = {
    severityMatch: this.severity === actualData.severity,
    occurrenceMatch: true, // it occurred as predicted
    impactAccuracy: this.calculateImpactAccuracy(actualData.impact),
    overallScore: 0 // will be calculated
  };
  
  // Calculate overall accuracy score
  const scores = [
    this.predictionAccuracy.severityMatch ? 1 : 0.5,
    1, // occurred match
    this.predictionAccuracy.impactAccuracy
  ];
  this.predictionAccuracy.overallScore = 
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  return this.save();
};

/**
 * Mark risk as avoided (did not occur)
 */
riskSchema.methods.markAsAvoided = function(reason) {
  this.occurred = false;
  this.status = 'avoided';
  this.note = reason;
  
  // Calculate prediction accuracy (false positive)
  this.predictionAccuracy = {
    severityMatch: false,
    occurrenceMatch: false,
    impactAccuracy: 0,
    overallScore: 0
  };
  
  return this.save();
};

/**
 * Mark risk as mitigated
 */
riskSchema.methods.markAsMitigated = function(mitigationDate, effectiveness) {
  this.status = 'mitigated';
  this.mitigatedAt = mitigationDate || new Date();
  
  if (effectiveness) {
    this.note = `Mitigated with ${effectiveness} effectiveness`;
  }
  
  return this.save();
};

/**
 * Calculate impact accuracy
 */
riskSchema.methods.calculateImpactAccuracy = function(actualImpact) {
  if (!this.predictedImpact || !actualImpact) return 0.5;
  
  let score = 0;
  let count = 0;
  
  // Schedule delay accuracy
  if (this.predictedImpact.scheduleDelay && actualImpact.scheduleDelayDays) {
    const predicted = (this.predictedImpact.scheduleDelay.min + 
                      this.predictedImpact.scheduleDelay.max) / 2;
    const actual = actualImpact.scheduleDelayDays;
    const error = Math.abs(predicted - actual) / Math.max(predicted, actual);
    score += Math.max(0, 1 - error);
    count++;
  }
  
  // Budget overrun accuracy
  if (this.predictedImpact.budgetOverrun && actualImpact.budgetOverrunPercent) {
    const predicted = (this.predictedImpact.budgetOverrun.min + 
                      this.predictedImpact.budgetOverrun.max) / 2;
    const actual = actualImpact.budgetOverrunPercent;
    const error = Math.abs(predicted - actual) / Math.max(predicted, actual);
    score += Math.max(0, 1 - error);
    count++;
  }
  
  return count > 0 ? score / count : 0.5;
};

/**
 * Get risk priority score (for sorting)
 */
riskSchema.methods.getPriorityScore = function() {
  const severityScore = {
    low: 1,
    medium: 2,
    'medium-high': 3,
    high: 4,
    critical: 5
  }[this.severity] || 2;
  
  // Priority = (severity * probability * confidence)
  return severityScore * this.probability * this.confidence;
};

// ============================================
// Statics
// ============================================

/**
 * Get all risks for a project
 */
riskSchema.statics.getProjectRisks = function(projectId, options = {}) {
  const query = { project: projectId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.occurred !== undefined) {
    query.occurred = options.occurred;
  }
  
  return this.find(query)
    .populate('basedOnCases.caseId')
    .sort({ probability: -1, severity: 1 });
};

/**
 * Get organization risk statistics
 */
riskSchema.statics.getOrganizationStats = async function(organizationId) {
  const risks = await this.find({ organization: organizationId });
  
  const stats = {
    total: risks.length,
    predicted: risks.filter(r => r.status === 'predicted').length,
    occurred: risks.filter(r => r.occurred === true).length,
    avoided: risks.filter(r => r.occurred === false).length,
    byType: {},
    bySeverity: {},
    avgConfidence: 0,
    avgAccuracy: 0
  };
  
  // Group by type
  risks.forEach(risk => {
    stats.byType[risk.type] = (stats.byType[risk.type] || 0) + 1;
    stats.bySeverity[risk.severity] = (stats.bySeverity[risk.severity] || 0) + 1;
  });
  
  // Calculate averages
  if (risks.length > 0) {
    stats.avgConfidence = risks.reduce((sum, r) => sum + r.confidence, 0) / risks.length;
    
    const risksWithAccuracy = risks.filter(r => r.predictionAccuracy?.overallScore);
    if (risksWithAccuracy.length > 0) {
      stats.avgAccuracy = risksWithAccuracy.reduce(
        (sum, r) => sum + r.predictionAccuracy.overallScore, 0
      ) / risksWithAccuracy.length;
    }
  }
  
  return stats;
};

/**
 * Get prediction accuracy report
 */
riskSchema.statics.getAccuracyReport = async function(organizationId) {
  const risks = await this.find({
    organization: organizationId,
    occurred: { $ne: null },
    'predictionAccuracy.overallScore': { $exists: true }
  });
  
  const report = {
    totalEvaluated: risks.length,
    correctPredictions: risks.filter(r => r.occurred === true).length,
    falsePositives: risks.filter(r => r.occurred === false).length,
    avgAccuracy: 0,
    byType: {}
  };
  
  // Calculate by type
  risks.forEach(risk => {
    if (!report.byType[risk.type]) {
      report.byType[risk.type] = {
        total: 0,
        occurred: 0,
        avgAccuracy: 0,
        accuracySum: 0
      };
    }
    
    report.byType[risk.type].total++;
    if (risk.occurred) report.byType[risk.type].occurred++;
    report.byType[risk.type].accuracySum += risk.predictionAccuracy.overallScore;
  });
  
  // Calculate averages
  Object.keys(report.byType).forEach(type => {
    const data = report.byType[type];
    data.avgAccuracy = data.accuracySum / data.total;
    delete data.accuracySum;
  });
  
  if (risks.length > 0) {
    report.avgAccuracy = risks.reduce(
      (sum, r) => sum + r.predictionAccuracy.overallScore, 0
    ) / risks.length;
  }
  
  return report;
};

// ============================================
// Pre-save hook
// ============================================
riskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Risk', riskSchema);
