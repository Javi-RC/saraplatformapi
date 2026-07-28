const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';
const isProduction = process.env.NODE_ENV === 'production';

function parseExpiresIn(str) {
  const match = String(str).match(/^(\d+)\s*(s|m|h|d)$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * multipliers[unit];
}

function getTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: parseExpiresIn(process.env.JWT_EXPIRES_IN || '7d')
  };
}

exports.setTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getTokenCookieOptions());
};

exports.clearTokenCookie = (res) => {
  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
};

exports.getTokenFromCookie = (req) => {
  return req.cookies?.[COOKIE_NAME] || null;
};

exports.COOKIE_NAME = COOKIE_NAME;
