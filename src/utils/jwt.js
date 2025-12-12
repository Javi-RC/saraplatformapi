const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

// Generar token JWT
exports.generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Verificar token JWT
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else {
      throw new Error('Token inválido');
    }
  }
};

// Middleware de autenticación
exports.authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = exports.verifyToken(token);
    req.user = decoded;
    // Alias de compatibilidad: muchos controladores usan req.user.id
    req.user.id = decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message
    });
  }
};