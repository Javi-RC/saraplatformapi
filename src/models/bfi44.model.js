const mongoose = require('mongoose');

/**
 * Schema to store Big Five Inventory (BFI-44) responses
 * Following SOLID principles and existing model architecture
 */
const bfi44ResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  responses: {
    type: Map,
    of: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    required: true,
    validate: {
      validator: function(responses) {
        // Validate that exactly 44 responses exist
        return responses.size === 44;
      },
      message: 'Exactly 44 responses are required'
    }
  },
  results: {
    Extraversion: {
      type: Number,
      required: true
    },
    Agreeableness: {
      type: Number,
      required: true
    },
    Conscientiousness: {
      type: Number,
      required: true
    },
    Neuroticism: {
      type: Number,
      required: true
    },
    Openness: {
      type: Number,
      required: true
    }
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// OPTIMIZATION: Compound index for efficient profile lookups
// This index supports both single-user and bulk queries with sorting
bfi44ResponseSchema.index({ userId: 1, createdAt: -1 });
bfi44ResponseSchema.index({ userId: 1, completedAt: -1 });

// Index for time-based queries
bfi44ResponseSchema.index({ createdAt: -1 });

/**
 * Method to get the most recent profile for a user
 */
bfi44ResponseSchema.statics.getLatestProfile = async function(userId) {
  return this.findOne({ userId })
    .sort({ completedAt: -1 })
    .exec();
};

/**
 * Method to check if a user has a complete profile
 */
bfi44ResponseSchema.statics.hasProfile = async function(userId) {
  const profile = await this.findOne({ userId });
  return !!profile;
};

/**
 * Instance method to validate data integrity
 */
bfi44ResponseSchema.methods.validateIntegrity = function() {
  // Verify all responses are within the correct range
  for (const [key, value] of this.responses) {
    const questionId = parseInt(key, 10);
    if (questionId < 1 || questionId > 44) {
      return false;
    }
    if (value < 1 || value > 5) {
      return false;
    }
  }
  return true;
};

module.exports = mongoose.model('BFI44Response', bfi44ResponseSchema);
