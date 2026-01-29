const { Router } = require('express');
const router = Router();
const { authMiddleware } = require('../utils/jwt');
const User = require('../models/user.model');
const validators = require('../utils/validators');
const userController = require('../controllers/user.controller');

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    
    const user = await User.findById(userId)
      .select('-passwordHash')
      .populate('organization', 'name title');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({ 
      success: true, 
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching profile'
    });
  }
});

router.patch('/profile', authMiddleware, validators.validateProfileUpdate, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const updates = req.body;

    const allowedUpdates = [
      'name',
      'country',
      'timezone',
      'preferredLanguage',
      'flexibleSchedule',
      'preferredWorkingHours',
      'notificationPreferences'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Aplicar actualizaciones
    Object.keys(filteredUpdates).forEach(key => {
      user[key] = filteredUpdates[key];
    });

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating profile'
    });
  }
});

router.get('/cv-consent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    
    const user = await User.findById(userId).select('cvProcessingConsent');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        consent: user.cvProcessingConsent || {
          accepted: false,
          version: '1.0'
        },
        hasConsent: user.hasCVProcessingConsent()
      }
    });

  } catch (error) {
    console.error('Error obteniendo consentimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching consent'
    });
  }
});

router.post('/cv-consent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const { accepted, aiProcessing, thirdPartySharing, dataRetention } = req.body;

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'The "accepted" field is required and must be a boolean'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (accepted) {
      if (aiProcessing !== true) {
        return res.status(400).json({
          success: false,
          error: 'You must accept AI processing to continue'
        });
      }

      const ipAddress = req.headers['x-forwarded-for'] || 
                       req.headers['x-real-ip'] || 
                       req.connection?.remoteAddress || 
                       req.socket?.remoteAddress;

      user.cvProcessingConsent = {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0',
        ipAddress: ipAddress,
        details: {
          aiProcessing: aiProcessing === true,
          thirdPartySharing: thirdPartySharing === true,
          dataRetention: dataRetention === true
        }
      };
    } else {
      user.cvProcessingConsent = {
        accepted: false,
        acceptedAt: undefined,
        version: '1.0',
        ipAddress: undefined,
        details: {
          aiProcessing: false,
          thirdPartySharing: false,
          dataRetention: false
        }
      };
    }

    await user.save();

    res.json({
      success: true,
      message: accepted ? 
        'Consent accepted successfully. You can now upload your CV.' : 
        'Consent revoked. You will not be able to upload CVs until you accept again.',
      consent: user.cvProcessingConsent,
      hasConsent: user.hasCVProcessingConsent()
    });

  } catch (error) {
    console.error('Error actualizando consentimiento:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating consent'
    });
  }
});

/**
 * GET /api/profile/language
 * Obtiene la preferencia de idioma del usuario
 * Acceso: Usuario autenticado
 */
router.get('/profile/language', authMiddleware, userController.getLanguagePreference);

/**
 * PATCH /api/profile/language
 * Actualiza la preferencia de idioma del usuario
 * Body: { language: 'es' | 'en' }
 * Acceso: Usuario autenticado
 */
router.patch('/profile/language', authMiddleware, userController.updateLanguagePreference);

/**
 * GET /api/profile/deletion-prerequisites
 * Verifica qué requisitos debe cumplir el usuario antes de eliminar su cuenta
 * Acceso: Usuario autenticado
 */
router.get('/profile/deletion-prerequisites', authMiddleware, userController.getDeletionPrerequisites);

/**
 * DELETE /api/profile/account
 * Elimina la cuenta del usuario de forma permanente
 * Body: { password: string (required for non-OAuth users), confirmation: "ELIMINAR" | "DELETE" }
 * Acceso: Usuario autenticado
 */
router.delete('/profile/account', authMiddleware, userController.deleteAccount);

module.exports = router;