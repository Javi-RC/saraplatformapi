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
        error: 'El nombre de la organización es obligatorio'
      });
    }

    if (!contact || !contact.email) {
      return res.status(400).json({
        success: false,
        error: 'El email de contacto es obligatorio'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(contact.email)) {
      return res.status(400).json({
        success: false,
        error: 'El email de contacto no es válido'
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
          error: 'El email de contacto no es válido'
        });
      }
    }

    next();
  }
}

module.exports = new Validators();