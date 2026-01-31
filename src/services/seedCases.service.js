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
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Multi-Region Software Development',
      briefDescription: 'Software project with team distributed across 3+ time zones',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: {
          involvedCountries: ['North America', 'Europe', 'Asia'],
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
      completed: true,qualityScore: 3.5,
      clientSatisfaction: 3.2,
      teamMorale: 3.0,
      actualRisks: [
        {
          type: 'communication_breakdown',
          severity: 'high',
          description: 'Time zone differences caused delays in decision-making and problem resolution',
          impact: 'schedule',
          rootCause: 'Insufficient overlap hours and lack of async-first protocols',
          actualImpact: {qualityImpact: 'medium'
          }
        },
        {
          type: 'process_mismatch',
          severity: 'medium',
          description: 'Scrum ceremonies were inefficient with distributed team',
          impact: 'productivity',
          rootCause: 'Traditional Scrum not adapted for remote/distributed context',
          actualImpact: {qualityImpact: 'low'
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
  
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: New Framework Adoption',
      briefDescription: 'Project using unfamiliar technology stack',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: {
          involvedCountries: ['Single Location'],
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
      completed: true,qualityScore: 3.8,
      clientSatisfaction: 4.0,
      teamMorale: 3.5,
      actualRisks: [
        {
          type: 'skill_gap',
          severity: 'high',
          description: 'Team learning curve steeper than expected',
          impact: 'schedule',
          rootCause: 'Insufficient training and lack of expert guidance',
          actualImpact: {qualityImpact: 'medium'
          }
        },
        {
          type: 'technical_infrastructure',
          severity: 'medium',
          description: 'New tooling setup took longer than planned',
          impact: 'schedule',
          rootCause: 'Underestimated complexity of new platform',
          actualImpact: {qualityImpact: 'low'
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
  
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Multi-Project Resource Allocation',
      briefDescription: 'Team members spread across multiple concurrent projects',
      estimatedDuration: { value: 5, unit: 'months' },
      features: {
        coordination: {
          involvedCountries: ['Single Location'],
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
      completed: true,qualityScore: 3.2,
      clientSatisfaction: 3.0,
      teamMorale: 2.5,
      actualRisks: [
        {
          type: 'team_overload',
          severity: 'high',
          description: 'Team burnout due to excessive workload across multiple projects',
          impact: 'schedule',
          rootCause: 'Poor resource allocation and unrealistic expectations',
          actualImpact: {qualityImpact: 'high'
          }
        },
        {
          type: 'quality_degradation',
          severity: 'medium',
          description: 'Quality suffered due to rushed work and fatigue',
          impact: 'quality',
          rootCause: 'Team trying to meet impossible deadlines',
          actualImpact: {qualityImpact: 'medium'
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

  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Evolving Requirements Project',
      briefDescription: 'Project with initially vague requirements',
      estimatedDuration: { value: 3, unit: 'months' },
      features: {
        coordination: {
          involvedCountries: ['Single Location'],
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
      completed: true,qualityScore: 3.0,
      clientSatisfaction: 2.8,
      teamMorale: 2.8,
      actualRisks: [
        {
          type: 'scope_creep',
          severity: 'high',
          description: 'Scope grew by approximately 50% during project',
          impact: 'schedule',
          rootCause: 'Vague initial requirements and no change control',
          actualImpact: {qualityImpact: 'medium'
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
  
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Cross-Team Integration Project',
      briefDescription: 'Project requiring integration with multiple external teams',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: {
          involvedCountries: ['Two Locations'],
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
      completed: true,qualityScore: 3.5,
      clientSatisfaction: 3.3,
      teamMorale: 3.2,
      actualRisks: [
        {
          type: 'dependency_blockage',
          severity: 'high',
          description: 'Frequent blocks waiting for other teams',
          impact: 'schedule',
          rootCause: 'Unclear dependencies and conflicting priorities',
          actualImpact: {qualityImpact: 'medium'
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
  },
  
  // Additional 20 cases for Phase 3 testing (reaching 25+ cases)
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Microservices Migration',
      briefDescription: 'Legacy monolith to microservices migration',
      estimatedDuration: { value: 8, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 3, culturalDiversity: 'low', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Java', 'Spring Boot', 'Docker', 'Kubernetes'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'partial', requiresSpecializedTools: true, sharedInfrastructureDependency: 'high' },
        team: { size: 15, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'partial', toolsFragmentation: 'medium', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 4, criticalDependencies: 12, informationFlow: 'bidirectional', stakeholdersCount: 6 }
      }
    },
    solution: { completed: true, qualityScore: 3.8, clientSatisfaction: 4.0, teamMorale: 3.5, actualRisks: [{ type: 'technical_debt', severity: 'high', description: 'Legacy code dependencies slowed migration', impact: 'schedule', rootCause: 'Insufficient technical analysis', actualImpact: { qualityImpact: 'high' } }], metrics: { avgVelocity: 28, bugRate: 0.22, meetingEfficiency: 3.5, teamMoraleProgression: [4.0, 3.8, 3.5, 3.5], deploymentFrequency: 'bi-weekly', codeReviewTimeAvg: 3.0 } },
    result: { lessonsLearned: ['Proper architecture analysis is critical', 'Incremental migration reduces risk'], successfulPractices: [{ practice: 'Strangler pattern implementation', impact: 'Gradual migration', replicable: true }], unsuccessfulPractices: [{ practice: 'Big bang approach initially attempted', impact: 'Delays and rollbacks', reason: 'Too risky' }], recommendations: ['Use strangler pattern', 'Invest in comprehensive testing'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Migration case studies', tags: ['migration', 'architecture', 'technical'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Mobile App Development - Startup',
      briefDescription: 'MVP mobile app for startup with tight deadlines',
      estimatedDuration: { value: 3, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 5, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['React Native', 'Firebase'], experienceLevel: 'mid', systemComplexity: 'medium', documentationLevel: 'minimal', requiresSpecializedTools: false, sharedInfrastructureDependency: 'low' },
        team: { size: 5, weeklyHours: 50, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'no', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 1, criticalDependencies: 2, informationFlow: 'unidirectional', stakeholdersCount: 3 }
      }
    },
    solution: { completed: true, qualityScore: 3.2, clientSatisfaction: 3.5, teamMorale: 2.8, actualRisks: [{ type: 'scope_creep', severity: 'high', description: 'Constant requirement changes', impact: 'scope', rootCause: 'Startup pivot mentality', actualImpact: { qualityImpact: 'medium' } }, { type: 'team_burnout', severity: 'medium', description: 'Extended hours caused fatigue', impact: 'quality', rootCause: 'Unrealistic deadlines', actualImpact: { qualityImpact: 'medium' } }], metrics: { avgVelocity: 40, bugRate: 0.28, meetingEfficiency: 2.5, teamMoraleProgression: [3.5, 3.0, 2.8, 2.5], deploymentFrequency: 'daily', codeReviewTimeAvg: 1.0 } },
    result: { lessonsLearned: ['MVP scope discipline critical', 'Burnout impacts quality'], successfulPractices: [{ practice: 'Feature flags for incremental releases', impact: 'Faster feedback', replicable: true }], unsuccessfulPractices: [{ practice: 'Working 50+ hours weekly', impact: 'Team burnout', reason: 'Unsustainable' }], recommendations: ['Protect MVP scope', 'Limit overtime', 'Use feature flags'] },
    metadata: { confidence: 0.6, isGeneric: true, basedOn: 'Startup project analysis', tags: ['mobile', 'mvp', 'startup'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Data Platform - Enterprise',
      briefDescription: 'Enterprise data lake and analytics platform',
      estimatedDuration: { value: 12, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America', 'Asia'], timeOverlap: 3, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'high', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Python', 'Spark', 'AWS'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 20, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 6, criticalDependencies: 10, informationFlow: 'multidirectional', stakeholdersCount: 12 }
      }
    },
    solution: { completed: true, qualityScore: 4.2, clientSatisfaction: 4.5, teamMorale: 4.0, actualRisks: [{ type: 'knowledge_gaps', severity: 'medium', description: 'Learning curve for new tech stack', impact: 'schedule', rootCause: 'Emerging technologies', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 35, bugRate: 0.12, meetingEfficiency: 4.0, teamMoraleProgression: [3.8, 4.0, 4.0, 4.2], deploymentFrequency: 'bi-weekly', codeReviewTimeAvg: 2.5 } },
    result: { lessonsLearned: ['Good documentation prevents issues', 'Async communication works at scale'], successfulPractices: [{ practice: 'Comprehensive documentation', impact: 'Smooth knowledge transfer', replicable: true }, { practice: 'Async-first communication', impact: 'Productive across timezones', replicable: true }], unsuccessfulPractices: [], recommendations: ['Invest in documentation', 'Use async patterns for distributed teams'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Enterprise data projects', tags: ['data', 'enterprise', 'distributed'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Legacy System Upgrade',
      briefDescription: 'Major version upgrade of critical business system',
      estimatedDuration: { value: 5, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'low', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['.NET', 'SQL Server'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'minimal', requiresSpecializedTools: false, sharedInfrastructureDependency: 'high' },
        team: { size: 8, weeklyHours: 35, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'waterfall', hasOnboarding: 'partial', hasCICD: 'no', toolsFragmentation: 'high', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 3, criticalDependencies: 15, informationFlow: 'unidirectional', stakeholdersCount: 8 }
      }
    },
    solution: { completed: true, qualityScore: 3.0, clientSatisfaction: 3.2, teamMorale: 3.0, actualRisks: [{ type: 'technical_debt', severity: 'very_high', description: 'Undocumented dependencies caused issues', impact: 'schedule', rootCause: 'Poor legacy documentation', actualImpact: { qualityImpact: 'high' } }, { type: 'resistance_to_change', severity: 'medium', description: 'Users resisted new interface', impact: 'adoption', rootCause: 'Insufficient change management', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 22, bugRate: 0.35, meetingEfficiency: 2.8, teamMoraleProgression: [3.5, 3.2, 3.0, 2.8], deploymentFrequency: 'monthly', codeReviewTimeAvg: 4.0 } },
    result: { lessonsLearned: ['Legacy analysis phase critical', 'Change management essential'], successfulPractices: [{ practice: 'Extensive testing in staging', impact: 'Caught major issues early', replicable: true }], unsuccessfulPractices: [{ practice: 'Minimal user training', impact: 'Adoption resistance', reason: 'Budget constraints' }], recommendations: ['Dedicate time for legacy analysis', 'Invest in change management and training'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Legacy upgrade projects', tags: ['legacy', 'upgrade', 'technical-debt'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: IoT Platform Development',
      briefDescription: 'IoT data collection and monitoring platform',
      estimatedDuration: { value: 10, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe', 'Asia'], timeOverlap: 4, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 3, culturalDiversity: 'high', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Python', 'MQTT', 'TimescaleDB', 'React'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'high' },
        team: { size: 12, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 5, criticalDependencies: 8, informationFlow: 'bidirectional', stakeholdersCount: 7 }
      }
    },
    solution: { completed: true, qualityScore: 4.0, clientSatisfaction: 4.2, teamMorale: 3.8, actualRisks: [{ type: 'third_party_dependency', severity: 'medium', description: 'Hardware vendor delays impacted timeline', impact: 'schedule', rootCause: 'External dependency', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 30, bugRate: 0.15, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.8, 3.8, 4.0], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.0 } },
    result: { lessonsLearned: ['Hardware dependencies need buffers', 'Simulator development accelerates testing'], successfulPractices: [{ practice: 'Built hardware simulators', impact: 'Parallel development possible', replicable: true }], unsuccessfulPractices: [{ practice: 'Waited for hardware delivery', impact: 'Initial delays', reason: 'No simulation strategy' }], recommendations: ['Build simulators for hardware dependencies', 'Add 30% buffer for vendor delays'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'IoT project studies', tags: ['iot', 'hardware', 'real-time'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: API Gateway Implementation',
      briefDescription: 'Central API gateway for microservices ecosystem',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 4, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Kong', 'Kubernetes', 'OAuth2'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'very_high' },
        team: { size: 6, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 8, criticalDependencies: 20, informationFlow: 'multidirectional', stakeholdersCount: 15 }
      }
    },
    solution: { completed: true, qualityScore: 4.5, clientSatisfaction: 4.7, teamMorale: 4.2, actualRisks: [], metrics: { avgVelocity: 38, bugRate: 0.08, meetingEfficiency: 4.5, teamMoraleProgression: [4.0, 4.2, 4.2, 4.5], deploymentFrequency: 'daily', codeReviewTimeAvg: 1.5 } },
    result: { lessonsLearned: ['Clear requirements prevent issues', 'Good team sync critical for shared infrastructure'], successfulPractices: [{ practice: 'Regular sync with consuming teams', impact: 'Alignment and early feedback', replicable: true }, { practice: 'Comprehensive API documentation', impact: 'Smooth adoption', replicable: true }], unsuccessfulPractices: [], recommendations: ['Maintain clear communication with all dependent teams', 'Invest heavily in documentation and examples'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'API gateway implementations', tags: ['api', 'infrastructure', 'integration'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Machine Learning Pipeline',
      briefDescription: 'ML model training and deployment pipeline',
      estimatedDuration: { value: 7, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America', 'Europe'], timeOverlap: 5, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'medium', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Python', 'TensorFlow', 'MLflow', 'Kubernetes'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 10, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'medium', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 3, criticalDependencies: 6, informationFlow: 'bidirectional', stakeholdersCount: 5 }
      }
    },
    solution: { completed: true, qualityScore: 3.8, clientSatisfaction: 4.0, teamMorale: 3.5, actualRisks: [{ type: 'unclear_requirements', severity: 'high', description: 'Model performance criteria evolved', impact: 'scope', rootCause: 'ML project uncertainty', actualImpact: { qualityImpact: 'medium' } }], metrics: { avgVelocity: 25, bugRate: 0.18, meetingEfficiency: 3.5, teamMoraleProgression: [3.8, 3.5, 3.5, 3.8], deploymentFrequency: 'weekly', codeReviewTimeAvg: 3.0 } },
    result: { lessonsLearned: ['ML requirements are inherently uncertain', 'Iterative approach essential'], successfulPractices: [{ practice: 'Regular model performance reviews with stakeholders', impact: 'Aligned expectations', replicable: true }], unsuccessfulPractices: [{ practice: 'Fixed accuracy target upfront', impact: 'Unrealistic expectations', reason: 'ML nature' }], recommendations: ['Accept uncertainty in ML projects', 'Use iterative approach with regular reviews', 'Define performance criteria ranges, not fixed targets'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'ML project patterns', tags: ['ml', 'ai', 'data-science'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Security Hardening Initiative',
      briefDescription: 'Application security audit and remediation',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 3, culturalDiversity: 'low', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Security Tools', 'OWASP'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'partial', requiresSpecializedTools: true, sharedInfrastructureDependency: 'very_high' },
        team: { size: 7, weeklyHours: 40, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'medium', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 10, criticalDependencies: 15, informationFlow: 'multidirectional', stakeholdersCount: 20 }
      }
    },
    solution: { completed: true, qualityScore: 4.5, clientSatisfaction: 4.8, teamMorale: 4.0, actualRisks: [{ type: 'dependency_blockage', severity: 'medium', description: 'Waiting for teams to implement fixes', impact: 'schedule', rootCause: 'Multiple team dependencies', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 35, bugRate: 0.10, meetingEfficiency: 4.0, teamMoraleProgression: [3.8, 4.0, 4.0, 4.2], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.0 } },
    result: { lessonsLearned: ['Security needs buy-in from all teams', 'Prioritization framework critical'], successfulPractices: [{ practice: 'Risk-based prioritization', impact: 'Focused on critical issues', replicable: true }], unsuccessfulPractices: [{ practice: 'Fixed all findings equally', impact: 'Resource waste initially', reason: 'Wrong prioritization' }], recommendations: ['Use risk-based prioritization', 'Get executive sponsorship for security initiatives'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Security initiative studies', tags: ['security', 'audit', 'cross-team'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: DevOps Transformation',
      briefDescription: 'CI/CD pipeline and infrastructure as code implementation',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 4, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Terraform', 'Jenkins', 'Docker', 'AWS'], experienceLevel: 'mid', systemComplexity: 'high', documentationLevel: 'partial', requiresSpecializedTools: true, sharedInfrastructureDependency: 'very_high' },
        team: { size: 8, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'partial', toolsFragmentation: 'high', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 12, criticalDependencies: 18, informationFlow: 'multidirectional', stakeholdersCount: 15 }
      }
    },
    solution: { completed: true, qualityScore: 3.7, clientSatisfaction: 3.9, teamMorale: 3.3, actualRisks: [{ type: 'resistance_to_change', severity: 'high', description: 'Development teams resistant to new processes', impact: 'adoption', rootCause: 'Cultural change management', actualImpact: { qualityImpact: 'medium' } }, { type: 'knowledge_gaps', severity: 'medium', description: 'Team learning curve for new tools', impact: 'schedule', rootCause: 'New technology stack', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 28, bugRate: 0.20, meetingEfficiency: 3.2, teamMoraleProgression: [3.5, 3.3, 3.2, 3.5], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.8 } },
    result: { lessonsLearned: ['Cultural change as important as technical', 'Training investment pays off'], successfulPractices: [{ practice: 'Champions program in each team', impact: 'Grassroots adoption', replicable: true }], unsuccessfulPractices: [{ practice: 'Top-down mandate without training', impact: 'Initial resistance', reason: 'Poor change management' }], recommendations: ['Invest in training and workshops', 'Use champion model for adoption', 'Start with pilot teams'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'DevOps transformation studies', tags: ['devops', 'transformation', 'culture'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Cloud Native Refactoring',
      briefDescription: 'Refactor legacy app for cloud-native deployment',
      estimatedDuration: { value: 9, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Asia', 'Europe'], timeOverlap: 2, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'high', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Java', 'Spring Cloud', 'Kubernetes', 'Redis'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'minimal', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 14, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'medium', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 4, criticalDependencies: 10, informationFlow: 'bidirectional', stakeholdersCount: 8 }
      }
    },
    solution: { completed: true, qualityScore: 3.5, clientSatisfaction: 3.7, teamMorale: 3.2, actualRisks: [{ type: 'technical_debt', severity: 'very_high', description: 'Significant refactoring needed for cloud patterns', impact: 'schedule', rootCause: 'Legacy architecture assumptions', actualImpact: { qualityImpact: 'high' } }, { type: 'communication_breakdown', severity: 'medium', description: 'Timezone challenges with 2h overlap', impact: 'coordination', rootCause: 'Insufficient async processes', actualImpact: { qualityImpact: 'medium' } }], metrics: { avgVelocity: 24, bugRate: 0.25, meetingEfficiency: 2.8, teamMoraleProgression: [3.5, 3.2, 3.0, 3.2], deploymentFrequency: 'bi-weekly', codeReviewTimeAvg: 3.5 } },
    result: { lessonsLearned: ['Cloud-native requires architectural mindset change', 'Async communication essential with minimal overlap'], successfulPractices: [{ practice: 'Architecture decision records (ADRs)', impact: 'Clear documentation of decisions', replicable: true }], unsuccessfulPractices: [{ practice: 'Synchronous decision-making with 2h overlap', impact: 'Bottlenecks', reason: 'Wrong communication model' }], recommendations: ['Establish async-first culture', 'Use ADRs for architecture decisions', 'Increase overlap or accept slower pace'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Cloud migration projects', tags: ['cloud', 'refactoring', 'distributed'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Real-Time Analytics Dashboard',
      briefDescription: 'Business intelligence dashboard with real-time data',
      estimatedDuration: { value: 5, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 3, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['React', 'GraphQL', 'PostgreSQL', 'Kafka'], experienceLevel: 'mid', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: false, sharedInfrastructureDependency: 'medium' },
        team: { size: 9, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 2, criticalDependencies: 5, informationFlow: 'unidirectional', stakeholdersCount: 10 }
      }
    },
    solution: { completed: true, qualityScore: 3.9, clientSatisfaction: 4.1, teamMorale: 3.7, actualRisks: [{ type: 'scope_creep', severity: 'high', description: 'Constant new widget requests', impact: 'scope', rootCause: 'Unclear initial requirements', actualImpact: { qualityImpact: 'medium' } }], metrics: { avgVelocity: 33, bugRate: 0.16, meetingEfficiency: 3.5, teamMoraleProgression: [3.5, 3.7, 3.7, 3.9], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.2 } },
    result: { lessonsLearned: ['BI requirements evolve - plan for it', 'Stakeholder demos drive clarity'], successfulPractices: [{ practice: 'Weekly demos with stakeholders', impact: 'Early feedback prevented waste', replicable: true }], unsuccessfulPractices: [{ practice: 'Build everything upfront', impact: 'Wasted effort on unused features', reason: 'Wrong approach' }], recommendations: ['Use iterative approach with frequent demos', 'Build core framework first, add widgets incrementally'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'BI project studies', tags: ['bi', 'analytics', 'frontend'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Payment Gateway Integration',
      briefDescription: 'Multi-provider payment processing integration',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 4, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Node.js', 'Stripe', 'PayPal API'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: false, sharedInfrastructureDependency: 'high' },
        team: { size: 6, weeklyHours: 40, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 3, criticalDependencies: 8, informationFlow: 'bidirectional', stakeholdersCount: 6 }
      }
    },
    solution: { completed: true, qualityScore: 4.3, clientSatisfaction: 4.6, teamMorale: 4.1, actualRisks: [{ type: 'third_party_dependency', severity: 'low', description: 'Minor API changes by providers', impact: 'maintenance', rootCause: 'External service evolution', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 36, bugRate: 0.09, meetingEfficiency: 4.2, teamMoraleProgression: [4.0, 4.1, 4.1, 4.3], deploymentFrequency: 'weekly', codeReviewTimeAvg: 1.8 } },
    result: { lessonsLearned: ['Abstraction layer critical for multi-provider', 'Extensive testing crucial for payment systems'], successfulPractices: [{ practice: 'Provider abstraction layer', impact: 'Easy to add/switch providers', replicable: true }, { practice: 'Comprehensive test suite', impact: 'Zero payment bugs in production', replicable: true }], unsuccessfulPractices: [], recommendations: ['Build abstraction layer from day one', 'Invest heavily in automated testing', 'Use sandbox environments extensively'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'Payment integration projects', tags: ['payment', 'integration', 'third-party'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Multi-Tenant SaaS Platform',
      briefDescription: 'Build multi-tenant SaaS from existing single-tenant app',
      estimatedDuration: { value: 8, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 5, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Ruby on Rails', 'PostgreSQL', 'Redis'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'partial', requiresSpecializedTools: false, sharedInfrastructureDependency: 'very_high' },
        team: { size: 11, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 4, criticalDependencies: 12, informationFlow: 'bidirectional', stakeholdersCount: 8 }
      }
    },
    solution: { completed: true, qualityScore: 3.6, clientSatisfaction: 3.8, teamMorale: 3.3, actualRisks: [{ type: 'technical_complexity', severity: 'very_high', description: 'Data isolation challenges', impact: 'quality', rootCause: 'Multi-tenancy complexity underestimated', actualImpact: { qualityImpact: 'high' } }, { type: 'scope_underestimation', severity: 'high', description: 'Tenant management features grew scope', impact: 'schedule', rootCause: 'Incomplete requirements', actualImpact: { qualityImpact: 'medium' } }], metrics: { avgVelocity: 26, bugRate: 0.23, meetingEfficiency: 3.3, teamMoraleProgression: [3.5, 3.3, 3.2, 3.5], deploymentFrequency: 'weekly', codeReviewTimeAvg: 3.2 } },
    result: { lessonsLearned: ['Multi-tenancy more complex than expected', 'Data isolation patterns need careful design'], successfulPractices: [{ practice: 'Schema-based tenant isolation', impact: 'Clear separation and security', replicable: true }], unsuccessfulPractices: [{ practice: 'Underestimated tenant management features', impact: 'Scope creep', reason: 'Incomplete analysis' }], recommendations: ['Design data isolation strategy upfront', 'Include tenant management in initial scope', 'Add 40% buffer for multi-tenant complexity'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'SaaS transformation projects', tags: ['saas', 'multi-tenant', 'architecture'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Compliance & GDPR Implementation',
      briefDescription: 'GDPR compliance updates across application',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 3, culturalDiversity: 'low', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Various'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'minimal', requiresSpecializedTools: false, sharedInfrastructureDependency: 'very_high' },
        team: { size: 10, weeklyHours: 40, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'waterfall', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'high', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 15, criticalDependencies: 25, informationFlow: 'multidirectional', stakeholdersCount: 20 }
      }
    },
    solution: { completed: true, qualityScore: 4.2, clientSatisfaction: 4.5, teamMorale: 3.5, actualRisks: [{ type: 'dependency_blockage', severity: 'high', description: 'Waiting for legal reviews and approvals', impact: 'schedule', rootCause: 'Legal process bottlenecks', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 30, bugRate: 0.11, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.5, 3.4, 3.5], deploymentFrequency: 'bi-weekly', codeReviewTimeAvg: 2.5 } },
    result: { lessonsLearned: ['Legal review time needs buffer', 'Compliance projects need cross-team coordination'], successfulPractices: [{ practice: 'Central compliance committee', impact: 'Consistent approach across teams', replicable: true }], unsuccessfulPractices: [{ practice: 'Each team interpreted requirements independently', impact: 'Inconsistencies initially', reason: 'Lack of coordination' }], recommendations: ['Establish central compliance authority', 'Add significant buffer for legal reviews', 'Document all compliance decisions centrally'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Compliance project studies', tags: ['compliance', 'gdpr', 'legal'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Performance Optimization Initiative',
      briefDescription: 'Application-wide performance improvements',
      estimatedDuration: { value: 3, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'low', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Various'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 7, weeklyHours: 35, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'kanban', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 5, criticalDependencies: 10, informationFlow: 'bidirectional', stakeholdersCount: 6 }
      }
    },
    solution: { completed: true, qualityScore: 4.5, clientSatisfaction: 4.8, teamMorale: 4.3, actualRisks: [], metrics: { avgVelocity: 40, bugRate: 0.07, meetingEfficiency: 4.5, teamMoraleProgression: [4.0, 4.2, 4.3, 4.5], deploymentFrequency: 'daily', codeReviewTimeAvg: 1.5 } },
    result: { lessonsLearned: ['Data-driven optimization prevents waste', 'Low-hanging fruit should go first'], successfulPractices: [{ practice: 'Performance budgets per page', impact: 'Clear targets and accountability', replicable: true }, { practice: 'Profiling before optimization', impact: 'Focused on actual bottlenecks', replicable: true }], unsuccessfulPractices: [], recommendations: ['Always profile first', 'Set performance budgets', 'Prioritize by impact/effort ratio', 'Automate performance testing'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'Performance optimization studies', tags: ['performance', 'optimization', 'technical'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Accessibility Compliance (WCAG)',
      briefDescription: 'Bring application to WCAG 2.1 AA compliance',
      estimatedDuration: { value: 5, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'low', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['HTML', 'CSS', 'JavaScript', 'ARIA'], experienceLevel: 'mid', systemComplexity: 'medium', documentationLevel: 'partial', requiresSpecializedTools: true, sharedInfrastructureDependency: 'low' },
        team: { size: 8, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 2, criticalDependencies: 3, informationFlow: 'unidirectional', stakeholdersCount: 4 }
      }
    },
    solution: { completed: true, qualityScore: 4.3, clientSatisfaction: 4.6, teamMorale: 4.0, actualRisks: [{ type: 'knowledge_gaps', severity: 'medium', description: 'Team learning curve for WCAG standards', impact: 'schedule', rootCause: 'New domain knowledge', actualImpact: { qualityImpact: 'low' } }], metrics: { avgVelocity: 32, bugRate: 0.13, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.8, 4.0, 4.2], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.3 } },
    result: { lessonsLearned: ['Accessibility is easier when built-in from start', 'Automated testing catches most issues'], successfulPractices: [{ practice: 'Automated accessibility testing in CI/CD', impact: 'Caught regressions early', replicable: true }, { practice: 'User testing with assistive tech users', impact: 'Found real-world issues', replicable: true }], unsuccessfulPractices: [{ practice: 'Manual testing only', impact: 'Missed many issues initially', reason: 'Not scalable' }], recommendations: ['Integrate accessibility testing in CI/CD', 'Train team on WCAG standards', 'Include users with disabilities in testing'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Accessibility projects', tags: ['accessibility', 'wcag', 'frontend'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Chatbot & NLP Integration',
      briefDescription: 'Customer service chatbot with NLP',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America', 'Asia'], timeOverlap: 4, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 3, culturalDiversity: 'high', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Python', 'Dialogflow', 'Node.js', 'WebSocket'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 9, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'medium', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 4, criticalDependencies: 6, informationFlow: 'bidirectional', stakeholdersCount: 8 }
      }
    },
    solution: { completed: true, qualityScore: 3.5, clientSatisfaction: 3.7, teamMorale: 3.4, actualRisks: [{ type: 'unclear_requirements', severity: 'high', description: 'NLP accuracy expectations unclear', impact: 'scope', rootCause: 'AI project uncertainty', actualImpact: { qualityImpact: 'high' } }, { type: 'third_party_dependency', severity: 'medium', description: 'NLP service limitations discovered late', impact: 'features', rootCause: 'Insufficient evaluation', actualImpact: { qualityImpact: 'medium' } }], metrics: { avgVelocity: 27, bugRate: 0.21, meetingEfficiency: 3.2, teamMoraleProgression: [3.5, 3.4, 3.3, 3.5], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.8 } },
    result: { lessonsLearned: ['AI project expectations need management', 'Fallback to human essential'], successfulPractices: [{ practice: 'Human escalation path', impact: 'User satisfaction maintained', replicable: true }], unsuccessfulPractices: [{ practice: 'Promised 95% accuracy upfront', impact: 'Unrealistic expectations', reason: 'AI uncertainty' }], recommendations: ['Set realistic AI expectations', 'Build human fallback from day one', 'Use confidence thresholds for escalation'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Chatbot project studies', tags: ['chatbot', 'nlp', 'ai'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Blockchain Integration POC',
      briefDescription: 'Proof of concept for blockchain-based feature',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 4, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Solidity', 'Ethereum', 'Web3.js'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'minimal', requiresSpecializedTools: true, sharedInfrastructureDependency: 'low' },
        team: { size: 5, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'partial', hasCICD: 'partial', toolsFragmentation: 'high', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 2, criticalDependencies: 4, informationFlow: 'unidirectional', stakeholdersCount: 5 }
      }
    },
    solution: { completed: true, qualityScore: 3.2, clientSatisfaction: 3.4, teamMorale: 3.8, actualRisks: [{ type: 'knowledge_gaps', severity: 'very_high', description: 'Steep blockchain learning curve', impact: 'schedule', rootCause: 'New technology domain', actualImpact: { qualityImpact: 'high' } }, { type: 'technical_complexity', severity: 'high', description: 'Smart contract bugs difficult to fix', impact: 'quality', rootCause: 'Immutable nature of blockchain', actualImpact: { qualityImpact: 'high' } }], metrics: { avgVelocity: 20, bugRate: 0.30, meetingEfficiency: 3.5, teamMoraleProgression: [3.2, 3.5, 3.8, 3.8], deploymentFrequency: 'monthly', codeReviewTimeAvg: 4.5 } },
    result: { lessonsLearned: ['Blockchain has significant learning curve', 'Testing strategies different from traditional apps'], successfulPractices: [{ practice: 'Extensive testing on test networks', impact: 'Caught critical bugs', replicable: true }], unsuccessfulPractices: [{ practice: 'Rushed to mainnet deployment', impact: 'Bug discovered in production', reason: 'Insufficient testing' }], recommendations: ['Allow extra time for learning', 'Use test networks extensively', 'Audit smart contracts before mainnet', 'Consider if blockchain truly needed'] },
    metadata: { confidence: 0.6, isGeneric: true, basedOn: 'Blockchain POC studies', tags: ['blockchain', 'poc', 'emerging-tech'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Observability Platform Setup',
      briefDescription: 'Implement monitoring, logging, and tracing',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'low', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Prometheus', 'Grafana', 'ELK Stack', 'Jaeger'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'very_high' },
        team: { size: 6, weeklyHours: 40, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'kanban', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 8, criticalDependencies: 12, informationFlow: 'multidirectional', stakeholdersCount: 12 }
      }
    },
    solution: { completed: true, qualityScore: 4.6, clientSatisfaction: 4.8, teamMorale: 4.4, actualRisks: [], metrics: { avgVelocity: 38, bugRate: 0.06, meetingEfficiency: 4.3, teamMoraleProgression: [4.0, 4.2, 4.4, 4.6], deploymentFrequency: 'weekly', codeReviewTimeAvg: 1.8 } },
    result: { lessonsLearned: ['Observability pays dividends quickly', 'Start with golden signals'], successfulPractices: [{ practice: 'Focus on SLIs/SLOs/SLAs first', impact: 'Clear metrics for success', replicable: true }, { practice: 'Dashboards for each team', impact: 'Team ownership of metrics', replicable: true }], unsuccessfulPractices: [], recommendations: ['Start with golden signals (latency, traffic, errors, saturation)', 'Define SLOs with teams', 'Make dashboards accessible to all', 'Automate alert management'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'Observability implementation projects', tags: ['observability', 'monitoring', 'devops'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Generic: Technical Documentation Overhaul',
      briefDescription: 'Comprehensive technical documentation project',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'low', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Markdown', 'Documentation Tools'], experienceLevel: 'mid', systemComplexity: 'low', documentationLevel: 'minimal', requiresSpecializedTools: false, sharedInfrastructureDependency: 'low' },
        team: { size: 6, weeklyHours: 30, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'yes', hasCICD: 'no', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 10, criticalDependencies: 5, informationFlow: 'unidirectional', stakeholdersCount: 15 }
      }
    },
    solution: { completed: true, qualityScore: 4.4, clientSatisfaction: 4.7, teamMorale: 3.9, actualRisks: [{ type: 'knowledge_silos', severity: 'medium', description: 'Information scattered across teams', impact: 'schedule', rootCause: 'No central knowledge repository', actualImpact: { qualityImpact: 'medium' } }], metrics: { avgVelocity: 35, bugRate: 0.05, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.7, 3.9, 4.1], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.0 } },
    result: { lessonsLearned: ['Documentation as code works well', 'Team contributions need incentives'], successfulPractices: [{ practice: 'Docs-as-code with version control', impact: 'Easy maintenance and review', replicable: true }, { practice: 'Quarterly docs review sessions', impact: 'Kept docs up to date', replicable: true }], unsuccessfulPractices: [{ practice: 'Relying on volunteers for contributions', impact: 'Slow progress', reason: 'No accountability' }], recommendations: ['Treat documentation as first-class deliverable', 'Use docs-as-code approach', 'Make documentation part of definition of done', 'Schedule regular review sessions'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Documentation project studies', tags: ['documentation', 'knowledge', 'process'] }
  }
];

/**
 * Load seed cases into database for an organization
 */
async function loadSeedCases(organizationId = null) {
  try {
    const existingSeeds = await CaseBase.find({ type: 'seed' });
    
    if (existingSeeds.length >= SEED_CASES.length) {
      return {
        loaded: false,
        count: existingSeeds.length,
        message: 'Seed cases already exist in database'
      };
    }
    
    const seedDocs = SEED_CASES.map(seedCase => ({
      ...seedCase,
      ...(organizationId ? { organization: organizationId } : {})
    }));
    
    // Insert one by one to avoid duplicate key errors on caseId index
    const inserted = [];
    for (const doc of seedDocs) {
      try {
        const result = await CaseBase.create(doc);
        inserted.push(result);
      } catch (err) {
        // Skip if duplicate, but log other errors
        if (err.code !== 11000) {
          console.warn('Warning: Could not insert seed case:', err.message);
        }
      }
    }
    
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
