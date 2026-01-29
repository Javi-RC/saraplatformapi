const userService = require('../../../src/services/user.service');
const userNotificationHelper = require('../../../src/services/userNotificationHelper');
const bcrypt = require('bcryptjs');

const {
  userRepository,
  organizationRepository,
  projectRepository,
  cvRepository,
  notificationRepository,
  bfi44Repository,
  caseBaseRepository
} = require('../../../src/repositories');

jest.mock('../../../src/services/userNotificationHelper');
jest.mock('bcryptjs');

describe('UserService - Unit Tests', () => {
  let mockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn()
    };

    userRepository.startSession = jest.fn().mockResolvedValue(mockSession);
  });

  describe('deleteAccount', () => {
    it('should throw error if user not found', async () => {
      userRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        userService.deleteAccount('user-123', 'password')
      ).rejects.toThrow('User not found');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword'
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      await expect(
        userService.deleteAccount('user-123', 'wrongpassword')
      ).rejects.toThrow('Invalid password');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw error if user is primary admin of organization', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword'
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      organizationRepository.find = jest.fn().mockResolvedValue([
        { name: 'Org 1' },
        { name: 'Org 2' }
      ]);

      await expect(
        userService.deleteAccount('user-123', 'password')
      ).rejects.toThrow('Cannot delete account');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should throw error if user is managing active projects', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword'
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([
        { projectName: 'Project 1', status: 'active' }
      ]);

      await expect(
        userService.deleteAccount('user-123', 'password')
      ).rejects.toThrow('Cannot delete account');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should successfully delete account with all cleanup', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword'
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      
      cvRepository.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });
      notificationRepository.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
      bfi44Repository.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 1 });
      
      organizationRepository.updateMany = jest.fn().mockResolvedValue({});
      projectRepository.updateMany = jest.fn().mockResolvedValue({});
      
      caseBaseRepository.find = jest.fn().mockResolvedValue([]);
      
      userNotificationHelper.notifyAccountDeleted = jest.fn().mockResolvedValue();
      userRepository.deleteById = jest.fn().mockResolvedValue({ deletedCount: 1 });

      const result = await userService.deleteAccount('user-123', 'password');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account deleted successfully');
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(userNotificationHelper.notifyAccountDeleted).toHaveBeenCalledWith(
        'user-123',
        'Test User',
        'test@example.com'
      );
    });

    it('should handle OAuth users without password verification', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'OAuth User',
        email: 'oauth@example.com',
        oauthProvider: 'google'
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      
      cvRepository.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
      notificationRepository.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
      bfi44Repository.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
      
      organizationRepository.updateMany = jest.fn().mockResolvedValue({});
      projectRepository.updateMany = jest.fn().mockResolvedValue({});
      
      caseBaseRepository.find = jest.fn().mockResolvedValue([]);
      
      userNotificationHelper.notifyAccountDeleted = jest.fn().mockResolvedValue();
      userRepository.deleteById = jest.fn().mockResolvedValue({ deletedCount: 1 });

      const result = await userService.deleteAccount('user-123', null);

      expect(result.success).toBe(true);
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should anonymize historical data in case base', async () => {
      const mockUser = {
        _id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedPassword'
      };

      const mockCase = {
        _id: 'case-123',
        teamComposition: {
          members: [
            { userId: 'user-123', name: 'Test User', role: 'developer' },
            { userId: 'user-456', name: 'Other User', role: 'designer' }
          ]
        },
        projectManager: 'user-123',
        save: jest.fn().mockResolvedValue()
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      bcrypt.compare = jest.fn().mockResolvedValue(true);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      
      cvRepository.deleteMany = jest.fn().mockResolvedValue({});
      notificationRepository.deleteMany = jest.fn().mockResolvedValue({});
      bfi44Repository.deleteMany = jest.fn().mockResolvedValue({});
      
      organizationRepository.updateMany = jest.fn().mockResolvedValue({});
      projectRepository.updateMany = jest.fn().mockResolvedValue({});
      
      caseBaseRepository.find = jest.fn().mockResolvedValue([mockCase]);
      
      userNotificationHelper.notifyAccountDeleted = jest.fn().mockResolvedValue();
      userRepository.deleteById = jest.fn().mockResolvedValue({});

      await userService.deleteAccount('user-123', 'password');

      expect(mockCase.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockCase.projectManagerDeleted).toBe(true);
      expect(mockCase.projectManagerName).toBe('Deleted User');
    });
  });

  describe('getDeletionPrerequisites', () => {
    it('should throw error if user not found', async () => {
      userRepository.findById = jest.fn().mockResolvedValue(null);

      await expect(
        userService.getDeletionPrerequisites('user-123')
      ).rejects.toThrow('User not found');
    });

    it('should return canDelete=false if user is primary admin', async () => {
      const mockUser = {
        _id: 'user-123',
        oauthProvider: null
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      organizationRepository.find = jest.fn().mockResolvedValue([
        { _id: 'org-1', name: 'Org 1', status: 'active' }
      ]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      cvRepository.count = jest.fn().mockResolvedValue(0);
      notificationRepository.count = jest.fn().mockResolvedValue(0);
      bfi44Repository.exists = jest.fn().mockResolvedValue(false);
      organizationRepository.count = jest.fn().mockResolvedValue(0);

      const result = await userService.getDeletionPrerequisites('user-123');

      expect(result.canDelete).toBe(false);
      expect(result.requiresPassword).toBe(true);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.blockers[0].type).toBe('primary_admin');
    });

    it('should return canDelete=false if user is managing active projects', async () => {
      const mockUser = {
        _id: 'user-123',
        oauthProvider: null
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([
        { _id: 'proj-1', projectName: 'Project 1', status: 'active' }
      ]);
      cvRepository.count = jest.fn().mockResolvedValue(0);
      notificationRepository.count = jest.fn().mockResolvedValue(0);
      bfi44Repository.exists = jest.fn().mockResolvedValue(false);
      organizationRepository.count = jest.fn().mockResolvedValue(0);

      const result = await userService.getDeletionPrerequisites('user-123');

      expect(result.canDelete).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
      expect(result.blockers[0].type).toBe('active_projects');
    });

    it('should return canDelete=true with warnings for data', async () => {
      const mockUser = {
        _id: 'user-123',
        oauthProvider: null
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      cvRepository.count = jest.fn().mockResolvedValue(2);
      notificationRepository.count = jest.fn().mockResolvedValue(5);
      bfi44Repository.exists = jest.fn().mockResolvedValue(true);
      organizationRepository.count = jest.fn().mockResolvedValue(0);

      const result = await userService.getDeletionPrerequisites('user-123');

      expect(result.canDelete).toBe(true);
      expect(result.requiresPassword).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('data_deletion');
    });

    it('should set requiresPassword=false for OAuth users', async () => {
      const mockUser = {
        _id: 'user-123',
        oauthProvider: 'google'
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      cvRepository.count = jest.fn().mockResolvedValue(0);
      notificationRepository.count = jest.fn().mockResolvedValue(0);
      bfi44Repository.exists = jest.fn().mockResolvedValue(false);
      organizationRepository.count = jest.fn().mockResolvedValue(0);

      const result = await userService.getDeletionPrerequisites('user-123');

      expect(result.requiresPassword).toBe(false);
      expect(result.canDelete).toBe(true);
    });

    it('should include organization membership warning', async () => {
      const mockUser = {
        _id: 'user-123',
        oauthProvider: null
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      cvRepository.count = jest.fn().mockResolvedValue(0);
      notificationRepository.count = jest.fn().mockResolvedValue(0);
      bfi44Repository.exists = jest.fn().mockResolvedValue(false);
      organizationRepository.count = jest.fn().mockResolvedValue(3);

      const result = await userService.getDeletionPrerequisites('user-123');

      expect(result.canDelete).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.type === 'organization_membership')).toBe(true);
    });

    it('should return clean prerequisites when no blockers or warnings', async () => {
      const mockUser = {
        _id: 'user-123',
        oauthProvider: 'github'
      };

      userRepository.findById = jest.fn().mockResolvedValue(mockUser);
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);
      cvRepository.count = jest.fn().mockResolvedValue(0);
      notificationRepository.count = jest.fn().mockResolvedValue(0);
      bfi44Repository.exists = jest.fn().mockResolvedValue(false);
      organizationRepository.count = jest.fn().mockResolvedValue(0);

      const result = await userService.getDeletionPrerequisites('user-123');

      expect(result.canDelete).toBe(true);
      expect(result.requiresPassword).toBe(false);
      expect(result.blockers.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('_validateCanDelete', () => {
    it('should allow deletion when no blockers exist', async () => {
      organizationRepository.find = jest.fn().mockResolvedValue([]);
      projectRepository.find = jest.fn().mockResolvedValue([]);

      await expect(
        userService._validateCanDelete('user-123')
      ).resolves.not.toThrow();
    });
  });

  describe('_deletePersonalData', () => {
    it('should delete CVs, notifications and BFI44 data', async () => {
      cvRepository.deleteMany = jest.fn().mockResolvedValue({});
      notificationRepository.deleteMany = jest.fn().mockResolvedValue({});
      bfi44Repository.deleteMany = jest.fn().mockResolvedValue({});

      await userService._deletePersonalData('user-123', mockSession);

      expect(cvRepository.deleteMany).toHaveBeenCalledWith(
        { user: 'user-123' },
        { session: mockSession }
      );
      expect(notificationRepository.deleteMany).toHaveBeenCalledWith(
        { recipient: 'user-123' },
        { session: mockSession }
      );
      expect(bfi44Repository.deleteMany).toHaveBeenCalledWith(
        { user: 'user-123' },
        { session: mockSession }
      );
    });
  });

  describe('_cleanOrganizationReferences', () => {
    it('should remove user from organization admin and employee lists', async () => {
      organizationRepository.updateMany = jest.fn().mockResolvedValue({});

      await userService._cleanOrganizationReferences('user-123', mockSession);

      expect(organizationRepository.updateMany).toHaveBeenCalledTimes(2);
      expect(organizationRepository.updateMany).toHaveBeenCalledWith(
        { additionalAdmins: 'user-123' },
        { $pull: { additionalAdmins: 'user-123' } },
        { session: mockSession }
      );
      expect(organizationRepository.updateMany).toHaveBeenCalledWith(
        { 'employees.user': 'user-123' },
        { $pull: { employees: { user: 'user-123' } } },
        { session: mockSession }
      );
    });
  });

  describe('_cleanProjectReferences', () => {
    it('should remove user from project teams and mark deleted PM', async () => {
      projectRepository.updateMany = jest.fn().mockResolvedValue({});

      await userService._cleanProjectReferences('user-123', mockSession);

      expect(projectRepository.updateMany).toHaveBeenCalledTimes(3);
    });
  });
});
