// Seed Risks and CBR Cases
const seedRisksAndCases = async (projects, organizations) => {
  console.log('\n⚠️  Creating risks and CBR cases...');
  
  const Risk = require('../../src/models/risk.model');
  const CaseBase = require('../../src/models/caseBase.model');
  
  const risks = [];
  const cbrCases = [];
  
  // Project 1: E-Commerce Platform - Planning Phase (predicted risks)
  const ecommerceProject = projects.find(p => p.projectName === 'E-Commerce Platform Modernization');
  if (ecommerceProject) {
    risks.push(
      {
        project: ecommerceProject._id,
        organization: ecommerceProject.organization,
        type: 'communication_breakdown',
        title: 'Timezone Communication Challenges',
        description: 'Team distributed across Europe and Americas may face communication delays',
        category: 'coordination',
        severity: 'medium',
        probability: 0.65,
        confidence: 0.78,
        source: 'cbr',
        reasoning: [
          'Team spans Europe/Madrid and America/Mexico_City timezones',
          '6-hour time overlap may not be sufficient for complex issues',
          'Medium cultural diversity requires extra communication effort'
        ],
        indicators: [
          'Delayed response times in async communication',
          'Confusion during handoffs between teams',
          'Repeated clarification requests in chat'
        ],
        mitigationStrategies: [
          {
            strategy: 'Establish clear communication protocols',
            description: 'Define response time expectations and escalation procedures',
            expectedEffectiveness: 'high'
          },
          {
            strategy: 'Schedule overlapping working hours',
            description: 'Define common working hours across time zones',
            expectedEffectiveness: 'medium'
          }
        ],
        status: 'predicted',
        identifiedAt: new Date()
      },
      {
        project: ecommerceProject._id,
        organization: ecommerceProject.organization,
        type: 'scope_creep',
        title: 'Requirements Expansion Risk',
        description: 'Complex modernization may lead to scope expansion',
        category: 'management',
        severity: 'medium',
        probability: 0.52,
        confidence: 0.68,
        source: 'cbr',
        reasoning: [
          'Legacy to microservices migration often uncovers hidden requirements',
          'High system complexity',
          '4 stakeholders may introduce competing priorities'
        ],
        indicators: [
          'Feature requests increasing sprint by sprint',
          'Original estimates becoming unrealistic',
          'Team velocity declining'
        ],
        mitigationStrategies: [
          {
            strategy: 'Strict change control process',
            description: 'All changes must go through formal approval',
            expectedEffectiveness: 'high'
          },
          {
            strategy: 'Regular scope reviews',
            description: 'Weekly alignment meetings with stakeholders',
            expectedEffectiveness: 'medium'
          }
        ],
        status: 'predicted',
        identifiedAt: new Date()
      }
    );
  }
  
  // Project 2: Mobile Banking - Active (some risks materialized)
  const mobileProject = projects.find(p => p.projectName === 'Mobile Banking App Redesign');
  if (mobileProject) {
    risks.push(
      {
        project: mobileProject._id,
        organization: mobileProject.organization,
        type: 'meeting_fatigue',
        title: 'High Meeting Load Impact',
        description: 'Five weekly meetings affecting productivity',
        category: 'coordination',
        severity: 'medium',
        probability: 0.72,
        confidence: 0.85,
        source: 'expert_rules',
        reasoning: [
          '5 weekly meetings (average 45 minutes each) = 3.75 hours',
          'High real-time communication requirement',
          'Team needs focus time for development'
        ],
        indicators: [
          'Decreased code output during meeting-heavy weeks',
          'Team complaints about meeting overload',
          'Context switching reducing code quality'
        ],
        mitigationStrategies: [
          {
            strategy: 'Consolidate meetings',
            description: 'Combine similar topics into fewer, more effective meetings',
            expectedEffectiveness: 'high'
          },
          {
            strategy: 'No-meeting days',
            description: 'Reserve 2 days per week for focused work',
            expectedEffectiveness: 'medium'
          }
        ],
        status: 'predicted',
        identifiedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        project: mobileProject._id,
        organization: mobileProject.organization,
        type: 'burnout_susceptibility',
        title: 'Team Burnout Risk',
        description: 'Full-time commitment with high communication demands may lead to burnout',
        category: 'team',
        severity: 'high',
        probability: 0.48,
        confidence: 0.75,
        source: 'cbr',
        reasoning: [
          '40 hours per week per member',
          'High real-time communication level',
          'Tight deadline pressure'
        ],
        indicators: [
          'Increasing sick days',
          'Declining code review quality',
          'Team morale dropping'
        ],
        mitigationStrategies: [
          {
            strategy: 'Workload balancing',
            description: 'Monitor and redistribute tasks to prevent overload',
            expectedEffectiveness: 'medium'
          },
          {
            strategy: 'Regular check-ins',
            description: '1:1 meetings to assess team well-being',
            expectedEffectiveness: 'high'
          }
        ],
        status: 'predicted',
        identifiedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  // Project 3: Customer Portal - Completed (actual risks that occurred)
  const portalProject = projects.find(p => p.projectName === 'Customer Portal Development');
  if (portalProject) {
    risks.push(
      {
        project: portalProject._id,
        organization: portalProject.organization,
        type: 'dependency_blockage',
        title: 'CRM Integration Delays',
        description: 'Third-party CRM integration caused project delays',
        category: 'technical',
        severity: 'high',
        probability: 0.85,
        confidence: 0.95,
        source: 'manual',
        reasoning: [
          'Critical dependency on external CRM system',
          'API documentation was incomplete',
          'Vendor support was slow to respond'
        ],
        indicators: [
          'Integration tasks blocked for 2 weeks',
          'Multiple API issues discovered late',
          'Testing delayed due to missing functionality'
        ],
        actualImpact: {
          qualityImpact: 'minimal'
        },
        lessonsLearned: [
          'Validate third-party APIs early in project',
          'Have fallback plans for critical dependencies',
          'Establish direct communication channels with vendors'
        ],
        status: 'occurred',
        identifiedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
        occurredAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        mitigatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    );
    
    // Create CBR case from completed project
    cbrCases.push({
      caseId: portalProject._id,
      organization: portalProject.organization,
      type: 'real',
      source: 'completed_project',
      problem: {
        projectName: portalProject.projectName,
        briefDescription: portalProject.briefDescription,
        estimatedDuration: portalProject.expectedDuration,
        features: {
          coordination: {
            involvedCountries: portalProject.involvedCountries,
            timeOverlap: portalProject.expectedTimeOverlap?.value || 8,
            requiresSyncComm: portalProject.requiresSynchronousCommunication,
            weeklyMeetings: portalProject.weeklyMeetingsCount,
            culturalDiversity: portalProject.culturalDiversityLevel,
            realTimeCommunicationLevel: portalProject.realTimeCommunicationLevel
          },
          technical: {
            mainTechnologies: portalProject.mainTechnologies,
            experienceLevel: portalProject.requiredExperienceLevel,
            systemComplexity: portalProject.systemComplexity,
            documentationLevel: portalProject.documentationLevel,
            requiresSpecializedTools: portalProject.requiresSpecializedTools?.needed || false
          },
          team: {
            size: portalProject.actualTeamMembers?.length || 4,
            weeklyHours: portalProject.weeklyHoursPerMember,
            distributedExperience: portalProject.distributedWorkExperienceLevel,
            requiredLanguages: portalProject.requiredLanguages,
            languageProficiency: portalProject.minimumLanguageProficiency
          },
          management: {
            methodology: portalProject.methodology,
            hasOnboarding: portalProject.hasOnboardingProcess,
            hasCICD: portalProject.hasCICD,
            toolsFragmentation: portalProject.toolsFragmentation,
            clarityOfRequirements: portalProject.clarityOfRequirements
          },
          organizational: {
            involvedTeams: Array.isArray(portalProject.involvedTeams) ? portalProject.involvedTeams.length : (portalProject.involvedTeams || 0),
            criticalDependencies: portalProject.criticalDependencies?.length || 0,
            informationFlow: portalProject.informationFlow || portalProject.informationFlowQuality,
            stakeholdersCount: portalProject.stakeholdersCount
          }
        }
      },
      solution: {
        completed: true,
        onTime: true,
        budgetOverrun: 0,
        qualityScore: 4,
        clientSatisfaction: 4,
        teamMorale: 4,
        actualRisks: [
          {
            type: 'dependency_blockage',
            title: 'CRM Integration Delays',
            severity: 'high',
            description: 'Third-party CRM integration caused delays',
            impact: 'Minor schedule delay, no quality impact',
            detectedAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
            mitigatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            rootCause: 'Incomplete API documentation',
            actualImpact: {
              scheduleDelayDays: 5,
              budgetOverrunPercent: 0,
              qualityImpact: 'minimal'
            }
          }
        ],
        metrics: {
          avgVelocity: 32,
          bugRate: 0.08,
          meetingEfficiency: 4,
          teamMoraleProgression: [4, 4, 3, 4, 4],
          deploymentFrequency: 'daily',
          codeReviewTimeAvg: 1,
          cicdStability: 5
        }
      },
      result: {
        lessonsLearned: [
          'Early validation of third-party dependencies is critical',
          'Complete documentation enables smooth development',
          'Low meeting overhead improved team focus'
        ],
        successfulPractices: [
          {
            practice: 'Daily automated deployments',
            impact: 'Enabled quick feedback and iteration',
            replicable: true
          },
          {
            practice: 'Comprehensive documentation from start',
            impact: 'Reduced onboarding time and confusion',
            replicable: true
          }
        ],
        recommendations: [
          'Continue automated deployment practices',
          'Validate external dependencies in planning phase',
          'Maintain low meeting overhead for focus time'
        ]
      },
      metadata: {
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        lastUpdated: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000)
      }
    });
  }
  
  // Project 4: Cloud Infrastructure Migration - Active (complex risks)
  const cloudProject = projects.find(p => p.projectName === 'Cloud Infrastructure Migration');
  if (cloudProject) {
    risks.push(
      {
        project: cloudProject._id,
        organization: cloudProject.organization,
        type: 'timezone_scheduling_gap',
        title: 'Cross-Continental Coordination Challenge',
        description: 'Team spread across US East, West, and UK requires careful scheduling',
        category: 'coordination',
        severity: 'high',
        probability: 0.78,
        confidence: 0.88,
        source: 'cbr',
        reasoning: [
          'Team across America/New_York, America/Los_Angeles, and Europe/London',
          'Only 5 hours of overlap between all timezones',
          'High cultural diversity adds complexity',
          'Expert-level work requires significant collaboration'
        ],
        indicators: [
          'Difficulty scheduling meetings with all members',
          'Some team members working outside normal hours',
          'Delayed decisions waiting for async responses'
        ],
        mitigationStrategies: [
          {
            strategy: 'Rotating meeting times',
            description: 'Alternate meeting times to share inconvenience',
            expectedEffectiveness: 'medium'
          },
          {
            strategy: 'Asynchronous-first culture',
            description: 'Default to async communication, sync for critical issues only',
            expectedEffectiveness: 'high'
          },
          {
            strategy: 'Clear documentation',
            description: 'Document all decisions and context thoroughly',
            expectedEffectiveness: 'high'
          }
        ],
        status: 'predicted',
        identifiedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        project: cloudProject._id,
        organization: cloudProject.organization,
        type: 'knowledge_management_gap',
        title: 'Tribal Knowledge Risk',
        description: 'Complex infrastructure knowledge not adequately documented',
        category: 'organizational',
        severity: 'medium-high',
        probability: 0.68,
        confidence: 0.75,
        source: 'cbr',
        reasoning: [
          'Expert-level work creates complex knowledge',
          'Documentation level marked as "complete" but may not cover tribal knowledge',
          'High team turnover risk with specialized skills'
        ],
        indicators: [
          'Onboarding new members takes weeks',
          'Same people always needed for certain tasks',
          'Undocumented workarounds and configurations'
        ],
        mitigationStrategies: [
          {
            strategy: 'Knowledge sharing sessions',
            description: 'Weekly sessions where experts share their knowledge',
            expectedEffectiveness: 'medium'
          },
          {
            strategy: 'Runbook creation',
            description: 'Document all procedures and edge cases',
            expectedEffectiveness: 'high'
          },
          {
            strategy: 'Pair programming',
            description: 'Ensure knowledge distribution through collaboration',
            expectedEffectiveness: 'high'
          }
        ],
        status: 'predicted',
        identifiedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  // Project 5: AI Recommendation - Planning (ML-specific risks)
  const aiProject = projects.find(p => p.projectName === 'AI-Powered Recommendation Engine');
  if (aiProject) {
    risks.push(
      {
        project: aiProject._id,
        organization: aiProject.organization,
        type: 'skill_gap',
        title: 'Machine Learning Expertise Gap',
        description: 'Team may lack experience with production ML systems',
        category: 'technical',
        severity: 'high',
        probability: 0.58,
        confidence: 0.70,
        source: 'expert_rules',
        reasoning: [
          'High system complexity with ML components',
          'Senior experience level required',
          'Specialized tools needed (MLflow, GPU compute)',
          'Partial documentation indicates knowledge gaps'
        ],
        indicators: [
          'Difficulty estimating ML development tasks',
          'Model performance not meeting expectations',
          'Training pipeline issues'
        ],
        mitigationStrategies: [
          {
            strategy: 'ML consultant engagement',
            description: 'Bring in ML expert for architecture review',
            expectedEffectiveness: 'high'
          },
          {
            strategy: 'Team training program',
            description: 'Invest in ML production best practices training',
            expectedEffectiveness: 'medium'
          }
        ],
        status: 'predicted',
        identifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  // Project 6: Cancelled Project - Show what went wrong
  const cancelledProject = projects.find(p => p.projectName === 'Legacy System Replacement');
  if (cancelledProject) {
    risks.push(
      {
        project: cancelledProject._id,
        organization: cancelledProject.organization,
        type: 'goal_misalignment',
        title: 'Unclear Project Goals',
        description: 'Low clarity of requirements led to misaligned expectations',
        category: 'management',
        severity: 'critical',
        probability: 0.95,
        confidence: 0.98,
        source: 'manual',
        reasoning: [
          'Clarity of requirements marked as "low"',
          'Poor information flow quality',
          '8 stakeholders with competing interests',
          'Minimal documentation of legacy system'
        ],
        indicators: [
          'Frequent scope changes',
          'Stakeholder disagreements',
          'Team confusion about priorities'
        ],
        actualImpact: {
          qualityImpact: 'severe'
        },
        lessonsLearned: [
          'Never start a project without clear requirements',
          'Limit stakeholders or establish clear decision-making process',
          'Document legacy systems before attempting replacement'
        ],
        status: 'occurred',
        identifiedAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
        occurredAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
      },
      {
        project: cancelledProject._id,
        organization: cancelledProject.organization,
        type: 'knowledge_management_gap',
        title: 'Lost Tribal Knowledge',
        description: 'Minimal documentation of legacy system caused massive delays',
        category: 'organizational',
        severity: 'critical',
        probability: 0.92,
        confidence: 0.96,
        source: 'manual',
        reasoning: [
          'Minimal documentation level',
          'Expert-level COBOL knowledge required',
          'Legacy system knowledge not transferred',
          'No onboarding process'
        ],
        actualImpact: {
          qualityImpact: 'critical'
        },
        lessonsLearned: [
          'Document existing systems before migration',
          'Identify and engage legacy system experts early',
          'Allow time for knowledge transfer'
        ],
        status: 'occurred',
        identifiedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        occurredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  const createdRisks = await Risk.insertMany(risks);
  console.log(`✅ Created ${createdRisks.length} risks`);
  
  const createdCases = cbrCases.length > 0 ? await CaseBase.insertMany(cbrCases) : [];
  console.log(`✅ Created ${createdCases.length} CBR cases`);
  
  return { risks: createdRisks, cases: createdCases };
};

module.exports = { seedRisksAndCases };

