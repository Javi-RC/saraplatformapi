const jwt = require('jsonwebtoken');
const { getTokenFromCookie } = require('./cookie');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

exports.generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization ? user.organization.toString() : null
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired', { cause: error });
    } else {
      throw new Error('Invalid token', { cause: error });
    }
  }
};

exports.authMiddleware = (req, res, next) => {
  try {
    let token = getTokenFromCookie(req);

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }

    const decoded = exports.verifyToken(token);
    req.user = decoded;
    req.user.id = decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message
    });
  }
};