/**
 * Role Authorization Middleware
 * Validates that the user has the required roles to access resources
 * Following SOLID principles and layered security
 */

const Organization = require('../models/organization.model');
const { ROLES } = require('../config/roles');

/**
 * Middleware to verify that the user has a specific role
 * @param {...string} allowedRoles - Allowed roles
 * @returns {Function} Express middleware
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Verify that the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Verify that the user has one of the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource',
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to verify that the user is an organization admin
 */
const requireOrgAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  if (req.user.role !== ROLES.ORG_ADMIN) {
    return res.status(403).json({
      success: false,
      error: 'You must be an organization admin to access this resource'
    });
  }

  next();
};

/**
 * Middleware to verify that the user is an employee
 */
const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  if (req.user.role !== ROLES.EMPLOYEE) {
    return res.status(403).json({
      success: false,
      error: 'You must be an employee to access this resource'
    });
  }

  next();
};

/**
 * Middleware to verify that the user has a complete profile
 */
const requireCompleteProfile = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  if (req.user.role === ROLES.UNASSIGNED) {
    return res.status(403).json({
      success: false,
      error: 'You must complete your profile before accessing this resource',
      profileComplete: false
    });
  }

  next();
};

/**
 * Middleware to verify that the user can access a specific user resource
 * Allows access to the user themselves or to their organization admins
 */
const requireOwnerOrOrgAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;

  // If it is the user themselves, allow access
  if (targetUserId === currentUserId) {
    return next();
  }

  if (req.user.role === ROLES.ORG_ADMIN) {
    try {
      // Find the organization managed by the current user
      const organization = await Organization.findOne({
        $or: [
          { admin: currentUserId },
          { additionalAdmins: currentUserId }
        ]
      });

      if (!organization) {
        return res.status(403).json({
          success: false,
          error: 'You are not managing any organization'
        });
      }

      // Check if the target user is an employee of the organization
      const isEmployee = organization.employees.some(
        emp => emp.user.toString() === targetUserId && emp.status === 'active'
      );

      if (isEmployee) {
        return next();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions'
      });
    }
  }

  return res.status(403).json({
    success: false,
    error: 'You do not have permission to access this resource'
  });
};

/**
 * Middleware to verify that the user can manage an organization
 */
const requireOrganizationAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const organizationId = req.params.id || req.params.organizationId;
  const userId = req.user.id;

  try {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Check if the user is an admin of the organization
    if (!organization.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not an admin of this organization'
      });
    }

    // Attach the organization to the request for later use
    req.organization = organization;
    next();
  } catch (error) {
    console.error('Error checking organization permissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Error checking permissions'
    });
  }
};

/**
 * Middleware to verify that the user can access organization resources
 * Allows access to admins and active employees
 */
const requireOrganizationMember = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const organizationId = req.params.id || req.params.organizationId;
  const userId = req.user.id;

  try {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Check if the user is an admin or employee
    const isAdmin = organization.isAdmin(userId);
    const isEmployee = organization.isEmployee(userId);

    if (!isAdmin && !isEmployee) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this organization'
      });
    }

    // Attach information to the request
    req.organization = organization;
    req.isOrgAdmin = isAdmin;
    req.isOrgEmployee = isEmployee;
    next();
  } catch (error) {
    console.error('Error checking organization membership:', error);
    return res.status(500).json({
      success: false,
      error: 'Error checking permissions'
    });
  }
};

/**
 * Middleware to verify that the user is an organization admin or project manager
 * Attaches req.isProjectManager for later use in the controller
 */
const requireOrgAdminOrProjectManager = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  // org_admin always allowed
  if (req.user.role === ROLES.ORG_ADMIN) {
    req.isProjectManager = false;
    return next();
  }

  // Check if employee is a project manager in their organization
  if (req.user.role === ROLES.EMPLOYEE && req.user.organization) {
    try {
      const organization = req.organization || await Organization.findById(req.user.organization);

      if (organization && organization.isProjectManager(req.user.id)) {
        req.isProjectManager = true;
        return next();
      }
    } catch (error) {
      console.error('Error checking project manager role:', error);
      return res.status(500).json({
        success: false,
        error: 'Error checking permissions'
      });
    }
  }

  return res.status(403).json({
    success: false,
    error: 'You must be an organization admin or project manager to access this resource'
  });
};

/**
 * Middleware to verify that the user is an admin (ORG_ADMIN or ADMIN)
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  if (req.user.role !== ROLES.ORG_ADMIN && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

module.exports = {
  requireRole,
  requireOrgAdmin,
  requireEmployee,
  requireCompleteProfile,
  requireOwnerOrOrgAdmin,
  requireOrganizationAdmin,
  requireOrganizationMember,
  requireOrgAdminOrProjectManager,
  isAdmin
};
