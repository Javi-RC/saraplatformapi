const bfi44NotificationHelper = require('./bfi44NotificationHelper');
const { toStableBfi44Profile } = require('../utils/bfi44ProfileMapper');

// Import repositories instead of models
const { bfi44Repository, userRepository } = require('../repositories');

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
      en: {
        1: "Disagree strongly",
        2: "Disagree a little",
        3: "Neither agree nor disagree",
        4: "Agree a little",
        5: "Agree strongly"
      },
      es: {
        1: "Totalmente en desacuerdo",
        2: "En desacuerdo",
        3: "Ni de acuerdo ni en desacuerdo",
        4: "De acuerdo",
        5: "Totalmente de acuerdo"
      }
    },

    // Prefijo para las preguntas
    prefix: {
      en: "I see myself as someone who",
      es: "Me veo a mí mismo/a como alguien que"
    },

    // Los 44 ítems del BFI-44
    questions: [
      { id: 1, text: { en: "Is talkative", es: "Es conversador/a" } },
      { id: 2, text: { en: "Tends to find fault with others", es: "Tiende a buscar defectos en los demás" } },
      { id: 3, text: { en: "Does a thorough job", es: "Hace un trabajo concienzudo" } },
      { id: 4, text: { en: "Is depressed, blue", es: "Es depresivo/a, triste" } },
      { id: 5, text: { en: "Is original, comes up with new ideas", es: "Es original, se le ocurren ideas nuevas" } },
      { id: 6, text: { en: "Is reserved", es: "Es reservado/a" } },
      { id: 7, text: { en: "Is helpful and unselfish with others", es: "Es servicial y desinteresado/a con los demás" } },
      { id: 8, text: { en: "Can be somewhat careless", es: "Puede ser algo descuidado/a" } },
      { id: 9, text: { en: "Is relaxed, handles stress well", es: "Es relajado/a, maneja bien el estrés" } },
      { id: 10, text: { en: "Is curious about many different things", es: "Es curioso/a sobre muchas cosas diferentes" } },
      { id: 11, text: { en: "Is full of energy", es: "Está lleno/a de energía" } },
      { id: 12, text: { en: "Starts quarrels with others", es: "Inicia peleas con otros" } },
      { id: 13, text: { en: "Is a reliable worker", es: "Es un/a trabajador/a confiable" } },
      { id: 14, text: { en: "Can be tense", es: "Puede estar tenso/a" } },
      { id: 15, text: { en: "Is ingenious, a deep thinker", es: "Es ingenioso/a, piensa profundamente" } },
      { id: 16, text: { en: "Generates a lot of enthusiasm", es: "Genera mucho entusiasmo" } },
      { id: 17, text: { en: "Has a forgiving nature", es: "Tiene una naturaleza indulgente" } },
      { id: 18, text: { en: "Tends to be disorganized", es: "Tiende a ser desorganizado/a" } },
      { id: 19, text: { en: "Worries a lot", es: "Se preocupa mucho" } },
      { id: 20, text: { en: "Has an active imagination", es: "Tiene una imaginación activa" } },
      { id: 21, text: { en: "Tends to be quiet", es: "Tiende a ser callado/a" } },
      { id: 22, text: { en: "Is generally trusting", es: "Es generalmente confiado/a" } },
      { id: 23, text: { en: "Tends to be lazy", es: "Tiende a ser perezoso/a" } },
      { id: 24, text: { en: "Is emotionally stable, not easily upset", es: "Es emocionalmente estable, no se altera fácilmente" } },
      { id: 25, text: { en: "Is inventive", es: "Es inventivo/a" } },
      { id: 26, text: { en: "Has an assertive personality", es: "Tiene una personalidad asertiva" } },
      { id: 27, text: { en: "Can be cold and aloof", es: "Puede ser frío/a y distante" } },
      { id: 28, text: { en: "Perseveres until the task is finished", es: "Persevera hasta terminar la tarea" } },
      { id: 29, text: { en: "Can be moody", es: "Puede ser temperamental" } },
      { id: 30, text: { en: "Values artistic, aesthetic experiences", es: "Valora las experiencias artísticas y estéticas" } },
      { id: 31, text: { en: "Is sometimes shy, inhibited", es: "Es a veces tímido/a, cohibido/a" } },
      { id: 32, text: { en: "Is considerate and kind to almost everyone", es: "Es considerado/a y amable con casi todos" } },
      { id: 33, text: { en: "Does things efficiently", es: "Hace las cosas eficientemente" } },
      { id: 34, text: { en: "Remains calm in tense situations", es: "Se mantiene calmado/a en situaciones tensas" } },
      { id: 35, text: { en: "Prefers work that is routine", es: "Prefiere el trabajo rutinario" } },
      { id: 36, text: { en: "Is outgoing, sociable", es: "Es extrovertido/a, sociable" } },
      { id: 37, text: { en: "Is sometimes rude to others", es: "Es a veces grosero/a con los demás" } },
      { id: 38, text: { en: "Makes plans and follows through with them", es: "Hace planes y los lleva a cabo" } },
      { id: 39, text: { en: "Gets nervous easily", es: "Se pone nervioso/a fácilmente" } },
      { id: 40, text: { en: "Likes to reflect, play with ideas", es: "Le gusta reflexionar, jugar con ideas" } },
      { id: 41, text: { en: "Has few artistic interests", es: "Tiene pocos intereses artísticos" } },
      { id: 42, text: { en: "Likes to cooperate with others", es: "Le gusta cooperar con otros" } },
      { id: 43, text: { en: "Is easily distracted", es: "Se distrae fácilmente" } },
      { id: 44, text: { en: "Is sophisticated in art, music, or literature", es: "Es sofisticado/a en arte, música o literatura" } }
    ]
  };

  /**
   * Obtener el cuestionario completo
   * @param {string} language - Language code ('en' or 'es')
   * @returns {Object} Estructura del cuestionario BFI-44
   */
  static getQuestionnaire(language = 'en') {
    const lang = ['en', 'es'].includes(language) ? language : 'en';
    
    return {
      inventory: "BFI-44",
      totalQuestions: 44,
      prefix: this.BFI44_CONFIG.prefix[lang],
      scale: this.BFI44_CONFIG.scale[lang],
      questions: this.BFI44_CONFIG.questions.map(q => ({
        id: q.id,
        text: q.text[lang]
      }))
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
    // Verify personality data consent before processing
    const user = await userRepository.findById(userId, { select: 'name personalityDataConsent' });
    
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (!user.hasPersonalityDataConsent()) {
      throw new Error('PERSONALITY_CONSENT_REQUIRED');
    }

    // Validar respuestas
    this.validateResponses(responses);

    // Convertir a Map para el modelo
    const responsesMap = new Map(
      Object.entries(responses).map(([key, value]) => [key, value])
    );

    // Calcular factores
    const results = this.calculateAllFactors(responsesMap);

    // Crear y guardar documento usando el repositorio
    const bfi44Response = await bfi44Repository.create({
      userId: userId,
      responses: responsesMap,
      results
    });

    const userName = user.name || 'Usuario';

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
    const profile = await bfi44Repository.findOne(
      { userId },
      { sort: { completedAt: -1 } }
    );
    
    if (!profile) {
      return null;
    }

    const stable = toStableBfi44Profile(profile.results);

    return {
      userId: profile.userId,
      traits: stable ? stable.traits : null,
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
    const response = await bfi44Repository.findById(responseId);
    
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
    return await bfi44Repository.userHasCompleted(userId);
  }

  /**
   * Obtener empleados de una organización que no han completado el test
   * @param {string} organizationId - ID de la organización
   * @returns {Promise<Array>} Lista de empleados sin test
   */
  static async getEmployeesWithoutTest(organizationId) {
    // Obtener todos los empleados de la organización
    const employees = await userRepository.find(
      {
        organization: organizationId,
        role: 'employee'
      },
      { select: '_id name email' }
    );

    // Obtener IDs de empleados con test completado
    const employeesWithTest = await bfi44Repository.distinct('userId', {
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
    const employees = await userRepository.count({
      organization: organizationId,
      role: 'employee'
    });

    const employeeIds = await userRepository.find(
      {
        organization: organizationId,
        role: 'employee'
      },
      { select: '_id' }
    );

    const employeesWithTest = await bfi44Repository.distinct('userId', {
      userId: { $in: employeeIds.map(e => e._id) }
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
    const user = await userRepository.findById(userId, { select: 'name email role' });
    
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
