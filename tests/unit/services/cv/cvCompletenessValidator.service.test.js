/**
 * Unit Tests for Curriculum Completeness Validator Service
 */

const {
  validateCVCompleteness,
  getFieldConfig,
  isFieldComplete,
  getCategoryCompleteness,
  CRITICAL_FIELDS
} = require('../../../../src/services/cv/cvCompletenessValidator.service');

describe('Curriculum Completeness Validator Service', () => {
  describe('validateCVCompleteness', () => {
    test('should return complete status for a fully populated curriculum', () => {
      const completeCV = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890', type: 'mobile' }]
        },
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'Computer Science'
          }
        ],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Developer',
            startDate: '2020-01',
            description: 'Developed apps',
            technologies: ['React', 'Node.js']
          }
        ],
        skills: {
          technical: [
            { name: 'React', level: 'advanced' },
            { name: 'Node.js', level: 'intermediate' }
          ]
        },
        languages: [
          { language: 'English', level: 'native' }
        ],
        availability: {
          immediate: true,
          willingToTravel: false,
          willingToWorkOffHours: true,
          overtimeAvailability: 'flexible'
        },
        crossCulturalExperience: {
          hasExperience: false
        },
        remoteWorkExperience: {
          yearsRemote: 3,
          distributedTeamsExperience: true,
          timezoneFlexibility: true
        }
      };

      const result = validateCVCompleteness(completeCV);

      expect(result.isComplete).toBe(true);
      expect(result.completenessScore).toBe(100);
      expect(result.missingFields).toHaveLength(0);
      expect(result.totalMissingCount).toBe(0);
    });

    test('should detect missing contact information', () => {
      const cvWithoutContact = {
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'Computer Science'
          }
        ],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Developer',
            startDate: '2020-01',
            description: 'Developed apps',
            technologies: ['React']
          }
        ],
        skills: {
          technical: [{ name: 'React', level: 'advanced' }]
        },
        languages: [{ language: 'English', level: 'native' }],
        availability: {
          immediate: true,
          willingToTravel: false,
          willingToWorkOffHours: false
        },
        crossCulturalExperience: { hasExperience: false },
        remoteWorkExperience: {
          yearsRemote: 0,
          distributedTeamsExperience: false,
          timezoneFlexibility: false
        }
      };

      const result = validateCVCompleteness(cvWithoutContact);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain('contact.email');
      expect(result.missingFields).toContain('contact.phones');
      expect(result.criticalMissingCount).toBeGreaterThan(0);
    });

    test('should detect missing availability fields', () => {
      const cvWithoutAvailability = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890' }]
        },
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS'
          }
        ],
        experience: [
          {
            company: 'Tech',
            position: 'Dev',
            startDate: '2020',
            description: 'Work',
            technologies: ['JS']
          }
        ],
        skills: {
          technical: [{ name: 'JS', level: 'basic' }]
        },
        languages: [{ language: 'English', level: 'native' }],
        crossCulturalExperience: { hasExperience: false },
        remoteWorkExperience: {
          yearsRemote: 0,
          distributedTeamsExperience: false,
          timezoneFlexibility: false
        }
      };

      const result = validateCVCompleteness(cvWithoutAvailability);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain('availability');
      expect(result.missingByPriority.high).toContain('availability');
    });

    test('should detect incomplete availability information', () => {
      const cvWithIncompleteAvailability = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890' }]
        },
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS'
          }
        ],
        experience: [
          {
            company: 'Tech',
            position: 'Dev',
            startDate: '2020',
            description: 'Work',
            technologies: ['JS']
          }
        ],
        skills: {
          technical: [{ name: 'JS', level: 'basic' }]
        },
        languages: [{ language: 'English', level: 'native' }],
        availability: {
          // immediate is missing (required field)
          // willingToTravel is optional
          // willingToWorkOffHours is optional
        },
        crossCulturalExperience: { hasExperience: false },
        remoteWorkExperience: {
          yearsRemote: 0,
          distributedTeamsExperience: false,
          timezoneFlexibility: false
        }
      };

      const result = validateCVCompleteness(cvWithIncompleteAvailability);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain('availability.immediate');
      // willingToTravel and willingToWorkOffHours are optional fields
    });

    test('should require startDate when immediate is false', () => {
      const cvWithNonImmediateAvailability = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890' }]
        },
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS'
          }
        ],
        experience: [
          {
            company: 'Tech',
            position: 'Dev',
            startDate: '2020',
            description: 'Work',
            technologies: ['JS']
          }
        ],
        skills: {
          technical: [{ name: 'JS', level: 'basic' }]
        },
        languages: [{ language: 'English', level: 'native' }],
        availability: {
          immediate: false,
          // startDate is missing - should be flagged
          willingToTravel: false,
          willingToWorkOffHours: false
        },
        crossCulturalExperience: { hasExperience: false },
        remoteWorkExperience: {
          yearsRemote: 0,
          distributedTeamsExperience: false,
          timezoneFlexibility: false
        }
      };

      const result = validateCVCompleteness(cvWithNonImmediateAvailability);

      expect(result.isComplete).toBe(false);
      expect(result.missingFields).toContain('availability.startDate');
    });

    test('should not require travelFrequency when willingToTravel is true (travel details are optional)', () => {
      const cvWithTravelButNoFrequency = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890' }]
        },
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS'
          }
        ],
        experience: [
          {
            company: 'Tech',
            position: 'Dev',
            startDate: '2020',
            description: 'Work',
            technologies: ['JS']
          }
        ],
        skills: {
          technical: [{ name: 'JS', level: 'basic' }]
        },
        languages: [{ language: 'English', level: 'native' }],
        availability: {
          immediate: true,
          willingToTravel: true,
          // travelFrequency is optional - not required even if willingToTravel is true
          willingToWorkOffHours: false
        },
        crossCulturalExperience: { hasExperience: false },
        remoteWorkExperience: {
          yearsRemote: 0,
          distributedTeamsExperience: false,
          timezoneFlexibility: false
        }
      };

      const result = validateCVCompleteness(cvWithTravelButNoFrequency);

      // Travel frequency is optional, so curriculum should be complete
      expect(result.isComplete).toBe(true);
      expect(result.missingFields).not.toContain('availability.travelFrequency');
    });

    test('should return 0% completeness for null curriculum', () => {
      const result = validateCVCompleteness(null);

      expect(result.isComplete).toBe(false);
      expect(result.completenessScore).toBe(0);
      expect(result.missingFields).toContain('cv');
    });

    test('should calculate correct completeness score', () => {
      const partialCV = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890' }]
        },
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS'
          }
        ],
        experience: [
          {
            company: 'Tech',
            position: 'Dev',
            startDate: '2020',
            description: 'Work',
            technologies: ['JS']
          }
        ],
        skills: {
          technical: [{ name: 'JS', level: 'basic' }]
        },
        languages: [{ language: 'English', level: 'native' }]
        // Missing: availability, crossCulturalExperience, remoteWorkExperience
      };

      const result = validateCVCompleteness(partialCV);

      expect(result.completenessScore).toBeLessThan(100);
      expect(result.completenessScore).toBeGreaterThan(0);
    });
  });

  describe('getFieldConfig', () => {
    test('should return config for top-level field', () => {
      const config = getFieldConfig('availability');
      expect(config).toBeDefined();
      expect(config.category).toBe('availability');
    });

    test('should return config for nested field', () => {
      const config = getFieldConfig('availability.immediate');
      expect(config).toBeDefined();
      expect(config.category).toBe('availability');
    });

    test('should return null for unknown field', () => {
      const config = getFieldConfig('unknownField');
      expect(config).toBeNull();
    });
  });

  describe('isFieldComplete', () => {
    test('should return true for complete field', () => {
      const cv = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890' }]
        }
      };

      const result = isFieldComplete(cv, 'contact.email');
      expect(result).toBe(true);
    });

    test('should return false for missing field', () => {
      const cv = {
        contact: {
          // email is missing
          phones: [{ number: '+1234567890' }]
        }
      };

      const result = isFieldComplete(cv, 'contact.email');
      expect(result).toBe(false);
    });

    test('should return true for non-tracked field', () => {
      const cv = {};
      const result = isFieldComplete(cv, 'someUnknownField');
      expect(result).toBe(true);
    });
  });

  describe('getCategoryCompleteness', () => {
    test('should group completeness by category', () => {
      const cv = {
        contact: {
          email: 'john@example.com',
          phones: [{ number: '+1234567890' }]
        },
        education: [
          {
            institution: 'MIT',
            degree: 'Bachelor',
            fieldOfStudy: 'CS'
          }
        ],
        experience: [
          {
            company: 'Tech',
            position: 'Dev',
            startDate: '2020',
            description: 'Work',
            technologies: ['JS']
          }
        ],
        skills: {
          technical: [{ name: 'JS', level: 'basic' }]
        },
        languages: [{ language: 'English', level: 'native' }]
        // Missing: availability, crossCulturalExperience, remoteWorkExperience
      };

      const categories = getCategoryCompleteness(cv);

      expect(categories.basic.isComplete).toBe(true);
      expect(categories.availability.isComplete).toBe(false);
      expect(categories.availability.missingFields.length).toBeGreaterThan(0);
    });
  });

  describe('CRITICAL_FIELDS', () => {
    test('should have validators for all critical fields', () => {
      const fieldNames = Object.keys(CRITICAL_FIELDS);
      
      expect(fieldNames).toContain('contact');
      expect(fieldNames).toContain('education');
      expect(fieldNames).toContain('experience');
      expect(fieldNames).toContain('skills');
      expect(fieldNames).toContain('languages');
      expect(fieldNames).toContain('availability');
      expect(fieldNames).toContain('crossCulturalExperience');
      expect(fieldNames).toContain('remoteWorkExperience');
    });

    test('all validators should be functions', () => {
      Object.values(CRITICAL_FIELDS).forEach(field => {
        expect(typeof field.validator).toBe('function');
      });
    });

    test('all fields should have category and priority', () => {
      Object.values(CRITICAL_FIELDS).forEach(field => {
        expect(field.category).toBeDefined();
        expect(field.priority).toBeDefined();
        expect(['critical', 'high', 'medium', 'low']).toContain(field.priority);
      });
    });
  });
});
