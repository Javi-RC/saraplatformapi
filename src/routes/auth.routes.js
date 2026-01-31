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

const User = require('../models/user.model'); 
const { generateToken } = require('../utils/jwt'); 

router.post('/register', register);
router.post('/login', login);
router.get('/confirm', confirmAccount);
router.post('/send-confirmation', sendConfirmation);

// OAuth callback dinámico
router.get(
  '/:provider/callback',
  (req, res, next) => {
    passport.authenticate(req.params.provider, { session: false })(req, res, next);
  },
  async (req, res) => {
    try {
      const { profile, provider } = req.user;
      const state = JSON.parse(req.query.state || '{}');

      // Buscar usuario existente
      let user = await User.findOne({
        $or: [
          { oauthProvider: provider, oauthId: profile.id },
          { email: profile.email }
        ]
      });

      if (user) {
        // Si el usuario existe pero no tiene datos OAuth, vincular la cuenta
        if (!user.oauthProvider || !user.oauthId) {
          user.oauthProvider = provider;
          user.oauthId = profile.id;
          user.avatar = user.avatar || profile.photos?.[0]?.value;
          user.isConfirmed = true;
        }
        
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);
        const redirectUrl = user.role === 'unassigned' 
          ? `${process.env.FRONTEND_URL}/complete-profile?token=${token}`
          : `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;
        return res.redirect(redirectUrl);
      }

      user = new User({
        name: profile.displayName || profile.name,
        email: profile.email,
        oauthProvider: provider,
        oauthId: profile.id,
        avatar: profile.photos?.[0]?.value,
        role: 'unassigned',
        isConfirmed: true,
        lastLogin: new Date()
      });

      await user.save();

      const token = generateToken(user);
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);

    } catch (error) {
      res.redirect(
        `${process.env.FRONTEND_URL}/login?oauth_error=${encodeURIComponent(error.message)}`
      );
    }
  }
);

// Endpoint para completar perfil después de OAuth (acepta token en body o header)
router.put('/complete-profile', async (req, res) => {
  try {
    const { role, token } = req.body;
    
    // Intentar obtener el token del body o del header Authorization
    let authToken = token;
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

    // Verificar el token
    const { verifyToken } = require('../utils/jwt');
    let decoded;
    try {
      decoded = verifyToken(authToken);
    } catch (error) {
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

    // Validar que el rol sea válido
    const validRoles = ['employee', 'org_admin'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role. Must be one of: employee, org_admin' 
      });
    }

    user.role = role;
    await user.save();

    // Generar nuevo token con el rol actualizado
    const newToken = generateToken(user);

    res.json({
      success: true,
      user: user.toJSON(),
      token: newToken,
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
    const { role } = req.body;
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      user: user.toJSON(),
      message: 'Profile updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating profile'
    });
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

module.exports = router;
