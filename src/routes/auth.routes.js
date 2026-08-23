const { Router } = require('express');
const passport = require('passport');
const router = Router();

const { 
  register, 
  login, 
  confirmAccount, 
  sendConfirmation 
} = require('../controllers/auth.controller');

const { authMiddleware } = require('../utils/jwt');
const { setTokenCookie, clearTokenCookie, getTokenFromCookie } = require('../utils/cookie');

const User = require('../models/user.model'); 
const { generateToken } = require('../utils/jwt'); 
const { getFrontendUrl } = require('../config/urls');
const { ROLES } = require('../config/roles');

function isAllowedRedirectUrl(url) {
  try {
    const frontendUrl = getFrontendUrl();
    const parsed = new URL(url);
    const allowed = new URL(frontendUrl);
    return parsed.origin === allowed.origin;
  } catch {
    return false;
  }
}

function safeRedirect(res, path, queryParams = {}, hash = '') {
  const base = getFrontendUrl();
  const url = new URL(path, base);
  Object.entries(queryParams).forEach(([k, v]) => url.searchParams.set(k, v));
  if (hash) url.hash = hash;
  const finalUrl = url.toString();
  if (!isAllowedRedirectUrl(finalUrl)) {
    return res.redirect(`${base}/login`);
  }
  return res.redirect(finalUrl);
}

router.post('/register', register);
router.post('/login', login);
router.get('/confirm', confirmAccount);
router.post('/send-confirmation', sendConfirmation);

// OAuth callback dinámico
router.get(
  '/:provider/callback',
  (req, res, next) => {
    const allowedProviders = ['google', 'github'];
    if (!allowedProviders.includes(req.params.provider)) {
      return safeRedirect(res, '/login', { oauth_error: 'Unsupported provider' });
    }
    passport.authenticate(req.params.provider, { session: false })(req, res, next);
  },
  async (req, res) => {
    try {
      const { profile, provider } = req.user;

      let user = await User.findOne({
        $or: [
          { oauthProvider: provider, oauthId: profile.id },
          { email: profile.email }
        ]
      });

      if (user) {
        if (!user.oauthProvider || !user.oauthId) {
          user.oauthProvider = provider;
          user.oauthId = profile.id;
          user.avatar = user.avatar || profile.photos?.[0]?.value;
          user.isConfirmed = true;
        }
        
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);
        setTokenCookie(res, token);
        const redirectPath = user.role === ROLES.UNASSIGNED
          ? '/complete-profile'
          : '/auth/callback';
        return safeRedirect(res, redirectPath, {}, `token=${token}`);
      }

      user = new User({
        name: profile.displayName || profile.name,
        email: profile.email,
        oauthProvider: provider,
        oauthId: profile.id,
        avatar: profile.photos?.[0]?.value,
        role: ROLES.UNASSIGNED,
        isConfirmed: true,
        lastLogin: new Date()
      });

      await user.save();

      const token = generateToken(user);
      setTokenCookie(res, token);
      safeRedirect(res, '/auth/callback', {}, `token=${token}`);

    } catch (_error) {
      return safeRedirect(res, '/login', { oauth_error: 'Authentication failed' });
    }
  }
);

// Endpoint para completar perfil después de OAuth (acepta token en cookie, body o header)
router.put('/complete-profile', async (req, res) => {
  try {
    let authToken = getTokenFromCookie(req);

    if (!authToken) {
      const { token } = req.body;
      authToken = token;
    }

    if (!authToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        authToken = authHeader.split(' ')[1];
      }
    }

    if (!authToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token is required' 
      });
    }

    const { verifyToken } = require('../utils/jwt');
    let decoded;
    try {
      decoded = verifyToken(authToken);
    } catch (_error) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    const userId = decoded.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (user.role !== ROLES.UNASSIGNED) {
      return res.status(400).json({ 
        success: false, 
        error: 'Profile already completed' 
      });
    }

    user.role = ROLES.EMPLOYEE;
    await user.save();

    const newToken = generateToken(user);
    setTokenCookie(res, newToken);

    res.json({
      success: true,
      user: user.toJSON(),
      message: 'Profile completed successfully'
    });

  } catch (error) {
    console.error('Error completing profile:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating profile'
    });
  }
});

// Endpoint para actualizar perfil (requiere autenticación)
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: user.toJSON(),
      message: 'Profile retrieved successfully'
    });

  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching profile'
    });
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.post('/logout', (req, res) => {
  clearTokenCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
