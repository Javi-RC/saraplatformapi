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
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
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

  // 1. Check query parameter (?lang is canonical, ?language accepted as a synonym)
  const queryLang = req.query && (req.query.lang || req.query.language);
  if (queryLang) {
    const normalizedQueryLang = normalizeLanguage(queryLang);
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

/**
 * Get translated synergy content for a specific key path
 * @param {string} keyPath - Dot notation path within synergy section (e.g., 'roles.innovator.name')
 * @param {string} lang - Language code
 * @param {object} params - Parameters to replace in translation
 * @returns {string|object} - Translated value
 */
function translateSynergy(keyPath, lang = DEFAULT_LANGUAGE, params = {}) {
  return translate(lang, `synergy.${keyPath}`, params);
}

/**
 * Translate a complete synergy analysis object
 * Translates all user-facing messages: roles, project profiles, metrics, recommendations, etc.
 * @param {object} synergyData - Raw synergy analysis object from TeamSynergyService
 * @param {string} lang - Language code
 * @returns {object} - Synergy object with translated fields
 */
function translateSynergyObject(synergyData, lang = DEFAULT_LANGUAGE) {
  if (!synergyData) return synergyData;

  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const synergy = { ...synergyData };

  // If synergy is not available, translate the fallback message
  if (synergy.available === false) {
    const notAvailable = translate(language, 'synergy.notAvailable');
    if (notAvailable && typeof notAvailable === 'object') {
      synergy.message = notAvailable.message || synergy.message;
      synergy.recommendation = notAvailable.recommendation || synergy.recommendation;
    }
    return synergy;
  }

  // Translate project profile name/description
  if (synergy.projectType && synergy.projectProfile) {
    const profileTrans = translate(language, `synergy.projectProfiles.${synergy.projectType}`);
    if (profileTrans && typeof profileTrans === 'object') {
      synergy.projectProfile = {
        ...synergy.projectProfile,
        name: profileTrans.name || synergy.projectProfile.name,
        description: profileTrans.description || synergy.projectProfile.description
      };
    }
  }

  // Translate metrics
  if (synergy.metrics) {
    synergy.metrics = _translateSynergyMetrics(synergy.metrics, synergy.projectType, language);
  }

  // Translate recommendations
  if (synergy.recommendations) {
    synergy.recommendations = synergy.recommendations.map(rec =>
      _translateSynergyRecommendation(rec, language)
    );
  }

  // Translate explanation if present
  if (synergy.explanation) {
    synergy.explanation = _translateSynergyExplanation(synergy.explanation, synergy, language);
  }

  // Translate incremental note
  if (synergy.note) {
    synergy.note = translate(language, 'synergy.incrementalNote') || synergy.note;
  }

  return synergy;
}

/**
 * Translate synergy metrics (roleDiversity, projectFit, previousCollaborations)
 * @private
 */
function _translateSynergyMetrics(metrics, projectType, lang) {
  const translated = { ...metrics };

  if (translated.roleDiversity) {
    translated.roleDiversity = { ...translated.roleDiversity };
    if (translated.roleDiversity.level) {
      translated.roleDiversity.level = translate(lang, `synergy.levels.${translated.roleDiversity.level}`) || translated.roleDiversity.level;
    }
  }

  // Translate project fit
  if (translated.projectFit) {
    translated.projectFit = { ...translated.projectFit };
    if (translated.projectFit.level) {
      translated.projectFit.level = translate(lang, `synergy.levels.${translated.projectFit.level}`) || translated.projectFit.level;
    }
    if (translated.projectFit.message) {
      const profileTrans = translate(lang, `synergy.projectProfiles.${projectType}`);
      const projectName = (profileTrans && profileTrans.name) || translated.projectFit.projectType;
      const level = _getSynergyScoreKey(translated.projectFit.score);
      const msgTrans = translate(lang, `synergy.messages.projectFit.${level}`, { projectType: projectName });
      translated.projectFit.message = msgTrans || translated.projectFit.message;
      if (projectName) {
        translated.projectFit.projectType = projectName;
      }
    }
  }

  // Translate previous collaborations
  if (translated.previousCollaborations) {
    translated.previousCollaborations = { ...translated.previousCollaborations };
    if (translated.previousCollaborations.level) {
      translated.previousCollaborations.level = translate(lang, `synergy.levels.${translated.previousCollaborations.level}`) || translated.previousCollaborations.level;
    }
    if (translated.previousCollaborations.message) {
      const score = translated.previousCollaborations.score;
      const percentage = translated.previousCollaborations.collaborationPercentage;
      const key = _getCollaborationMessageKey(score);
      const msgTrans = translate(lang, `synergy.messages.previousCollaborations.${key}`, { percentage });
      translated.previousCollaborations.message = msgTrans || translated.previousCollaborations.message;
    }
  }

  return translated;
}

/**
 * Translate a single synergy recommendation
 * @private
 */
function _translateSynergyRecommendation(rec, lang) {
  if (!rec) return rec;

  const categoryMapping = {
    role_diversity: 'roleDiversity',
    project_fit: 'projectFit',
    previous_collaborations_low: 'buildCohesion',
    previous_collaborations_high: 'leverageSynergy',
    success: 'success'
  };

  // Determine translation key
  let transKey = categoryMapping[rec.category];
  if (rec.category === 'previous_collaborations') {
    transKey = rec.priority === 'info' ? 'leverageSynergy' : 'buildCohesion';
  }

  if (!transKey) return rec;

  const recTrans = translate(lang, `synergy.recommendations.${transKey}`);
  if (!recTrans || typeof recTrans !== 'object') return rec;

  const params = {
    projectType: rec._projectTypeName || '',
    projectTypeLower: (rec._projectTypeName || '').toLowerCase(),
    percentage: rec._collaborationPercentage || ''
  };

  return {
    ...rec,
    title: replaceParams(recTrans.title || rec.title, params),
    description: replaceParams(recTrans.description || rec.description, params),
    actions: recTrans.actions || rec.actions
  };
}

/**
 * Translate synergy explanation (summary, strengths, concerns)
 * @private
 */
function _translateSynergyExplanation(explanation, synergy, lang) {
  const translated = { ...explanation };

  // Translate summary
  if (translated.summary && synergy) {
    const levelTrans = translate(lang, `synergy.levels.${translated.summary.level}`) || translated.summary.level;
    const profileTrans = translate(lang, `synergy.projectProfiles.${synergy.projectType}`);
    const projectTypeName = (profileTrans && profileTrans.name) || synergy.projectType;

    const roleDivLevel = synergy.metrics?.roleDiversity?.score >= 60
      ? (translate(lang, 'synergy.levels.good') || 'good')
      : (translate(lang, 'synergy.levels.poor') || 'limited');
    const projFitLevel = synergy.metrics?.projectFit?.score >= 60
      ? (translate(lang, 'synergy.levels.good') || 'good')
      : (translate(lang, 'synergy.levels.poor') || 'poor');

    const summaryTemplate = translate(lang, 'synergy.summary.text');
    translated.summary = {
      ...translated.summary,
      level: levelTrans,
      text: replaceParams(summaryTemplate || translated.summary.text, {
        level: levelTrans,
        score: translated.summary.score,
        projectType: projectTypeName,
        roleDiversityLevel: roleDivLevel,
        projectFitLevel: projFitLevel
      })
    };
  }

  // Translate strengths
  if (translated.strengths) {
    translated.strengths = translated.strengths.map(s => {
      const areaKey = _areaToKey(s.area);
      const descTrans = translate(lang, `synergy.strengths.${areaKey}`);
      if (!descTrans) return s;
      return {
        ...s,
        description: replaceParams(descTrans, {
          projectType: synergy.projectType || '',
          totalCollaborations: synergy.metrics?.previousCollaborations?.totalCollaborations || ''
        })
      };
    });
  }

  // Translate concerns
  if (translated.concerns) {
    translated.concerns = translated.concerns.map(c => {
      const areaKey = _areaToKey(c.area);
      const descTrans = translate(lang, `synergy.concerns.${areaKey}`);
      if (!descTrans) return c;
      return { ...c, description: descTrans };
    });
  }

  return translated;
}

/**
 * Map area label to translation key
 * @private
 */
function _areaToKey(area) {
  const mapping = {
    'Trait Diversity': 'roleDiversity',
    'Project Fit': 'projectFit',
    'Previous Collaborations': 'previousCollaborations'
  };
  return mapping[area] || area;
}

/**
 * Get score key for message selection
 * @private
 */
function _getSynergyScoreKey(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Get collaboration message key
 * @private
 */
function _getCollaborationMessageKey(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score > 0) return 'limited';
  return 'none';
}

/**
 * Translate a synergy validation result from personalityOptimizer.validateTeamAddition
 * Translates the addition message based on the improvement value
 * @param {object} validation - Validation object with { userId, recommended, synergyImpact, message }
 * @param {string} lang - Language code
 * @returns {object} - Validation with translated message
 */
function translateSynergyValidation(validation, lang = DEFAULT_LANGUAGE) {
  if (!validation) return validation;

  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const improvement = validation.synergyImpact;
  const key = _getAdditionMessageKey(improvement);
  const translated = translate(language, `personalityOptimizer.addition.${key}`);

  return {
    ...validation,
    message: translated || validation.message
  };
}

/**
 * Translate an array of synergy validations
 * @param {Array} validations - Array of validation objects
 * @param {string} lang - Language code
 * @returns {Array} - Array with translated messages
 */
function translateSynergyValidations(validations, lang = DEFAULT_LANGUAGE) {
  if (!Array.isArray(validations)) return validations;
  return validations.map(v => translateSynergyValidation(v, lang));
}

/**
 * Translate hiring recommendations from personalityOptimizer.generateHiringRecommendations
 * @param {object} hiringData - Hiring recommendations object
 * @param {string} lang - Language code
 * @returns {object} - Hiring recommendations with translated fields
 */
function translateHiringRecommendations(hiringData, lang = DEFAULT_LANGUAGE) {
  if (!hiringData) return hiringData;

  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

  if (hiringData.available === false) {
    return {
      ...hiringData,
      message: translate(language, 'personalityOptimizer.hiring.notAvailable') || hiringData.message
    };
  }

  if (!hiringData.recommendations) return hiringData;

  const translated = { ...hiringData, recommendations: { ...hiringData.recommendations } };

  // Translate reasoning messages
  if (translated.recommendations.reasoning) {
    translated.recommendations.reasoning = translated.recommendations.reasoning.map(reason => {
      // Match "Seek <RoleName> to fill missing role in team"
      const seekMatch = reason.match(/^Seek (.+) to fill missing role in team$/);
      if (seekMatch) {
        return replaceParams(
          translate(language, 'personalityOptimizer.hiring.seekRole') || reason,
          { roleName: seekMatch[1] }
        );
      }
      return reason;
    });
  }

  // Translate ideal profile recommendations/reasons
  if (translated.recommendations.idealProfiles) {
    translated.recommendations.idealProfiles = translated.recommendations.idealProfiles.map(profile => {
      const result = { ...profile };

      // Translate role name/description from synergy roles
      if (result.role) {
        const roleTrans = translate(language, `synergy.roles.${result.role}`);
        if (roleTrans && typeof roleTrans === 'object') {
          result.name = roleTrans.name || result.name;
          result.description = roleTrans.description || result.description;
        }
      }

      // Translate trait-based recommendations
      if (result.trait && result.recommendation) {
        if (result.recommendation.startsWith('Higher ')) {
          result.recommendation = replaceParams(
            translate(language, 'personalityOptimizer.hiring.higherTrait') || result.recommendation,
            { trait: result.trait }
          );
        }
        if (result.recommendation === 'Low Neuroticism (< 2.5)') {
          result.recommendation = translate(language, 'personalityOptimizer.hiring.lowNeuroticism') || result.recommendation;
        }
        if (result.recommendation === 'High Conscientiousness (> 4.0)') {
          result.recommendation = translate(language, 'personalityOptimizer.hiring.highConscientiousness') || result.recommendation;
        }
      }

      // Translate reason
      if (result.reason) {
        const lowMatch = result.reason.match(/^Team average is low \((.+)\)$/);
        if (lowMatch) {
          result.reason = replaceParams(
            translate(language, 'personalityOptimizer.hiring.lowAverage') || result.reason,
            { average: lowMatch[1] }
          );
        }
        if (result.reason === 'To balance high team stress tendency') {
          result.reason = translate(language, 'personalityOptimizer.hiring.balanceStress') || result.reason;
        }
        if (result.reason === 'To improve team discipline and reliability') {
          result.reason = translate(language, 'personalityOptimizer.hiring.improveDiscipline') || result.reason;
        }
      }

      return result;
    });
  }

  // Translate avoid profiles
  if (translated.recommendations.avoidProfiles) {
    translated.recommendations.avoidProfiles = translated.recommendations.avoidProfiles.map(profile => {
      const result = { ...profile };

      if (result.recommendation && result.recommendation.startsWith('Very high ')) {
        result.recommendation = replaceParams(
          translate(language, 'personalityOptimizer.hiring.veryHighTrait') || result.recommendation,
          { trait: result.trait }
        );
      }

      if (result.reason) {
        const highMatch = result.reason.match(/^Team average is already high \((.+)\)$/);
        if (highMatch) {
          result.reason = replaceParams(
            translate(language, 'personalityOptimizer.hiring.highAverage') || result.reason,
            { average: highMatch[1] }
          );
        }
      }

      return result;
    });
  }

  return translated;
}

/**
 * Get addition message key based on improvement value
 * @private
 */
function _getAdditionMessageKey(improvement) {
  if (improvement === null || improvement === undefined) return 'noData';
  if (improvement > 5) return 'excellent';
  if (improvement > 0) return 'good';
  if (improvement === 0) return 'neutral';
  if (improvement > -5) return 'acceptable';
  return 'warning';
}

/**
 * Get all risk type identifiers
 * @param {string} lang - Language code
 * @returns {Array<string>} Array of risk type keys
 */
function getRiskTypes(lang = DEFAULT_LANGUAGE) {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  return Object.keys(translations[language].risks || {});
}

/**
 * Get full risk metadata (title, description, category, etc.) for a given type
 * @param {string} type - Risk type identifier
 * @param {string} lang - Language code
 * @returns {Object|null} Risk metadata or null if not found
 */
function getRiskMetadata(type, lang = DEFAULT_LANGUAGE) {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const normalizedType = normalizeRiskType(type);
  const riskData = translations[language].risks[normalizedType] ||
                   translations[language].risks[type];
  return riskData || null;
}

/**
 * Get all Hofstede-related risks
 * @param {string} lang - Language code
 * @returns {Array<Object>} Array of risk metadata objects with `type` key added
 */
function getHofstedeRisks(lang = DEFAULT_LANGUAGE) {
  const types = getRiskTypes(lang);
  return types
    .filter(type => getRiskMetadata(type, lang)?.isHofstedeRelated)
    .map(type => ({ type, ...getRiskMetadata(type, lang) }));
}

/**
 * Get all traditional (non-Hofstede) risks
 * @param {string} lang - Language code
 * @returns {Array<Object>} Array of risk metadata objects with `type` key added
 */
function getTraditionalRisks(lang = DEFAULT_LANGUAGE) {
  const types = getRiskTypes(lang);
  return types
    .filter(type => !getRiskMetadata(type, lang)?.isHofstedeRelated)
    .map(type => ({ type, ...getRiskMetadata(type, lang) }));
}

/**
 * Get risks filtered by category
 * @param {string} category - Category name
 * @param {string} lang - Language code
 * @returns {Array<Object>} Array of risk metadata objects with `type` key added
 */
function getRisksByCategory(category, lang = DEFAULT_LANGUAGE) {
  const types = getRiskTypes(lang);
  return types
    .filter(type => getRiskMetadata(type, lang)?.category === category)
    .map(type => ({ type, ...getRiskMetadata(type, lang) }));
}

/**
 * Check if a risk type is Hofstede-related
 * @param {string} type - Risk type identifier
 * @param {string} lang - Language code
 * @returns {boolean}
 */
function isHofstedeRisk(type, lang = DEFAULT_LANGUAGE) {
  const metadata = getRiskMetadata(type, lang);
  return metadata?.isHofstedeRelated === true;
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
  translateSynergy,
  translateSynergyObject,
  translateSynergyValidation,
  translateSynergyValidations,
  translateHiringRecommendations,
  getLanguageFromRequest,
  isValidLanguage,
  normalizeRiskType,
  getRiskTypes,
  getRiskMetadata,
  getHofstedeRisks,
  getTraditionalRisks,
  getRisksByCategory,
  isHofstedeRisk,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE
};
