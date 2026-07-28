/**
 * English translations for risk catalog
 * Contains all risk types, titles, descriptions, and recommendations in English
 */

module.exports = {
  risks: {
    // Communication Risks
    communication_breakdown: {
      title: 'Communication Breakdown',
      category: 'coordination',
      typicalSeverities: ['medium', 'high', 'critical'],
      possibleSources: ['expert_rules', 'expert_rules_enhanced', 'cbr', 'combined'],
      isHofstedeRelated: false,
      triggerConditions: 'Team size, remote work percentage, timezone differences',
      description: 'If the team is distributed across time zones with little overlap, communication failures may arise that delay deliveries and cause misunderstandings',
      indicators: {
        delays: 'Response delays',
        infoNotShared: 'Information not shared',
        misunderstandings: 'Frequent misunderstandings'
      },
      recommendations: {
        asyncUpdates: 'Implement daily asynchronous updates',
        asyncTools: 'Use effective asynchronous communication tools',
        communicationNorms: 'Establish communication norms'
      }
    },

    communication_tools_missing: {
      title: 'Inadequate Communication Tools',
      category: 'coordination',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules_enhanced'],
      isHofstedeRelated: true,
      algorithm: 'Time Overlap + Binomial Coefficient',
      formula: 'Max = C(n,2) × Z where n=countries, Z=tool count',
      triggerConditions: 'involvedCountries (≥2 countries) + communicationTools',
      description: 'If the project involves multiple countries and no communication tools have been defined, serious coordination problems will arise due to lack of adequate channels',
      indicators: {
        limitedOverlap: 'Limited time overlap',
        insufficientTools: 'Insufficient tools for coordination'
      },
      recommendations: {
        syncAsyncTools: 'Implement both synchronous and asynchronous communication tools',
        communicationNorms: 'Establish clear communication norms'
      }
    },

    // Cultural & Linguistic Risks
    cultural_distance_risk: {
      title: 'High Socio-Cultural Distance',
      category: 'team',
      typicalSeverities: ['medium', 'high', 'critical'],
      possibleSources: ['expert_rules_hofstede'],
      isHofstedeRelated: true,
      algorithm: 'Hofstede 6D Euclidean Distance',
      formula: 'sqrt(sum((dim1-dim2)^2)) across PDI, IDV, MAS, UAI, LTO, IND',
      triggerConditions: 'involvedCountries (≥2 countries)',
      description: 'If there are people from different cultures in the project, misunderstandings derived from socio-cultural distance may arise and cause delivery delays',
      indicators: {
        culturalDistance: 'Cultural distance between team countries',
        differentValues: 'Different values in Hofstede dimensions',
        culturalMisunderstandings: 'Potential cultural misunderstandings'
      },
      recommendations: {
        culturalTraining: 'Implement socio-cultural training',
        sensitiveCommunication: 'Establish culturally sensitive communication norms',
        culturalMediators: 'Assign cultural mediators'
      }
    },

    linguistic_distance_risk: {
      title: 'Socio-Cultural Linguistic Distance',
      category: 'coordination',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules_linguistic'],
      isHofstedeRelated: true,
      algorithm: 'Language Overlap Analysis',
      formula: 'Score +1 per country speaking commonLanguage, 5 intervals',
      triggerConditions: 'involvedCountries + commonLanguage',
      description: 'If the team is multicultural and not all countries speak the common project language, socio-cultural distance problems may arise that hinder understanding',
      indicators: {
        differentLanguages: 'Different official languages in team countries',
        notAllSpeakCommon: 'Not all members speak the common language'
      },
      recommendations: {
        languageTraining: 'Provide training in the common language',
        translationServices: 'Use translation services',
        documentInCommon: 'Document in the same language',
        bilingualFacilitators: 'Assign bilingual facilitators'
      }
    },

    linguistic_distance_no_common_language: {
      title: 'No Common Language Defined',
      category: 'coordination',
      typicalSeverities: ['high', 'critical'],
      possibleSources: ['expert_rules_linguistic'],
      isHofstedeRelated: true,
      algorithm: 'Language Overlap Analysis',
      triggerConditions: 'involvedCountries without commonLanguage',
      description: 'If the multicultural team has no common project language defined, the lack of a shared language will cause constant misunderstandings and delays',
      indicators: {
        multiculturalNoCommon: 'Multicultural team without common language',
        highMisunderstandingRisk: 'High risk of misunderstandings'
      },
      recommendations: {
        defineCommon: 'Define a common project language',
        languageTraining: 'Provide linguistic training',
        translationServices: 'Use translation services',
        documentInCommon: 'Document everything in that language'
      }
    },

    // Project Requirements Risks
    team_autonomy_risk: {
      title: 'Team Autonomy Risk',
      category: 'team',
      typicalSeverities: ['low', 'medium', 'high'],
      possibleSources: ['expert_rules_project_requirements'],
      isHofstedeRelated: true,
      algorithm: '1-5 Inverse Scale',
      formula: 'Risk = 6 - requiredAutonomyLevel',
      triggerConditions: 'requiredAutonomyLevel present (1-5)',
      description: 'If the project requires a high level of team autonomy, problems may arise if the team is not prepared to work with that degree of independence',
      indicators: {
        autonomyMismatch: 'Required vs available autonomy level',
        constantSupervision: 'Need for constant supervision'
      },
      recommendations: {
        evaluateAutonomy: 'Evaluate the team\'s actual capacity',
        training: 'Provide training',
        adjustSupervision: 'Adjust supervision structure'
      }
    },

    schedule_flexibility_risk: {
      title: 'Schedule Flexibility Risk',
      category: 'management',
      typicalSeverities: ['low', 'medium', 'high'],
      possibleSources: ['expert_rules_project_requirements'],
      isHofstedeRelated: true,
      algorithm: '1-5 Inverse Scale',
      formula: 'Risk = 6 - requiredScheduleFlexibility',
      triggerConditions: 'requiredScheduleFlexibility present (1-5)',
      description: 'If the project requires high schedule flexibility, coordination and availability problems may arise',
      indicators: {
        flexibilityMismatch: 'Required vs available schedule flexibility',
        timezoneCoordination: 'Coordination across different time zones'
      },
      recommendations: {
        evaluateFlexibility: 'Evaluate team flexibility',
        coreHours: 'Establish core hours',
        availabilityWindows: 'Define availability windows'
      }
    },

    travel_availability_risk: {
      title: 'Travel Availability Risk',
      category: 'management',
      typicalSeverities: ['low', 'medium', 'high'],
      possibleSources: ['expert_rules_project_requirements'],
      isHofstedeRelated: true,
      algorithm: '1-5 Inverse Scale',
      formula: 'Risk = 6 - requiredTravelAvailability',
      triggerConditions: 'requiredTravelAvailability present (1-5)',
      description: 'If the project requires high travel availability, logistical and cost problems may arise',
      indicators: {
        travelMismatch: 'Required vs available travel availability',
        inPersonMeetings: 'Need for in-person meetings'
      },
      recommendations: {
        evaluateTravel: 'Evaluate team availability',
        planAhead: 'Plan travel in advance',
        virtualMeetings: 'Prioritize virtual meetings',
        budgetTravel: 'Budget travel costs'
      }
    },

    // Technical Risks
    skill_gap: {
      title: 'Skill Gap',
      category: 'technical',
      typicalSeverities: ['medium', 'high', 'critical'],
      possibleSources: ['expert_rules', 'cbr', 'combined'],
      isHofstedeRelated: false,
      triggerConditions: 'Technology stack complexity vs team experience',
      description: 'If the team lacks several project technologies or technology coverage is below 50%, a skill gap will arise affecting quality and development speed',
      indicators: {
        lowTechMatch: 'Technical match <50%',
        missingTechnologies: '≥3 missing technologies',
        juniorInComplex: 'Junior experience in complex project'
      },
      recommendations: {
        hireSpecialists: 'Hire specialists in critical technologies',
        intensiveTraining: 'Implement a training program',
        addSenior: 'Add a senior profile for mentoring'
      }
    },

    tool_fragmentation: {
      title: 'Tool Fragmentation',
      category: 'technical',
      typicalSeverities: ['low', 'medium'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Too many tools without integration',
      description: 'If the project uses several tools without integration, tool fragmentation will arise causing confusion and productivity loss',
      indicators: {
        tooManyTools: '>5 main tools'
      },
      recommendations: {
        limitTools: 'Limit the number of tools and ensure their integration'
      }
    },

    // Team Risks
    team_overload: {
      title: 'Team Overload',
      category: 'team',
      typicalSeverities: ['medium', 'high', 'critical'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Workload vs team capacity',
      description: 'If team members work on more than two concurrent projects, exceed 45 weekly hours, or show high stress tendency, work overload may arise',
      indicators: {
        highHours: '>45h/week average',
        concurrentProjects: '≥3 concurrent projects',
        multipleOverloaded: 'Multiple overloaded members'
      },
      recommendations: {
        redistributeOrHire: 'Redistribute workload or hire more resources',
        reduceConcurrency: 'Reduce project concurrency or extend deadlines'
      }
    },

    team_conflicts: {
      title: 'Team Conflicts',
      category: 'team',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Personality clashes, poor communication',
      description: 'If personality clashes or poor communication exist among team members, conflicts may arise affecting productivity and work environment',
      indicators: {
        tensions: 'Interpersonal tensions',
        poorCommunication: 'Deteriorated communication',
        lowMorale: 'Low morale'
      },
      recommendations: {
        mediation: 'Apply conflict mediation',
        teamBuilding: 'Conduct team building activities',
        clarifyRoles: 'Clarify roles and responsibilities'
      }
    },

    burnout_susceptibility: {
      title: 'Burnout Susceptibility',
      category: 'team',
      typicalSeverities: ['medium', 'high', 'critical'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'High workload, long hours, stress',
      description: 'If the team shows high neuroticism, high workload, and requires synchronous communication with low time overlap, burnout may arise',
      indicators: {
        highNeuroticism: 'High neuroticism',
        highWorkload: 'High workload',
        noWorkLife: 'No work-life balance',
        sustainedPressure: 'Sustained pressure'
      },
      recommendations: {
        workloadLimits: 'Define clear workload limits',
        hourCaps: 'Establish hour caps',
        wellnessPolicies: 'Promote wellness and work-life balance policies'
      }
    },

    social_isolation: {
      title: 'Social Isolation',
      category: 'team',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'High remote work percentage',
      description: 'If remote work exceeds 70%, there are no annual in-person meetings, no prior joint experience, and no team building activities, social isolation may occur',
      indicators: {
        highRemote: '>70% remote work',
        noPriorFaceToFace: 'Team formed by people without prior face-to-face communication',
        noTeamExperience: 'Team without prior experience working together',
        noTeamBuilding: 'No team building activities'
      },
      recommendations: {
        socialChannels: 'Foster social communication channels',
        teamBuildingActivities: 'Organize remote and in-person team building activities',
        workVisibility: 'Give visibility to each member\'s work'
      }
    },

    conflict_escalation_risk: {
      title: 'Conflict Escalation Risk',
      category: 'team',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Unresolved conflicts, poor communication',
      description: 'If the team has low agreeableness, high cultural diversity, and multiple teams involved, conflict risk may arise',
      indicators: {
        lowAgreeableness: 'Low average agreeableness (<3)',
        highCulturalDiversity: 'High cultural diversity',
        conflictivePersonalities: 'Conflictive personalities'
      },
      recommendations: {
        communicationProtocols: 'Establish clear communication protocols',
        conflictProcess: 'Define an explicit conflict resolution process',
        clarifyOwnership: 'Ensure role and responsibility clarity'
      }
    },

    onboarding_issues: {
      title: 'Onboarding Issues',
      category: 'team',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'New team members, complex project',
      description: 'If the team is composed of new members, there is no mentoring program or onboarding documentation, onboarding problems may arise',
      indicators: {
        manyNewMembers: '>30% new members',
        inadequateOnboarding: 'Inadequate onboarding',
        highComplexity: 'High project complexity',
        remoteWork: 'Remote work'
      },
      recommendations: {
        mentoring: 'Implement a mentoring program',
        welcomePack: 'Create a welcome pack with documentation and key contacts',
        introMeetings: 'Schedule introductory meetings'
      }
    },

    digital_fatigue: {
      title: 'Digital Fatigue',
      category: 'organizational',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'High digital interaction, remote work',
      description: 'If work is fully remote, there is a high number of meetings and no disconnection policy, digital fatigue may arise',
      indicators: {
        highRemote: 'High percentage of remote work',
        manyTools: 'Multiple digital tools',
        screenTime: 'Extended screen time'
      },
      recommendations: {
        breakTime: 'Establish meeting-free days',
        limitMeetings: 'Promote breaks',
        asynchronous: 'Use asynchronous alternatives'
      }
    },

    work_life_boundary_blur: {
      title: 'Work-Life Boundary Blur',
      category: 'organizational',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Remote work, always-on culture',
      description: 'If work mode is remote, there is no disconnection policy or defined schedule and deadlines are tight, burnout may arise',
      indicators: {
        alwaysOnCulture: 'Always-on culture',
        noWorkSchedule: 'No defined schedules',
        homeOffice: 'Work from home without boundaries'
      },
      recommendations: {
        clearSchedules: 'Define clear disconnection policies',
        respectOffTime: 'Respect off-work hours'
      }
    },

    meeting_fatigue: {
      title: 'Meeting Fatigue',
      category: 'organizational',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Too many meetings, inefficient meetings',
      description: 'If there is an excessive number of meetings, multiple distributed teams, burnout may arise',
      indicators: {
        manyMeetings: 'More than 5 daily meetings',
        longMeetings: 'Meetings longer than 1 hour',
        noBreaks: 'Consecutive meetings without breaks'
      },
      recommendations: {
        limitMeetings: 'Limit meeting duration',
        shorterMeetings: 'Prioritize asynchronous communication'
      }
    },

      timezone_scheduling_gap: {
        title: 'Timezone Scheduling Gap',
        category: 'management',
        typicalSeverities: ['medium', 'high'],
        possibleSources: ['expert_rules', 'cbr'],
        isHofstedeRelated: false,
        triggerConditions: 'Distributed team, timezone differences',
        description: 'If the project has low time overlap, three or more different time zones, and frequent meetings, gaps will arise making team synchronization difficult',
        indicators: {
          lowOverlap: 'Low time overlap (<3h)',
          manyTimezones: '≥3 time zones',
          frequentMeetings: 'Frequent meetings required'
        },
        recommendations: {
          sharedHours: 'Set shared working hours for the whole team',
          rotateMeetings: 'Rotate meeting times fairly',
          asyncCommunication: 'Use asynchronous communication',
          recordMeetings: 'Record important meetings',
          flexibleStaff: 'Assign team members with schedule flexibility'
        }
      },

      role_clarity_gap: {
        title: 'Role Clarity Gap',
        category: 'management',
        typicalSeverities: ['medium', 'high'],
        possibleSources: ['expert_rules', 'cbr'],
        isHofstedeRelated: false,
        triggerConditions: 'Unclear roles, overlapping responsibilities',
        description: 'If the team exceeds eight members and roles are not clearly defined, lack of clarity may arise',
        indicators: {
          largeTeam: 'Large team (>8)',
          noOrgChart: 'No org chart',
          multipleTeams: 'Multiple teams'
        },
        recommendations: {
          defineRoles: 'Define roles and responsibilities',
          reviewRoles: 'Review roles at project start with the whole team'
        }
      },

      knowledge_management_gap: {
        title: 'Knowledge Management Gap',
        category: 'organizational',
        typicalSeverities: ['medium', 'high'],
        possibleSources: ['expert_rules', 'cbr'],
        isHofstedeRelated: false,
        triggerConditions: 'Knowledge silos, no documentation',
        description: 'If the team is large, there are no knowledge management tools and documentation is minimal, a knowledge management gap may arise',
        indicators: {
          oversizedTeam: 'Team too large >5 people'
        },
        recommendations: {
          knowledgeSystem: 'Implement a knowledge management system',
          updatedWiki: 'Maintain an up-to-date wiki',
          dailyDocs: 'Document work continuously'
        }
      },

      remote_work_support_gap: {
        title: 'Remote Work Support Gap',
        category: 'organizational',
        typicalSeverities: ['medium', 'high'],
        possibleSources: ['expert_rules', 'cbr'],
        isHofstedeRelated: false,
        triggerConditions: 'High remote work, lack of infrastructure',
        description: 'If work mode is not in-person and no policies exist, there will be a lack of remote work support',
        indicators: {
          highRemote: '>50% remote work',
          noPolicies: 'No remote work policies',
          noTools: 'No collaborative tools',
          noTechSupport: 'No home-office technical support'
        },
        recommendations: {
          remotePolicies: 'Define clear policies',
          provideTools: 'Provide adequate tools',
          homeOfficeSupport: 'Offer technical and ergonomic support'
        }
      },

    technostress_overload: {
      title: 'Technostress Overload',
      category: 'organizational',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Complex tools, constant notifications',
      description: 'If the project uses too many digital tools and there is no adequate training, overload may arise',
      indicators: {
        tooManyTools: 'Too many different tools',
        complexTools: 'Complex tools',
        constantUpdates: 'Constant technological changes'
      },
      recommendations: {
        standardizeTools: 'Consolidate technological tools',
        training: 'Provide comprehensive training',
        simplify: 'Implement changes gradually'
      }
    },

      change_resistance_risk: {
        title: 'Resistance to Change',
        category: 'organizational',
        typicalSeverities: ['medium', 'high'],
        possibleSources: ['expert_rules', 'cbr'],
        isHofstedeRelated: false,
        triggerConditions: 'Organizational changes, new processes',
        description: 'If the team has low openness to experience and the project is highly complex, resistance to change may arise',
        indicators: {
          lowOpenness: 'Low openness to experience',
          manyNewTech: 'Multiple new technologies',
          methodChanges: 'Methodological changes',
          experienceGap: 'Experience gap'
        },
        recommendations: {
          adoptionPlan: 'Apply progressive adoption plans',
          pairingMentoring: 'Mentoring in new areas',
          limitChanges: 'Limit simultaneous changes'
        }
      },

    // Management Risks
    scope_creep: {
      title: 'Scope Creep',
      category: 'management',
      typicalSeverities: ['medium', 'high', 'critical'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Unclear requirements, weak change control',
      description: 'If the project description is vague, documentation incomplete and key roles are not defined, risk of uncontrolled scope expansion may arise',
      indicators: {
        frequentChanges: 'Frequent changes in requirements',
        poorDocumentation: 'Poor documentation',
        stakeholderPressure: 'Stakeholder pressure'
      },
      recommendations: {
        changeControl: 'Hold an initial requirements meeting',
        clearScope: 'Define a clear MVP',
        stakeholderManagement: 'Maintain alignment with stakeholders'
      }
    },

    process_mismatch: {
      title: 'Process Mismatch',
      category: 'management',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'Methodology vs project needs mismatch',
      description: 'If the project lacks onboarding processes, CI/CD, has tool fragmentation and low experience in distributed projects, a process mismatch will occur',
      indicators: {
        heavyProcess: 'Too heavy processes',
        lightProcess: 'Insufficient processes',
        poorAdherence: 'Low adherence to processes'
      },
      recommendations: {
        adaptProcess: 'Adapt ceremonies to distributed work',
        rightSize: 'Document workflows'
      }
    },

    dependency_blockage: {
      title: 'Dependency Blockage',
      category: 'management',
      typicalSeverities: ['medium', 'high'],
      possibleSources: ['expert_rules', 'cbr'],
      isHofstedeRelated: false,
      triggerConditions: 'External dependencies, complex integrations',
      description: 'If there are multiple critical dependencies and several teams, blockages may occur delaying the project',
      indicators: {
        externalDependencies: 'Critical external dependencies',
        delays: 'Frequent delays',
        lackOfControl: 'Lack of control over dependencies'
      },
      recommendations: {
        identifyEarly: 'Hold weekly synchronization meetings',
        alternatives: 'Add integration time to planning',
        activeManagement: 'Define clear interfaces between teams'
      }
    },

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
      // Currículo
      cv_uploaded: {
        title: 'Curriculum Uploaded',
        message: 'Your curriculum has been uploaded successfully'
      },
      cv_processed: {
        title: 'Curriculum Processed',
        message: 'Your curriculum has been processed successfully'
      },
      cv_analysis_ready: {
        title: 'Curriculum Analysis Ready',
        message: 'Your curriculum analysis is now available'
      },
      cv_analysis_failed: {
        title: 'Curriculum Analysis Failed',
        message: 'An error occurred while analyzing your curriculum'
      },
      cv_submitted_to_org: {
        title: 'New Curriculum Received',
        message: '{userName} has submitted their curriculum to {organizationName}'
      },
      cv_reviewed: {
        title: 'Curriculum Update',
        message: 'Your curriculum submitted to {organizationName} has been reviewed'
      },
      cv_status_changed: {
        title: 'Curriculum Status Updated',
        message: 'The status of your curriculum at {organizationName} has changed to: {statusLabel}'
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
      dependency_blockage: 'Blockages from external dependencies',
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
      communication_tools_missing: 'Lack of adequate communication tools for coordination',
      tool_fragmentation: 'Excessive tools without integration causing confusion',
      team_conflicts: 'Interpersonal conflicts affecting productivity and work environment',
      digital_fatigue: 'Mental exhaustion from excessive digital tool usage and meetings',
      work_life_boundary_blur: 'Inability to disconnect from work due to lack of boundaries',
      meeting_fatigue: 'Exhaustion from excessive and prolonged meetings',
      technostress_overload: 'Overload from too many digital tools without adequate training'
    }
  },

  // Team Synergy translations
  synergy: {
    // Availability messages
    notAvailable: {
      message: 'No personality data available for team members',
      recommendation: 'Request team members to complete BFI-44 assessment'
    },

    // Team roles
    roles: {
      innovator: {
        name: 'Innovator/Creator',
        description: 'Generates new ideas and creative solutions'
      },
      executor: {
        name: 'Executor/Implementer',
        description: 'Completes tasks reliably and with discipline'
      },
      facilitator: {
        name: 'Facilitator/Coordinator',
        description: 'Manages team communication and resolves conflicts'
      },
      analyst: {
        name: 'Analyst/Specialist',
        description: 'Deep analysis and technical problem solving'
      },
      stabilizer: {
        name: 'Stabilizer/Monitor',
        description: 'Maintains team stability under pressure'
      }
    },

    // Project profiles
    projectProfiles: {
      innovation: {
        name: 'Innovation/Startup',
        description: 'New product development with novel technologies'
      },
      maintenance: {
        name: 'Legacy/Maintenance',
        description: 'Maintaining and improving existing systems'
      },
      crisis: {
        name: 'Crisis/Tight Deadline',
        description: 'High-pressure projects with strict deadlines'
      },
      research: {
        name: 'Research/R&D',
        description: 'Exploratory projects with uncertain outcomes'
      },
      standard: {
        name: 'Standard Development',
        description: 'Typical software development project'
      }
    },

    // Score levels
    levels: {
      excellent: 'excellent',
      good: 'good',
      fair: 'fair',
      poor: 'poor'
    },

    // Inverse score levels (for risks)
    inverseLevels: {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    },

    // Metric messages
    messages: {
      complementarity: {
        excellent: 'Team members complement each other excellently',
        good: 'Good complementarity between team members',
        fair: 'Moderate complementarity - some improvement possible',
        poor: 'Team members may be too similar or too different'
      },
      projectFit: {
        excellent: 'Team personality is excellent for {projectType}',
        good: 'Team personality is good for {projectType}',
        fair: 'Team personality is adequate for {projectType}',
        poor: 'Team personality may not be well-suited for {projectType}'
      },
      balance: {
        excellent: 'Team traits are well-balanced',
        good: 'Team traits are reasonably balanced',
        fair: 'Team traits show some imbalance',
        poor: 'Team traits are significantly imbalanced'
      },
      previousCollaborations: {
        excellent: 'Excellent collaboration history - {percentage}% of pairs have worked together',
        good: 'Good collaboration history - {percentage}% of pairs have worked together',
        fair: 'Moderate collaboration history - {percentage}% of pairs have worked together',
        limited: 'Limited collaboration history - only {percentage}% of pairs have worked together',
        none: 'No previous collaborations detected - this is a new team'
      },
      tooSmall: {
        complementarity: 'Team too small to measure complementarity',
        collaborations: 'Team too small to measure previous collaborations'
      }
    },

    // Conflict risks (deprecated but translated for backward compatibility)
    conflictRisks: {
      high_stress_tendency: {
        description: 'Team has high average neuroticism - may struggle under pressure',
        recommendation: 'Consider stress management training and regular check-ins'
      },
      low_discipline: {
        description: 'Team has low conscientiousness - quality and deadline risks',
        recommendation: 'Implement strict processes, code reviews, and project management oversight'
      },
      personality_conflict: {
        description: 'Wide variance in agreeableness - potential for interpersonal conflicts',
        recommendation: 'Assign a facilitator role and establish clear communication protocols'
      },
      low_adaptability: {
        description: 'Team has low openness - may resist new technologies or methods',
        recommendation: 'Provide extra time for adaptation and consider training programs'
      },
      extreme_difference: {
        description: 'Extreme differences in {trait} ({min} to {max})',
        recommendation: 'Be aware of different working styles related to {traitLower}'
      }
    },

    // Recommendations
    recommendations: {
      roleDiversity: {
        title: 'Improve Role Diversity',
        description: 'Team lacks diversity in personality roles',
        actions: [
          'Consider adding members with complementary personality profiles',
          'Identify missing team roles and recruit accordingly',
          'Use personality assessments in hiring process'
        ]
      },
      projectFit: {
        title: 'Improve Fit for {projectType} Projects',
        description: 'Team personality profile doesn\'t match project requirements',
        actions: [
          'Seek members with traits suited for {projectTypeLower}',
          'Provide training and support to compensate for trait gaps',
          'Adjust project management style to accommodate team personality'
        ]
      },
      buildCohesion: {
        title: 'Build Team Cohesion',
        description: 'Limited collaboration history detected ({percentage}% of pairs have worked together)',
        actions: [
          'Schedule team-building activities to build rapport',
          'Pair experienced collaborators with new team members as mentors',
          'Establish clear communication channels and protocols early',
          'Consider more frequent check-ins during initial project phases'
        ]
      },
      leverageSynergy: {
        title: 'Leverage Existing Synergy',
        description: 'Strong collaboration history ({percentage}% of pairs have worked together)',
        actions: [
          'Capitalize on existing team dynamics and workflows',
          'Use past successful patterns as templates',
          'Be mindful of potential groupthink - encourage fresh perspectives'
        ]
      },
      success: {
        title: 'Excellent Team Synergy',
        description: 'Team shows strong personality complementarity and balance',
        actions: [
          'Maintain current team composition',
          'Continue to monitor team dynamics',
          'Use this team as a template for future projects'
        ]
      }
    },

    // Summary / explanation
    summary: {
      text: 'This team has {level} synergy ({score}/100) for {projectType} projects. The team shows {roleDiversityLevel} role diversity and {projectFitLevel} fit with project requirements.'
    },

    // Strengths
    strengths: {
      roleDiversity: 'Team has {uniqueRoles} different personality roles, ensuring good coverage',
      projectFit: 'Team personality profile matches {projectType} project requirements',
      previousCollaborations: 'Strong collaboration history with {totalCollaborations} past project(s) together'
    },

    // Concerns
    concerns: {
      roleDiversity: 'Team lacks diversity in personality roles',
      projectFit: 'Team personality may not be suited for this project type',
      previousCollaborations: 'Limited or no previous collaboration history'
    },

    // Incremental update note
    incrementalNote: 'New member has no BFI-44 profile yet. Synergy based on existing team.'
  },

  // Personality Optimizer translations
  personalityOptimizer: {
    // Addition validation messages (validateTeamAddition)
    addition: {
      noData: 'Unable to assess impact due to missing personality data - proceeding based on technical fit',
      excellent: 'Excellent addition - significantly improves team synergy',
      good: 'Good addition - improves team synergy',
      neutral: 'Neutral addition - maintains current synergy level',
      acceptable: 'Acceptable - slight decrease in synergy but may be justified by technical skills',
      warning: 'Warning - may negatively impact team synergy. Consider alternatives if available.'
    },

    // Improvement comparison messages (compareTeamSynergy)
    improvement: {
      noData: 'Unable to compare due to missing personality data',
      significant: 'Significant improvement in team synergy',
      moderate: 'Moderate improvement in team synergy',
      slight: 'Slight improvement in team synergy',
      noChange: 'No change in team synergy',
      decreased: 'Team synergy decreased (technical fit may be prioritized)'
    },

    // Hiring recommendations
    hiring: {
      notAvailable: 'Unable to generate recommendations without personality data',
      seekRole: 'Seek {roleName} to fill missing role in team',
      higherTrait: 'Higher {trait}',
      lowAverage: 'Team average is low ({average})',
      veryHighTrait: 'Very high {trait}',
      highAverage: 'Team average is already high ({average})',
      lowNeuroticism: 'Low Neuroticism (< 2.5)',
      balanceStress: 'To balance high team stress tendency',
      highConscientiousness: 'High Conscientiousness (> 4.0)',
      improveDiscipline: 'To improve team discipline and reliability'
    }
  }
};
