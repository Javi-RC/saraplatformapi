const authService = require('../services/auth/auth.service');
const validators = require('../utils/validators');
const responseHandler = require('../utils/responseHandler');
const { getFrontendUrl } = require('../config/urls');
const { setTokenCookie } = require('../utils/cookie');
const AppError = require('../utils/AppError');

exports.register = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    validators.validateRegistrationData(email, name, password);

    const result = await authService.register({ email, name, password, role });

    return responseHandler.success(res, {
      message: result.message,
      user: result.user,
      ...(result.warning ? { warning: result.warning } : {})
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
      message: result.message,
      ...(result.warning ? { warning: result.warning } : {})
    });

  } catch (error) {
    return responseHandler.handleError(error, res);
  }
};

exports.confirmAccount = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw AppError.badRequest('INVALID_OR_EXPIRED_TOKEN', 'Missing confirmation token');
    }

    await authService.confirmAccount(token);

    const frontendUrl = getFrontendUrl();
    return responseHandler.redirect(res, `${frontendUrl}/login?confirmed=true`);

  } catch (_error) {
    const frontendUrl = getFrontendUrl();
    return responseHandler.redirect(res, `${frontendUrl}/login?error=confirmation_failed`);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    validators.validateLoginData(email, password);
    const result = await authService.login({ email, password });

    setTokenCookie(res, result.token);

    return responseHandler.success(res, {
      message: 'Login successful',
      user: result.user
    });

  } catch (error) {
    return responseHandler.handleError(error, res);
  }
};