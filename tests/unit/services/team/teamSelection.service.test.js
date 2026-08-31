const teamSelectionService = require('../../../../src/services/team/teamSelection.service');
const personalityOptimizer = require('../../../../src/services/team/personalityOptimizer.service');
const {
  organizationRepository,
  projectRepository,
  cvRepository
} = require('../../../../src/repositories');

jest.mock('../../../../src/services/team/personalityOptimizer.service');
jest.mock('../../../../src/repositories', () => ({
  organizationRepository: { findById: jest.fn() },
  projectRepository: { find: jest.fn(), findById: jest.fn() },
  cvRepository: { find: jest.fn(), findOne: jest.fn() },
  userRepository: { findById: jest.fn() },
  bfi44Repository: { findOne: jest.fn() }
}));

describe('TeamSelectionService - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeTechnology', () => {
    it('should normalize technology names to lowercase', () => {
      expect(teamSelectionService.normalizeTechnology('Node.js')).toBe('node');
      expect(teamSelectionService.normalizeTechnology('JavaScript')).toBe('javascript');
      expect(teamSelectionService.normalizeTechnology('  PostgreSQL  ')).toBe('postgresql');
    });

    it('should handle empty strings', () => {
      expect(teamSelectionService.normalizeTechnology('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(teamSelectionService.normalizeTechnology('  React  ')).toBe('react');
    });

    it('should handle special characters', () => {
      expect(teamSelectionService.normalizeTechnology('C++')).toBe('c++');
      expect(teamSelectionService.normalizeTechnology('C#')).toBe('c#');
    });
  });

  describe('normalizeSkillLevel', () => {
    it('should return numeric levels for basic skill levels', () => {
      expect(teamSelectionService.normalizeSkillLevel('básico')).toBe(1);
    });

    it('should return numeric levels for intermediate skill levels', () => {
      expect(teamSelectionService.normalizeSkillLevel('intermedio')).toBe(2);
    });

    it('should return numeric levels for advanced skill levels', () => {
      expect(teamSelectionService.normalizeSkillLevel('avanzado')).toBe(3);
    });

    it('should return numeric levels for expert skill levels', () => {
      expect(teamSelectionService.normalizeSkillLevel('experto')).toBe(4);
    });

    it('should return default level for unknown levels', () => {
      expect(teamSelectionService.normalizeSkillLevel('unknown')).toBe(2);
      expect(teamSelectionService.normalizeSkillLevel('invalid')).toBe(2);
    });

    it('should handle case insensitive input', () => {
      expect(teamSelectionService.normalizeSkillLevel('BÁSICO')).toBe(1);
      expect(teamSelectionService.normalizeSkillLevel('Avanzado')).toBe(3);
    });

    it('should return default for null or undefined', () => {
      expect(teamSelectionService.normalizeSkillLevel(null)).toBe(2);
      expect(teamSelectionService.normalizeSkillLevel(undefined)).toBe(2);
    });
  });

  describe('calculateTotalYearsOfExperience', () => {
    it('should return 0 for empty experience array', () => {
      expect(teamSelectionService.calculateTotalYearsOfExperience([])).toBe(0);
    });

    it('should return 0 for null or undefined', () => {
      expect(teamSelectionService.calculateTotalYearsOfExperience(null)).toBe(0);
      expect(teamSelectionService.calculateTotalYearsOfExperience(undefined)).toBe(0);
    });

    it('should calculate years correctly for single experience', () => {
      const experiences = [{
        startDate: '2020-01-01',
        endDate: '2022-01-01',
        current: false
      }];
      
      const years = teamSelectionService.calculateTotalYearsOfExperience(experiences);
      expect(years).toBeCloseTo(2, 0);
    });

    it('should handle current job with no end date', () => {
      const experiences = [{
        startDate: '2020-01-01',
        current: true
      }];
      
      const years = teamSelectionService.calculateTotalYearsOfExperience(experiences);
      expect(years).toBeGreaterThan(3);
    });

    it('should sum multiple experiences', () => {
      const experiences = [
        {
          startDate: '2018-01-01',
          endDate: '2020-01-01',
          current: false
        },
        {
          startDate: '2020-06-01',
          endDate: '2022-01-01',
          current: false
        }
      ];
      
      const years = teamSelectionService.calculateTotalYearsOfExperience(experiences);
      expect(years).toBeGreaterThan(3);
    });
  });

  describe('calculateSkillsDistance', () => {
    const config = {
      skillMatchPenalty: 5
    };

    it('should return 0 for empty required techs', () => {
      const distance = teamSelectionService.calculateSkillsDistance([], [], [], [], config);
      expect(distance).toBe(0);
    });

    it('should calculate distance for matching skills', () => {
      const employeeSkills = [
        { name: 'JavaScript', level: 'avanzado' },
        { name: 'Node.js', level: 'intermedio' }
      ];
      const requiredTechs = ['javascript', 'node'];
      const matchedSkills = [];
      const missingSkills = [];

      const distance = teamSelectionService.calculateSkillsDistance(
        employeeSkills,
        requiredTechs,
        matchedSkills,
        missingSkills,
        config
      );

      expect(distance).toBeGreaterThanOrEqual(0);
      expect(matchedSkills.length).toBeGreaterThan(0);
      expect(missingSkills.length).toBe(0);
    });

    it('should penalize missing skills', () => {
      const employeeSkills = [
        { name: 'JavaScript', level: 'avanzado' }
      ];
      const requiredTechs = ['javascript', 'python', 'go'];
      const matchedSkills = [];
      const missingSkills = [];

      const distance = teamSelectionService.calculateSkillsDistance(
        employeeSkills,
        requiredTechs,
        matchedSkills,
        missingSkills,
        config
      );

      expect(matchedSkills.length).toBe(1);
      expect(missingSkills.length).toBe(2);
      expect(missingSkills).toContain('python');
      expect(missingSkills).toContain('go');
    });

    it('should handle empty employee skills', () => {
      const employeeSkills = [];
      const requiredTechs = ['javascript', 'node'];
      const matchedSkills = [];
      const missingSkills = [];

      const distance = teamSelectionService.calculateSkillsDistance(
        employeeSkills,
        requiredTechs,
        matchedSkills,
        missingSkills,
        config
      );

      expect(matchedSkills.length).toBe(0);
      expect(missingSkills.length).toBe(2);
    });
  });

  describe('calculateExperienceDistance', () => {
    const config = {
      experienceNormalizationFactor: 2
    };

    it('should calculate distance for junior level', () => {
      const experiences = [{
        startDate: '2023-01-01',
        endDate: '2024-01-01',
        current: false
      }];

      const distance = teamSelectionService.calculateExperienceDistance(experiences, 'junior', config);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThanOrEqual(5);
    });

    it('should calculate distance for mid level', () => {
      const experiences = [{
        startDate: '2021-01-01',
        current: true
      }];

      const distance = teamSelectionService.calculateExperienceDistance(experiences, 'mid', config);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThanOrEqual(5);
    });

    it('should calculate distance for senior level', () => {
      const experiences = [{
        startDate: '2018-01-01',
        current: true
      }];

      const distance = teamSelectionService.calculateExperienceDistance(experiences, 'senior', config);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThanOrEqual(5);
    });

    it('should handle empty experience array', () => {
      const distance = teamSelectionService.calculateExperienceDistance([], 'mid', config);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('estimateEmployeeComplexityLevel', () => {
    const config = {
      complexityFactors: {
        certificationsBonus: 0.5,
        advancedSkillsBonus: 0.5,
        projectsBonus: 0.5,
        experienceBonus: 0.5
      }
    };

    it('should return base score for minimal curriculum', () => {
      const cv = {
        skills: { technical: [] },
        certifications: [],
        projects: [],
        experience: []
      };

      const score = teamSelectionService.estimateEmployeeComplexityLevel(cv, config);
      expect(score).toBe(1);
    });

    it('should add bonus for certifications', () => {
      const cv = {
        skills: { technical: [] },
        certifications: [{ name: 'AWS' }, { name: 'Azure' }],
        projects: [],
        experience: []
      };

      const score = teamSelectionService.estimateEmployeeComplexityLevel(cv, config);
      expect(score).toBeGreaterThan(1);
    });

    it('should add bonus for advanced skills', () => {
      const cv = {
        skills: {
          technical: [
            { name: 'JavaScript', level: 'avanzado' },
            { name: 'Python', level: 'avanzado' },
            { name: 'Go', level: 'avanzado' },
            { name: 'Rust', level: 'avanzado' },
            { name: 'Java', level: 'experto' }
          ]
        },
        certifications: [],
        projects: [],
        experience: []
      };

      const score = teamSelectionService.estimateEmployeeComplexityLevel(cv, config);
      expect(score).toBeGreaterThan(1);
    });

    it('should add bonus for projects', () => {
      const cv = {
        skills: { technical: [] },
        certifications: [],
        projects: [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }],
        experience: []
      };

      const score = teamSelectionService.estimateEmployeeComplexityLevel(cv, config);
      expect(score).toBeGreaterThan(1);
    });

    it('should cap score at 3', () => {
      const cv = {
        skills: {
          technical: [
            { name: 'JS', level: 'experto' },
            { name: 'Python', level: 'experto' },
            { name: 'Go', level: 'experto' },
            { name: 'Rust', level: 'experto' },
            { name: 'Java', level: 'experto' }
          ]
        },
        certifications: [{ name: 'AWS' }, { name: 'Azure' }],
        projects: [{ name: 'P1' }, { name: 'P2' }, { name: 'P3' }],
        experience: [{
          startDate: '2010-01-01',
          current: true
        }]
      };

      const score = teamSelectionService.estimateEmployeeComplexityLevel(cv, config);
      expect(score).toBeLessThanOrEqual(3);
    });
  });

  describe('calculateComplexityMatch', () => {
    const config = {
      complexityMultiplier: 1.5,
      complexityFactors: {
        certificationsBonus: 0.5,
        advancedSkillsBonus: 0.5,
        projectsBonus: 0.5,
        experienceBonus: 0.5
      }
    };

    it('should calculate distance for low complexity', () => {
      const cv = {
        skills: { technical: [] },
        certifications: [],
        projects: [],
        experience: []
      };

      const distance = teamSelectionService.calculateComplexityMatch(cv, 'low', config);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThanOrEqual(5);
    });

    it('should calculate distance for medium complexity', () => {
      const cv = {
        skills: { technical: [{ name: 'JS', level: 'avanzado' }] },
        certifications: [{ name: 'AWS' }],
        projects: [],
        experience: []
      };

      const distance = teamSelectionService.calculateComplexityMatch(cv, 'medium', config);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThanOrEqual(5);
    });

    it('should calculate distance for high complexity', () => {
      const cv = {
        skills: { technical: [] },
        certifications: [],
        projects: [],
        experience: []
      };

      const distance = teamSelectionService.calculateComplexityMatch(cv, 'high', config);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calculateEmployeeScore', () => {
    const config = {
      skillsWeight: 1,
      experienceWeight: 1,
      complexityWeight: 1,
      availabilityWeight: 1,
      skillMatchPenalty: 5,
      experienceNormalizationFactor: 2,
      complexityMultiplier: 1.5,
      complexityFactors: {},
      availabilityComponents: {}
    };

    it('should return Infinity for invalid curriculum input', async () => {
      const score = await teamSelectionService.calculateEmployeeScore({
        cv: null, requiredTechs: ['node'], experienceLevel: 'mid', complexity: 'medium', weeklyHours: 40, config
      });
      expect(score.total).toBe(Infinity);
      expect(score.details.error).toBeDefined();
    });

    it('should return Infinity for curriculum without userId', async () => {
      const cv = { skills: {} };
      const score = await teamSelectionService.calculateEmployeeScore({
        cv, requiredTechs: ['node'], experienceLevel: 'mid', complexity: 'medium', weeklyHours: 40, config
      });
      expect(score.total).toBe(Infinity);
    });

    it('should calculate score for valid curriculum', async () => {
      const cv = {
        userId: { _id: 'user-123' },
        skills: {
          technical: [{ name: 'JavaScript', level: 'avanzado' }]
        },
        experience: [{
          startDate: '2020-01-01',
          current: true
        }],
        certifications: [],
        projects: [],
        availability: { immediate: true }
      };

      projectRepository.find.mockResolvedValue([]);

      const score = await teamSelectionService.calculateEmployeeScore({
        cv,
        requiredTechs: ['javascript'],
        experienceLevel: 'mid',
        complexity: 'medium',
        weeklyHours: 40,
        config
      });

      expect(score.total).toBeDefined();
      expect(score.total).not.toBe(Infinity);
      expect(Number.isFinite(score.total)).toBe(true);
      expect(score.details).toBeDefined();
      expect(score.matchedSkills).toBeDefined();
      expect(score.missingSkills).toBeDefined();
    });

    it('should include matched and missing skills', async () => {
      const cv = {
        userId: { _id: 'user-123' },
        skills: {
          technical: [{ name: 'JavaScript', level: 'avanzado' }]
        },
        experience: [],
        availability: { immediate: true }
      };

      projectRepository.find.mockResolvedValue([]);

      const score = await teamSelectionService.calculateEmployeeScore({
        cv,
        requiredTechs: ['javascript', 'python', 'go'],
        experienceLevel: 'mid',
        complexity: 'medium',
        weeklyHours: 40,
        config
      });

      expect(score.matchedSkills.length).toBeGreaterThan(0);
      expect(score.missingSkills.length).toBeGreaterThan(0);
    });

    // Regression: the previous positional signature took 7 parameters and every
    // production call site passed 6, shifting `config` onto `weeklyHours` and the
    // active-projects array onto `config`. `phase1Config.skillsWeight` was then
    // undefined and the total came out NaN, which silently disabled every
    // downstream ranking. A malformed config must never produce a non-finite score.
    it('should never produce a non-finite score when the config is malformed', async () => {
      const cv = {
        userId: { _id: 'user-123' },
        skills: { technical: [{ name: 'JavaScript', level: 'avanzado' }] },
        experience: [],
        availability: { immediate: true }
      };

      projectRepository.find.mockResolvedValue([]);

      for (const malformed of [[], {}, 'not-a-config', 42]) {
        const score = await teamSelectionService.calculateEmployeeScore({
          cv,
          requiredTechs: ['javascript'],
          config: malformed
        });

        expect(Number.isNaN(score.total)).toBe(false);
        expect(Number.isFinite(score.total)).toBe(true);
      }
    });
  });

  describe('selectOptimalTeam', () => {
    it('should throw error if organization not found', async () => {
      organizationRepository.findById.mockResolvedValue(null);

      await expect(
        teamSelectionService.selectOptimalTeam({}, 'org-123', 5)
      ).rejects.toThrow('Organization not found');
    });

    it('should return empty array if no employees', async () => {
      const mockOrg = {
        employees: []
      };

      organizationRepository.findById.mockResolvedValue(mockOrg);

      const result = await teamSelectionService.selectOptimalTeam({}, 'org-123', 5);
      expect(result.team).toEqual([]);
      expect(result.metadata.requestedSize).toBe(5);
      expect(result.metadata.availableEmployees).toBe(0);
      expect(result.metadata.selectedSize).toBe(0);
      expect(result.metadata.shortage).toBe(5);
      expect(result.metadata.allEmployeesInOrg).toBe(0);
    });

    it('should return empty array if no valid curricula', async () => {
      const mockOrg = {
        employees: [
          { user: 'user-1', status: 'active' },
          { user: 'user-2', status: 'active' }
        ]
      };

      organizationRepository.findById.mockResolvedValue(mockOrg);
      cvRepository.find.mockResolvedValue([]);

      const result = await teamSelectionService.selectOptimalTeam({}, 'org-123', 5);
      expect(result.team).toEqual([]);
      expect(result.metadata.requestedSize).toBe(5);
      expect(result.metadata.availableEmployees).toBe(0);
      expect(result.metadata.selectedSize).toBe(0);
      expect(result.metadata.shortage).toBe(5);
      expect(result.metadata.allEmployeesInOrg).toBe(2);
      expect(result.metadata.employeesWithAcceptedCV).toBe(0);
    });
  });

  describe('selectComplementaryTeam', () => {
    it('should throw error if organization not found', async () => {
      organizationRepository.findById.mockResolvedValue(null);

      await expect(
        teamSelectionService.selectComplementaryTeam({}, 'org-123', [], 2)
      ).rejects.toThrow('Organization not found');
    });

    it('should return empty suggestions if no available employees', async () => {
      const mockOrg = {
        employees: [
          { user: 'user-1', status: 'active' }
        ]
      };

      organizationRepository.findById.mockResolvedValue(mockOrg);

      const result = await teamSelectionService.selectComplementaryTeam(
        {},
        'org-123',
        ['user-1'],
        2
      );

      expect(result.suggestions).toEqual([]);
      expect(result.metadata.shortage).toBe(2);
    });

    it('should filter out current team members', async () => {
      const mockOrg = {
        employees: [
          { user: 'user-1', status: 'active' },
          { user: 'user-2', status: 'active' },
          { user: 'user-3', status: 'active' }
        ]
      };

      organizationRepository.findById.mockResolvedValue(mockOrg);
      cvRepository.find.mockResolvedValue([]);

      const result = await teamSelectionService.selectComplementaryTeam(
        {},
        'org-123',
        ['user-1'],
        2
      );

      expect(cvRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.objectContaining({
            $in: expect.not.arrayContaining(['user-1'])
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const date = teamSelectionService.parseDate('2020-01-01');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2020);
    });

    it('should handle ISO date strings', () => {
      const date = teamSelectionService.parseDate('2020-01-01T00:00:00.000Z');
      expect(date).toBeInstanceOf(Date);
    });

    it('should return null for invalid dates', () => {
      const date = teamSelectionService.parseDate('invalid-date');
      expect(date).toBeNull();
    });

    it('should return null for null input', () => {
      const date = teamSelectionService.parseDate(null);
      expect(date).toBeNull();
    });

    it('should return null for undefined input', () => {
      const date = teamSelectionService.parseDate(undefined);
      expect(date).toBeNull();
    });
  });

  describe('monthsDifference', () => {
    it('should calculate months between two dates', () => {
      const start = new Date('2020-01-01');
      const end = new Date('2021-01-01');
      
      const months = teamSelectionService.monthsDifference(start, end);
      expect(months).toBe(12);
    });

    it('should handle same year', () => {
      const start = new Date('2020-01-01');
      const end = new Date('2020-06-01');
      
      const months = teamSelectionService.monthsDifference(start, end);
      expect(months).toBe(5);
    });

    it('should handle multiple years', () => {
      const start = new Date('2018-01-01');
      const end = new Date('2021-01-01');
      
      const months = teamSelectionService.monthsDifference(start, end);
      expect(months).toBe(36);
    });

    it('should return 0 for same dates', () => {
      const start = new Date('2020-01-01');
      const end = new Date('2020-01-01');
      
      const months = teamSelectionService.monthsDifference(start, end);
      expect(months).toBe(0);
    });
  });
});
