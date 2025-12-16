const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function() {
      return !this.oauthProvider;
    },
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  passwordHash: {
    type: String,
    required: function() {
      return !this.oauthProvider;
    },
    select: false
  },
  oauthProvider: {
    type: String,
    enum: ['google', 'github'],
    default: undefined
  },
  oauthId: {
    type: String
  },
  role: {
    type: String,
    enum: ['employee', 'org_admin', 'unassigned'], // Nuevo estado
    default: 'unassigned'
  },
  // Organización a la que pertenece (si es empleado)
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  isConfirmed: {
    type: Boolean,
    default: function() {
      return !!this.oauthProvider;
    }
  },
  confirmationToken: String,
  confirmationTokenExpiry: Date,
  verificationTokenExpiry: {
    type: Date,
    default: () => Date.now() + 24 * 60 * 60 * 1000 // 24 horas
  },
  registrationAttempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  avatar: String,
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    }
  }
});

// Use a partial index so only documents with both oauthProvider and oauthId
// (non-null) are indexed. This prevents duplicate-key errors for {null, null}
userSchema.index(
  { oauthProvider: 1, oauthId: 1 },
  {
    unique: true,
    // Use $type to avoid unsupported $ne/$not expressions in older/memory MongoDB
    partialFilterExpression: {
      oauthProvider: { $type: 'string' },
      oauthId: { $type: 'string' }
    }
  }
);

// Índice TTL para eliminar usuarios no verificados después de 48 horas
userSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 172800, // 48 horas
    partialFilterExpression: { isConfirmed: false }
  }
);

// Método para verificar si el perfil está completo
userSchema.methods.isProfileComplete = function() {
  return this.role !== 'unassigned';
};

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.confirmationToken;
  delete user.confirmationTokenExpiry;
  return user;
};

module.exports = mongoose.model('User', userSchema);