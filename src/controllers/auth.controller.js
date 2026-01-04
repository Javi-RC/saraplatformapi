const authService = require('../services/auth.service');
const validators = require('../utils/validators');
const responseHandler = require('../utils/responseHandler');

exports.register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    // Validar datos
    validators.validateRegistrationData(email, name, password);

    // Lógica de negocio en el servicio
    const result = await authService.register({ email, name, password, role });

    // Respuesta
    return responseHandler.success(res, {
      message: result.message,
      user: result.user
    }, 201);

  } catch (error) {
    return responseHandler.handleError(error, res);
  }
};

exports.sendConfirmation = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validar datos
    validators.validateConfirmationRequest(email, name);

    // Lógica de negocio en el servicio
    const result = await authService.resendConfirmationEmail(email, name);

    // Respuesta
    return responseHandler.success(res, {
      message: result.message
    });

  } catch (error) {
    return responseHandler.handleError(error, res);
  }
};

exports.confirmAccount = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return responseHandler.handleError(new Error('INVALID_OR_EXPIRED_TOKEN'), res);
    }

    // Lógica de negocio en el servicio
    await authService.confirmAccount(token);

    // Redirección
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return responseHandler.redirect(res, `${frontendUrl}/login?confirmed=true`);

  } catch (error) {
    console.error('Error confirmAccount:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    return responseHandler.redirect(res, `${frontendUrl}/error?message=Error confirmando cuenta`);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos
    validators.validateLoginData(email, password);

    // Lógica de negocio en el servicio
    const result = await authService.login({ email, password });

    // Respuesta
    return responseHandler.success(res, {
      message: 'Login exitoso',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    return responseHandler.handleError(error, res);
  }
};