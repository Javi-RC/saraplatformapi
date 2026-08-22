const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { COOKIE_NAME } = require('../utils/cookie');
const { getFrontendUrl } = require('./urls');
const User = require('../models/user.model');

// JWT STRATEGY
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Short-lived cache to avoid DB hit on every request (30s TTL)
const _userCache = new Map();
const CACHE_TTL_MS = 30_000;

function _getCachedUser(userId) {
  const entry = _userCache.get(userId);
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.user;
  _userCache.delete(userId);
  return null;
}

function _setCachedUser(userId, user) {
  _userCache.set(userId, { user, ts: Date.now() });
}

// Evict stale entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of _userCache) {
    if (now - entry.ts >= CACHE_TTL_MS) _userCache.delete(key);
  }
}, 60_000).unref();

const cookieExtractor = (req) => {
  return req?.cookies?.[COOKIE_NAME] || null;
};

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
  secretOrKey: process.env.JWT_SECRET
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const cached = _getCachedUser(payload.userId);
      if (cached) return done(null, cached);

      const user = await User.findById(payload.userId);
      if (user) {
        const userData = {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization
        };
        _setCachedUser(payload.userId, userData);
        return done(null, userData);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// GOOGLE STRATEGY (only if credentials provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${getFrontendUrl()}/auth/google/callback`,
      },
      (accessToken, refreshToken, profile, done) => {
        const normalizedProfile = {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value,
          photos: profile.photos,
        };

        return done(null, {
          profile: normalizedProfile,
          provider: 'google'
        });
      }
    )
  );
} else {
  // eslint-disable-next-line no-console
  console.warn('Google OAuth not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.');
}


module.exports = passport;
