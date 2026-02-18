const { 
  requireRole, 
  requireOrgAdmin, 
  requireEmployee,
  requireCompleteProfile,
  requireOwnerOrOrgAdmin,
  requireOrganizationAdmin,
  requireOrganizationMember,
  requireOrgAdminOrProjectManager
} = require('../../../src/middleware/authorization');

describe('Authorization Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    it('debería permitir acceso con rol correcto', () => {
      req.user = { role: 'org_admin' };
      const middleware = requireRole('org_admin', 'project_manager');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería denegar acceso con rol incorrecto', () => {
      req.user = { role: 'employee' };
      const middleware = requireRole('org_admin', 'project_manager');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You do not have permission to access this resource',
        requiredRoles: ['org_admin', 'project_manager'],
        currentRole: 'employee'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería denegar acceso sin usuario autenticado', () => {
      const middleware = requireRole('org_admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería aceptar múltiples roles', () => {
      req.user = { role: 'project_manager' };
      const middleware = requireRole('org_admin', 'project_manager', 'employee');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireOrgAdmin', () => {
    it('debería permitir acceso a org_admin', () => {
      req.user = { role: 'org_admin' };

      requireOrgAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería denegar acceso a no org_admin', () => {
      req.user = { role: 'employee' };

      requireOrgAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You must be an organization admin to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería denegar acceso sin autenticación', () => {
      requireOrgAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
    });
  });

  describe('requireEmployee', () => {
    it('debería permitir acceso a employee', () => {
      req.user = { role: 'employee' };

      requireEmployee(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería denegar acceso a no employee', () => {
      req.user = { role: 'org_admin' };

      requireEmployee(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You must be an employee to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería denegar acceso sin autenticación', () => {
      requireEmployee(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
    });
  });

  describe('requireCompleteProfile', () => {
    it('debería permitir acceso con perfil completo', () => {
      req.user = { role: 'employee' };

      requireCompleteProfile(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería denegar acceso con perfil incompleto', () => {
      req.user = { role: 'unassigned' };

      requireCompleteProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You must complete your profile before accessing this resource',
        profileComplete: false
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería denegar acceso sin autenticación', () => {
      requireCompleteProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
    });
  });

  describe('requireOwnerOrOrgAdmin', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('debería permitir acceso al propio usuario', async () => {
      req.user = { id: 'user-123' };
      req.params.userId = 'user-123';

      await requireOwnerOrOrgAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería denegar acceso sin autenticación', async () => {
      req.params.userId = 'user-123';

      await requireOwnerOrOrgAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
    });
  });

  describe('requireOrganizationAdmin', () => {
    it('debería denegar acceso sin autenticación', async () => {
      req.params.id = 'org-123';

      await requireOrganizationAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
    });
  });

  describe('requireOrganizationMember', () => {
    it('debería denegar acceso sin autenticación', async () => {
      req.params.id = 'org-123';

      await requireOrganizationMember(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
    });
  });

  describe('requireOrgAdminOrProjectManager', () => {
    it('debería permitir acceso a org_admin', async () => {
      req.user = { id: 'admin-1', role: 'org_admin' };

      await requireOrgAdminOrProjectManager(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.isProjectManager).toBe(false);
    });

    it('debería denegar acceso sin autenticación', async () => {
      await requireOrgAdminOrProjectManager(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Not authenticated'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería denegar acceso a empleado sin rol de project manager', async () => {
      req.user = { id: 'emp-1', role: 'employee', organization: null };

      await requireOrgAdminOrProjectManager(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
