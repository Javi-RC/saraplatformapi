const authService = require('../services/auth.service');
const validators = require('../utils/validators');
const responseHandler = require('../utils/responseHandler');

exports.register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    validators.validateRegistrationData(email, name, password);

    const result = await authService.register({ email, name, password, role });

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

    validators.validateConfirmationRequest(email, name);

    const result = await authService.resendConfirmationEmail(email, name);

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

    await authService.confirmAccount(token);

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

    validators.validateLoginData(email, password);
    const result = await authService.login({ email, password });

    return responseHandler.success(res, {
      message: 'Login exitoso',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    return responseHandler.handleError(error, res);
  }
};