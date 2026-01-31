/**
 * CV Questions Generator Service
 * Generates dynamic questions based on missing CV fields
 * Following SOLID principles: Single Responsibility Principle
 */

const { CRITICAL_FIELDS } = require('./cvCompletenessValidator.service');

/**
 * Question templates for each field
 * Supports multiple languages (EN/ES) and dynamic question types
 */
const QUESTION_TEMPLATES = {
  // Basic Information
  'contact.email': {
    en: {
      question: 'What is your email address?',
      type: 'email',
      placeholder: 'user@example.com',
      required: true,
      validation: 'email'
    },
    es: {
      question: '¿Cuál es tu dirección de correo electrónico?',
      type: 'email',
      placeholder: 'usuario@ejemplo.com',
      required: true,
      validation: 'email'
    }
  },

  'contact.phones': {
    en: {
      question: 'What is your phone number?',
      type: 'phone',
      placeholder: '+1 (555) 123-4567',
      required: true,
      validation: 'phone',
      helpText: 'Include country code'
    },
    es: {
      question: '¿Cuál es tu número de teléfono?',
      type: 'phone',
      placeholder: '+34 600 123 456',
      required: true,
      validation: 'phone',
      helpText: 'Incluye el código de país'
    }
  },

  // Education
  'education': {
    en: {
      question: 'What is your educational background?',
      type: 'array',
      subfields: ['institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate'],
      required: true,
      helpText: 'Add at least one educational entry'
    },
    es: {
      question: '¿Cuál es tu formación académica?',
      type: 'array',
      subfields: ['institution', 'degree', 'fieldOfStudy', 'startDate', 'endDate'],
      required: true,
      helpText: 'Agrega al menos una entrada educativa'
    }
  },

  // Experience
  'experience': {
    en: {
      question: 'What is your professional experience?',
      type: 'array',
      subfields: ['company', 'position', 'startDate', 'endDate', 'description', 'technologies'],
      required: true,
      helpText: 'Add at least one work experience entry'
    },
    es: {
      question: '¿Cuál es tu experiencia profesional?',
      type: 'array',
      subfields: ['company', 'position', 'startDate', 'endDate', 'description', 'technologies'],
      required: true,
      helpText: 'Agrega al menos una entrada de experiencia laboral'
    }
  },

  // Technical Skills
  'skills.technical': {
    en: {
      question: 'What are your technical skills?',
      type: 'array',
      subfields: ['name', 'level', 'yearsOfExperience'],
      required: true,
      helpText: 'Add your technical skills (e.g., React, Node.js, Python)'
    },
    es: {
      question: '¿Cuáles son tus habilidades técnicas?',
      type: 'array',
      subfields: ['name', 'level', 'yearsOfExperience'],
      required: true,
      helpText: 'Agrega tus habilidades técnicas (ej: React, Node.js, Python)'
    }
  },

  // Languages
  'languages': {
    en: {
      question: 'What languages do you speak?',
      type: 'array',
      subfields: ['language', 'level'],
      required: true,
      helpText: 'Add at least one language'
    },
    es: {
      question: '¿Qué idiomas hablas?',
      type: 'array',
      subfields: ['language', 'level'],
      required: true,
      helpText: 'Agrega al menos un idioma'
    }
  },

  // Availability
  'availability.immediate': {
    en: {
      question: 'Are you available to start immediately?',
      type: 'boolean',
      required: true,
      options: [
        { value: true, label: 'Yes, I can start immediately' },
        { value: false, label: 'No, I need some time' }
      ]
    },
    es: {
      question: '¿Estás disponible para comenzar inmediatamente?',
      type: 'boolean',
      required: true,
      options: [
        { value: true, label: 'Sí, puedo comenzar de inmediato' },
        { value: false, label: 'No, necesito algo de tiempo' }
      ]
    }
  },

  'availability.startDate': {
    en: {
      question: 'When can you start working?',
      type: 'date',
      required: true,
      validation: 'futureDate',
      helpText: 'Select the earliest date you can start'
    },
    es: {
      question: '¿Cuándo puedes comenzar a trabajar?',
      type: 'date',
      required: true,
      validation: 'futureDate',
      helpText: 'Selecciona la fecha más próxima en que puedes comenzar'
    }
  },

  'availability.willingToTravel': {
    en: {
      question: 'Are you willing to travel for work?',
      type: 'boolean',
      required: true,
      options: [
        { value: true, label: 'Yes, I am willing to travel' },
        { value: false, label: 'No, I prefer not to travel' }
      ]
    },
    es: {
      question: '¿Estás dispuesto/a a viajar por trabajo?',
      type: 'boolean',
      required: true,
      options: [
        { value: true, label: 'Sí, estoy dispuesto/a a viajar' },
        { value: false, label: 'No, prefiero no viajar' }
      ]
    }
  },

  'availability.travelFrequency': {
    en: {
      question: 'How often are you willing to travel?',
      type: 'select',
      required: true,
      options: [
        { value: 'none', label: 'Not willing to travel' },
        { value: 'occasionally', label: 'Occasionally (1-2 times per month)' },
        { value: 'frequently', label: 'Frequently (weekly)' },
        { value: 'always', label: 'Always available for travel' }
      ]
    },
    es: {
      question: '¿Con qué frecuencia estás dispuesto/a a viajar?',
      type: 'select',
      required: true,
      options: [
        { value: 'none', label: 'No dispuesto a viajar' },
        { value: 'occasionally', label: 'Ocasionalmente (1-2 veces al mes)' },
        { value: 'frequently', label: 'Frecuentemente (semanalmente)' },
        { value: 'always', label: 'Siempre disponible para viajar' }
      ]
    }
  },

  'availability.willingToRelocate': {
    en: {
      question: 'Are you willing to relocate for work?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Yes, I am willing to relocate' },
        { value: false, label: 'No, I prefer to stay in my current location' }
      ]
    },
    es: {
      question: '¿Estás dispuesto/a a mudarte por trabajo?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Sí, estoy dispuesto/a a mudarme' },
        { value: false, label: 'No, prefiero quedarme en mi ubicación actual' }
      ]
    }
  },

  'availability.willingToWorkOffHours': {
    en: {
      question: 'Are you willing to work outside regular hours?',
      type: 'boolean',
      required: true,
      options: [
        { value: true, label: 'Yes, I can work flexible hours' },
        { value: false, label: 'No, I prefer regular hours only' }
      ],
      helpText: 'This includes overtime, weekends, or on-call duties'
    },
    es: {
      question: '¿Estás dispuesto/a a trabajar fuera del horario regular?',
      type: 'boolean',
      required: true,
      options: [
        { value: true, label: 'Sí, puedo trabajar en horarios flexibles' },
        { value: false, label: 'No, prefiero solo horario regular' }
      ],
      helpText: 'Esto incluye horas extras, fines de semana o guardias'
    }
  },

  'availability.overtimeAvailability': {
    en: {
      question: 'How much overtime can you work?',
      type: 'select',
      required: true,
      options: [
        { value: 'none', label: 'No overtime availability' },
        { value: 'limited', label: 'Limited (occasional extra hours)' },
        { value: 'flexible', label: 'Flexible (regular overtime possible)' },
        { value: 'full', label: 'Full availability (whenever needed)' }
      ]
    },
    es: {
      question: '¿Cuántas horas extra puedes trabajar?',
      type: 'select',
      required: true,
      options: [
        { value: 'none', label: 'Sin disponibilidad para horas extra' },
        { value: 'limited', label: 'Limitado (horas extra ocasionales)' },
        { value: 'flexible', label: 'Flexible (horas extra regulares posibles)' },
        { value: 'full', label: 'Disponibilidad completa (cuando sea necesario)' }
      ]
    }
  },

  'availability.weekendAvailability': {
    en: {
      question: 'Can you work on weekends if needed?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Yes, I can work on weekends' },
        { value: false, label: 'No, weekends are not available' }
      ]
    },
    es: {
      question: '¿Puedes trabajar los fines de semana si es necesario?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Sí, puedo trabajar los fines de semana' },
        { value: false, label: 'No, los fines de semana no estoy disponible' }
      ]
    }
  },

  'availability.onCallAvailability': {
    en: {
      question: 'Are you available for on-call duties?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Yes, I can be on-call' },
        { value: false, label: 'No, I am not available for on-call' }
      ],
      helpText: 'On-call means being available to respond to urgent issues outside regular hours'
    },
    es: {
      question: '¿Estás disponible para guardias?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Sí, puedo estar de guardia' },
        { value: false, label: 'No, no estoy disponible para guardias' }
      ],
      helpText: 'Guardia significa estar disponible para responder a problemas urgentes fuera del horario regular'
    }
  },

  // Cross-Cultural Experience
  'crossCulturalExperience.hasExperience': {
    en: {
      question: 'Do you have cross-cultural or international work experience?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Yes, I have international experience' },
        { value: false, label: 'No international experience' }
      ]
    },
    es: {
      question: '¿Tienes experiencia de trabajo intercultural o internacional?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Sí, tengo experiencia internacional' },
        { value: false, label: 'No tengo experiencia internacional' }
      ]
    }
  },

  'crossCulturalExperience.countriesWorkedWith': {
    en: {
      question: 'Which countries have you worked with or in?',
      type: 'multiselect',
      required: false,
      placeholder: 'Select countries',
      helpText: 'Add countries where you have worked or collaborated with teams'
    },
    es: {
      question: '¿Con qué países has trabajado?',
      type: 'multiselect',
      required: false,
      placeholder: 'Selecciona países',
      helpText: 'Agrega países donde has trabajado o colaborado con equipos'
    }
  },

  // Remote Work Experience
  'remoteWorkExperience.yearsRemote': {
    en: {
      question: 'How many years of remote work experience do you have?',
      type: 'number',
      required: false,
      min: 0,
      max: 50,
      placeholder: '0',
      helpText: 'Enter 0 if no remote work experience'
    },
    es: {
      question: '¿Cuántos años de experiencia en trabajo remoto tienes?',
      type: 'number',
      required: false,
      min: 0,
      max: 50,
      placeholder: '0',
      helpText: 'Ingresa 0 si no tienes experiencia en trabajo remoto'
    }
  },

  'remoteWorkExperience.distributedTeamsExperience': {
    en: {
      question: 'Do you have experience working with distributed teams?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Yes, I have worked with distributed teams' },
        { value: false, label: 'No distributed team experience' }
      ]
    },
    es: {
      question: '¿Tienes experiencia trabajando con equipos distribuidos?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Sí, he trabajado con equipos distribuidos' },
        { value: false, label: 'No tengo experiencia con equipos distribuidos' }
      ]
    }
  },

  'remoteWorkExperience.timezoneFlexibility': {
    en: {
      question: 'Are you flexible with working across different timezones?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Yes, I can adapt to different timezones' },
        { value: false, label: 'No, I prefer my local timezone' }
      ]
    },
    es: {
      question: '¿Eres flexible para trabajar en diferentes zonas horarias?',
      type: 'boolean',
      required: false,
      options: [
        { value: true, label: 'Sí, puedo adaptarme a diferentes zonas horarias' },
        { value: false, label: 'No, prefiero mi zona horaria local' }
      ]
    }
  }
};

/**
 * Generates questions for missing fields
 * @param {Array} missingFields - Array of missing field paths
 * @param {string} language - Language code ('en' or 'es')
 * @returns {Array} Array of question objects
 */
function generateQuestionsForMissingFields(missingFields, language = 'en') {
  const questions = [];
  const lang = ['en', 'es'].includes(language) ? language : 'en';

  // Remove duplicates and process each missing field
  const uniqueFields = [...new Set(missingFields)];

  uniqueFields.forEach((fieldPath) => {
    // Handle array field references like education[0].institution
    const cleanPath = fieldPath.replace(/\[\d+\]/g, '');
    const baseField = cleanPath.split('.')[0];

    // Check if we have a template for this field
    let template = QUESTION_TEMPLATES[fieldPath] || QUESTION_TEMPLATES[cleanPath] || QUESTION_TEMPLATES[baseField];

    if (template && template[lang]) {
      questions.push({
        field: fieldPath,
        ...template[lang],
        priority: CRITICAL_FIELDS[baseField]?.priority || 'medium'
      });
    }
  });

  // Sort by priority: critical > high > medium > low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  questions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return questions;
}

/**
 * Generates conditional questions based on user's previous answers
 * @param {Array} missingFields - Array of missing field paths
 * @param {Object} currentAnswers - Current CV data
 * @param {string} language - Language code
 * @returns {Array} Array of conditional question objects
 */
function generateConditionalQuestions(missingFields, currentAnswers, language = 'en') {
  const questions = generateQuestionsForMissingFields(missingFields, language);
  const conditionalQuestions = [];

  questions.forEach((question) => {
    // Check if this question has dependencies
    const shouldAsk = shouldAskQuestion(question.field, currentAnswers);

    if (shouldAsk) {
      conditionalQuestions.push(question);
    }
  });

  return conditionalQuestions;
}

/**
 * Determines if a question should be asked based on dependencies
 * @param {string} fieldPath - Field path
 * @param {Object} currentAnswers - Current CV data
 * @returns {boolean} True if question should be asked
 */
function shouldAskQuestion(fieldPath, currentAnswers) {
  // Conditional logic for dependent fields

  // If not immediate, ask for start date
  if (fieldPath === 'availability.startDate') {
    return currentAnswers?.availability?.immediate === false;
  }

  // If willing to travel, ask for frequency
  if (fieldPath === 'availability.travelFrequency') {
    return currentAnswers?.availability?.willingToTravel === true;
  }

  // If willing to work off-hours, ask for overtime details
  if (fieldPath === 'availability.overtimeAvailability') {
    return currentAnswers?.availability?.willingToWorkOffHours === true;
  }

  // If has cross-cultural experience, ask for countries
  if (fieldPath === 'crossCulturalExperience.countriesWorkedWith') {
    return currentAnswers?.crossCulturalExperience?.hasExperience === true;
  }

  // Default: ask the question
  return true;
}

/**
 * Get questions grouped by category
 * @param {Array} missingFields - Array of missing field paths
 * @param {string} language - Language code
 * @returns {Object} Questions grouped by category
 */
function getQuestionsByCategory(missingFields, language = 'en') {
  const questions = generateQuestionsForMissingFields(missingFields, language);
  const grouped = {};

  questions.forEach((question) => {
    const baseField = question.field.split('.')[0].split('[')[0];
    const category = CRITICAL_FIELDS[baseField]?.category || 'other';

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(question);
  });

  return grouped;
}

module.exports = {
  generateQuestionsForMissingFields,
  generateConditionalQuestions,
  getQuestionsByCategory,
  shouldAskQuestion,
  QUESTION_TEMPLATES
};
