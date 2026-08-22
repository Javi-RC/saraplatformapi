const { Router } = require('express');
const router = Router();
const { authMiddleware } = require('../utils/jwt');
const User = require('../models/user.model');
const Project = require('../models/project.model');
const Notification = require('../models/notification.model');
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

    const userData = user.toJSON();
    // Preserve organization as a plain ID for frontend compatibility
    // while keeping populated data available under organizationData
    if (userData.organization && typeof userData.organization === 'object') {
      userData.organizationData = userData.organization;
      userData.organization = userData.organization._id || userData.organization.id;
    }

    res.json({ 
      success: true, 
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
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
    const disallowedKeys = new Set(['__proto__', 'constructor', 'prototype', 'role', 'organization', 'passwordHash']);
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key) && !disallowedKeys.has(key)) {
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

    // Apply updates
    for (const key of Object.keys(filteredUpdates)) {
      if (!disallowedKeys.has(key)) {
        user[key] = filteredUpdates[key];
      }
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Error updating profile:', error);
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
    console.error('Error fetching consent:', error);
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
        'Consent accepted successfully. You can now upload your curriculum.' : 
        'Consent revoked. You will not be able to upload curricula until you accept again.',
      consent: user.cvProcessingConsent,
      hasConsent: user.hasCVProcessingConsent()
    });

  } catch (error) {
    console.error('Error updating consent:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating consent'
    });
  }
});

// ─── Personality Data Consent (BFI-44) ──────────────────────────────────────

router.get('/personality-consent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    const user = await User.findById(userId).select('personalityDataConsent');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        consent: user.personalityDataConsent || {
          accepted: false,
          version: '1.0'
        },
        hasConsent: user.hasPersonalityDataConsent()
      }
    });

  } catch (error) {
    console.error('Error fetching personality consent:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching personality consent'
    });
  }
});

router.post('/personality-consent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const { accepted, personalityProfiling, dataRetention } = req.body;

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
      if (personalityProfiling !== true) {
        return res.status(400).json({
          success: false,
          error: 'You must accept personality profiling to continue'
        });
      }

      const ipAddress = req.headers['x-forwarded-for'] ||
                       req.headers['x-real-ip'] ||
                       req.connection?.remoteAddress ||
                       req.socket?.remoteAddress;

      user.personalityDataConsent = {
        accepted: true,
        acceptedAt: new Date(),
        version: '1.0',
        ipAddress: ipAddress,
        details: {
          personalityProfiling: personalityProfiling === true,
          dataRetention: dataRetention === true
        }
      };
    } else {
      user.personalityDataConsent = {
        accepted: false,
        acceptedAt: undefined,
        version: '1.0',
        ipAddress: undefined,
        details: {
          personalityProfiling: false,
          dataRetention: false
        }
      };
    }

    await user.save();

    res.json({
      success: true,
      message: accepted
        ? 'Consent accepted successfully. You can now complete the BFI-44 questionnaire.'
        : 'Consent revoked. You will not be able to complete the BFI-44 questionnaire until you accept again.',
      consent: user.personalityDataConsent,
      hasConsent: user.hasPersonalityDataConsent()
    });

  } catch (error) {
    console.error('Error updating personality consent:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating personality consent'
    });
  }
});

/**
 * GET /api/profile/stats
 * Returns aggregate statistics for the authenticated user's dashboard
 */
router.get('/profile/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    const projects = await Project.find({
      $or: [
        { projectManager: userId },
        { 'assignedEmployees.user': userId }
      ]
    }).select('synergyCache assignedEmployees projectManager').lean();

    const projectCount = projects.length;
    const teamCount = projects.filter(p =>
      p.assignedEmployees?.some(e => e.user?.toString() === userId?.toString())
    ).length;

    let compatibility = null;
    const synergies = projects
      .map(p => p.synergyCache?.data?.overallSynergy)
      .filter(v => v != null);
    if (synergies.length > 0) {
      const avg = synergies.reduce((a, b) => a + b, 0) / synergies.length;
      compatibility = `${Math.round(avg * 100)}%`;
    }

    const data = [
      { key: 'projects', value: projectCount, color: 'sara-stat-icon--blue', labelKey: 'profile.dashboard.stats.projects', linkKey: 'profile.dashboard.stats.viewProjects', path: '/projects' },
      { key: 'teams', value: teamCount, color: 'sara-stat-icon--green', labelKey: 'profile.dashboard.stats.teams', linkKey: 'profile.dashboard.stats.viewTeams', path: '/teams' },
      { key: 'compatibility', value: compatibility || '—', color: 'sara-stat-icon--purple', labelKey: 'profile.dashboard.stats.compatibility' },
      { key: 'recommendations', value: projectCount, color: 'sara-stat-icon--orange', labelKey: 'profile.dashboard.stats.recommendations' }
    ];

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ success: false, error: 'Error fetching profile stats' });
  }
});

/**
 * GET /api/profile/activity
 * Returns recent activity entries for the authenticated user
 */
router.get('/profile/activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const data = notifications.map(n => {
      const type = n.type || 'SYSTEM_UPDATE';
      const now = Date.now();
      const diffMs = now - new Date(n.createdAt).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      let timeKey;
      if (diffMinutes < 1) {
        timeKey = 'profile.dashboard.activity.justNow';
      } else if (diffMinutes < 60) {
        timeKey = 'profile.dashboard.activity.minutesAgo';
      } else if (diffHours < 24) {
        timeKey = 'profile.dashboard.activity.hoursAgo';
      } else if (diffDays === 1) {
        timeKey = 'profile.dashboard.activity.yesterday';
      } else if (diffDays <= 7) {
        timeKey = 'profile.dashboard.activity.daysAgo';
      } else {
        timeKey = 'profile.dashboard.activity.weeksAgo';
      }

      return {
        titleKey: `notifications.${type}`,
        timeKey,
        rawTitle: n.title,
        rawMessage: n.message,
        createdAt: n.createdAt
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching profile activity:', error);
    res.status(500).json({ success: false, error: 'Error fetching profile activity' });
  }
});

/**
 * GET /api/teams/my-teams
 * Returns teams (projects) the authenticated user is assigned to
 */
router.get('/teams/my-teams', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    const projects = await Project.find({
      'assignedEmployees.user': userId
    })
      .select('projectName assignedEmployees projectManager')
      .populate('projectManager', 'name email')
      .lean();

    const data = projects.map(p => {
      const memberCount = p.assignedEmployees?.length || 0;
      const userAssignment = p.assignedEmployees?.find(
        e => e.user?.toString() === userId?.toString()
      );
      return {
        id: p._id,
        projectId: p._id,
        name: p.projectName,
        memberCount,
        role: userAssignment?.assignedRole || 'team_member'
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching my teams:', error);
    res.status(500).json({ success: false, error: 'Error fetching teams' });
  }
});

/**
 * GET /api/profile/language
 * Gets the user's language preference
 * Access: Authenticated user
 */
router.get('/profile/language', authMiddleware, userController.getLanguagePreference);

/**
 * PATCH /api/profile/language
 * Updates the user's language preference
 * Body: { language: 'es' | 'en' }
 * Access: Authenticated user
 */
router.patch('/profile/language', authMiddleware, userController.updateLanguagePreference);

/**
 * GET /api/profile/deletion-prerequisites
 * Checks what requirements the user must meet before deleting their account
 * Access: Authenticated user
 */
router.get('/profile/deletion-prerequisites', authMiddleware, userController.getDeletionPrerequisites);

/**
 * DELETE /api/profile/account
 * Permanently deletes the user's account
 * Body: { password: string (required for non-OAuth users), confirmation: "ELIMINAR" | "DELETE" }
 * Access: Authenticated user
 */
router.delete('/profile/account', authMiddleware, userController.deleteAccount);

module.exports = router;