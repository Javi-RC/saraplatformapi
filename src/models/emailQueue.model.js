const mongoose = require('mongoose');

const emailQueueSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['confirmation'],
    index: true
  },
  to: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'failed'],
    default: 'pending',
    index: true
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  lastError: {
    type: String,
    default: null
  },
  nextRetryAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

emailQueueSchema.index({ status: 1, nextRetryAt: 1 });

emailQueueSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 259200 }
);

module.exports = mongoose.model('EmailQueue', emailQueueSchema);
