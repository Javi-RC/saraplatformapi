/**
 * Seed Cases Service
 * Provides initial generic cases for CBR system bootstrap
 * Based on project management literature and industry best practices
 */

const CaseBase = require('../models/caseBase.model');

/**
 * Seed cases based on industry data and PM literature
 * Sources: PMI PMBOK, Standish Group Chaos Report, Scrum Alliance surveys
 */
const SEED_CASES = [
  // ============================================
  // CASE 1: Distributed Team Communication Issues
  // ============================================
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Multi-Region Software Development',
      briefDescription: 'Software project with team distributed across 3+ time zones',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: {
          teamRegions: ['North America', 'Europe', 'Asia'],
          timeOverlap: 3,
          requiresSyncComm: 'yes',
          weeklyMeetings: 5,
          culturalDiversity: 'high',
          realTimeCommunicationLevel: 'high'
        },
        technical: {
          mainTechnologies: ['JavaScript', 'Node.js', 'React'],
          experienceLevel: 'mid',
          systemComplexity: 'high',
          documentationLevel: 'partial',
          requiresSpecializedTools: false,
          sharedInfrastructureDependency: 'medium'
        },
        team: {
          size: 12,
          weeklyHours: 40,
          distributedExperience: 'low',
          requiredLanguages: ['English'],
          languageProficiency: 'B2'
        },
        management: {
          methodology: 'scrum',
          hasOnboarding: 'partial',
          hasCICD: 'yes',
          toolsFragmentation: 'medium',
          clarityOfRequirements: 'medium'
        },
        organizational: {
          involvedTeams: 3,
          criticalDependencies: 4,
          informationFlow: 'bidirectional',
          stakeholdersCount: 5
        }
      }
    },
    solution: {
      completed: true,
      onTime: false,
      delayDays: 21,
      budgetOverrun: 18,
      qualityScore: 3.5,
      clientSatisfaction: 3.2,
      teamMorale: 3.0,
      actualRisks: [
        {
          type: 'communication_breakdown',
          severity: 'high',
          description: 'Time zone differences caused delays in decision-making and problem resolution',
          impact: 'schedule',
          rootCause: 'Insufficient overlap hours and lack of async-first protocols',
          actualImpact: {
            scheduleDelayDays: 18,
            budgetOverrunPercent: 15,
            qualityImpact: 'medium'
          }
        },
        {
          type: 'process_mismatch',
          severity: 'medium',
          description: 'Scrum ceremonies were inefficient with distributed team',
          impact: 'productivity',
          rootCause: 'Traditional Scrum not adapted for remote/distributed context',
          actualImpact: {
            scheduleDelayDays: 5,
            budgetOverrunPercent: 8,
            qualityImpact: 'low'
          }
        }
      ],
      metrics: {
        avgVelocity: 35,
        bugRate: 0.16,
        meetingEfficiency: 2.8,
        teamMoraleProgression: [4.0, 3.5, 3.2, 3.0],
        deploymentFrequency: 'weekly',
        codeReviewTimeAvg: 2.5
      }
    },
    result: {
      lessonsLearned: [
        'Async-first communication protocols are essential for distributed teams',
        'Daily written updates reduce need for synchronous meetings',
        'Clear documentation reduces misunderstandings across time zones'
      ],
      successfulPractices: [
        {
          practice: 'Established 4-hour core overlap hours',
          impact: 'Improved synchronous collaboration when needed',
          replicable: true
        },
        {
          practice: 'Used shared documentation extensively',
          impact: 'Reduced communication gaps',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Daily standup meetings at fixed time',
          impact: 'Low participation from some regions',
          reason: 'Time zone conflicts'
        }
      ],
      recommendations: [
        'Start with async-first approach from day 1',
        'Establish clear escalation protocols',
        'Invest in comprehensive documentation'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'PMI PMBOK Guide - distributed team studies',
      tags: ['distributed', 'communication', 'high-complexity']
    }
  },
  
  // ============================================
  // CASE 2: Skill Gap with New Technology
  // ============================================
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: New Framework Adoption',
      briefDescription: 'Project using unfamiliar technology stack',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: {
          teamRegions: ['Single Location'],
          timeOverlap: 8,
          requiresSyncComm: 'only_critical_moments',
          weeklyMeetings: 2,
          culturalDiversity: 'low',
          realTimeCommunicationLevel: 'medium'
        },
        technical: {
          mainTechnologies: ['New Framework', 'Cloud Platform'],
          experienceLevel: 'junior',
          systemComplexity: 'medium',
          documentationLevel: 'minimal',
          requiresSpecializedTools: true,
          sharedInfrastructureDependency: 'low'
        },
        team: {
          size: 6,
          weeklyHours: 40,
          distributedExperience: 'high',
          requiredLanguages: ['English'],
          languageProficiency: 'C1'
        },
        management: {
          methodology: 'agile',
          hasOnboarding: 'yes',
          hasCICD: 'partial',
          toolsFragmentation: 'low',
          clarityOfRequirements: 'high'
        },
        organizational: {
          involvedTeams: 1,
          criticalDependencies: 2,
          informationFlow: 'unidirectional',
          stakeholdersCount: 3
        }
      }
    },
    solution: {
      completed: true,
      onTime: false,
      delayDays: 28,
      budgetOverrun: 25,
      qualityScore: 3.8,
      clientSatisfaction: 4.0,
      teamMorale: 3.5,
      actualRisks: [
        {
          type: 'skill_gap',
          severity: 'high',
          description: 'Team learning curve steeper than expected',
          impact: 'schedule',
          rootCause: 'Insufficient training and lack of expert guidance',
          actualImpact: {
            scheduleDelayDays: 21,
            budgetOverrunPercent: 20,
            qualityImpact: 'medium'
          }
        },
        {
          type: 'technical_infrastructure',
          severity: 'medium',
          description: 'New tooling setup took longer than planned',
          impact: 'schedule',
          rootCause: 'Underestimated complexity of new platform',
          actualImpact: {
            scheduleDelayDays: 7,
            budgetOverrunPercent: 5,
            qualityImpact: 'low'
          }
        }
      ],
      metrics: {
        avgVelocity: 28,
        bugRate: 0.22,
        meetingEfficiency: 3.5,
        teamMoraleProgression: [4.0, 3.8, 3.5, 3.7],
        deploymentFrequency: 'bi-weekly',
        codeReviewTimeAvg: 3.0
      }
    },
    result: {
      lessonsLearned: [
        'Invest in upfront training when using new technologies',
        'Pair programming accelerates knowledge transfer',
        'Allow extra time for learning curve in estimates'
      ],
      successfulPractices: [
        {
          practice: 'Weekly knowledge sharing sessions',
          impact: 'Team competency improved faster',
          replicable: true
        },
        {
          practice: 'Brought in external consultant for first 3 weeks',
          impact: 'Reduced costly mistakes',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Expected team to learn on-the-job without structure',
          impact: 'Slow progress in first month',
          reason: 'No formal learning plan'
        }
      ],
      recommendations: [
        'Budget 2-3 weeks for intensive training',
        'Consider external expertise for first phase',
        'Increase estimates by 30-40% for new tech adoption'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'Standish Group Chaos Report - technology adoption studies',
      tags: ['skill-gap', 'new-technology', 'training']
    }
  },
  
  // ============================================
  // CASE 3: Team Overload
  // ============================================
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Multi-Project Resource Allocation',
      briefDescription: 'Team members spread across multiple concurrent projects',
      estimatedDuration: { value: 5, unit: 'months' },
      features: {
        coordination: {
          teamRegions: ['Single Location'],
          timeOverlap: 8,
          requiresSyncComm: 'no',
          weeklyMeetings: 3,
          culturalDiversity: 'low',
          realTimeCommunicationLevel: 'low'
        },
        technical: {
          mainTechnologies: ['Standard Stack'],
          experienceLevel: 'senior',
          systemComplexity: 'medium',
          documentationLevel: 'complete',
          requiresSpecializedTools: false,
          sharedInfrastructureDependency: 'medium'
        },
        team: {
          size: 8,
          weeklyHours: 50, // Overloaded
          distributedExperience: 'high',
          requiredLanguages: ['English'],
          languageProficiency: 'native'
        },
        management: {
          methodology: 'kanban',
          hasOnboarding: 'yes',
          hasCICD: 'yes',
          toolsFragmentation: 'high',
          clarityOfRequirements: 'high'
        },
        organizational: {
          involvedTeams: 2,
          criticalDependencies: 3,
          informationFlow: 'bidirectional',
          stakeholdersCount: 4
        }
      }
    },
    solution: {
      completed: true,
      onTime: false,
      delayDays: 42,
      budgetOverrun: 35,
      qualityScore: 3.2,
      clientSatisfaction: 3.0,
      teamMorale: 2.5,
      actualRisks: [
        {
          type: 'team_overload',
          severity: 'high',
          description: 'Team burnout due to excessive workload across multiple projects',
          impact: 'schedule',
          rootCause: 'Poor resource allocation and unrealistic expectations',
          actualImpact: {
            scheduleDelayDays: 35,
            budgetOverrunPercent: 30,
            qualityImpact: 'high'
          }
        },
        {
          type: 'quality_degradation',
          severity: 'medium',
          description: 'Quality suffered due to rushed work and fatigue',
          impact: 'quality',
          rootCause: 'Team trying to meet impossible deadlines',
          actualImpact: {
            scheduleDelayDays: 10,
            budgetOverrunPercent: 8,
            qualityImpact: 'medium'
          }
        }
      ],
      metrics: {
        avgVelocity: 22,
        bugRate: 0.31,
        meetingEfficiency: 2.5,
        teamMoraleProgression: [4.0, 3.5, 2.8, 2.5],
        deploymentFrequency: 'monthly',
        codeReviewTimeAvg: 4.5
      }
    },
    result: {
      lessonsLearned: [
        'Context switching between projects kills productivity',
        'Team morale directly impacts quality and schedule',
        'Burnout is expensive - prevention is critical'
      ],
      successfulPractices: [
        {
          practice: 'Eventually reduced scope and extended timeline',
          impact: 'Team recovered and delivered quality work',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Pushed team to work overtime consistently',
          impact: 'Decreased productivity and increased errors',
          reason: 'Unsustainable pace'
        },
        {
          practice: 'Spread team across too many projects',
          impact: 'High context switching overhead',
          reason: 'Poor resource planning'
        }
      ],
      recommendations: [
        'Limit concurrent projects per person to 2 maximum',
        'Monitor team workload weekly',
        'Have contingency resources available',
        'Reduce scope rather than push team beyond limits'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'Multiple industry surveys on developer burnout',
      tags: ['overload', 'burnout', 'resource-allocation']
    }
  },
  
  // ============================================
  // CASE 4: Scope Creep
  // ============================================
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Evolving Requirements Project',
      briefDescription: 'Project with initially vague requirements',
      estimatedDuration: { value: 3, unit: 'months' },
      features: {
        coordination: {
          teamRegions: ['Single Location'],
          timeOverlap: 8,
          requiresSyncComm: 'yes',
          weeklyMeetings: 4,
          culturalDiversity: 'low',
          realTimeCommunicationLevel: 'high'
        },
        technical: {
          mainTechnologies: ['Web Stack'],
          experienceLevel: 'mid',
          systemComplexity: 'medium',
          documentationLevel: 'minimal',
          requiresSpecializedTools: false,
          sharedInfrastructureDependency: 'low'
        },
        team: {
          size: 5,
          weeklyHours: 40,
          distributedExperience: 'medium',
          requiredLanguages: ['English'],
          languageProficiency: 'B2'
        },
        management: {
          methodology: 'waterfall',
          hasOnboarding: 'no',
          hasCICD: 'no',
          toolsFragmentation: 'medium',
          clarityOfRequirements: 'low'
        },
        organizational: {
          involvedTeams: 2,
          criticalDependencies: 1,
          informationFlow: 'bidirectional',
          stakeholdersCount: 6
        }
      }
    },
    solution: {
      completed: true,
      onTime: false,
      delayDays: 56,
      budgetOverrun: 45,
      qualityScore: 3.0,
      clientSatisfaction: 2.8,
      teamMorale: 2.8,
      actualRisks: [
        {
          type: 'scope_creep',
          severity: 'high',
          description: 'Scope grew by approximately 50% during project',
          impact: 'schedule',
          rootCause: 'Vague initial requirements and no change control',
          actualImpact: {
            scheduleDelayDays: 48,
            budgetOverrunPercent: 40,
            qualityImpact: 'medium'
          }
        }
      ],
      metrics: {
        avgVelocity: 18,
        bugRate: 0.25,
        meetingEfficiency: 2.3,
        teamMoraleProgression: [3.8, 3.5, 3.0, 2.8],
        deploymentFrequency: 'end-only',
        codeReviewTimeAvg: 2.0
      }
    },
    result: {
      lessonsLearned: [
        'Clear requirements upfront save massive time later',
        'Change control process is not optional',
        'Frequent stakeholder alignment prevents surprises'
      ],
      successfulPractices: [
        {
          practice: 'Eventually implemented change control board',
          impact: 'Stopped uncontrolled scope growth',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Accepted all feature requests without prioritization',
          impact: 'Project timeline became meaningless',
          reason: 'No formal change process'
        }
      ],
      recommendations: [
        'Invest 2-3 weeks in detailed requirements workshop',
        'Implement change control from day 1',
        'Define MVP clearly and stick to it',
        'Each new feature = something removed or timeline extended'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'PMI Pulse of the Profession - scope management',
      tags: ['scope-creep', 'requirements', 'change-management']
    }
  },
  
  // ============================================
  // CASE 5: Dependency Issues
  // ============================================
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Cross-Team Integration Project',
      briefDescription: 'Project requiring integration with multiple external teams',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: {
          teamRegions: ['Two Locations'],
          timeOverlap: 6,
          requiresSyncComm: 'yes',
          weeklyMeetings: 4,
          culturalDiversity: 'medium',
          realTimeCommunicationLevel: 'medium'
        },
        technical: {
          mainTechnologies: ['Microservices', 'APIs'],
          experienceLevel: 'senior',
          systemComplexity: 'high',
          documentationLevel: 'partial',
          requiresSpecializedTools: false,
          sharedInfrastructureDependency: 'high'
        },
        team: {
          size: 10,
          weeklyHours: 40,
          distributedExperience: 'medium',
          requiredLanguages: ['English'],
          languageProficiency: 'B2'
        },
        management: {
          methodology: 'agile',
          hasOnboarding: 'yes',
          hasCICD: 'yes',
          toolsFragmentation: 'low',
          clarityOfRequirements: 'medium'
        },
        organizational: {
          involvedTeams: 5,
          criticalDependencies: 8,
          informationFlow: 'multidirectional',
          stakeholdersCount: 8
        }
      }
    },
    solution: {
      completed: true,
      onTime: false,
      delayDays: 35,
      budgetOverrun: 28,
      qualityScore: 3.5,
      clientSatisfaction: 3.3,
      teamMorale: 3.2,
      actualRisks: [
        {
          type: 'dependency_blockage',
          severity: 'high',
          description: 'Frequent blocks waiting for other teams',
          impact: 'schedule',
          rootCause: 'Unclear dependencies and conflicting priorities',
          actualImpact: {
            scheduleDelayDays: 28,
            budgetOverrunPercent: 22,
            qualityImpact: 'medium'
          }
        }
      ],
      metrics: {
        avgVelocity: 32,
        bugRate: 0.18,
        meetingEfficiency: 3.0,
        teamMoraleProgression: [3.8, 3.5, 3.2, 3.2],
        deploymentFrequency: 'weekly',
        codeReviewTimeAvg: 2.2
      }
    },
    result: {
      lessonsLearned: [
        'Dependencies are often underestimated',
        'Weekly cross-team syncs are essential',
        'Mock services enable parallel development'
      ],
      successfulPractices: [
        {
          practice: 'Implemented formal SLAs between teams',
          impact: 'Improved accountability and reduced blocks',
          replicable: true
        },
        {
          practice: 'Created mock services for critical dependencies',
          impact: 'Team could work in parallel',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Assumed other teams would deliver on time',
          impact: 'Cascade delays',
          reason: 'No formal tracking'
        }
      ],
      recommendations: [
        'Map all dependencies in detail upfront',
        'Establish SLAs with dependent teams',
        'Build buffer time for integration (30%+)',
        'Use mock services for parallel development'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'Enterprise project management case studies',
      tags: ['dependencies', 'integration', 'cross-team']
    }
  }
];

/**
 * Load seed cases into database for an organization
 */
async function loadSeedCases(organizationId = null) {
  try {
    // Check if seed cases already exist
    const existingSeeds = await CaseBase.find({ type: 'seed' });
    
    if (existingSeeds.length >= SEED_CASES.length) {
      console.log(`Seed cases already loaded (${existingSeeds.length} found)`);
      return {
        loaded: false,
        count: existingSeeds.length,
        message: 'Seed cases already exist in database'
      };
    }
    
    // Create seed case documents
    const seedDocs = SEED_CASES.map(seedCase => ({
      ...seedCase,
      organization: organizationId, // Can be null for global seeds
      caseId: null // Seed cases don't reference real projects
    }));
    
    // Insert seed cases
    const inserted = await CaseBase.insertMany(seedDocs);
    
    console.log(`Loaded ${inserted.length} seed cases into database`);
    
    return {
      loaded: true,
      count: inserted.length,
      cases: inserted.map(c => ({
        id: c._id,
        projectName: c.problem.projectName,
        type: c.type
      })),
      message: `Successfully loaded ${inserted.length} seed cases`
    };
    
  } catch (error) {
    console.error('Error loading seed cases:', error);
    throw new Error(`Failed to load seed cases: ${error.message}`);
  }
}

/**
 * Get all available seed cases
 */
async function getSeedCases() {
  const seeds = await CaseBase.find({ type: 'seed' });
  
  return seeds.map(seed => ({
    id: seed._id,
    projectName: seed.problem.projectName,
    description: seed.problem.briefDescription,
    source: seed.metadata.basedOn,
    mainRisks: seed.solution.actualRisks.map(r => r.type),
    outcome: {
      completed: seed.solution.completed,
      delayDays: seed.solution.delayDays,
      budgetOverrun: seed.solution.budgetOverrun
    }
  }));
}

/**
 * Delete all seed cases (for testing/reset)
 */
async function deleteSeedCases() {
  const result = await CaseBase.deleteMany({ type: 'seed' });
  
  return {
    deleted: result.deletedCount,
    message: `Deleted ${result.deletedCount} seed cases`
  };
}

module.exports = {
  loadSeedCases,
  getSeedCases,
  deleteSeedCases,
  SEED_CASES
};
