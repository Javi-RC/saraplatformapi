const AppError = require('./AppError');

class ResponseHandler {
  handleError(error, res) {
    console.error('Controller Error:', error);

    // Prefer structured application errors
    if (error && (error.name === 'AppError' || error.code)) {
      const status = Number(error.status || error.statusCode) || 500;
      const code = error.code || error.message || 'INTERNAL_ERROR';
      return res.status(status).json({
        success: false,
        error: error.message || code,
        code,
        ...(error.details ? { details: error.details } : {})
      });
    }

    const errorMap = {
      'USER_ALREADY_EXISTS': { status: 409, message: 'This email is already registered' },
      'INVALID_CREDENTIALS': { status: 401, message: 'Invalid credentials' },
      'EMAIL_NOT_CONFIRMED': { status: 401, message: 'Please confirm your email before signing in' },
      'INVALID_OR_EXPIRED_TOKEN': { status: 400, message: 'Invalid or expired token' },
      'USER_NOT_FOUND': { status: 404, message: 'User not found' },
      'TOO_MANY_ATTEMPTS': { status: 429, message: 'Too many registration attempts. Please wait 24 hours or contact support.' },
      'MISSING_REQUIRED_FIELDS': { status: 400, message: 'All fields are required' },
      'INVALID_EMAIL_FORMAT': { status: 400, message: 'Invalid email format' },
      'PASSWORD_TOO_SHORT': { status: 400, message: 'Password must be at least 6 characters long' },
      'MISSING_CREDENTIALS': { status: 400, message: 'Email and password are required' },
      'MISSING_EMAIL_OR_NAME': { status: 400, message: 'Email and name are required' },
      'ERROR_PROCESSING_CV': { status: 500, message: 'Error processing the CV. Check the Gemini API configuration.' },
      'CV_NOT_FOUND': { status: 404, message: 'CV not found' },
      // BFI-44 Errors
      'INVALID_RESPONSE_COUNT': { status: 400, message: 'There must be exactly 44 responses' },
      'BFI44_INVALID_RESPONSES_FORMAT': { status: 400, message: 'Invalid responses format' },
      'BFI44_INVALID_RESPONSE_COUNT': { status: 400, message: 'There must be exactly 44 responses' },
      'BFI44_RESPONSE_NOT_FOUND': { status: 404, message: 'BFI-44 response not found' },

      // Common plain-text errors currently thrown by services
      'Project not found': { status: 404, message: 'Project not found' },
      'Organization not found': { status: 404, message: 'Organization not found' },
      'Project manager not found': { status: 404, message: 'Project manager not found' },
      'Notificación no encontrada': { status: 404, message: 'Notification not found' },
      'Usuario receptor no encontrado': { status: 404, message: 'Notification recipient not found' }
    };

    const errorInfo = errorMap[error.message] || { status: Number(error.statusCode) || 500, message: 'Internal server error' };
    
    return res.status(errorInfo.status).json({
      success: false,
      error: errorInfo.message
    });
  }

  success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      ...data
    });
  }

  error(res, message, statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }

  redirect(res, url) {
    return res.redirect(url);
  }
}

module.exports = new ResponseHandler();