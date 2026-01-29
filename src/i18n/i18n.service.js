/**
 * Internationalization Service
 * Handles translation of risk-related content
 * Supports Spanish (es) and English (en)
 */

const es = require('./es');
const en = require('./en');

const translations = {
  es,
  en
};

const SUPPORTED_LANGUAGES = ['es', 'en'];
const DEFAULT_LANGUAGE = 'es';

/**
 * Get translation for a specific key path
 * @param {string} lang - Language code (es, en)
 * @param {string} keyPath - Dot notation path (e.g., 'risks.communication_breakdown.title')
 * @param {object} params - Parameters to replace in translation (e.g., {count: 5})
 * @returns {string|object} - Translated value
 */
function translate(lang, keyPath, params = {}) {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const keys = keyPath.split('.');
  
  let value = translations[language];
  
  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      console.warn(`[i18n] Translation key not found: ${keyPath} for language: ${language}`);
      return keyPath;
    }
  }
  
  // Replace parameters in the string
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return replaceParams(value, params);
  }
  
  return value;
}

/**
 * Replace parameters in a string
 * @param {string} text - Text with placeholders like {count}
 * @param {object} params - Parameters to replace
 * @returns {string} - Text with replaced parameters
 */
function replaceParams(text, params) {
  let result = text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Normalize risk type to snake_case format
 * Converts "Scope Creep" -> "scope_creep", "ScopeCreep" -> "scope_creep"
 * @param {string} riskType - Risk type in any format
 * @returns {string} - Normalized risk type in snake_case
 */
function normalizeRiskType(riskType) {
  if (!riskType || typeof riskType !== 'string') {
    return riskType;
  }
  
  return riskType
    // Insert underscore before uppercase letters (for PascalCase/camelCase)
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    // Replace spaces and hyphens with underscores
    .replace(/[\s-]+/g, '_')
    // Convert to lowercase
    .toLowerCase()
    // Remove duplicate underscores
    .replace(/_+/g, '_')
    // Trim underscores from start/end
    .replace(/^_|_$/g, '');
}

/**
 * Translate risk object (title, description, etc.)
 * @param {string} riskType - Risk type identifier
 * @param {string} lang - Language code
 * @returns {object} - Translated risk metadata
 */
function translateRisk(riskType, lang = DEFAULT_LANGUAGE) {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const normalizedType = normalizeRiskType(riskType);
  
  // Try normalized type first, then original
  const riskData = translations[language].risks[normalizedType] || 
                   translations[language].risks[riskType];
  
  if (!riskData) {
    console.warn(`[i18n] Risk type not found: ${riskType} (normalized: ${normalizedType})`);
    return {
      title: riskType,
      description: '',
      indicators: {},
      recommendations: {}
    };
  }
  
  return riskData;
}

/**
 * Translate array of indicators
 * @param {string} riskType - Risk type identifier
 * @param {string} lang - Language code
 * @returns {Array} - Array of translated indicators
 */
function translateIndicators(riskType, lang = DEFAULT_LANGUAGE) {
  const riskData = translateRisk(riskType, lang);
  return Object.values(riskData.indicators || {});
}

/**
 * Translate array of recommendations
 * @param {string} riskType - Risk type identifier
 * @param {string} lang - Language code
 * @returns {Array} - Array of translated recommendations
 */
function translateRecommendations(riskType, lang = DEFAULT_LANGUAGE) {
  const riskData = translateRisk(riskType, lang);
  return Object.values(riskData.recommendations || {});
}

/**
 * Translate severity level
 * @param {string} severity - Severity level (low, medium, high, etc.)
 * @param {string} lang - Language code
 * @returns {string} - Translated severity
 */
function translateSeverity(severity, lang = DEFAULT_LANGUAGE) {
  // Normalize to lowercase for consistent lookup
  const normalizedSeverity = severity ? severity.toLowerCase() : severity;
  return translate(lang, `common.severity.${normalizedSeverity}`);
}

/**
 * Translate category
 * @param {string} category - Category (coordination, technical, team, etc.)
 * @param {string} lang - Language code
 * @returns {string} - Translated category
 */
function translateCategory(category, lang = DEFAULT_LANGUAGE) {
  // Normalize to lowercase for consistent lookup
  const normalizedCategory = category ? category.toLowerCase() : category;
  return translate(lang, `common.category.${normalizedCategory}`);
}

/**
 * Translate source
 * @param {string} source - Source (expert_rules, cbr, etc.)
 * @param {string} lang - Language code
 * @returns {string} - Translated source
 */
function translateSource(source, lang = DEFAULT_LANGUAGE) {
  // Normalize to lowercase for consistent lookup
  const normalizedSource = source ? source.toLowerCase() : source;
  return translate(lang, `common.source.${normalizedSource}`);
}

/**
 * Translate status
 * @param {string} status - Status (predicted, occurred, avoided, etc.)
 * @param {string} lang - Language code
 * @returns {string} - Translated status
 */
function translateStatus(status, lang = DEFAULT_LANGUAGE) {
  // Normalize to lowercase for consistent lookup
  const normalizedStatus = status ? status.toLowerCase() : status;
  return translate(lang, `common.status.${normalizedStatus}`);
}

/**
 * Translate phase description
 * @param {number} phase - Phase number (1-4)
 * @param {number} caseCount - Number of cases
 * @param {string} lang - Language code
 * @returns {string} - Translated phase description
 */
function translatePhaseDescription(phase, caseCount, lang = DEFAULT_LANGUAGE) {
  const template = translate(lang, `common.phaseDescriptions.${phase}`);
  return replaceParams(template, { count: caseCount });
}

/**
 * Translate full risk object for API response
 * @param {object} risk - Risk object from database
 * @param {string} lang - Language code
 * @returns {object} - Risk with translated fields
 */
function translateRiskObject(risk, lang = DEFAULT_LANGUAGE) {
  if (!risk || !risk.type) return risk;
  
  // Convert Mongoose document to plain object if needed
  const plainRisk = risk.toObject ? risk.toObject() : risk;
  
  // If risk was edited by user OR is a manual risk, preserve user's custom content
  // This ensures project manager's customizations are never overwritten
  const preserveUserContent = plainRisk.userEdited || plainRisk.source === 'manual';
  
  // Always translate metadata fields (severity, source, status, category)
  const translatedMetadata = {
    severityLabel: plainRisk.severity ? translateSeverity(plainRisk.severity, lang) : null,
    sourceLabel: plainRisk.source ? translateSource(plainRisk.source, lang) : null,
    statusLabel: plainRisk.status ? translateStatus(plainRisk.status, lang) : null,
    categoryLabel: plainRisk.category ? translateCategory(plainRisk.category, lang) : null
  };
  
  if (preserveUserContent) {
    // Keep all user's custom content, only add translated labels
    return {
      ...plainRisk,
      ...translatedMetadata
    };
  }
  
  // For system-generated risks that haven't been edited, translate from catalog
  const translated = translateRisk(plainRisk.type, lang);
  
  return {
    ...plainRisk,
    title: translated.title || plainRisk.title,
    description: translated.description || plainRisk.description,
    indicators: translateIndicators(plainRisk.type, lang),
    recommendations: translateRecommendations(plainRisk.type, lang),
    ...translatedMetadata
  };
}

/**
 * Get user's preferred language from request
 * Checks: 1) Query param, 2) User object, 3) Organization default, 4) Accept-Language header
 * @param {object} req - Express request object
 * @returns {string} - Language code
 */
function getLanguageFromRequest(req) {
  const normalizeLanguage = (lang) => {
    if (!lang || typeof lang !== 'string') {
      return null;
    }
    return lang.toLowerCase().split('-')[0];
  };

  // 1. Check query parameter
  if (req.query && req.query.lang) {
    const normalizedQueryLang = normalizeLanguage(req.query.lang);
    if (SUPPORTED_LANGUAGES.includes(normalizedQueryLang)) {
      return normalizedQueryLang;
    }
  }
  
  // 2. Check user preference
  if (req.user && req.user.preferredLanguage) {
    const normalizedUserLang = normalizeLanguage(req.user.preferredLanguage);
    if (SUPPORTED_LANGUAGES.includes(normalizedUserLang)) {
      return normalizedUserLang;
    }
  }
  
  // 3. Check organization default
  if (req.user && req.user.organization && req.user.organization.defaultLanguage) {
    const normalizedOrgLang = normalizeLanguage(req.user.organization.defaultLanguage);
    if (SUPPORTED_LANGUAGES.includes(normalizedOrgLang)) {
      return normalizedOrgLang;
    }
  }
  
  // 4. Check Accept-Language header
  if (req.headers && req.headers['accept-language']) {
    const acceptLang = req.headers['accept-language'].split(',')[0].split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(acceptLang)) {
      return acceptLang;
    }
  }
  
  // 5. Return default
  return DEFAULT_LANGUAGE;
}

/**
 * Validate language code
 * @param {string} lang - Language code
 * @returns {boolean} - True if valid
 */
function isValidLanguage(lang) {
  return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * Translate notification object based on its type
 * @param {object} notification - Notification object from database
 * @param {string} lang - Language code
 * @returns {object} - Notification with translated title and message
 */
function translateNotification(notification, lang = DEFAULT_LANGUAGE) {
  if (!notification) return notification;
  
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  
  // Convert Mongoose document to plain object if needed
  const plainNotification = notification.toObject ? notification.toObject() : { ...notification };
  
  // Get translated content for this notification type
  const notificationType = plainNotification.type;
  const translatedContent = translations[language]?.notifications?.content?.[notificationType];
  
  if (translatedContent) {
    // Extract metadata for parameter replacement
    const metadata = plainNotification.metadata || {};
    
    // Replace parameters in title
    let translatedTitle = translatedContent.title;
    let translatedMessage = translatedContent.message;
    
    // Replace common parameters
    const params = {
      projectName: metadata.projectName || '',
      organizationName: metadata.organizationName || '',
      userName: metadata.userName || '',
      blockerMessages: metadata.blockerMessages || '',
      ...metadata
    };
    
    translatedTitle = replaceParams(translatedTitle, params);
    translatedMessage = replaceParams(translatedMessage, params);
    
    // Translate priority
    const translatedPriority = translations[language]?.notifications?.priority?.[plainNotification.priority] || plainNotification.priority;
    
    return {
      ...plainNotification,
      title: translatedTitle,
      message: translatedMessage,
      priority: translatedPriority
    };
  }
  
  // Translate priority even if no content translation found
  const translatedPriority = translations[language]?.notifications?.priority?.[plainNotification.priority] || plainNotification.priority;
  
  return {
    ...plainNotification,
    priority: translatedPriority
  };
}

/**
 * Translate array of notifications
 * @param {Array} notifications - Array of notification objects
 * @param {string} lang - Language code
 * @returns {Array} - Array of translated notifications
 */
function translateNotifications(notifications, lang = DEFAULT_LANGUAGE) {
  if (!Array.isArray(notifications)) return notifications;
  return notifications.map(n => translateNotification(n, lang));
}

module.exports = {
  translate,
  translateRisk,
  translateIndicators,
  translateRecommendations,
  translateSeverity,
  translateCategory,
  translateSource,
  translateStatus,
  translatePhaseDescription,
  translateRiskObject,
  translateNotification,
  translateNotifications,
  getLanguageFromRequest,
  isValidLanguage,
  normalizeRiskType,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE
};
