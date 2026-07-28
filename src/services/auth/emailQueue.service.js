const EmailQueue = require('../../models/emailQueue.model');
const User = require('../../models/user.model');
const emailService = require('./email.service');

const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', service: 'emailQueue', msg, ...meta, timestamp: new Date().toISOString() })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', service: 'emailQueue', msg, ...meta, timestamp: new Date().toISOString() })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', service: 'emailQueue', msg, ...meta, timestamp: new Date().toISOString() }))
};

class EmailQueueService {
  constructor() {
    this.intervalId = null;
    this.isProcessing = false;
    this.pollIntervalMs = Number(process.env.EMAIL_QUEUE_POLL_INTERVAL_MS) || 10000;
    this.baseDelayMs = Number(process.env.EMAIL_RETRY_BASE_DELAY_MS) || 1000;
  }

  async enqueue(emailData) {
    const job = await EmailQueue.create({
      type: emailData.type || 'confirmation',
      to: emailData.to,
      payload: emailData.payload,
      status: 'pending',
      attempts: 0,
      nextRetryAt: new Date()
    });

    logger.info('Email enqueued', { jobId: job._id, type: job.type, to: job.to });
    return job;
  }

  async processPendingJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const jobs = await EmailQueue.find({
        status: { $in: ['pending', 'processing'] },
        nextRetryAt: { $lte: now },
        attempts: { $lt: 5 }
      }).sort({ createdAt: 1 }).limit(10);

      for (const job of jobs) {
        await this._processJob(job);
      }
    } catch (error) {
      logger.error('Error processing email queue', { error: error.message });
    } finally {
      this.isProcessing = false;
    }
  }

  async _processJob(job) {
    const { type } = job;

    try {
      await EmailQueue.findByIdAndUpdate(job._id, { status: 'processing' });

      let result;

      if (type === 'confirmation') {
        const { email, name, confirmLink } = job.payload;
        result = await emailService.sendConfirmationEmail(email, name, confirmLink);
      } else {
        throw new Error(`Unknown email type: ${type}`);
      }

      await EmailQueue.findByIdAndUpdate(job._id, {
        status: 'sent',
        sentAt: new Date(),
        attempts: job.attempts + 1
      });

      logger.info('Email sent from queue', { jobId: job._id, type, to: job.to });

      return result;
    } catch (error) {
      const newAttempts = job.attempts + 1;
      const maxAttempts = job.maxAttempts || 5;
      const newStatus = newAttempts >= maxAttempts ? 'failed' : 'pending';
      const delayMs = this.baseDelayMs * Math.pow(2, newAttempts - 1);
      const nextRetryAt = new Date(Date.now() + delayMs);

      await EmailQueue.findByIdAndUpdate(job._id, {
        status: newStatus,
        attempts: newAttempts,
        lastError: error.message,
        nextRetryAt
      });

      if (newStatus === 'failed') {
        logger.error('Email permanently failed after max attempts', {
          jobId: job._id,
          type,
          to: job.to,
          attempts: newAttempts,
          error: error.message
        });

        if (type === 'confirmation') {
          await this._deleteUnconfirmedUser(job.to);
        }
      } else {
        logger.warn('Email retry scheduled', {
          jobId: job._id,
          type,
          to: job.to,
          attempt: newAttempts,
          maxAttempts,
          nextRetryAt
        });
      }
    }
  }

  async _deleteUnconfirmedUser(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase(), isConfirmed: false });

      if (!user) {
        logger.warn('No unconfirmed user found to delete', { email });
        return;
      }

      await User.findByIdAndDelete(user._id);

      logger.info('Unconfirmed user deleted after email delivery failure', {
        userId: user._id,
        email: user.email,
        name: user.name
      });
    } catch (error) {
      logger.error('Failed to delete unconfirmed user', { email, error: error.message });
    }
  }

  start() {
    logger.info('Email queue worker started', { pollIntervalMs: this.pollIntervalMs });
    this.intervalId = setInterval(() => this.processPendingJobs(), this.pollIntervalMs);
    this.processPendingJobs();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Email queue worker stopped');
    }
  }

  async getStats() {
    const [pending, processing, sent, failed] = await Promise.all([
      EmailQueue.countDocuments({ status: 'pending' }),
      EmailQueue.countDocuments({ status: 'processing' }),
      EmailQueue.countDocuments({ status: 'sent' }),
      EmailQueue.countDocuments({ status: 'failed' })
    ]);

    return { pending, processing, sent, failed };
  }
}

module.exports = new EmailQueueService();
