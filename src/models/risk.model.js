const mongoose = require('mongoose');

/**
 * Model: Risk
 * Represents a predicted or actual risk for a project
 * Part of the CBR + Decision Tree risk prediction system
 */
const riskSchema = new mongoose.Schema({
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
  
  type: {
    type: String,
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
    enum: ['coordination', 'technical', 'team', 'management', 'organizational', 'other'],
    required: true
  },
  
  severity: {
    type: String,
    enum: ['low', 'medium', 'medium-high', 'high', 'critical', 'emerging'],
    required: true
  },
    
  source: {
    type: String,
    enum: [
      'expert_rules', 
      'cbr', 
      'combined', 
      'seed_cases', 
      'emerging_pattern', 
      'manual', 
      'expert_rules_early_warning',
      'expert_rules_hofstede',
      'expert_rules_linguistic',
      'expert_rules_project_requirements',
      'expert_rules_enhanced'
    ],
    required: true
  },
  
  // Flag to indicate user has edited the content (title, description, etc.)
  // When true, i18n should NOT overwrite user's custom content
  userEdited: {
    type: Boolean,
    default: false
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
  
  recommendations: [{
    type: String,
    trim: true,
    maxlength: [1000, 'Recommendation cannot exceed 1000 characters']
  }],
    
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
  
 
  rootCause: {
    type: String,
    trim: true,
    maxlength: [1000, 'Root cause description cannot exceed 1000 characters']
  },
  
  
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
  
  status: {
    type: String,
    enum: ['not occurred','occurred', 'predicted'],
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

riskSchema.index({ project: 1, type: 1 });
riskSchema.index({ organization: 1, occurred: 1 });
riskSchema.index({ similarity: -1, severity: 1 });
riskSchema.index({ 'basedOnCases.caseId': 1 });

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
 *

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
  
  // Priority = (severity * similarity)
  return severityScore * (this.similarity || 0.5);
};
// Statics

/**
 * Get all risks for a project
 */
riskSchema.statics.getProjectRisks = async function(projectId, options = {}) {
  const query = { project: projectId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.occurred !== undefined) {
    query.occurred = options.occurred;
  }
  
  try {
    // Check if CaseBase model is registered before attempting populate
    const modelExists = mongoose.modelNames().includes('CaseBase');
    
    if (modelExists) {
      return await this.find(query)
        .populate({
          path: 'basedOnCases.caseId',
          options: { strictPopulate: false }
        })
        .sort({ similarity: -1, severity: 1 });
    } else {
      // CaseBase model not registered, return without populate
      return await this.find(query).sort({ similarity: -1, severity: 1 });
    }
  } catch (error) {
    // If populate fails for any reason, return without populate
    console.error('Error in getProjectRisks, returning risks without case details:', error.message);
    return await this.find(query).sort({ similarity: -1, severity: 1 });
  }
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
// Pre-save hook
riskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Risk', riskSchema);
