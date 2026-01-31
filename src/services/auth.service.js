const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');
const emailService = require('./email.service');
const authNotificationHelper = require('./authNotificationHelper');
const bfi44NotificationHelper = require('./bfi44NotificationHelper');
const AppError = require('../utils/AppError');

// Import repositories instead of models
const { userRepository, bfi44Repository } = require('../repositories');

class AuthService {
  async register(userData) {
    const { email, name, password, role} = userData;

    // Verificar si usuario existe
    const existingUser = await userRepository.findByEmail(email.toLowerCase());
    
    if (existingUser) {
      // Si el usuario ya está verificado, no permitir re-registro
      if (existingUser.isConfirmed) {
        throw AppError.conflict('USER_ALREADY_EXISTS', 'This email is already registered');
      }
      
      // Usuario existe pero no está verificado
      // Verificar si el token de verificación expiró
      if (existingUser.verificationTokenExpiry && existingUser.verificationTokenExpiry < Date.now()) {
        // Token expirado: permitir re-registro eliminando el usuario anterior
        await userRepository.deleteById(existingUser._id);
      } else {
        // Token aún válido: verificar límite de intentos
        if (existingUser.registrationAttempts >= 3) {
          throw new AppError('TOO_MANY_ATTEMPTS', 429, 'Too many registration attempts. Please wait 24 hours or contact support.');
        }
        
        // Permitir reenvío de email de verificación
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        await userRepository.updateById(existingUser._id, {
          confirmationToken,
          confirmationTokenExpiry,
          verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
          registrationAttempts: (existingUser.registrationAttempts || 0) + 1
        });
        
        // Reenviar email
        const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
        const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;
        
        try {
          await emailService.sendConfirmationEmail(email, name, confirmLink);
        } catch (error) {
          console.error('Error reenviando email:', error);
        }
        
        return {
          user: {
            id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name
          },
          message: 'Verification email resent. Check your inbox.'
        };
      }
    }

    // Crear usuario
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
      role: role
    });

    // Enviar email
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;
    
    try {
      await emailService.sendConfirmationEmail(email, name, confirmLink);
    } catch (error) {
      console.error('Error enviando email:', error);
    }

    // Enviar notificación In-App de bienvenida (asíncrono, no bloquea)
    authNotificationHelper.notifyAccountCreated(newUser._id, name).catch(err => {
      console.error('Error enviando notificación de cuenta creada:', err);
    });

    return {
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name
      },
      message: 'Usuario registrado. Revisa tu email para confirmar tu cuenta.'
    };
  }

  async login(credentials) {
    const { email, password } = credentials;
    const MAX_LOGIN_ATTEMPTS = 3;
    const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

    const user = await userRepository.findByEmail(email.toLowerCase(), { select: '+passwordHash +loginAttempts +lockUntil' });
    
    if (!user) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMs = user.lockUntil - new Date();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      throw AppError.tooManyRequests(
        'ACCOUNT_LOCKED',
        `Account temporarily locked. Try again in ${remainingMinutes} minute(s)`
      );
    }

    // Reset lock if expired
    if (user.lockUntil && user.lockUntil <= new Date()) {
      await userRepository.resetLoginAttempts(user._id);
    }

    if (!user.isConfirmed) {
      throw AppError.unauthorized('EMAIL_NOT_CONFIRMED', 'Please confirm your email before signing in');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock account for 15 minutes
        await userRepository.lockAccount(user._id, new Date(Date.now() + LOCK_TIME_MS));
        throw AppError.tooManyRequests(
          'ACCOUNT_LOCKED',
          'Too many failed login attempts. Account locked for 15 minutes'
        );
      }
      
      await userRepository.incrementLoginAttempts(user._id);
      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      throw AppError.unauthorized(
        'INVALID_CREDENTIALS',
        `Invalid credentials. ${remaining} attempt(s) remaining`
      );
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await userRepository.resetLoginAttempts(user._id);
    }

    // Actualizar último login
    await userRepository.updateLastLogin(user._id);

    // Generar JWT
    const token = generateToken(user);

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
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

    // Enviar notificación In-App de cuenta confirmada
    authNotificationHelper.notifyAccountConfirmed(user._id, user.name).catch(err => {
      console.error('Error enviando notificación de cuenta confirmada:', err);
    });

    // Si es empleado y no ha completado el test BFI-44, notificar
    if (user.role === 'employee') {
      const hasProfile = await bfi44Repository.userHasCompleted(user._id);
      if (!hasProfile) {
        bfi44NotificationHelper.notifyTestPending(user._id, user.name).catch(err => {
          console.error('Error enviando notificación de test BFI-44:', err);
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

    // Generar nuevo token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Actualizar usuario
    await userRepository.updateById(user._id, {
      confirmationToken,
      confirmationTokenExpiry,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      registrationAttempts: (user.registrationAttempts || 0) + 1
    });

    // Enviar email
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;

    await emailService.sendConfirmationEmail(email, name, confirmLink);

    return { message: 'Confirmation email sent' };
  }
}

module.exports = new AuthService();