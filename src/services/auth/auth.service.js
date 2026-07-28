const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../../utils/jwt');
const emailService = require('./email.service');
const emailQueueService = require('./emailQueue.service');
const authNotificationHelper = require('../notification/helpers/auth.helper');
const bfi44NotificationHelper = require('../notification/helpers/bfi44.helper');
const AppError = require('../../utils/AppError');
const { ROLES } = require('../../config/roles');

const { userRepository, bfi44Repository } = require('../../repositories');

const logger = {
  info: (msg, meta) => console.log(JSON.stringify({ level: 'info', service: 'auth', msg, ...meta, timestamp: new Date().toISOString() })),
  warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', service: 'auth', msg, ...meta, timestamp: new Date().toISOString() })),
  error: (msg, meta) => console.error(JSON.stringify({ level: 'error', service: 'auth', msg, ...meta, timestamp: new Date().toISOString() }))
};

class AuthService {
  async _sendConfirmationEmail(email, name, confirmLink, userId) {
    try {
      await emailService.sendConfirmationEmail(email, name, confirmLink);

      await userRepository.updateById(userId, {
        'emailStatus.lastSentAt': new Date(),
        'emailStatus.sendAttempts': 1,
        'emailStatus.lastError': null
      });

      return { sent: true, queued: false };
    } catch (error) {
      logger.warn('Immediate email send failed, enqueuing for background retry', {
        email,
        userId,
        error: error.message
      });

      const job = await emailQueueService.enqueue({
        type: 'confirmation',
        to: email,
        payload: { email, name, confirmLink }
      });

      await userRepository.updateById(userId, {
        'emailStatus.lastSentAt': new Date(),
        'emailStatus.sendAttempts': 0,
        'emailStatus.lastError': error.message,
        'emailStatus.queuedJobId': job._id
      });

      return { sent: false, queued: true, jobId: job._id };
    }
  }

  async register(userData) {
    const { email, name, password } = userData;

    const existingUser = await userRepository.findByEmail(email.toLowerCase());
    
    if (existingUser) {
      if (existingUser.isConfirmed) {
        throw AppError.conflict('USER_ALREADY_EXISTS', 'This email is already registered');
      }
      
      if (existingUser.verificationTokenExpiry && existingUser.verificationTokenExpiry < Date.now()) {
        await userRepository.deleteById(existingUser._id);
      } else {
        if (existingUser.registrationAttempts >= 3) {
          throw new AppError('TOO_MANY_ATTEMPTS', 429, 'Too many registration attempts. Please wait 24 hours or contact support.');
        }
        
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await userRepository.updateById(existingUser._id, {
          confirmationToken,
          confirmationTokenExpiry,
          verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
          registrationAttempts: (existingUser.registrationAttempts || 0) + 1
        });
        
        const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
        const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;
        
        const emailResult = await this._sendConfirmationEmail(email, name, confirmLink, existingUser._id);
        
        return {
          user: {
            id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name
          },
          message: 'Verification email resent. Check your inbox.',
          ...(emailResult.queued ? { warning: 'Email could not be sent immediately. It has been queued for retry.' } : {})
        };
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await userRepository.create({
      email: email.toLowerCase(),
      name: name.trim(),
      passwordHash,
      confirmationToken,
      confirmationTokenExpiry,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      registrationAttempts: 0,
      isConfirmed: false,
      role: ROLES.UNASSIGNED
    });

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;
    
    const emailResult = await this._sendConfirmationEmail(email, name, confirmLink, newUser._id);

    authNotificationHelper.notifyAccountCreated(newUser._id, name).catch(err => {
      logger.error('Error sending account created notification', { userId: newUser._id, error: err.message });
    });

    return {
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name
      },
      message: 'User registered. Check your email to confirm your account.',
      ...(emailResult.queued ? { warning: 'Email could not be sent immediately. It has been queued for retry.' } : {})
    };
  }

  async login(credentials) {
    const { email, password } = credentials;
    const MAX_LOGIN_ATTEMPTS = 3;
    const LOCK_TIME_MS = 15 * 60 * 1000;

    const user = await userRepository.findByEmail(email.toLowerCase(), { select: '+passwordHash +loginAttempts +lockUntil' });
    
    if (!user) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid credentials');
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMs = user.lockUntil - new Date();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      throw AppError.tooManyRequests(
        'ACCOUNT_LOCKED',
        `Account temporarily locked. Try again in ${remainingMinutes} minute(s)`
      );
    }

    if (user.lockUntil && user.lockUntil <= new Date()) {
      await userRepository.resetLoginAttempts(user._id);
    }

    if (!user.isConfirmed) {
      throw AppError.unauthorized('EMAIL_NOT_CONFIRMED', 'Please confirm your email before signing in');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const attempts = (user.loginAttempts || 0) + 1;
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        await userRepository.lockAccount(user._id, new Date(Date.now() + LOCK_TIME_MS));
        throw AppError.tooManyRequests(
          'ACCOUNT_LOCKED',
          'Too many failed login attempts. Account locked for 15 minutes'
        );
      }
      
      await userRepository.incrementLoginAttempts(user._id);
      throw AppError.unauthorized(
        'INVALID_CREDENTIALS',
        'Invalid email or password'
      );
    }

    if (user.loginAttempts > 0) {
      await userRepository.resetLoginAttempts(user._id);
    }

    await userRepository.updateLastLogin(user._id);

    const token = generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization || null
      }
    };
  }

  async confirmAccount(token) {
    const user = await userRepository.findOne({ 
      confirmationToken: token, 
      confirmationTokenExpiry: { $gt: new Date() } 
    });

    if (!user) {
      throw AppError.badRequest('INVALID_OR_EXPIRED_TOKEN', 'Invalid or expired token');
    }

    await userRepository.updateById(user._id, {
      isConfirmed: true,
      $unset: {
        confirmationToken: 1,
        confirmationTokenExpiry: 1
      },
      lastLogin: new Date()
    });

    authNotificationHelper.notifyAccountConfirmed(user._id, user.name).catch(err => {
      logger.error('Error sending account confirmed notification', { userId: user._id, error: err.message });
    });

    if (user.role === ROLES.EMPLOYEE) {
      const hasProfile = await bfi44Repository.userHasCompleted(user._id);
      if (!hasProfile) {
        bfi44NotificationHelper.notifyTestPending(user._id, user.name).catch(err => {
          logger.error('Error sending BFI-44 test notification', { userId: user._id, error: err.message });
        });
      }
    }

    return user;
  }

  async resendConfirmationEmail(email, name) {
    const user = await userRepository.findByEmail(email.toLowerCase());
    
    if (!user) {
      throw AppError.notFound('USER_NOT_FOUND', 'User not found');
    }

    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await userRepository.updateById(user._id, {
      confirmationToken,
      confirmationTokenExpiry,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      registrationAttempts: (user.registrationAttempts || 0) + 1
    });

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;

    const emailResult = await this._sendConfirmationEmail(email, name, confirmLink, user._id);

    return {
      message: 'Confirmation email sent',
      ...(emailResult.queued ? { warning: 'Email could not be sent immediately. It has been queued for retry.' } : {})
    };
  }
}

module.exports = new AuthService();
