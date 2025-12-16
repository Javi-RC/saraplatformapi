const mongoose = require('mongoose');

/**
 * Modelo de Organización
 * Representa una empresa u organización dentro del sistema
 * Siguiendo principios SOLID: Single Responsibility
 */
const organizationSchema = new mongoose.Schema({
  // Información básica de la organización
  name: {
    type: String,
    required: [true, 'El nombre de la organización es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    unique: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  
  // Identificación fiscal/legal
  taxId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Permite múltiples valores null pero valores únicos no-null
    index: true
  },
  
  // Información de contacto
  contact: {
    email: {
      type: String,
      required: [true, 'El email de contacto es obligatorio'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  // Dirección física
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    }
  },
  
  // Industria/Sector
  industry: {
    type: String,
    trim: true,
    enum: [
      'software_development',
      'web_development',
      'mobile_development',
      'devops_cloud',
      'data_science',
      'cybersecurity',
      'ai_machine_learning',
      'blockchain',
      'game_development',
      'qa_testing',
      'consulting',
      'fintech',
      'healthtech',
      'edtech',
      'ecommerce',
      'saas',
      'other'
    ]
  },
  
  // Tamaño de la organización
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10'
  },
  
  // Administrador principal de la organización
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Se requiere un administrador'],
    index: true
  },
  
  // Miembros adicionales del equipo administrativo
  additionalAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Empleados asociados a la organización
  employees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    position: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    },
    isProjectManager: {
      type: Boolean,
      default: false
    }
  }],
  
  // Configuración de la organización
  settings: {
    allowPublicCVSubmission: {
      type: Boolean,
      default: true,
      description: 'Permite que empleados externos envíen CVs'
    },
    requireApproval: {
      type: Boolean,
      default: true,
      description: 'Requiere aprobación del administrador para nuevos empleados'
    },
    notifyOnCVSubmission: {
      type: Boolean,
      default: true,
      description: 'Notificar a administradores cuando se recibe un CV'
    },
    autoProcessCV: {
      type: Boolean,
      default: true,
      description: 'Procesar automáticamente CVs con IA'
    }
  },
  
  // Estado de la organización
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // Logo de la organización
  logo: {
    type: String,
    trim: true
  },
  
  // Datos adicionales personalizables
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Metadatos de auditoría
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Última actividad
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para optimización de consultas
organizationSchema.index({ admin: 1, status: 1 });
organizationSchema.index({ 'employees.user': 1 });
organizationSchema.index({ createdAt: -1 });

// Virtual: Total de empleados activos
organizationSchema.virtual('activeEmployeesCount').get(function() {
  return this.employees ? this.employees.filter(emp => emp.status === 'active').length : 0;
});

// Virtual: Total de empleados
organizationSchema.virtual('totalEmployeesCount').get(function() {
  return this.employees ? this.employees.length : 0;
});

// Virtual: Verificar si la organización está completamente configurada
organizationSchema.virtual('isFullyConfigured').get(function() {
  return !!(
    this.name &&
    this.contact.email &&
    this.admin &&
    this.industry
  );
});

// Método: Verificar si un usuario es administrador
organizationSchema.methods.isAdmin = function(userId) {
  const userIdStr = userId.toString();
  
  // Manejar caso donde admin está poblado (es un objeto) o no poblado (es ObjectId)
  const adminId = this.admin._id ? this.admin._id.toString() : this.admin.toString();
  
  // Verificar si es el admin principal
  if (adminId === userIdStr) {
    return true;
  }
  
  // Verificar si está en additionalAdmins (también puede estar poblado)
  return this.additionalAdmins ? this.additionalAdmins.some(admin => {
    const additionalAdminId = admin._id ? admin._id.toString() : admin.toString();
    return additionalAdminId === userIdStr;
  }) : false;
};

// Método: Verificar si un usuario es empleado
organizationSchema.methods.isEmployee = function(userId) {
  if (!this.employees) return false;
  const userIdStr = userId.toString();
  return this.employees.some(emp => {
    // Manejar caso donde emp.user está poblado o no
    const empUserId = emp.user._id ? emp.user._id.toString() : emp.user.toString();
    return empUserId === userIdStr && emp.status === 'active';
  });
};

// Método: Verificar si un usuario es jefe de proyecto
organizationSchema.methods.isProjectManager = function(userId) {
  if (!this.employees) return false;
  const userIdStr = userId.toString();
  const employee = this.employees.find(emp => {
    const empUserId = emp.user._id ? emp.user._id.toString() : emp.user.toString();
    return empUserId === userIdStr && emp.status === 'active';
  });
  return employee ? employee.isProjectManager : false;
};

// Método: Agregar empleado
organizationSchema.methods.addEmployee = function(userId, employeeData = {}) {
  // Inicializar employees si no existe
  if (!this.employees) {
    this.employees = [];
  }
  
  // Verificar si ya existe
  const existingEmployee = this.employees.find(
    emp => emp.user.toString() === userId.toString()
  );
  
  if (existingEmployee) {
    throw new Error('El empleado ya está asociado a esta organización');
  }
  
  this.employees.push({
    user: userId,
    position: employeeData.position,
    department: employeeData.department,
    status: this.settings.requireApproval ? 'pending' : 'active',
    isProjectManager: employeeData.isProjectManager || false
  });
  
  this.lastActivityAt = Date.now();
  return this.save();
};

// Método: Remover empleado
organizationSchema.methods.removeEmployee = function(userId) {
  if (!this.employees) {
    throw new Error('Empleado no encontrado en la organización');
  }
  
  const index = this.employees.findIndex(
    emp => emp.user.toString() === userId.toString()
  );
  
  if (index === -1) {
    throw new Error('Empleado no encontrado en la organización');
  }
  
  this.employees.splice(index, 1);
  this.lastActivityAt = Date.now();
  return this.save();
};

// Método: Actualizar estado de empleado
organizationSchema.methods.updateEmployeeStatus = function(userId, newStatus) {
  if (!this.employees) {
    throw new Error('Empleado no encontrado en la organización');
  }
  
  const employee = this.employees.find(
    emp => emp.user.toString() === userId.toString()
  );
  
  if (!employee) {
    throw new Error('Empleado no encontrado en la organización');
  }
  
  employee.status = newStatus;
  this.lastActivityAt = Date.now();
  return this.save();
};

// Método: Asignar/desasignar rol de jefe de proyecto
organizationSchema.methods.setProjectManagerRole = function(userId, isProjectManager) {
  if (!this.employees) {
    throw new Error('Empleado no encontrado en la organización');
  }
  
  const employee = this.employees.find(
    emp => emp.user.toString() === userId.toString()
  );
  
  if (!employee) {
    throw new Error('Empleado no encontrado en la organización');
  }
  
  if (employee.status !== 'active') {
    throw new Error('Solo se puede asignar el rol de jefe de proyecto a empleados activos');
  }
  
  employee.isProjectManager = isProjectManager;
  this.lastActivityAt = Date.now();
  return this.save();
};

// Método: Agregar administrador adicional
organizationSchema.methods.addAdmin = function(userId) {
  const userIdStr = userId.toString();
  
  if (this.admin.toString() === userIdStr) {
    throw new Error('El usuario ya es el administrador principal');
  }
  
  if (this.additionalAdmins.some(adminId => adminId.toString() === userIdStr)) {
    throw new Error('El usuario ya es un administrador adicional');
  }
  
  this.additionalAdmins.push(userId);
  this.lastActivityAt = Date.now();
  return this.save();
};

// Middleware: Actualizar timestamp antes de guardar
organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware: Validar que el admin no esté en la lista de additionalAdmins
organizationSchema.pre('save', function(next) {
  if (this.admin && this.additionalAdmins.length > 0) {
    const adminStr = this.admin.toString();
    this.additionalAdmins = this.additionalAdmins.filter(
      id => id.toString() !== adminStr
    );
  }
  next();
});

// Método estático: Buscar organizaciones por administrador
organizationSchema.statics.findByAdmin = function(adminId) {
  return this.find({
    $or: [
      { admin: adminId },
      { additionalAdmins: adminId }
    ]
  }).populate('admin', 'name email avatar')
    .populate('additionalAdmins', 'name email avatar');
};

// Método estático: Buscar organizaciones donde el usuario es empleado
organizationSchema.statics.findByEmployee = function(userId) {
  return this.find({
    'employees.user': userId,
    'employees.status': 'active'
  }).populate('admin', 'name email avatar');
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
