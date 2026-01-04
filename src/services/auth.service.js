const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');
const emailService = require('./email.service');
const authNotificationHelper = require('./authNotificationHelper');
const bfi44NotificationHelper = require('./bfi44NotificationHelper');
const BFI44Response = require('../models/bfi44.model');
const AppError = require('../utils/AppError');

class AuthService {
  async register(userData) {
    const { email, name, password, role} = userData;

    // Verificar si usuario existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      // Si el usuario ya está verificado, no permitir re-registro
      if (existingUser.isConfirmed) {
        throw AppError.conflict('USER_ALREADY_EXISTS', 'This email is already registered');
      }
      
      // Usuario existe pero no está verificado
      // Verificar si el token de verificación expiró
      if (existingUser.verificationTokenExpiry && existingUser.verificationTokenExpiry < Date.now()) {
        // Token expirado: permitir re-registro eliminando el usuario anterior
        await User.deleteOne({ _id: existingUser._id });
        console.log(`Usuario no verificado eliminado para re-registro: ${email}`);
      } else {
        // Token aún válido: verificar límite de intentos
        if (existingUser.registrationAttempts >= 3) {
          throw new AppError('TOO_MANY_ATTEMPTS', 429, 'Too many registration attempts. Please wait 24 hours or contact support.');
        }
        
        // Permitir reenvío de email de verificación
        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        existingUser.confirmationToken = confirmationToken;
        existingUser.confirmationTokenExpiry = confirmationTokenExpiry;
        existingUser.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        existingUser.registrationAttempts = (existingUser.registrationAttempts || 0) + 1;
        await existingUser.save();
        
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
          message: 'Email de verificación reenviado. Revisa tu bandeja de entrada.'
        };
      }
    }

    // Crear usuario
    const passwordHash = await bcrypt.hash(password, 12);
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = new User({
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

    await newUser.save();

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

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    
    if (!user) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid credentials');
    }

    if (!user.isConfirmed) {
      throw AppError.unauthorized('EMAIL_NOT_CONFIRMED', 'Please confirm your email before signing in');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw AppError.unauthorized('INVALID_CREDENTIALS', 'Invalid credentials');
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

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
    const user = await User.findOne({ 
      confirmationToken: token, 
      confirmationTokenExpiry: { $gt: new Date() } 
    });

    if (!user) {
      throw AppError.badRequest('INVALID_OR_EXPIRED_TOKEN', 'Invalid or expired token');
    }

    user.isConfirmed = true;
    user.confirmationToken = undefined;
    user.confirmationTokenExpiry = undefined;
    user.lastLogin = new Date();
    await user.save();

    // Enviar notificación In-App de cuenta confirmada
    authNotificationHelper.notifyAccountConfirmed(user._id, user.name).catch(err => {
      console.error('Error enviando notificación de cuenta confirmada:', err);
    });

    // Si es empleado y no ha completado el test BFI-44, notificar
    if (user.role === 'employee') {
      const hasProfile = await BFI44Response.hasProfile(user._id);
      if (!hasProfile) {
        bfi44NotificationHelper.notifyTestPending(user._id, user.name).catch(err => {
          console.error('Error enviando notificación de test BFI-44:', err);
        });
      }
    }

    return user;
  }

  async resendConfirmationEmail(email, name) {
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw AppError.notFound('USER_NOT_FOUND', 'User not found');
    }

    // Generar nuevo token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Actualizar usuario
    user.confirmationToken = confirmationToken;
    user.confirmationTokenExpiry = confirmationTokenExpiry;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.registrationAttempts = (user.registrationAttempts || 0) + 1;
    await user.save();

    // Enviar email
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;

    await emailService.sendConfirmationEmail(email, name, confirmLink);

    return { message: 'Correo de confirmación enviado' };
  }
}

module.exports = new AuthService();