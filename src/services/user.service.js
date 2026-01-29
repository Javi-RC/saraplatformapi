const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const userNotificationHelper = require('./userNotificationHelper');

// Import repositories instead of models
const {
  userRepository,
  organizationRepository,
  projectRepository,
  cvRepository,
  notificationRepository,
  bfi44Repository,
  caseBaseRepository
} = require('../repositories');

/**
 * User Service
 * Handles user account management operations
 * Following SOLID principles: Single Responsibility
 */
class UserService {
  /**
   * Deletes a user account and handles all related data
   * @param {string} userId - ID of the user to delete
   * @param {string} password - User's password for confirmation
   * @returns {Promise<Object>} Result of deletion operation
   */
  async deleteAccount(userId, password) {
    const session = await userRepository.startSession();
    session.startTransaction();

    try {
      // 1. Verify user exists and password is correct
      const user = await userRepository.findById(userId, { select: '+passwordHash' });
      
      if (!user) {
        throw AppError.notFound('USER_NOT_FOUND', 'User not found');
      }

      // If user has password (not OAuth), verify it
      if (user.passwordHash && password) {
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          throw AppError.unauthorized('INVALID_PASSWORD', 'Invalid password');
        }
      }

      // 2. Run pre-deletion validations
      await this._validateCanDelete(userId);

      // 3. Delete personal data (GDPR compliance)
      await this._deletePersonalData(userId, session);

      // 4. Clean organization references
      await this._cleanOrganizationReferences(userId, session);

      // 5. Clean project references
      await this._cleanProjectReferences(userId, session);

      // 6. Anonymize historical data
      await this._anonymizeHistoricalData(userId, session);

      // 7. Send deletion confirmation notification
      await userNotificationHelper.notifyAccountDeleted(userId, user.name, user.email);

      // 8. Delete the user account
      await userRepository.deleteById(userId, { session });

      await session.commitTransaction();

      return {
        success: true,
        message: 'Account deleted successfully'
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Validates if a user account can be deleted
   * @param {string} userId - ID of the user
   * @throws {AppError} If user cannot be deleted
   * @private
   */
  async _validateCanDelete(userId) {
    // Check if user is primary admin of any organization
    const orgsAsAdmin = await organizationRepository.find(
      { admin: userId },
      { select: 'name' }
    );
    
    if (orgsAsAdmin.length > 0) {
      const orgNames = orgsAsAdmin.map(org => org.name).join(', ');
      throw new AppError(
        'CANNOT_DELETE_ORG_ADMIN',
        400,
        `Cannot delete account. You are the primary administrator of: ${orgNames}. ` +
        'Please transfer ownership or delete these organizations first.'
      );
    }

    // Check if user is managing active projects
    const activeProjects = await projectRepository.find(
      {
        projectManager: userId,
        status: { $in: ['draft', 'active', 'on_hold'] }
      },
      { select: 'projectName status' }
    );

    if (activeProjects.length > 0) {
      const projectInfo = activeProjects
        .map(p => `${p.projectName} (${p.status})`)
        .join(', ');
      
      throw new AppError(
        'CANNOT_DELETE_PROJECT_MANAGER',
        400,
        `Cannot delete account. You are managing ${activeProjects.length} active project(s): ${projectInfo}. ` +
        'Please complete, cancel, or transfer these projects first.'
      );
    }
  }

  /**
   * Deletes all personal data (GDPR compliance)
   * @param {string} userId - ID of the user
   * @param {ClientSession} session - MongoDB session for transaction
   * @private
   */
  async _deletePersonalData(userId, session) {
    // Delete CVs (sensitive personal information)
    await cvRepository.deleteMany({ user: userId }, { session });

    // Delete notifications (user communications)
    await notificationRepository.deleteMany({ recipient: userId }, { session });

    // Delete BFI-44 profile (psychometric personal data)
    await bfi44Repository.deleteMany({ user: userId }, { session });
  }

  /**
   * Cleans user references from organizations
   * @param {string} userId - ID of the user
   * @param {ClientSession} session - MongoDB session for transaction
   * @private
   */
  async _cleanOrganizationReferences(userId, session) {
    // Remove from additional admins list
    await organizationRepository.updateMany(
      { additionalAdmins: userId },
      { $pull: { additionalAdmins: userId } },
      { session }
    );

    // Remove from employees list
    await organizationRepository.updateMany(
      { 'employees.user': userId },
      { $pull: { employees: { user: userId } } },
      { session }
    );
  }

  /**
   * Cleans user references from projects
   * @param {string} userId - ID of the user
   * @param {ClientSession} session - MongoDB session for transaction
   * @private
   */
  async _cleanProjectReferences(userId, session) {
    // Remove from assigned employees
    await projectRepository.updateMany(
      { 'assignedEmployees.user': userId },
      { $pull: { assignedEmployees: { user: userId } } },
      { session }
    );

    // Remove from team composition
    await projectRepository.updateMany(
      { 'teamComposition.selectedEmployees': userId },
      { $pull: { 'teamComposition.selectedEmployees': userId } },
      { session }
    );

    // Mark completed/cancelled projects where user was PM as having deleted PM
    await projectRepository.updateMany(
      { 
        projectManager: userId,
        status: { $in: ['completed', 'cancelled'] }
      },
      { 
        $set: { 
          'metadata.projectManagerDeleted': true,
          'metadata.deletedProjectManagerName': 'Deleted User'
        }
      },
      { session }
    );
  }

  /**
   * Anonymizes user data in historical records
   * @param {string} userId - ID of the user
   * @param {ClientSession} session - MongoDB session for transaction
   * @private
   */
  async _anonymizeHistoricalData(userId, session) {
    // Anonymize in CaseBase for CBR system integrity
    // Keep the cases but remove personal identifiers
    const casesToUpdate = await caseBaseRepository.find(
      {
        $or: [
          { 'teamComposition.members.userId': userId },
          { 'projectManager': userId }
        ]
      },
      { session }
    );

    for (const caseDoc of casesToUpdate) {
      // Anonymize team members
      if (caseDoc.teamComposition && caseDoc.teamComposition.members) {
        caseDoc.teamComposition.members = caseDoc.teamComposition.members.map(member => {
          if (member.userId && member.userId.toString() === userId.toString()) {
            return {
              ...member,
              userId: null,
              name: 'Deleted User',
              isDeleted: true
            };
          }
          return member;
        });
      }

      // Anonymize project manager if needed
      if (caseDoc.projectManager && caseDoc.projectManager.toString() === userId.toString()) {
        caseDoc.projectManagerDeleted = true;
        caseDoc.projectManagerName = 'Deleted User';
      }

      await caseDoc.save({ session });
    }
  }

  /**
   * Gets deletion prerequisites for a user
   * Returns what needs to be done before account can be deleted
   * @param {string} userId - ID of the user
   * @returns {Promise<Object>} Prerequisites information
   */
  async getDeletionPrerequisites(userId) {
    // Get user to check if OAuth or not
    const user = await userRepository.findById(userId, { select: 'oauthProvider' });
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found');
    }

    const prerequisites = {
      canDelete: true,
      requiresPassword: !user.oauthProvider, // false for OAuth users (Google/GitHub)
      blockers: [],
      warnings: []
    };

    // Check organizations where user is primary admin
    const orgsAsAdmin = await organizationRepository.find(
      { admin: userId },
      { select: 'name status' }
    );
    
    if (orgsAsAdmin.length > 0) {
      prerequisites.canDelete = false;
      prerequisites.blockers.push({
        type: 'primary_admin',
        message: `You are the primary administrator of ${orgsAsAdmin.length} organization(s)`,
        organizations: orgsAsAdmin.map(org => ({
          id: org._id,
          name: org.name,
          status: org.status
        })),
        action: 'Transfer ownership or delete these organizations first'
      });
    }

    // Check active projects as PM
    const activeProjects = await projectRepository.find(
      {
        projectManager: userId,
        status: { $in: ['draft', 'active', 'on_hold'] }
      },
      { select: 'projectName status organization' }
    );

    if (activeProjects.length > 0) {
      prerequisites.canDelete = false;
      prerequisites.blockers.push({
        type: 'active_projects',
        message: `You are managing ${activeProjects.length} active project(s)`,
        projects: activeProjects.map(proj => ({
          id: proj._id,
          name: proj.projectName,
          status: proj.status
        })),
        action: 'Complete, cancel, or transfer these projects first'
      });
    }

    // Check data that will be deleted
    const cvCount = await cvRepository.count({ user: userId });
    const notificationCount = await notificationRepository.count({ recipient: userId });
    const hasBFI44 = await bfi44Repository.exists({ user: userId });

    if (cvCount > 0 || notificationCount > 0 || hasBFI44) {
      prerequisites.warnings.push({
        type: 'data_deletion',
        message: 'The following data will be permanently deleted:',
        items: [
          cvCount > 0 ? `${cvCount} CV(s)` : null,
          notificationCount > 0 ? `${notificationCount} notification(s)` : null,
          hasBFI44 ? 'BFI-44 personality profile' : null,
          'All personal information and account data'
        ].filter(Boolean)
      });
    }

    // Check if user is part of organizations (as employee/additional admin)
    const orgsAsMember = await organizationRepository.count({
      $or: [
        { additionalAdmins: userId },
        { 'employees.user': userId }
      ]
    });

    if (orgsAsMember > 0) {
      prerequisites.warnings.push({
        type: 'organization_membership',
        message: `You will be removed from ${orgsAsMember} organization(s) where you are a member or additional admin`
      });
    }

    return prerequisites;
  }
}

module.exports = new UserService();
