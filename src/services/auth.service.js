const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../utils/jwt');
const emailService = require('./email.service');
const authNotificationHelper = require('./authNotificationHelper');
const bfi44NotificationHelper = require('./bfi44NotificationHelper');
const BFI44Response = require('../models/bfi44.model');

class AuthService {
  async register(userData) {
    const { email, name, password, role} = userData;

    // Verificar si usuario existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS');
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
      throw new Error('INVALID_CREDENTIALS');
    }

    if (!user.isConfirmed) {
      throw new Error('EMAIL_NOT_CONFIRMED');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
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
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
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
      throw new Error('USER_NOT_FOUND');
    }

    // Generar nuevo token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const confirmationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Actualizar usuario
    user.confirmationToken = confirmationToken;
    user.confirmationTokenExpiry = confirmationTokenExpiry;
    await user.save();

    // Enviar email
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const confirmLink = `${backendUrl}/auth/confirm?token=${confirmationToken}`;

    await emailService.sendConfirmationEmail(email, name, confirmLink);

    return { message: 'Correo de confirmación enviado' };
  }
}

module.exports = new AuthService();