function getErrorStatusCode(error, defaultStatus = 500) {
  if (!error) return defaultStatus;
  if (error.statusCode) return error.statusCode;
  if (error.status) return error.status;
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('not found') || msg.includes('no encontrad')) return 404;
  if (msg.includes('permission') || msg.includes('permiso') || msg.includes('unauthorized') || msg.includes('no autorizado') || msg.includes('forbidden')) return 403;
  if (msg.includes('conflict') || msg.includes('already exist') || msg.includes('ya exist') || msg.includes('duplicad')) return 409;
  if (msg.includes('invalid') || msg.includes('inválid') || msg.includes('required') || msg.includes('requerid') || msg.includes('missing') || msg.includes('faltant')) return 400;
  if (msg.includes('unauth') || msg.includes('credent') || msg.includes('password') || msg.includes('contraseñ')) return 401;
  return defaultStatus;
}

function handleErrorCatch(error, res) {
  const status = getErrorStatusCode(error);
  if (process.env.NODE_ENV === 'production') {
    return res.status(status).json({ success: false, error: 'Internal server error' });
  }
  return res.status(status).json({ success: false, error: error.message });
}

module.exports = { getErrorStatusCode, handleErrorCatch };
