const mongoose = require('mongoose');

/**
 * Schema para almacenar las respuestas del Big Five Inventory (BFI-44)
 * Siguiendo principios SOLID y arquitectura de modelos existente
 */
const bfi44ResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  responses: {
    type: Map,
    of: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    required: true,
    validate: {
      validator: function(responses) {
        // Validar que existan exactamente 44 respuestas
        return responses.size === 44;
      },
      message: 'Deben existir exactamente 44 respuestas'
    }
  },
  results: {
    Extraversion: {
      type: Number,
      required: true
    },
    Agreeableness: {
      type: Number,
      required: true
    },
    Conscientiousness: {
      type: Number,
      required: true
    },
    Neuroticism: {
      type: Number,
      required: true
    },
    Openness: {
      type: Number,
      required: true
    }
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
bfi44ResponseSchema.index({ userId: 1, completedAt: -1 });

/**
 * Método para obtener el perfil más reciente de un usuario
 */
bfi44ResponseSchema.statics.getLatestProfile = async function(userId) {
  return this.findOne({ userId })
    .sort({ completedAt: -1 })
    .exec();
};

/**
 * Método para verificar si un usuario tiene un perfil completo
 */
bfi44ResponseSchema.statics.hasProfile = async function(userId) {
  const profile = await this.findOne({ userId });
  return !!profile;
};

/**
 * Método de instancia para validar integridad de datos
 */
bfi44ResponseSchema.methods.validateIntegrity = function() {
  // Verificar que todas las respuestas estén en el rango correcto
  for (const [key, value] of this.responses) {
    const questionId = parseInt(key);
    if (questionId < 1 || questionId > 44) {
      return false;
    }
    if (value < 1 || value > 5) {
      return false;
    }
  }
  return true;
};

module.exports = mongoose.model('BFI44Response', bfi44ResponseSchema);
