const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const backendUrl = process.env.BACKEND_URL;

// GOOGLE STRATEGY (only if credentials provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${backendUrl}/auth/google/callback`,
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
