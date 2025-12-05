class ResponseHandler {
  handleError(error, res) {
    console.error('Controller Error:', error);

    const errorMap = {
      'USER_ALREADY_EXISTS': { status: 409, message: 'Este email ya está registrado' },
      'INVALID_CREDENTIALS': { status: 401, message: 'Credenciales inválidas' },
      'EMAIL_NOT_CONFIRMED': { status: 401, message: 'Confirma tu email antes de iniciar sesión' },
      'INVALID_OR_EXPIRED_TOKEN': { status: 400, message: 'Token inválido o expirado' },
      'USER_NOT_FOUND': { status: 404, message: 'Usuario no encontrado' },
      'MISSING_REQUIRED_FIELDS': { status: 400, message: 'Todos los campos son requeridos' },
      'INVALID_EMAIL_FORMAT': { status: 400, message: 'Formato de email inválido' },
      'PASSWORD_TOO_SHORT': { status: 400, message: 'La contraseña debe tener al menos 6 caracteres' },
      'MISSING_CREDENTIALS': { status: 400, message: 'Email y contraseña son requeridos' },
      'MISSING_EMAIL_OR_NAME': { status: 400, message: 'Email y nombre son requeridos' },
      'ERROR_PROCESSING_CV': { status: 500, message: 'Error al procesar el CV. Verifica la configuración de Gemini API.' },
      'CV_NOT_FOUND': { status: 404, message: 'CV no encontrado' }
    };

    const errorInfo = errorMap[error.message] || { status: 500, message: 'Error interno del servidor' };
    
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

  redirect(res, url) {
    return res.redirect(url);
  }
}

module.exports = new ResponseHandler();