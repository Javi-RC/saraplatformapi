/**
 * English translations for risk catalog
 * Contains all risk types, titles, descriptions, and recommendations in English
 */

module.exports = {
  risks: {
    // Communication Risks
    communication_breakdown: {
      title: 'Communication Breakdown',
      description: 'Communication problems that prevent effective team coordination',
      indicators: {
        delays: 'Response delays',
        infoNotShared: 'Information not shared',
        misunderstandings: 'Frequent misunderstandings'
      },
      recommendations: {
        asyncUpdates: 'Implement daily asynchronous updates',
        escalationProtocols: 'Define clear escalation protocols',
        asyncTools: 'Use effective asynchronous communication tools',
        communicationNorms: 'Establish communication norms'
      }
    },

    communication_tools_missing: {
      title: 'Inadequate Communication Tools',
      description: 'Lack of appropriate communication tools according to time overlap between countries',
      indicators: {
        limitedOverlap: 'Limited time overlap',
        insufficientTools: 'Insufficient tools for coordination'
      },
      recommendations: {
        asyncUpdates: 'Implement daily asynchronous updates',
        escalationProtocols: 'Define clear escalation protocols',
        asyncTools: 'Use effective asynchronous communication tools',
        communicationNorms: 'Establish communication norms'
      }
    },

    // Cultural & Linguistic Risks
    cultural_distance_risk: {
      title: 'High Cultural Distance',
      description: 'High cultural distance between team countries according to Hofstede dimensions',
      indicators: {
        culturalDistance: 'Cultural distance between team countries',
        differentValues: 'Different values in Hofstede dimensions',
        culturalMisunderstandings: 'Potential cultural misunderstandings'
      },
      recommendations: {
        culturalTraining: 'Implement cross-cultural training for the team',
        sensitiveCommunication: 'Establish culturally sensitive communication norms',
        culturalMediators: 'Assign cultural mediators in the team'
      }
    },

    linguistic_distance_risk: {
      title: 'Linguistic Distance',
      description: 'Partial language barrier - not all countries speak the common language',
      indicators: {
        differentLanguages: 'Different official languages in team countries',
        notAllSpeakCommon: 'Not all members speak the common language'
      },
      recommendations: {
        languageTraining: 'Provide training in the common language',
        translationServices: 'Use translation services if necessary',
        documentInCommon: 'Document in common language',
        bilingualFacilitators: 'Assign bilingual facilitators'
      }
    },

    linguistic_distance_no_common_language: {
      title: 'No Common Language Defined',
      description: 'No common language defined for the multicultural team',
      indicators: {
        multiculturalNoCommon: 'Multicultural team without common language',
        highMisunderstandingRisk: 'High risk of misunderstandings'
      },
      recommendations: {
        defineCommon: 'Define common language for the project',
        languageTraining: 'Provide training in the common language',
        translationServices: 'Use translation services if necessary',
        documentInCommon: 'Document in common language'
      }
    },

    // Project Requirements Risks
    team_autonomy_risk: {
      title: 'Team Autonomy Risk',
      description: 'Team autonomy level does not meet project requirements',
      indicators: {
        autonomyMismatch: 'Required vs available autonomy level',
        constantSupervision: 'Need for constant supervision'
      },
      recommendations: {
        evaluateAutonomy: 'Evaluate if team can work with required autonomy',
        training: 'Provide training if necessary',
        adjustSupervision: 'Adjust supervision structure',
        assignLeaders: 'Assign technical leaders if high autonomy required'
      }
    },

    schedule_flexibility_risk: {
      title: 'Schedule Flexibility Risk',
      description: 'Team schedule flexibility does not meet project requirements',
      indicators: {
        flexibilityMismatch: 'Required vs available schedule flexibility',
        timezoneCoordination: 'Coordination across different time zones'
      },
      recommendations: {
        evaluateFlexibility: 'Evaluate team schedule flexibility',
        coreHours: 'Establish core hours if necessary',
        asyncTools: 'Use asynchronous tools',
        availabilityWindows: 'Define availability windows'
      }
    },

    travel_availability_risk: {
      title: 'Travel Availability Risk',
      description: 'Team travel availability does not meet project requirements',
      indicators: {
        travelMismatch: 'Required vs available travel availability',
        inPersonMeetings: 'Need for in-person meetings'
      },
      recommendations: {
        evaluateTravel: 'Evaluate team travel availability',
        planAhead: 'Plan travel in advance',
        virtualMeetings: 'Use virtual meetings when possible',
        budgetTravel: 'Budget travel costs'
      }
    },

    // Technical Risks
    skill_gap: {
      title: 'Skill Gap',
      description: 'Lack of necessary technical skills in the team',
      indicators: {
        lowTechMatch: 'Technical match <50%',
        missingTechnologies: '≥3 missing technologies',
        juniorInComplex: 'Junior experience in complex project'
      },
      recommendations: {
        hireSpecialists: 'Hire specialists in critical technologies',
        intensiveTraining: 'Intensive training program',
        addSenior: 'Add a senior for training or mentoring tasks'
      }
    },

    technical_infrastructure: {
      title: 'Technical Infrastructure Issues',
      description: 'Inadequate technical infrastructure for the project',
      indicators: {
        insufficientInfra: 'Insufficient infrastructure',
        inadequateTools: 'Inadequate tools'
      },
      recommendations: {
        improveInfra: 'Evaluate and improve infrastructure',
        investTools: 'Invest in adequate tools',
        cloudServices: 'Contract cloud services if necessary'
      }
    },

    quality_degradation: {
      title: 'Quality Degradation',
      description: 'Risk of decrease in product quality',
      indicators: {
        lowConscientiousness: 'Low team conscientiousness',
        overloaded: 'Overloaded team',
        juniorTeam: 'Junior team',
        noCICD: 'No CI/CD',
        minimalDocs: 'Minimal documentation'
      },
      recommendations: {
        automatedTesting: 'Automated testing',
        specificDoD: 'Very specific Definition of Done',
        pairProgramming: 'Mandatory pair programming',
        reviews: 'Reviews'
      }
    },

    tool_fragmentation: {
      title: 'Tool Fragmentation',
      description: 'Excessive or disorganized use of technical tools',
      indicators: {
        tooManyTools: '>5 main tools'
      },
      recommendations: {
        limitTools: 'Maximum 3-4 main tools'
      }
    },

    // Team Risks
    team_overload: {
      title: 'Team Overload',
      description: 'Team with excessive workload',
      indicators: {
        highHours: '>45h/week average',
        concurrentProjects: '≥3 concurrent projects',
        multipleOverloaded: 'Multiple overloaded members'
      },
      recommendations: {
        redistributeOrHire: 'Redistribute workload or hire resources',
        reduceConcurrency: 'Reduce concurrency or extend deadlines',
        extendDeadline: 'Extend completion date'
      }
    },

    team_conflicts: {
      title: 'Team Conflicts',
      description: 'Interpersonal conflicts within the team',
      indicators: {
        tensions: 'Interpersonal tensions',
        poorCommunication: 'Deteriorated communication',
        lowMorale: 'Low morale'
      },
      recommendations: {
        mediation: 'Conflict mediation',
        teamBuilding: 'Team building',
        clarifyRoles: 'Clarify roles and responsibilities'
      }
    },

    burnout_susceptibility: {
      title: 'Burnout Susceptibility',
      description: 'Risk of professional burnout in the team',
      indicators: {
        highNeuroticism: 'High neuroticism',
        highWorkload: 'High workload',
        noWorkLife: 'No work-life balance',
        sustainedPressure: 'Sustained pressure'
      },
      recommendations: {
        hourLimits: 'Define workload limits (hour caps) Strengthen company wellness and work-life balance policies'
      }
    },

    social_isolation: {
      title: 'Social Isolation',
      description: 'Lack of social interaction in remote teams',
      indicators: {
        highRemote: '>70% remote work',
        noPriorFaceToFace: 'Team formed by people without prior face-to-face communication',
        noTeamExperience: 'Team without prior experience working together',
        noTeamBuilding: 'No team building activities'
      },
      recommendations: {
        socialChannels: 'Encourage use of social communication channels (not just work)',
        teamBuildingActivities: 'Remote or in-person team building activities',
        workVisibility: 'Visibility of everyone\'s work'
      }
    },

    conflict_escalation_risk: {
      title: 'Conflict Escalation Risk',
      description: 'Minor conflicts can escalate without adequate resolution',
      indicators: {
        lowAgreeableness: 'Low average agreeableness (<3)',
        highPressure: 'High pressure (Review article for high-pressure situations)',
        conflictivePersonalities: 'Conflictive personalities'
      },
      recommendations: {
        communicationProtocols: 'Establish communication protocols (tone, response times, escalation)',
        conflictProcess: 'Define explicit conflict resolution process (1:1 → mediation → escalation)',
        clarifyOwnership: 'Ensure role and ownership clarity'
      }
    },

    onboarding_issues: {
      title: 'Onboarding Issues',
      description: 'Difficulties in integrating new members',
      indicators: {
        manyNewMembers: '>30% new members',
        inadequateOnboarding: 'Inadequate onboarding',
        highComplexity: 'High project complexity',
        remoteWork: 'Remote work'
      },
      recommendations: {
        mentoring: 'Implement mentoring program',
        welcomePack: 'Create welcome pack with videos, documentation and key contacts'
      }
    },

    digital_fatigue: {
      title: 'Digital Fatigue',
      description: 'Exhaustion from excessive use of digital tools',
      indicators: {
        highRemote: 'High percentage of remote work',
        manyTools: 'Multiple digital tools',
        screenTime: 'Extended screen time'
      },
      recommendations: {
        breakTime: 'Establish regular breaks',
        limitMeetings: 'Limit virtual meetings',
        asynchronous: 'Prioritize asynchronous communication'
      }
    },

    work_life_boundary_blur: {
      title: 'Work-Life Boundary Blur',
      description: 'Difficulty separating work and personal life in remote settings',
      indicators: {
        alwaysOnCulture: 'Always-on culture',
        noWorkSchedule: 'No defined schedules',
        homeOffice: 'Work from home without boundaries'
      },
      recommendations: {
        clearSchedules: 'Establish clear schedules',
        respectOffTime: 'Respect off-work time',
        boundaries: 'Encourage healthy boundaries'
      }
    },

    meeting_fatigue: {
      title: 'Meeting Fatigue',
      description: 'Exhaustion from excessive virtual meetings',
      indicators: {
        manyMeetings: 'More than 5 daily meetings',
        longMeetings: 'Meetings longer than 1 hour',
        noBreaks: 'Consecutive meetings without breaks'
      },
      recommendations: {
        limitMeetings: 'Reduce number of meetings',
        shorterMeetings: 'Make meetings shorter (25-50 min)',
        meetingFreeTime: 'Establish meeting-free blocks'
      }
    },

      timezone_scheduling_gap: {
        title: 'Timezone Scheduling Gap',
        description: 'Coordination difficulties due to time zone differences',
        indicators: {
          lowOverlap: 'Low time overlap (<3h)',
          manyTimezones: '≥3 time zones',
          frequentMeetings: 'Frequent meetings required'
        },
        recommendations: {
          sharedHours: 'Set shared working hours for the whole team',
          rotateMeetings: 'Rotate meeting times fairly',
          asyncCommunication: 'Asynchronous communication',
          recordMeetings: 'Record important meetings',
          flexibleStaff: 'Assign team members with schedule flexibility when possible',
          sharedDocs: 'Shared documentation repositories for all teams'
        }
      },

      role_clarity_gap: {
        title: 'Role Clarity Gap',
        description: 'Roles and responsibilities are not clearly defined',
        indicators: {
          largeTeam: 'Large team (>8)',
          noOrgChart: 'No org chart',
          multipleTeams: 'Multiple teams'
        },
        recommendations: {
          defineRoles: 'Define clear roles and responsibilities',
          reviewRoles: 'Review roles at project start with the team'
        }
      },

      knowledge_management_gap: {
        title: 'Knowledge Management Gap',
        description: 'Lack of systems to capture and share knowledge',
        indicators: {
          oversizedTeam: 'Team too large >5 people'
        },
        recommendations: {
          knowledgeSystem: 'Implement a knowledge management system (Confluence, Notion, SharePoint)',
          updatedWiki: 'Keep the project wiki up to date',
          dailyDocs: 'Daily documentation of tasks and issues resolved (knowledge management)'
        }
      },

      remote_work_support_gap: {
        title: 'Remote Work Support Gap',
        description: 'Inadequate organizational support for remote work',
        indicators: {
          highRemote: '>50% remote work',
          noPolicies: 'No remote work policies',
          noTools: 'No collaborative tools',
          noTechSupport: 'No home-office technical support'
        },
        recommendations: {
          remotePolicies: 'Define clear remote work policies',
          provideTools: 'Provide software tools that support remote work',
          homeOfficeSupport: 'Technical support for home office setup (ergonomics)'
        }
      },

    technostress_overload: {
      title: 'Technostress Overload',
      description: 'Stress from excess technologies and tools',
      indicators: {
        tooManyTools: 'Too many different tools',
        complexTools: 'Complex tools',
        constantUpdates: 'Constant technological changes'
      },
      recommendations: {
        standardizeTools: 'Standardize tools',
        training: 'Provide adequate training',
        simplify: 'Simplify technology stack'
      }
    },

    change_resistance: {
      title: 'Change Resistance',
      description: 'Team resistance to changes in processes or technologies',
      indicators: {
        lowOpenness: 'Low openness to change in the team',
        establishedRoutines: 'Very established routines',
        fearOfChange: 'Fear of the unknown'
      },
      recommendations: {
        involveTeam: 'Involve team in change decisions',
        incremental: 'Implement incremental changes',
        communication: 'Clearly communicate benefits of change'
      }
    },

      change_resistance_risk: {
        title: 'Resistance to Change',
        description: 'Organizational resistance to necessary changes',
        indicators: {
          lowOpenness: 'Low openness to experience',
          manyNewTech: 'Multiple new technologies',
          methodChanges: 'Methodological changes',
          experienceGap: 'Experience gap'
        },
        recommendations: {
          adoptionPlan: 'Adoption plan: checklist per sprint',
          pairingMentoring: 'Pairing/mentoring in new areas',
          limitChanges: 'Limit simultaneous changes (one transition at a time)'
        }
      },

      other: {
        title: 'Other Risk',
        description: 'Unclassified risk type',
        indicators: {},
        recommendations: {}
      },

    // Management Risks
    scope_creep: {
      title: 'Scope Creep',
      description: 'Continuous expansion of scope without adequate control',
      indicators: {
        frequentChanges: 'Frequent changes in requirements',
        poorDocumentation: 'Poor documentation',
        stakeholderPressure: 'Stakeholder pressure'
      },
      recommendations: {
        changeControl: 'Implement change control process',
        clearScope: 'Define scope clearly',
        stakeholderManagement: 'Active stakeholder management'
      }
    },

    process_mismatch: {
      title: 'Process Mismatch',
      description: 'Processes do not fit project needs',
      indicators: {
        heavyProcess: 'Too heavy processes',
        lightProcess: 'Insufficient processes',
        poorAdherence: 'Low adherence to processes'
      },
      recommendations: {
        adaptProcess: 'Adapt processes to context',
        rightSize: 'Adjust formality level',
        continuousImprovement: 'Continuous process improvement'
      }
    },

    dependency_blockage: {
      title: 'Dependency Blockage',
      description: 'External dependencies that block progress',
      indicators: {
        externalDependencies: 'Critical external dependencies',
        delays: 'Frequent delays',
        lackOfControl: 'Lack of control over dependencies'
      },
      recommendations: {
        identifyEarly: 'Identify dependencies early',
        alternatives: 'Prepare alternatives',
        activeManagement: 'Active dependency management'
      }
    },

    resource_unavailability: {
      title: 'Resource Unavailability',
      description: 'Key resources not available when needed',
      indicators: {
        keyPeopleUnavailable: 'Key people unavailable',
        sharedResources: 'Resources shared with other projects',
        budgetConstraints: 'Budget constraints'
      },
      recommendations: {
        resourcePlanning: 'Detailed resource planning',
        buffers: 'Include resource buffers',
        alternatives: 'Identify alternative resources'
      }
    },

    role_clarity_risk: {
      title: 'Lack of Role Clarity',
      description: 'Roles and responsibilities are not clearly defined',
      indicators: {
        overlappingRoles: 'Overlapping roles',
        gaps: 'Gaps in responsibilities',
        confusion: 'Confusion about who does what'
      },
      recommendations: {
        raciMatrix: 'Create RACI matrix',
        clearDefinitions: 'Define roles clearly',
        communication: 'Communicate roles to team'
      }
    },

    standards_compliance_gap: {
      title: 'Standards Compliance Gap',
      description: 'Required project standards are not met',
      indicators: {
        lackOfStandards: 'Lack of defined standards',
        poorCompliance: 'Low compliance',
        noValidation: 'No standards validation'
      },
      recommendations: {
        defineStandards: 'Define standards clearly',
        training: 'Train on standards',
        validation: 'Implement automatic validation'
      }
    },

    team_insufficient: {
      title: 'Insufficient Team',
      description: 'Team size is inadequate for the project',
      indicators: {
        understaffed: 'Team below required size',
        highWorkload: 'High workload per person',
        cannotMeetDeadlines: 'Cannot meet deadlines'
      },
      recommendations: {
        hire: 'Hire more staff',
        reduceScope: 'Reduce project scope',
        extendTimeline: 'Extend project timeline'
      }
    },

    // Requirements Risks
    unclear_requirements: {
      title: 'Unclear Requirements',
      description: 'Project requirements are not clearly defined or constantly evolving',
      indicators: {
        ambiguousRequirements: 'Ambiguous or incomplete requirements',
        frequentChanges: 'Frequent changes in specifications',
        stakeholderDisagreement: 'Stakeholder disagreement',
        uncertaintyInScope: 'Uncertainty in project scope'
      },
      recommendations: {
        clarifyRequirements: 'Conduct requirements clarification sessions with stakeholders',
        documentRequirements: 'Document requirements in detail and obtain approval',
        iterativeApproach: 'Adopt iterative approach to validate requirements early',
        prototypeValidation: 'Create prototypes to validate requirements understanding'
      }
    },

    // External Dependencies Risks
    third_party_dependency: {
      title: 'Third Party Dependency',
      description: 'Project depends on third-party services, APIs, or components',
      indicators: {
        externalServices: 'Dependency on external services',
        apiIntegrations: 'Multiple third-party API integrations',
        vendorLockIn: 'Vendor lock-in risk',
        limitedControl: 'Limited control over external components'
      },
      recommendations: {
        evaluateVendors: 'Thoroughly evaluate vendors before integration',
        fallbackPlans: 'Prepare contingency plans for critical services',
        abstractDependencies: 'Abstract dependencies to facilitate future changes',
        monitorThirdParty: 'Monitor third-party service status and performance'
      }
    }
  },

  // Common terms
  common: {
    severity: {
      low: 'Low',
      medium: 'Medium',
      'medium-high': 'Medium-High',
      high: 'High',
      critical: 'Critical',
      emerging: 'Emerging'
    },
    category: {
      coordination: 'Coordination',
      technical: 'Technical',
      team: 'Team',
      management: 'Management',
      organizational: 'Organizational',
      other: 'Other'
    },
    source: {
      expert_rules: 'Expert rules',
      expert_rules_enhanced: 'Enhanced expert rules',
      expert_rules_hofstede: 'Hofstede cultural dimensions',
      expert_rules_linguistic: 'Linguistic analysis',
      expert_rules_project_requirements: 'Project requirements',
      expert_rules_early_warning: 'Early warning signals',
      cbr: 'Case-based reasoning',
      combined: 'Combined',
      seed_cases: 'Seed cases',
      emerging_pattern: 'Emerging pattern',
      manual: 'Manual',
      predicted: 'Predicted',
      decision_tree: 'Decision tree',
      system: 'System'
    },
    phaseDescriptions: {
      1: 'Prediction based on expert rules ({count} cases - insufficient for CBR)',
      2: 'Combining expert rules with experience from {count} projects (prioritizing DT)',
      3: 'Prioritizing experience from {count} similar projects (complementing with DT)',
      4: 'Prediction based on experience from {count} similar projects (mature CBR)'
    },
    status: {
      predicted: 'Predicted',
      occurred: 'Occurred',
      avoided: 'Avoided',
      mitigated: 'Mitigated',
      active: 'Active',
      resolved: 'Resolved',
      pending: 'Pending'
    }
  },

  // Notifications
  notifications: {
    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    },
    messages: {
      obtained_successfully: 'Notifications obtained successfully',
      error_obtaining: 'Error obtaining notifications',
      count_obtained_successfully: 'Count obtained successfully',
      error_obtaining_count: 'Error obtaining count',
      statistics_obtained_successfully: 'Statistics obtained successfully',
      error_obtaining_statistics: 'Error obtaining statistics',
      marked_as_read: 'Notification marked as read',
      error_marking_as_read: 'Error marking as read',
      not_found: 'Notification not found',
      marked_as_read_multiple: '{count} notifications marked as read',
      error_marking_multiple: 'Error marking notifications',
      array_required: 'An array of notification IDs is required',
      marked_as_read_all: '{count} notifications marked as read',
      error_marking_all: 'Error marking all as read',
      archived: 'Notification archived',
      error_archiving: 'Error archiving notification',
      deleted_successfully: 'Notification deleted successfully',
      error_deleting: 'Error deleting notification',
      created_successfully: 'Notification created successfully',
      error_creating: 'Error creating notification',
      required_fields: 'recipientId, type, title and message are required',
      invalid_type: 'Invalid notification type',
      recipient_not_found: 'Recipient user not found',
      bulk_sent_successfully: '{count} notifications sent successfully',
      error_sending_bulk: 'Error sending bulk notifications',
      required_array_recipients: 'An array of recipientIds is required',
      required_fields_bulk: 'type, title and message are required',
      sent_to_role: '{count} notifications sent to role {role}',
      error_sending_to_role: 'Error sending notifications by role',
      required_fields_role: 'role, type, title and message are required',
      sent_to_all: '{count} notifications sent to all users',
      error_sending_to_all: 'Error sending notifications to all'
    },
    // Notification content translations by type
    content: {
      // Authentication
      email_confirmation: {
        title: 'Email Confirmation',
        message: 'Please confirm your email address'
      },
      password_reset: {
        title: 'Password Reset',
        message: 'A password reset has been requested'
      },
      // Account
      account_updated: {
        title: 'Account Updated',
        message: 'Your account has been updated successfully'
      },
      account_deletion_confirmed: {
        title: 'Account Deletion Confirmed',
        message: '{userName}, your account has been successfully deleted. All your personal data has been removed from our system.'
      },
      account_deletion_requirements: {
        title: 'Account Deletion Requirements',
        message: 'Before you can delete your account: {blockerMessages}'
      },
      role_changed: {
        title: 'Role Changed',
        message: 'Your role at {organizationName} has been changed'
      },
      // CV
      cv_uploaded: {
        title: 'CV Uploaded',
        message: 'Your CV has been uploaded successfully'
      },
      cv_processed: {
        title: 'CV Processed',
        message: 'Your CV has been processed successfully'
      },
      cv_analysis_ready: {
        title: 'CV Analysis Ready',
        message: 'Your CV analysis is now available'
      },
      cv_analysis_failed: {
        title: 'CV Analysis Failed',
        message: 'An error occurred while analyzing your CV'
      },
      cv_submitted_to_org: {
        title: 'New CV Received',
        message: '{userName} has submitted their CV to {organizationName}'
      },
      cv_reviewed: {
        title: 'CV Update',
        message: 'Your CV submitted to {organizationName} has been reviewed'
      },
      cv_status_changed: {
        title: 'CV Status Updated',
        message: 'The status of your CV at {organizationName} has changed to: {statusLabel}'
      },
      // Organization
      org_employee_added: {
        title: 'Linked to Organization',
        message: 'You have been added as an employee of {organizationName}'
      },
      org_employee_removed: {
        title: 'Organization Link Ended',
        message: 'You have been removed from {organizationName}'
      },
      org_employee_status_changed: {
        title: 'Organization Status Update',
        message: 'Your link with {organizationName} has been updated'
      },
      org_admin_added: {
        title: 'Promoted to Administrator',
        message: 'You have been added as an administrator of {organizationName}'
      },
      org_settings_updated: {
        title: 'Settings Updated',
        message: 'Settings for {organizationName} have been updated'
      },
      // Projects
      project_created: {
        title: 'New Project Created',
        message: 'A new project "{projectName}" has been created in {organizationName}'
      },
      project_updated: {
        title: 'Project Updated',
        message: 'Project "{projectName}" has been updated'
      },
      project_deleted: {
        title: 'Project Deleted',
        message: 'Project "{projectName}" has been deleted by an administrator'
      },
      project_activated: {
        title: 'Project Activated',
        message: 'Project "{projectName}" is now active'
      },
      project_completed: {
        title: 'Project Completed',
        message: 'Project "{projectName}" has been successfully completed'
      },
      project_cancelled: {
        title: 'Project Cancelled',
        message: 'Project "{projectName}" has been cancelled'
      },
      assigned_to_project: {
        title: 'Assigned to Project',
        message: 'You have been assigned to project "{projectName}"'
      },
      removed_from_project: {
        title: 'Removed from Project',
        message: 'You have been removed from project "{projectName}"'
      },
      // BFI-44
      bfi44_completed: {
        title: 'BFI-44 Test Completed',
        message: 'You have completed the BFI-44 personality test'
      },
      bfi44_reminder: {
        title: 'BFI-44 Reminder',
        message: 'Don\'t forget to complete your BFI-44 personality test'
      },
      // Administrative
      admin_announcement: {
        title: 'Admin Announcement',
        message: 'New announcement from administrator'
      },
      system_update: {
        title: 'System Update',
        message: 'The system has been updated'
      },
      // Generic
      custom: {
        title: 'Notification',
        message: 'You have a new notification'
      }
    }
  },

  // Post-Project translations
  postProject: {
    sections: {
      generalOutcome: 'General Project Outcome',
      predictedRisks: 'Predicted Risks',
      lessonsLearned: 'Lessons Learned'
    },
    fields: {
      completed: 'Project completed?',
      actualCompletedDate: 'Actual completion date',
      qualityScore: 'Quality score (1-5)',
      clientSatisfaction: 'Client satisfaction (1-5)',
      teamMorale: 'Team morale (1-5)',
      budgetOverrun: 'Budget overrun (%)',
      actualizedRisks: 'Risks that materialized',
      lessonsLearned: 'Lessons learned',
      successfulPractices: 'Successful practices',
      unsuccessfulPractices: 'Unsuccessful practices',
      recommendations: 'Recommendations for future projects'
    },
    riskDescriptions: {
      communication_breakdown: 'Communication problems that prevented effective coordination',
      process_mismatch: 'Processes did not fit project needs',
      scope_creep: 'Uncontrolled expansion of project scope',
      team_overload: 'Team was overloaded with work',
      quality_degradation: 'Decrease in product quality',
      unclear_requirements: 'Unclear or constantly evolving requirements',
      dependency_blockage: 'Blockages from external dependencies',
      resource_unavailability: 'Key resources unavailable when needed',
      timezone_scheduling_gap: 'Coordination difficulties due to time zone differences',
      social_isolation: 'Lack of social interaction in the team',
      team_autonomy_risk: 'Team autonomy level did not meet requirements',
      schedule_flexibility_risk: 'Schedule flexibility did not meet requirements',
      travel_availability_risk: 'Travel availability did not meet requirements',
      skill_gap: 'Lack of technical skills in the team',
      cultural_distance_risk: 'High cultural distance affected collaboration',
      linguistic_distance_risk: 'Language barriers affected communication',
      burnout_susceptibility: 'Team experienced professional burnout',
      conflict_escalation_risk: 'Minor conflicts escalated without proper resolution',
      onboarding_issues: 'Difficulties integrating new team members',
      third_party_dependency: 'Issues with third-party services or APIs'
    }
  }
};
