const userService = require('../services/user.service');
const responseHandler = require('../utils/responseHandler');
const AppError = require('../utils/AppError');
const i18n = require('../i18n/i18n.service');

/**
 * User Controller
 * Handles HTTP requests related to user account management
 * Following SOLID principles: Single Responsibility
 */
class UserController {
  /**
   * Update user language preference
   * PATCH /api/profile/language
   * Body: { language: 'es' | 'en' }
   */
  async updateLanguagePreference(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id || req.user?._id;
      const { language } = req.body;

      if (!language || !i18n.isValidLanguage(language)) {
        return res.status(400).json({
          success: false,
          error: `Invalid language. Supported languages: ${i18n.SUPPORTED_LANGUAGES.join(', ')}`
        });
      }

      const User = require('../models/user.model');
      const user = await User.findByIdAndUpdate(
        userId,
        { preferredLanguage: language },
        { new: true }
      ).select('-passwordHash');

      return responseHandler.success(res, {
        message: 'Language preference updated successfully',
        preferredLanguage: user.preferredLanguage
      });

    } catch (error) {
      console.error('Error updating language preference:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Get user language preference
   * GET /api/profile/language
   */
  async getLanguagePreference(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id || req.user?._id;
      
      const User = require('../models/user.model');
      const user = await User.findById(userId)
        .select('preferredLanguage')
        .populate('organization', 'defaultLanguage');

      const effectiveLanguage = user?.preferredLanguage || 
                                 user?.organization?.defaultLanguage || 
                                 i18n.DEFAULT_LANGUAGE;

      return responseHandler.success(res, {
        data: {
          preferredLanguage: user?.preferredLanguage,
          language: user?.preferredLanguage,
          organizationDefaultLanguage: user?.organization?.defaultLanguage,
          effectiveLanguage,
          supportedLanguages: i18n.SUPPORTED_LANGUAGES
        }
      });

    } catch (error) {
      console.error('Error getting language preference:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Get deletion prerequisites
   * GET /api/profile/deletion-prerequisites
   * Returns information about what needs to be done before account can be deleted
   */
  async getDeletionPrerequisites(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id || req.user?._id;

      const prerequisites = await userService.getDeletionPrerequisites(userId);

      return responseHandler.success(res, prerequisites);

    } catch (error) {
      console.error('Error getting deletion prerequisites:', error);
      return responseHandler.handleError(error, res);
    }
  }

  /**
   * Delete user account
   * DELETE /api/profile/account
   * Permanently deletes the user account and all associated personal data
   * 
   * Body: { password, confirmation }
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user?.userId || req.user?.id || req.user?._id;
      const { password, confirmation } = req.body;

      // Validate confirmation text
      if (confirmation !== 'ELIMINAR' && confirmation !== 'DELETE') {
        throw new AppError(
          'INVALID_CONFIRMATION',
          400,
          'You must type "ELIMINAR" or "DELETE" to confirm account deletion'
        );
      }

      // Password is required for non-OAuth users
      const User = require('../models/user.model');
      const user = await User.findById(userId).select('passwordHash oauthProvider');
      
      if (user.passwordHash && !user.oauthProvider && !password) {
        throw new AppError(
          'PASSWORD_REQUIRED',
          400,
          'Password is required to delete your account'
        );
      }

      // Execute deletion
      const result = await userService.deleteAccount(userId, password);

      return responseHandler.success(res, {
        message: result.message,
        deleted: true
      });

    } catch (error) {
      console.error('Error deleting account:', error);
      
      // Handle specific errors
      if (error.code === 'CANNOT_DELETE_ORG_ADMIN' || 
          error.code === 'CANNOT_DELETE_PROJECT_MANAGER') {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: error.code
        });
      }

      if (error.code === 'INVALID_PASSWORD') {
        return res.status(401).json({
          success: false,
          error: 'Invalid password',
          code: 'INVALID_PASSWORD'
        });
      }

      return responseHandler.handleError(error, res);
    }
  }
}

module.exports = new UserController();
