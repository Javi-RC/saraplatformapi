class AppError extends Error {
  /**
   * @param {string} code - Stable machine-readable code (e.g. USER_NOT_FOUND)
   * @param {number} status - HTTP status code
   * @param {string} [message] - Human-readable message (optional)
   * @param {object} [details] - Extra details for debugging/clients (optional)
   */
  constructor(code, status, message, details) {
    super(message || code);

    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;

    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(code, message, details) {
    return new AppError(code, 400, message, details);
  }

  static unauthorized(code, message, details) {
    return new AppError(code, 401, message, details);
  }

  static forbidden(code, message, details) {
    return new AppError(code, 403, message, details);
  }

  static notFound(code, message, details) {
    return new AppError(code, 404, message, details);
  }

  static conflict(code, message, details) {
    return new AppError(code, 409, message, details);
  }
}

module.exports = AppError;
