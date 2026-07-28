const AppError = require('./AppError');

class Validators {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    if (typeof password !== 'string' || password.length < 8) {
      return false;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
  }

  validateRegistrationData(email, name, password) {
    if (!email || !name || !password) {
      throw AppError.badRequest('MISSING_REQUIRED_FIELDS', 'All fields are required');
    }

    if (!this.validateEmail(email)) {
      throw AppError.badRequest('INVALID_EMAIL_FORMAT', 'Invalid email format');
    }

    if (!this.validatePassword(password)) {
      throw AppError.badRequest('PASSWORD_TOO_WEAK', 'Password must be at least 8 characters and contain uppercase, lowercase, and a number');
    }
  }

  validateLoginData(email, password) {
    if (!email || !password) {
      throw AppError.badRequest('MISSING_CREDENTIALS', 'Email and password are required');
    }
  }

  validateConfirmationRequest(email, name) {
    if (!email || !name) {
      throw AppError.badRequest('MISSING_EMAIL_OR_NAME', 'Email and name are required');
    }
  }

  validateOrganizationCreation(req, res, next) {
    const { name, contact } = req.body;

    if (!name || !name.trim()) {
      return next(AppError.badRequest('ORGANIZATION_NAME_REQUIRED', 'Organization name is required'));
    }

    if (!contact || !contact.email) {
      return next(AppError.badRequest('CONTACT_EMAIL_REQUIRED', 'Contact email is required'));
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(contact.email)) {
      return next(AppError.badRequest('CONTACT_EMAIL_INVALID', 'Contact email is not valid'));
    }

    next();
  }

  validateOrganizationUpdate(req, res, next) {
    const { contact } = req.body;

    if (contact && contact.email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(contact.email)) {
        return next(AppError.badRequest('CONTACT_EMAIL_INVALID', 'Contact email is not valid'));
      }
    }

    next();
  }

  validateBFI44Responses(responses) {
    if (!responses || typeof responses !== 'object') {
      throw new Error('BFI44_INVALID_RESPONSES_FORMAT');
    }

    const responseKeys = Object.keys(responses);
    if (responseKeys.length !== 44) {
      throw new Error('BFI44_INVALID_RESPONSE_COUNT');
    }

    for (let i = 1; i <= 44; i++) {
      const key = i.toString();
      const value = responses[key];

      if (value === undefined || value === null) {
        throw new Error(`BFI44_MISSING_QUESTION_${i}`);
      }

      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error(`BFI44_INVALID_VALUE_QUESTION_${i}`);
      }
    }

    return true;
  }

  validateProfileUpdate(req, res, next) {
    const { 
      name, 
      country, 
      timezone, 
      flexibleSchedule, 
      preferredWorkingHours,
      notificationPreferences 
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
        return next(AppError.badRequest('NAME_INVALID', 'Name must be between 2 and 50 characters'));
      }
    }

    if (country !== undefined) {
      if (typeof country !== 'string' || country.trim().length === 0) {
        return next(AppError.badRequest('COUNTRY_INVALID', 'Country must be a valid string'));
      }
    }

    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || timezone.trim().length === 0) {
        return next(AppError.badRequest('TIMEZONE_INVALID', 'Timezone must be a valid string'));
      }
    }

    if (flexibleSchedule !== undefined) {
      if (typeof flexibleSchedule !== 'boolean') {
        return next(AppError.badRequest('FLEXIBLE_SCHEDULE_INVALID', 'flexibleSchedule must be a boolean'));
      }
    }

    if (preferredWorkingHours !== undefined) {
      if (typeof preferredWorkingHours !== 'object' || preferredWorkingHours === null) {
        return next(AppError.badRequest('PREFERRED_WORKING_HOURS_INVALID', 'preferredWorkingHours must be an object'));
      }

      const { start, end } = preferredWorkingHours;
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

      if (start !== undefined && (typeof start !== 'string' || !timeRegex.test(start))) {
        return next(AppError.badRequest('START_TIME_INVALID', 'Start time must be in HH:MM format (24h)'));
      }

      if (end !== undefined && (typeof end !== 'string' || !timeRegex.test(end))) {
        return next(AppError.badRequest('END_TIME_INVALID', 'End time must be in HH:MM format (24h)'));
      }
    }

    if (notificationPreferences !== undefined) {
      if (typeof notificationPreferences !== 'object' || notificationPreferences === null) {
        return next(AppError.badRequest('NOTIFICATION_PREFERENCES_INVALID', 'notificationPreferences must be an object'));
      }

      const { email, inApp, push } = notificationPreferences;

      if (email !== undefined && typeof email !== 'boolean') {
        return next(AppError.badRequest('EMAIL_PREFERENCE_INVALID', 'Email preference must be a boolean'));
      }

      if (inApp !== undefined && typeof inApp !== 'boolean') {
        return next(AppError.badRequest('IN_APP_PREFERENCE_INVALID', 'In-app notifications preference must be a boolean'));
      }

      if (push !== undefined && typeof push !== 'boolean') {
        return next(AppError.badRequest('PUSH_PREFERENCE_INVALID', 'Push notifications preference must be a boolean'));
      }
    }

    next();
  }
}

module.exports = new Validators();
