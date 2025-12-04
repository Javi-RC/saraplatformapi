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
}

module.exports = new Validators();