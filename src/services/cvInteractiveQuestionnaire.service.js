/**
 * Interactive Curriculum Questionnaire Service
 * Manages the interactive flow of questions based on user responses
 * Following SOLID principles: Single Responsibility Principle
 */

const { validateCVCompleteness } = require('./cvCompletenessValidator.service');
const { generateConditionalQuestions, shouldAskQuestion } = require('./cvQuestionsGenerator.service');

/**
 * Question flow configuration
 * Defines the order and grouping of questions
 */
const QUESTION_FLOW = {
  'phase-1-basic': {
    title: { en: 'Basic Information', es: 'Información Básica' },
    description: {
      en: 'Provide your contact information',
      es: 'Proporciona tu información de contacto'
    },
    fields: ['contact.email', 'contact.phones']
  },
  'phase-2-background': {
    title: { en: 'Educational & Work Background', es: 'Formación y Experiencia Laboral' },
    description: {
      en: 'Tell us about your education and work experience',
      es: 'Cuéntanos sobre tu formación y experiencia laboral'
    },
    fields: ['education', 'experience']
  },
  'phase-3-skills': {
    title: { en: 'Technical Skills & Languages', es: 'Habilidades Técnicas e Idiomas' },
    description: {
      en: 'Share your technical skills and languages',
      es: 'Comparte tus habilidades técnicas e idiomas'
    },
    fields: ['skills.technical', 'languages']
  },
  'phase-4-availability': {
    title: { en: 'Availability & Flexibility', es: 'Disponibilidad y Flexibilidad' },
    description: {
      en: 'Tell us about your availability and work flexibility',
      es: 'Cuéntanos sobre tu disponibilidad y flexibilidad laboral'
    },
    fields: [
      'availability.immediate',
      'availability.startDate',
      'availability.willingToTravel',
      'availability.travelFrequency',
      'availability.willingToRelocate',
      'availability.willingToWorkOffHours',
      'availability.overtimeAvailability',
      'availability.weekendAvailability',
      'availability.onCallAvailability'
    ]
  },
  'phase-5-experience': {
    title: { en: 'Experience & Skills', es: 'Experiencia Adicional' },
    description: {
      en: 'Tell us about your cross-cultural and remote work experience',
      es: 'Cuéntanos sobre tu experiencia intercultural y trabajo remoto'
    },
    fields: [
      'crossCulturalExperience.hasExperience',
      'crossCulturalExperience.countriesWorkedWith',
      'remoteWorkExperience.yearsRemote',
      'remoteWorkExperience.distributedTeamsExperience',
      'remoteWorkExperience.timezoneFlexibility'
    ]
  }
};

/**
 * Creates a new questionnaire session
 * @param {string} userId - User ID
 * @param {string} language - Language code ('en' or 'es')
 * @returns {Object} Questionnaire session object
 */
function createQuestionnaireSession(userId, language = 'en') {
  return {
    sessionId: generateSessionId(),
    userId,
    language: ['en', 'es'].includes(language) ? language : 'en',
    startedAt: new Date(),
    currentPhase: 'phase-1-basic',
    answeredQuestions: {},
    currentAnswers: {},
    progress: {
      totalPhases: Object.keys(QUESTION_FLOW).length,
      completedPhases: 0,
      currentPhaseIndex: 0
    }
  };
}

/**
 * Generates a unique session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `qs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the first set of questions for a questionnaire session
 * @param {Object} cv - Curriculum object
 * @param {string} language - Language code
 * @param {Object} session - Questionnaire session
 * @returns {Object} Questions and session data
 */
function getInitialQuestions(cv, language = 'en', session = null) {
  const sess = session || createQuestionnaireSession('', language);
  const completeness = validateCVCompleteness(cv);

  // Get missing fields
  const missingFields = completeness.missingFields;

  // Find the first phase that has questions
  const phaseKeys = Object.keys(QUESTION_FLOW);
  let selectedPhase = null;
  let selectedPhaseIndex = 0;
  let questions = [];

  for (let i = 0; i < phaseKeys.length; i++) {
    const phaseId = phaseKeys[i];
    const phaseFields = QUESTION_FLOW[phaseId].fields;
    
    const phaseMissingFields = missingFields.filter(field =>
      phaseFields.some(phaseField => field.startsWith(phaseField))
    );

    if (phaseMissingFields.length > 0) {
      questions = generateConditionalQuestions(phaseMissingFields, cv.toObject(), language);
      
      if (questions.length > 0) {
        selectedPhase = phaseId;
        selectedPhaseIndex = i;
        break;
      }
    }
  }

  // If no phase has questions, curriculum is complete
  if (!selectedPhase) {
    return {
      session: sess,
      phase: null,
      questions: [],
      totalQuestions: 0,
      noQuestionsNeeded: true,
      completenessScore: completeness.completenessScore,
      missingByPriority: completeness.missingByPriority,
      isComplete: true
    };
  }

  return {
    session: sess,
    phase: {
      id: selectedPhase,
      title: QUESTION_FLOW[selectedPhase].title[language],
      description: QUESTION_FLOW[selectedPhase].description[language],
      index: selectedPhaseIndex + 1,
      total: Object.keys(QUESTION_FLOW).length
    },
    questions,
    totalQuestions: questions.length,
    noQuestionsNeeded: false,
    completenessScore: completeness.completenessScore,
    missingByPriority: completeness.missingByPriority
  };
}

/**
 * Process user responses and get the next set of questions
 * @param {Object} cv - Curriculum object
 * @param {Object} responses - User's answers to current questions
 * @param {string} currentPhase - Current phase ID
 * @param {string} language - Language code
 * @returns {Object} Next questions and session progress
 */
function processResponsesAndGetNext(cv, responses, currentPhase, language = 'en') {
  const lang = ['en', 'es'].includes(language) ? language : 'en';

  // Merge responses with curriculum
  const updatedCV = { ...cv };
  Object.entries(responses).forEach(([key, value]) => {
    const keys = key.split('.');
    let target = updatedCV;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;
  });

  const completeness = validateCVCompleteness(updatedCV);
  const missingFields = completeness.missingFields;

  // Determine next phase
  const phaseKeys = Object.keys(QUESTION_FLOW);
  const currentIndex = phaseKeys.indexOf(currentPhase);

  // Find the next phase that has questions, starting from current + 1
  let selectedPhase = null;
  let selectedPhaseIndex = -1;
  let nextQuestions = [];

  for (let i = currentIndex + 1; i < phaseKeys.length; i++) {
    const phaseId = phaseKeys[i];
    const phaseFields = QUESTION_FLOW[phaseId].fields;
    
    const phaseMissingFields = missingFields.filter(field =>
      phaseFields.some(phaseField => field.startsWith(phaseField))
    );

    if (phaseMissingFields.length > 0) {
      nextQuestions = generateConditionalQuestions(phaseMissingFields, updatedCV, lang);
      
      if (nextQuestions.length > 0) {
        selectedPhase = phaseId;
        selectedPhaseIndex = i;
        break;
      }
    }
  }

  // If no more phases with questions, questionnaire is complete
  if (!selectedPhase) {
    return {
      isComplete: true,
      completenessScore: completeness.completenessScore,
      message: lang === 'es' 
        ? '¡Cuestionario completado! Gracias por proporcionar toda la información.'
        : 'Questionnaire completed! Thank you for providing all the information.',
      remainingMissing: missingFields,
      phase: null,
      questions: []
    };
  }

  return {
    isComplete: false,
    completenessScore: completeness.completenessScore,
    phase: {
      id: selectedPhase,
      title: QUESTION_FLOW[selectedPhase].title[lang],
      description: QUESTION_FLOW[selectedPhase].description[lang],
      index: selectedPhaseIndex + 1,
      total: phaseKeys.length
    },
    questions: nextQuestions,
    totalQuestions: nextQuestions.length,
    noQuestionsNeeded: false,
    remainingMissing: missingFields.filter(field =>
      QUESTION_FLOW[selectedPhase].fields.some(phaseField => field.startsWith(phaseField))
    ),
    missingByPriority: completeness.missingByPriority
  };
}

/**
 * Finalize the questionnaire and return final curriculum state
 * @param {Object} cv - Curriculum object
 * @param {Object} finalResponses - Final set of responses
 * @returns {Object} Final curriculum state and completion status
 */
function finalizeQuestionnaire(cv, finalResponses) {
  // Merge final responses
  const finalCV = { ...cv };
  Object.entries(finalResponses).forEach(([key, value]) => {
    const keys = key.split('.');
    let target = finalCV;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }

    target[keys[keys.length - 1]] = value;
  });

  const completeness = validateCVCompleteness(finalCV);

  return {
    cvUpdated: finalCV,
    isComplete: completeness.isComplete,
    completenessScore: completeness.completenessScore,
    missingFields: completeness.missingFields,
    missingByPriority: completeness.missingByPriority,
    summary: {
      en: completeness.isComplete
        ? 'Your curriculum is now complete and ready for use!'
        : `Your curriculum is ${completeness.completenessScore}% complete. ${completeness.missingFields.length} fields still need attention.`,
      es: completeness.isComplete
        ? '¡Tu currículo ahora está completo y listo para usar!'
        : `Tu currículo está ${completeness.completenessScore}% completo. ${completeness.missingFields.length} campos aún necesitan atención.`
    }
  };
}

/**
 * Get all phases configuration
 * @returns {Object} All phases with metadata
 */
function getAllPhases() {
  return QUESTION_FLOW;
}

/**
 * Get phase by ID
 * @param {string} phaseId - Phase ID
 * @param {string} language - Language code
 * @returns {Object} Phase configuration
 */
function getPhaseById(phaseId, language = 'en') {
  const lang = ['en', 'es'].includes(language) ? language : 'en';
  const phase = QUESTION_FLOW[phaseId];

  if (!phase) return null;

  return {
    id: phaseId,
    title: phase.title[lang],
    description: phase.description[lang],
    fields: phase.fields
  };
}

/**
 * Calculate progress percentage based on missing fields
 * @param {number} completenessScore - Completeness score (0-100)
 * @returns {number} Progress percentage
 */
function calculateProgress(completenessScore) {
  return Math.min(completenessScore, 100);
}

/**
 * Validate a response against a question
 * @param {Object} question - Question object
 * @param {*} response - User's response
 * @returns {Object} Validation result
 */
function validateResponse(question, response) {
  const errors = [];

  // Check if required and empty
  if (question.required && (response === null || response === undefined || response === '')) {
    errors.push({
      en: 'This field is required',
      es: 'Este campo es obligatorio'
    });
  }

  // Validate based on type
  if (response !== null && response !== undefined && response !== '') {
    switch (question.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(response)) {
          errors.push({
            en: 'Please provide a valid email address',
            es: 'Por favor proporciona un correo electrónico válido'
          });
        }
        break;

      case 'phone':
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
        if (!phoneRegex.test(response)) {
          errors.push({
            en: 'Please provide a valid phone number',
            es: 'Por favor proporciona un número telefónico válido'
          });
        }
        break;

      case 'date':
        const dateObj = new Date(response);
        if (isNaN(dateObj.getTime())) {
          errors.push({
            en: 'Please provide a valid date',
            es: 'Por favor proporciona una fecha válida'
          });
        } else if (question.validation === 'futureDate' && dateObj < new Date()) {
          errors.push({
            en: 'Please provide a future date',
            es: 'Por favor proporciona una fecha futura'
          });
        }
        break;

      case 'number':
        if (isNaN(response) || (question.min !== undefined && response < question.min) || (question.max !== undefined && response > question.max)) {
          errors.push({
            en: `Please provide a valid number${question.min ? ` between ${question.min}` : ''}${question.max ? ` and ${question.max}` : ''}`,
            es: `Por favor proporciona un número válido${question.min ? ` entre ${question.min}` : ''}${question.max ? ` y ${question.max}` : ''}`
          });
        }
        break;

      case 'select':
      case 'boolean':
        if (question.options) {
          const validValues = question.options.map(opt => opt.value);
          if (!validValues.includes(response)) {
            errors.push({
              en: 'Please select a valid option',
              es: 'Por favor selecciona una opción válida'
            });
          }
        }
        break;

      case 'array':
        if (!Array.isArray(response) || response.length === 0) {
          errors.push({
            en: 'Please add at least one item',
            es: 'Por favor agrega al menos un elemento'
          });
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  createQuestionnaireSession,
  generateSessionId,
  getInitialQuestions,
  processResponsesAndGetNext,
  finalizeQuestionnaire,
  getAllPhases,
  getPhaseById,
  calculateProgress,
  validateResponse,
  QUESTION_FLOW
};
