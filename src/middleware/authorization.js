/**
 * Middleware de Autorización de Roles
 * Valida que el usuario tenga los roles necesarios para acceder a recursos
 * Siguiendo principios SOLID y seguridad por capas
 */

/**
 * Middleware para verificar que el usuario tiene un rol específico
 * @param {...string} allowedRoles - Roles permitidos
 * @returns {Function} Middleware de Express
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Verificar que el usuario está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    // Verificar que el usuario tiene uno de los roles permitidos
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
 * Middleware para verificar que el usuario es administrador de organización
 */
const requireOrgAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  if (req.user.role !== 'org_admin') {
    return res.status(403).json({
      success: false,
      error: 'You must be an organization admin to access this resource'
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario es empleado
 */
const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  if (req.user.role !== 'employee') {
    return res.status(403).json({
      success: false,
      error: 'You must be an employee to access this resource'
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario tiene perfil completo
 */
const requireCompleteProfile = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  if (req.user.role === 'unassigned') {
    return res.status(403).json({
      success: false,
      error: 'You must complete your profile before accessing this resource',
      profileComplete: false
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario puede acceder a un recurso específico de usuario
 * Permite acceso al propio usuario o a administradores de su organización
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

  // Si es el propio usuario, permitir
  if (targetUserId === currentUserId) {
    return next();
  }

  // Si es org_admin, verificar que el usuario objetivo pertenece a su organización
  if (req.user.role === 'org_admin') {
    try {
      const Organization = require('../models/organization.model');
      const User = require('../models/user.model');

      // Buscar la organización administrada por el usuario actual
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

      // Verificar si el usuario objetivo es empleado de la organización
      const isEmployee = organization.employees.some(
        emp => emp.user.toString() === targetUserId && emp.status === 'active'
      );

      if (isEmployee) {
        return next();
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
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
 * Middleware para verificar que el usuario puede gestionar una organización
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
    const Organization = require('../models/organization.model');
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Verificar si el usuario es administrador de la organización
    if (!organization.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not an admin of this organization'
      });
    }

    // Adjuntar la organización al request para uso posterior
    req.organization = organization;
    next();
  } catch (error) {
    console.error('Error verificando permisos de organización:', error);
    return res.status(500).json({
      success: false,
      error: 'Error checking permissions'
    });
  }
};

/**
 * Middleware para verificar que el usuario puede acceder a recursos de una organización
 * Permite acceso a administradores y empleados activos
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
    const Organization = require('../models/organization.model');
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Verificar si el usuario es administrador o empleado
    const isAdmin = organization.isAdmin(userId);
    const isEmployee = organization.isEmployee(userId);

    if (!isAdmin && !isEmployee) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this organization'
      });
    }

    // Adjuntar información al request
    req.organization = organization;
    req.isOrgAdmin = isAdmin;
    req.isOrgEmployee = isEmployee;
    next();
  } catch (error) {
    console.error('Error verificando membresía de organización:', error);
    return res.status(500).json({
      success: false,
      error: 'Error checking permissions'
    });
  }
};

module.exports = {
  requireRole,
  requireOrgAdmin,
  requireEmployee,
  requireCompleteProfile,
  requireOwnerOrOrgAdmin,
  requireOrganizationAdmin,
  requireOrganizationMember
};
