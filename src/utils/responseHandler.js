const errorMap = {
  'USER_ALREADY_EXISTS': { status: 409, message: 'This email is already registered' },
  'INVALID_CREDENTIALS': { status: 401, message: 'Invalid credentials' },
  'EMAIL_NOT_CONFIRMED': { status: 401, message: 'Please confirm your email before signing in' },
  'INVALID_OR_EXPIRED_TOKEN': { status: 400, message: 'Invalid or expired token' },
  'USER_NOT_FOUND': { status: 404, message: 'User not found' },
  'TOO_MANY_ATTEMPTS': { status: 429, message: 'Too many registration attempts. Please wait 24 hours or contact support.' },
  'ACCOUNT_LOCKED': { status: 429, message: 'Account temporarily locked' },
  'MISSING_REQUIRED_FIELDS': { status: 400, message: 'All fields are required' },
  'INVALID_EMAIL_FORMAT': { status: 400, message: 'Invalid email format' },
  'PASSWORD_TOO_SHORT': { status: 400, message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number' },
  'PASSWORD_TOO_WEAK': { status: 400, message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number' },
  'MISSING_CREDENTIALS': { status: 400, message: 'Email and password are required' },
  'MISSING_EMAIL_OR_NAME': { status: 400, message: 'Email and name are required' },
  'EMAIL_SEND_FAILED': { status: 502, message: 'Failed to send email' },
  'ERROR_PROCESSING_CV': { status: 500, message: 'Error processing the curriculum' },
  'CV_NOT_FOUND': { status: 404, message: 'Curriculum not found' },
  'INVALID_RESPONSE_COUNT': { status: 400, message: 'There must be exactly 44 responses' },
  'BFI44_INVALID_RESPONSES_FORMAT': { status: 400, message: 'Invalid responses format' },
  'BFI44_INVALID_RESPONSE_COUNT': { status: 400, message: 'There must be exactly 44 responses' },
  'BFI44_RESPONSE_NOT_FOUND': { status: 404, message: 'BFI-44 response not found' },
  'ORGANIZATION_NAME_ALREADY_EXISTS': { status: 409, message: 'An organization with that name already exists' },
  'ORGANIZATION_NOT_FOUND': { status: 404, message: 'Organization not found' },
  'PROJECT_NOT_FOUND': { status: 404, message: 'Project not found' },
  'PROJECT_MANAGER_NOT_FOUND': { status: 404, message: 'Project manager not found' },
  'NOTIFICATION_NOT_FOUND': { status: 404, message: 'Notification not found' },
  'RECIPIENT_USER_NOT_FOUND': { status: 404, message: 'Recipient user not found' },
  'ORGANIZATION_NAME_REQUIRED': { status: 400, message: 'Organization name is required' },
  'CONTACT_EMAIL_REQUIRED': { status: 400, message: 'Contact email is required' },
  'CONTACT_EMAIL_INVALID': { status: 400, message: 'Contact email is not valid' },
  'NAME_TOO_SHORT': { status: 400, message: 'Name must be between 2 and 50 characters' },
  'NAME_TOO_LONG': { status: 400, message: 'Name must be between 2 and 50 characters' },
  'COUNTRY_INVALID': { status: 400, message: 'Country must be a valid string' },
  'TIMEZONE_INVALID': { status: 400, message: 'Timezone must be a valid string' },
  'FLEXIBLE_SCHEDULE_INVALID': { status: 400, message: 'flexibleSchedule must be a boolean' },
  'PREFERRED_WORKING_HOURS_INVALID': { status: 400, message: 'preferredWorkingHours must be an object' },
  'START_TIME_INVALID': { status: 400, message: 'Start time must be in HH:MM format (24h)' },
  'END_TIME_INVALID': { status: 400, message: 'End time must be in HH:MM format (24h)' },
  'NOTIFICATION_PREFERENCES_INVALID': { status: 400, message: 'notificationPreferences must be an object' },
  'EMAIL_PREFERENCE_INVALID': { status: 400, message: 'Email preference must be a boolean' },
  'IN_APP_PREFERENCE_INVALID': { status: 400, message: 'In-app notifications preference must be a boolean' },
  'PUSH_PREFERENCE_INVALID': { status: 400, message: 'Push notifications preference must be a boolean' }
};

class ResponseHandler {
  handleError(error, res) {
    if (error && (error.name === 'AppError' || error.code)) {
      const status = Number(error.status || error.statusCode) || 500;
      const code = error.code || 'INTERNAL_ERROR';
      const response = { success: false, error: code };

      if (process.env.NODE_ENV !== 'production' && error.message && error.message !== code) {
        response.message = error.message;
      }

      if (error.details) {
        response.details = error.details;
      }

      return res.status(status).json(response);
    }

    const errorMessage = error && error.message ? error.message : null;
    const errorInfo = errorMap[errorMessage] || { status: Number(error && error.statusCode) || 500, message: 'Internal server error' };
    const fallbackCode = errorMessage && errorMessage !== errorInfo.message
      ? errorMessage.replace(/\s+/g, '_').toUpperCase()
      : 'INTERNAL_ERROR';

    const response = { success: false, error: fallbackCode };

    if (process.env.NODE_ENV !== 'production' && errorInfo.message) {
      response.message = errorInfo.message;
    }

    return res.status(errorInfo.status).json(response);
  }

  success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      ...data
    });
  }

  error(res, code, statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      error: code
    });
  }

  redirect(res, url) {
    return res.redirect(url);
  }
}

module.exports = new ResponseHandler();
