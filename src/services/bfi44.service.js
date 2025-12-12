const BFI44Response = require('../models/bfi44.model');
const User = require('../models/user.model');
const bfi44NotificationHelper = require('./bfi44NotificationHelper');

/**
 * BFI-44 Service
 * Servicio para manejar la lógica de negocio del Big Five Inventory
 * Siguiendo principios SOLID: Single Responsibility Principle
 */
class BFI44Service {
  /**
   * Configuración del BFI-44
   * Ítems por factor y ítems invertidos según el estándar BFI-44
   */
  static BFI44_CONFIG = {
    // Ítems que pertenecen a cada factor
    factors: {
      Extraversion: [1, 6, 11, 16, 21, 26, 31, 36],
      Agreeableness: [2, 7, 12, 17, 22, 27, 32, 37, 42],
      Conscientiousness: [3, 8, 13, 18, 23, 28, 33, 38, 43],
      Neuroticism: [4, 9, 14, 19, 24, 29, 34, 39],
      Openness: [5, 10, 15, 20, 25, 30, 35, 40, 41, 44]
    },
    
    // Ítems que deben invertirse (reverse-scored)
    reversedItems: {
      Extraversion: [6, 21, 31],
      Agreeableness: [2, 12, 27, 37],
      Conscientiousness: [8, 18, 23, 43],
      Neuroticism: [9, 24, 34],
      Openness: [35, 41]
    },

    // Escala Likert
    scale: {
      1: "Disagree strongly",
      2: "Disagree a little",
      3: "Neither agree nor disagree",
      4: "Agree a little",
      5: "Agree strongly"
    },

    // Los 44 ítems del BFI-44
    questions: [
      { id: 1, text: "Is talkative" },
      { id: 2, text: "Tends to find fault with others" },
      { id: 3, text: "Does a thorough job" },
      { id: 4, text: "Is depressed, blue" },
      { id: 5, text: "Is original, comes up with new ideas" },
      { id: 6, text: "Is reserved" },
      { id: 7, text: "Is helpful and unselfish with others" },
      { id: 8, text: "Can be somewhat careless" },
      { id: 9, text: "Is relaxed, handles stress well" },
      { id: 10, text: "Is curious about many different things" },
      { id: 11, text: "Is full of energy" },
      { id: 12, text: "Starts quarrels with others" },
      { id: 13, text: "Is a reliable worker" },
      { id: 14, text: "Can be tense" },
      { id: 15, text: "Is ingenious, a deep thinker" },
      { id: 16, text: "Generates a lot of enthusiasm" },
      { id: 17, text: "Has a forgiving nature" },
      { id: 18, text: "Tends to be disorganized" },
      { id: 19, text: "Worries a lot" },
      { id: 20, text: "Has an active imagination" },
      { id: 21, text: "Tends to be quiet" },
      { id: 22, text: "Is generally trusting" },
      { id: 23, text: "Tends to be lazy" },
      { id: 24, text: "Is emotionally stable, not easily upset" },
      { id: 25, text: "Is inventive" },
      { id: 26, text: "Has an assertive personality" },
      { id: 27, text: "Can be cold and aloof" },
      { id: 28, text: "Perseveres until the task is finished" },
      { id: 29, text: "Can be moody" },
      { id: 30, text: "Values artistic, aesthetic experiences" },
      { id: 31, text: "Is sometimes shy, inhibited" },
      { id: 32, text: "Is considerate and kind to almost everyone" },
      { id: 33, text: "Does things efficiently" },
      { id: 34, text: "Remains calm in tense situations" },
      { id: 35, text: "Prefers work that is routine" },
      { id: 36, text: "Is outgoing, sociable" },
      { id: 37, text: "Is sometimes rude to others" },
      { id: 38, text: "Makes plans and follows through with them" },
      { id: 39, text: "Gets nervous easily" },
      { id: 40, text: "Likes to reflect, play with ideas" },
      { id: 41, text: "Has few artistic interests" },
      { id: 42, text: "Likes to cooperate with others" },
      { id: 43, text: "Is easily distracted" },
      { id: 44, text: "Is sophisticated in art, music, or literature" }
    ]
  };

  /**
   * Obtener el cuestionario completo
   * @returns {Object} Estructura del cuestionario BFI-44
   */
  static getQuestionnaire() {
    return {
      inventory: "BFI-44",
      scale: this.BFI44_CONFIG.scale,
      questions: this.BFI44_CONFIG.questions
    };
  }

  /**
   * Invertir puntuación de un ítem (reverse scoring)
   * Fórmula: reverse = 6 - original_value
   * @param {number} value - Valor original (1-5)
   * @returns {number} Valor invertido
   */
  static reverseScore(value) {
    return 6 - value;
  }

  /**
   * Calcular puntuación de un factor específico
   * @param {Object} responses - Respuestas del usuario
   * @param {string} factorName - Nombre del factor
   * @returns {number} Puntuación total del factor
   */
  static calculateFactorScore(responses, factorName) {
    const items = this.BFI44_CONFIG.factors[factorName];
    const reversedItems = this.BFI44_CONFIG.reversedItems[factorName] || [];
    
    let score = 0;
    
    for (const itemId of items) {
      let value = responses.get(itemId.toString());
      
      // Si no hay valor, lanzar error
      if (value === undefined) {
        throw new Error(`MISSING_ITEM_${itemId}`);
      }
      
      // Aplicar inversión si corresponde
      if (reversedItems.includes(itemId)) {
        value = this.reverseScore(value);
      }
      
      score += value;
    }
    
    return score;
  }

  /**
   * Calcular todos los factores del Big Five
   * @param {Object} responses - Respuestas del usuario (Map)
   * @returns {Object} Puntuaciones de los 5 factores
   */
  static calculateAllFactors(responses) {
    const results = {};
    
    for (const factorName of Object.keys(this.BFI44_CONFIG.factors)) {
      results[factorName] = this.calculateFactorScore(responses, factorName);
    }
    
    return results;
  }

  /**
   * Validar respuestas del usuario
   * @param {Object} responses - Respuestas a validar
   * @throws {Error} Si las respuestas no son válidas
   */
  static validateResponses(responses) {
    // Verificar que existan 44 respuestas
    const responseKeys = Object.keys(responses);
    if (responseKeys.length !== 44) {
      throw new Error('INVALID_RESPONSE_COUNT');
    }

    // Verificar que todas las respuestas estén en el rango 1-5
    for (let i = 1; i <= 44; i++) {
      const value = responses[i.toString()];
      
      if (value === undefined || value === null) {
        throw new Error(`MISSING_QUESTION_${i}`);
      }
      
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error(`INVALID_VALUE_QUESTION_${i}`);
      }
    }
  }

  /**
   * Guardar respuestas y calcular resultados
   * @param {string} userId - ID del usuario
   * @param {Object} responses - Respuestas del cuestionario
   * @returns {Promise<Object>} Resultado guardado
   */
  static async submitResponses(userId, responses) {
    // Validar respuestas
    this.validateResponses(responses);

    // Convertir a Map para el modelo
    const responsesMap = new Map(
      Object.entries(responses).map(([key, value]) => [key, value])
    );

    // Calcular factores
    const results = this.calculateAllFactors(responsesMap);

    // Crear y guardar documento
    const bfi44Response = new BFI44Response({
      userId,
      responses: responsesMap,
      results
    });

    await bfi44Response.save();

    // Obtener nombre del usuario para la notificación
    const user = await User.findById(userId).select('name');
    const userName = user ? user.name : 'Usuario';

    // Enviar notificación de test completado (asíncrono, no bloquea)
    bfi44NotificationHelper.notifyTestCompleted(userId, userName).catch(err => {
      console.error('Error enviando notificación de test completado:', err);
    });

    return {
      userId,
      results,
      completedAt: bfi44Response.completedAt
    };
  }

  /**
   * Obtener perfil de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} Perfil del usuario o null
   */
  static async getUserProfile(userId) {
    const profile = await BFI44Response.getLatestProfile(userId);
    
    if (!profile) {
      return null;
    }

    return {
      userId: profile.userId,
      results: profile.results,
      completedAt: profile.completedAt
    };
  }

  /**
   * Recalcular resultados de un perfil existente
   * Útil si cambia la lógica de cálculo
   * @param {string} responseId - ID de la respuesta
   * @returns {Promise<Object>} Resultados recalculados
   */
  static async recalculateProfile(responseId) {
    const response = await BFI44Response.findById(responseId);
    
    if (!response) {
      throw new Error('BFI44_RESPONSE_NOT_FOUND');
    }

    // Recalcular factores
    const newResults = this.calculateAllFactors(response.responses);

    // Actualizar documento
    response.results = newResults;
    await response.save();

    return {
      userId: response.userId,
      results: newResults,
      recalculatedAt: new Date()
    };
  }

  /**
   * Verificar si un usuario tiene perfil BFI-44
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>}
   */
  static async hasProfile(userId) {
    return await BFI44Response.hasProfile(userId);
  }

  /**
   * Obtener empleados de una organización que no han completado el test
   * @param {string} organizationId - ID de la organización
   * @returns {Promise<Array>} Lista de empleados sin test
   */
  static async getEmployeesWithoutTest(organizationId) {
    // Obtener todos los empleados de la organización
    const employees = await User.find({
      organization: organizationId,
      role: 'employee'
    }).select('_id name email');

    // Obtener IDs de empleados con test completado
    const employeesWithTest = await BFI44Response.distinct('userId', {
      userId: { $in: employees.map(e => e._id) }
    });

    // Filtrar empleados sin test
    const employeesWithoutTest = employees.filter(
      emp => !employeesWithTest.some(id => id.toString() === emp._id.toString())
    );

    return employeesWithoutTest;
  }

  /**
   * Notificar a empleados sin test de una organización
   * @param {string} organizationId - ID de la organización
   * @returns {Promise<Object>} Resultado de la notificación
   */
  static async notifyEmployeesWithoutTest(organizationId) {
    const employeesWithoutTest = await this.getEmployeesWithoutTest(organizationId);

    if (employeesWithoutTest.length === 0) {
      return {
        notified: 0,
        message: 'Todos los empleados han completado el test'
      };
    }

    // Enviar notificaciones a cada empleado
    const employeeIds = employeesWithoutTest.map(e => e._id);
    const employeeNames = employeesWithoutTest.map(e => e.name);

    await bfi44NotificationHelper.notifyMultipleEmployeesPending(employeeIds, employeeNames);

    return {
      notified: employeesWithoutTest.length,
      employees: employeesWithoutTest.map(e => ({
        id: e._id,
        name: e.name,
        email: e.email
      }))
    };
  }

  /**
   * Obtener estadísticas de test por organización
   * @param {string} organizationId - ID de la organización
   * @returns {Promise<Object>} Estadísticas
   */
  static async getOrganizationStats(organizationId) {
    const employees = await User.countDocuments({
      organization: organizationId,
      role: 'employee'
    });

    const employeesWithTest = await BFI44Response.distinct('userId', {
      userId: {
        $in: await User.find({
          organization: organizationId,
          role: 'employee'
        }).distinct('_id')
      }
    });

    const completedCount = employeesWithTest.length;
    const pendingCount = employees - completedCount;
    const completionRate = employees > 0 ? (completedCount / employees) * 100 : 0;

    return {
      totalEmployees: employees,
      completed: completedCount,
      pending: pendingCount,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }

  /**
   * Verificar y notificar a un usuario específico sobre el test pendiente
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la verificación
   */
  static async checkAndNotifyUser(userId) {
    const user = await User.findById(userId).select('name email role');
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Solo notificar a empleados
    if (user.role !== 'employee') {
      return {
        notified: false,
        reason: 'Usuario no es empleado'
      };
    }

    // Verificar si ya completó el test
    const hasProfile = await this.hasProfile(userId);
    
    if (hasProfile) {
      return {
        notified: false,
        reason: 'Usuario ya completó el test'
      };
    }

    // Enviar notificación
    await bfi44NotificationHelper.notifyTestPending(userId, user.name);

    return {
      notified: true,
      userId,
      userName: user.name
    };
  }
}

module.exports = BFI44Service;
