/**
 * Curriculum Completeness Validator Service
 * Validates curriculum completeness and identifies missing or incomplete fields
 * Following SOLID principles: Single Responsibility Principle
 */

/**
 * Critical fields configuration
 * Each field has a validator function and metadata
 */
const CRITICAL_FIELDS = {
  // Basic Information
  contact: {
    category: 'basic',
    priority: 'critical',
    fields: ['email', 'phones'],
    validator: (cv) => {
      const missing = [];
      if (!cv.contact?.email) missing.push('contact.email');
      if (!cv.contact?.phones || cv.contact.phones.length === 0) {
        missing.push('contact.phones');
      }
      return missing;
    }
  },

  // Education
  education: {
    category: 'background',
    priority: 'high',
    validator: (cv) => {
      const missing = [];
      if (!cv.education || cv.education.length === 0) {
        missing.push('education');
      } else {
        cv.education.forEach((edu, index) => {
          if (!edu.institution) missing.push(`education[${index}].institution`);
          if (!edu.degree) missing.push(`education[${index}].degree`);
          // fieldOfStudy is optional - not everyone needs to specify it
        });
      }
      return missing;
    }
  },

  // Professional Experience
  experience: {
    category: 'background',
    priority: 'critical',
    validator: (cv) => {
      const missing = [];
      if (!cv.experience || cv.experience.length === 0) {
        missing.push('experience');
      } else {
        cv.experience.forEach((exp, index) => {
          if (!exp.company) missing.push(`experience[${index}].company`);
          if (!exp.position) missing.push(`experience[${index}].position`);
          if (!exp.startDate) missing.push(`experience[${index}].startDate`);
          // description and technologies are recommended but not strictly required
        });
      }
      return missing;
    }
  },

  // Technical Skills
  skills: {
    category: 'technical',
    priority: 'critical',
    validator: (cv) => {
      const missing = [];
      if (!cv.skills?.technical || cv.skills.technical.length === 0) {
        missing.push('skills.technical');
      } else {
        cv.skills.technical.forEach((skill, index) => {
          if (!skill.name) missing.push(`skills.technical[${index}].name`);
          if (!skill.level) missing.push(`skills.technical[${index}].level`);
        });
      }
      return missing;
    }
  },

  // Languages
  languages: {
    category: 'communication',
    priority: 'high',
    validator: (cv) => {
      const missing = [];
      if (!cv.languages || cv.languages.length === 0) {
        missing.push('languages');
      } else {
        cv.languages.forEach((lang, index) => {
          if (!lang.language) missing.push(`languages[${index}].language`);
          if (!lang.level) missing.push(`languages[${index}].level`);
        });
      }
      return missing;
    }
  },

  // Availability Information
  availability: {
    category: 'availability',
    priority: 'high',
    validator: (cv) => {
      const missing = [];
      
      if (!cv.availability) {
        missing.push('availability');
        return missing;
      }

      // Check if immediate is defined
      if (cv.availability.immediate === undefined || cv.availability.immediate === null) {
        missing.push('availability.immediate');
      }

      // If not immediate, startDate is required
      if (cv.availability.immediate === false && !cv.availability.startDate) {
        missing.push('availability.startDate');
      }

      // Travel availability is optional - only mark as missing if not defined at all
      // If user explicitly sets willingToTravel to false, don't require frequency

      // Off-hours work is optional - only mark as missing if not defined at all
      // If user explicitly sets willingToWorkOffHours to false, don't require overtime availability

      return missing;
    }
  },

  // Cross-cultural Experience (Optional field)
  crossCulturalExperience: {
    category: 'experience',
    priority: 'low',
    validator: (cv) => {
      const missing = [];
      
      // This is an optional field - only validate if user started filling it
      if (!cv.crossCulturalExperience) {
        // Don't mark as missing if completely empty
        return missing;
      }

      if (cv.crossCulturalExperience.hasExperience === undefined) {
        missing.push('crossCulturalExperience.hasExperience');
      }

      // Only require countries if user explicitly said they have experience
      if (cv.crossCulturalExperience.hasExperience === true) {
        if (!cv.crossCulturalExperience.countriesWorkedWith || 
            cv.crossCulturalExperience.countriesWorkedWith.length === 0) {
          missing.push('crossCulturalExperience.countriesWorkedWith');
        }
      }

      return missing;
    }
  },

  // Remote Work Experience (Optional field)
  remoteWorkExperience: {
    category: 'experience',
    priority: 'low',
    validator: (cv) => {
      const missing = [];
      
      // This is an optional field - don't require it if user has no remote experience
      if (!cv.remoteWorkExperience) {
        // Don't mark as missing if completely empty
        return missing;
      }

      // If user started filling it, validate completeness
      if (cv.remoteWorkExperience.yearsRemote === undefined) {
        missing.push('remoteWorkExperience.yearsRemote');
      }

      if (cv.remoteWorkExperience.distributedTeamsExperience === undefined) {
        missing.push('remoteWorkExperience.distributedTeamsExperience');
      }

      if (cv.remoteWorkExperience.timezoneFlexibility === undefined) {
        missing.push('remoteWorkExperience.timezoneFlexibility');
      }

      return missing;
    }
  }
};

/**
 * Validates curriculum completeness and returns detailed report
 * @param {Object} cv - Curriculum object to validate
 * @returns {Object} Validation report with missing fields by category and priority
 */
function validateCVCompleteness(cv) {
  if (!cv) {
    return {
      isComplete: false,
      completenessScore: 0,
      missingFields: ['cv'],
      missingByCategory: {},
      missingByPriority: { critical: ['cv'], high: [], medium: [], low: [] }
    };
  }

  const allMissing = [];
  const missingByCategory = {};
  const missingByPriority = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  // Validate each critical field
  Object.entries(CRITICAL_FIELDS).forEach(([fieldName, config]) => {
    const missing = config.validator(cv);
    
    if (missing.length > 0) {
      allMissing.push(...missing);

      // Group by category
      if (!missingByCategory[config.category]) {
        missingByCategory[config.category] = [];
      }
      missingByCategory[config.category].push(...missing);

      // Group by priority
      missingByPriority[config.priority].push(...missing);
    }
  });

  // Calculate completeness score
  const totalFields = Object.keys(CRITICAL_FIELDS).length;
  const completeFields = totalFields - Object.keys(missingByCategory).length;
  const completenessScore = Math.round((completeFields / totalFields) * 100);

  return {
    isComplete: allMissing.length === 0,
    completenessScore,
    missingFields: allMissing,
    missingByCategory,
    missingByPriority,
    totalMissingCount: allMissing.length,
    criticalMissingCount: missingByPriority.critical.length,
    highMissingCount: missingByPriority.high.length,
    mediumMissingCount: missingByPriority.medium.length
  };
}

/**
 * Get field configuration by field path
 * @param {string} fieldPath - Dot-notation field path (e.g., 'availability.immediate')
 * @returns {Object|null} Field configuration or null if not found
 */
function getFieldConfig(fieldPath) {
  const topLevelField = fieldPath.split('.')[0].split('[')[0];
  return CRITICAL_FIELDS[topLevelField] || null;
}

/**
 * Validates if a specific field is complete
 * @param {Object} cv - Curriculum object
 * @param {string} fieldPath - Field path to validate
 * @returns {boolean} True if field is complete, false otherwise
 */
function isFieldComplete(cv, fieldPath) {
  const config = getFieldConfig(fieldPath);
  if (!config) return true; // Not a tracked field, assume complete

  const missing = config.validator(cv);
  return !missing.includes(fieldPath);
}

/**
 * Get completeness status for each category
 * @param {Object} cv - Curriculum object
 * @returns {Object} Category-wise completeness status
 */
function getCategoryCompleteness(cv) {
  const categories = {};

  Object.entries(CRITICAL_FIELDS).forEach(([fieldName, config]) => {
    const missing = config.validator(cv);
    const category = config.category;

    if (!categories[category]) {
      categories[category] = {
        isComplete: true,
        missingFields: [],
        priority: config.priority
      };
    }

    if (missing.length > 0) {
      categories[category].isComplete = false;
      categories[category].missingFields.push(...missing);
    }
  });

  return categories;
}

module.exports = {
  validateCVCompleteness,
  getFieldConfig,
  isFieldComplete,
  getCategoryCompleteness,
  CRITICAL_FIELDS
};
