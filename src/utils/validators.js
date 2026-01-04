class Validators {
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    return typeof password === 'string' && password.length >= 6;
  }

  validateRegistrationData(email, name, password) {
    if (!email || !name || !password) {
      throw new Error('MISSING_REQUIRED_FIELDS');
    }

    if (!this.validateEmail(email)) {
      throw new Error('INVALID_EMAIL_FORMAT');
    }

    if (!this.validatePassword(password)) {
      throw new Error('PASSWORD_TOO_SHORT');
    }
  }

  validateLoginData(email, password) {
    if (!email || !password) {
      throw new Error('MISSING_CREDENTIALS');
    }
  }

  validateConfirmationRequest(email, name) {
    if (!email || !name) {
      throw new Error('MISSING_EMAIL_OR_NAME');
    }
  }

  /**
   * Middleware para validar datos de creación de organización
   */
  validateOrganizationCreation(req, res, next) {
    const { name, contact } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Organization name is required'
      });
    }

    if (!contact || !contact.email) {
      return res.status(400).json({
        success: false,
        error: 'Contact email is required'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(contact.email)) {
      return res.status(400).json({
        success: false,
        error: 'Contact email is not valid'
      });
    }

    next();
  }

  /**
   * Middleware para validar datos de actualización de organización
   */
  validateOrganizationUpdate(req, res, next) {
    const { contact } = req.body;

    if (contact && contact.email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(contact.email)) {
        return res.status(400).json({
          success: false,
          error: 'Contact email is not valid'
        });
      }
    }

    next();
  }

  /**
   * Validar respuestas del BFI-44
   * @param {Object} responses - Objeto con las respuestas del cuestionario
   * @throws {Error} Si las respuestas no son válidas
   */
  validateBFI44Responses(responses) {
    if (!responses || typeof responses !== 'object') {
      throw new Error('BFI44_INVALID_RESPONSES_FORMAT');
    }

    // Verificar que existan exactamente 44 respuestas
    const responseKeys = Object.keys(responses);
    if (responseKeys.length !== 44) {
      throw new Error('BFI44_INVALID_RESPONSE_COUNT');
    }

    // Validar cada respuesta
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

  /**
   * Middleware para validar actualización de perfil de usuario
   */
  validateProfileUpdate(req, res, next) {
    const { 
      name, 
      country, 
      timezone, 
      flexibleSchedule, 
      preferredWorkingHours,
      notificationPreferences 
    } = req.body;

    // Validar nombre si se proporciona
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Name must be between 2 and 50 characters'
        });
      }
    }

    // Validar country si se proporciona
    if (country !== undefined) {
      if (typeof country !== 'string' || country.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Country must be a valid string'
        });
      }
    }

    // Validar timezone si se proporciona
    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || timezone.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Timezone must be a valid string'
        });
      }
    }

    // Validar flexibleSchedule si se proporciona
    if (flexibleSchedule !== undefined) {
      if (typeof flexibleSchedule !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'flexibleSchedule must be a boolean'
        });
      }
    }

    // Validar preferredWorkingHours si se proporciona
    if (preferredWorkingHours !== undefined) {
      if (typeof preferredWorkingHours !== 'object' || preferredWorkingHours === null) {
        return res.status(400).json({
          success: false,
          error: 'preferredWorkingHours must be an object'
        });
      }

      const { start, end } = preferredWorkingHours;
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

      if (start !== undefined && (typeof start !== 'string' || !timeRegex.test(start))) {
        return res.status(400).json({
          success: false,
          error: 'Start time must be in HH:MM format (24h)'
        });
      }

      if (end !== undefined && (typeof end !== 'string' || !timeRegex.test(end))) {
        return res.status(400).json({
          success: false,
          error: 'End time must be in HH:MM format (24h)'
        });
      }
    }

    // Validar notificationPreferences si se proporciona
    if (notificationPreferences !== undefined) {
      if (typeof notificationPreferences !== 'object' || notificationPreferences === null) {
        return res.status(400).json({
          success: false,
          error: 'notificationPreferences must be an object'
        });
      }

      const { email, inApp, push } = notificationPreferences;

      if (email !== undefined && typeof email !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Email preference must be a boolean'
        });
      }

      if (inApp !== undefined && typeof inApp !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'In-app notifications preference must be a boolean'
        });
      }

      if (push !== undefined && typeof push !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Push notifications preference must be a boolean'
        });
      }
    }

    next();
  }
}

module.exports = new Validators();