/**
 * Seed case dataset for the CBR system.
 * Extracted from seedCases.service.js to keep data and logic separate.
 */

/**
 * Seed cases based on industry data and PM literature
 * Sources: PMI PMBOK, Standish Group Chaos Report, Scrum Alliance surveys
 */
const SEED_CASES = [
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Desarrollo de software multirregional',
      briefDescription: 'Proyecto de software con el equipo distribuido en 3+ zonas horarias',
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
          description: 'Las diferencias horarias provocaron retrasos en la toma de decisiones y en la resolución de problemas',
          impact: 'schedule',
          rootCause: 'Pocas horas de solapamiento y ausencia de protocolos "async-first"'
        },
        {
          type: 'process_mismatch',
          severity: 'medium',
          description: 'Las ceremonias de Scrum fueron ineficientes con un equipo distribuido',
          impact: 'productivity',
          rootCause: 'Scrum tradicional sin adaptar al contexto remoto/distribuido'
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
        'Los protocolos de comunicación "async-first" son esenciales para equipos distribuidos',
        'Las actualizaciones diarias por escrito reducen la necesidad de reuniones síncronas',
        'La documentación clara reduce malentendidos entre zonas horarias'
      ],
      successfulPractices: [
        {
          practice: 'Establecer 4 horas de solapamiento central',
          impact: 'Mejoró la colaboración síncrona cuando era necesario',
          replicable: true
        },
        {
          practice: 'Uso intensivo de documentación compartida',
          impact: 'Redujo los huecos de comunicación',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Daily standup a una hora fija',
          impact: 'Baja participación de algunas regiones',
          reason: 'Conflictos de zona horaria'
        }
      ],
      recommendations: [
        'Empezar con un enfoque "async-first" desde el día 1',
        'Establecer protocolos de escalado claros',
        'Invertir en documentación completa'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'Guía PMI PMBOK - estudios sobre equipos distribuidos',
      tags: ['distributed', 'communication', 'high-complexity']
    }
  },
  
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Adopción de un nuevo framework',
      briefDescription: 'Proyecto con un stack tecnológico poco familiar',
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
          description: 'La curva de aprendizaje del equipo fue mayor de lo esperado',
          impact: 'schedule',
          rootCause: 'Formación insuficiente y falta de guía experta'
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
        'Invertir en formación inicial cuando se usan nuevas tecnologías',
        'La programación en pareja acelera la transferencia de conocimiento',
        'Incluir tiempo extra por curva de aprendizaje en las estimaciones'
      ],
      successfulPractices: [
        {
          practice: 'Sesiones semanales de intercambio de conocimiento',
          impact: 'La competencia del equipo mejoró más rápido',
          replicable: true
        },
        {
          practice: 'Incorporar un consultor externo durante las primeras 3 semanas',
          impact: 'Redujo errores costosos',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Esperar que el equipo aprendiera “sobre la marcha” sin estructura',
          impact: 'Progreso lento durante el primer mes',
          reason: 'No había un plan de aprendizaje formal'
        }
      ],
      recommendations: [
        'Reservar 2-3 semanas para formación intensiva',
        'Considerar apoyo externo en la primera fase',
        'Aumentar las estimaciones un 30-40% al adoptar tecnología nueva'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'Informe Chaos del Standish Group - estudios sobre adopción tecnológica',
      tags: ['skill-gap', 'new-technology', 'training']
    }
  },
  
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Asignación de recursos en multiproyecto',
      briefDescription: 'Miembros del equipo repartidos entre varios proyectos concurrentes',
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
          description: 'Agotamiento del equipo por carga excesiva entre varios proyectos',
          impact: 'schedule',
          rootCause: 'Mala asignación de recursos y expectativas poco realistas'
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
        'El cambio de contexto entre proyectos destruye la productividad',
        'La moral del equipo impacta directamente en la calidad y en los plazos',
        'El burnout es caro: prevenirlo es crítico'
      ],
      successfulPractices: [
        {
          practice: 'Reducir alcance y ampliar el plazo',
          impact: 'El equipo se recuperó y entregó trabajo de calidad',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Forzar horas extra de forma continuada',
          impact: 'Bajó la productividad y aumentaron los errores',
          reason: 'Ritmo insostenible'
        },
        {
          practice: 'Repartir el equipo entre demasiados proyectos',
          impact: 'Alto coste por cambio de contexto',
          reason: 'Mala planificación de recursos'
        }
      ],
      recommendations: [
        'Limitar los proyectos concurrentes por persona a un máximo de 2',
        'Monitorizar la carga de trabajo semanalmente',
        'Disponer de recursos de contingencia',
        'Reducir alcance en vez de forzar al equipo más allá de sus límites'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'Encuestas del sector sobre burnout en desarrollo',
      tags: ['overload', 'burnout', 'resource-allocation']
    }
  },

  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Proyecto con requisitos cambiantes',
      briefDescription: 'Proyecto con requisitos inicialmente vagos',
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
          description: 'El alcance creció aproximadamente un 50% durante el proyecto',
          impact: 'schedule',
          rootCause: 'Requisitos iniciales vagos y ausencia de control de cambios'
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
        'Aclarar requisitos al inicio ahorra muchísimo tiempo después',
        'El control de cambios no es opcional',
        'Alinear con stakeholders con frecuencia evita sorpresas'
      ],
      successfulPractices: [
        {
          practice: 'Implantar un comité de control de cambios',
          impact: 'Detuvo el crecimiento incontrolado del alcance',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Aceptar todas las peticiones sin priorización',
          impact: 'El cronograma dejó de tener sentido',
          reason: 'No había un proceso formal de cambios'
        }
      ],
      recommendations: [
        'Invertir 2-3 semanas en un taller detallado de requisitos',
        'Implantar control de cambios desde el día 1',
        'Definir claramente el MVP y ceñirse a él',
        'Cada funcionalidad nueva implica quitar otra o ampliar plazos'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'PMI Pulse of the Profession - gestión del alcance',
      tags: ['scope-creep', 'requirements', 'change-management']
    }
  },
  
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Integración entre equipos',
      briefDescription: 'Proyecto que requiere integración con varios equipos externos',
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
          description: 'Bloqueos frecuentes esperando a otros equipos',
          impact: 'schedule',
          rootCause: 'Dependencias poco claras y prioridades en conflicto'
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
        'Las dependencias suelen subestimarse',
        'Las sincronizaciones semanales entre equipos son esenciales',
        'Los servicios mock permiten desarrollo en paralelo'
      ],
      successfulPractices: [
        {
          practice: 'Implantar SLAs formales entre equipos',
          impact: 'Mejoró la responsabilidad y redujo bloqueos',
          replicable: true
        },
        {
          practice: 'Crear servicios mock para dependencias críticas',
          impact: 'El equipo pudo trabajar en paralelo',
          replicable: true
        }
      ],
      unsuccessfulPractices: [
        {
          practice: 'Asumir que otros equipos entregarían a tiempo',
          impact: 'Retrasos en cascada',
          reason: 'Sin seguimiento formal'
        }
      ],
      recommendations: [
        'Mapear todas las dependencias en detalle desde el inicio',
        'Establecer SLAs con equipos dependientes',
        'Incluir colchón de tiempo para integración (30%+)',
        'Usar servicios mock para desarrollo en paralelo'
      ]
    },
    metadata: {
      confidence: 0.5,
      isGeneric: true,
      basedOn: 'Casos de estudio de gestión de proyectos en entornos enterprise',
      tags: ['dependencies', 'integration', 'cross-team']
    }
  },
  
  // Additional 20 cases for Phase 3 testing (reaching 25+ cases)

  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Desarrollo de app móvil - startup',
      briefDescription: 'App móvil MVP para una startup con plazos muy ajustados',
      estimatedDuration: { value: 3, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 5, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['React Native', 'Firebase'], experienceLevel: 'mid', systemComplexity: 'medium', documentationLevel: 'minimal', requiresSpecializedTools: false, sharedInfrastructureDependency: 'low' },
        team: { size: 5, weeklyHours: 50, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'no', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 1, criticalDependencies: 2, informationFlow: 'unidirectional', stakeholdersCount: 3 }
      }
    },
    solution: { completed: true, qualityScore: 3.2, clientSatisfaction: 3.5, teamMorale: 2.8, actualRisks: [{ type: 'scope_creep', severity: 'high', description: 'Cambios constantes de requisitos', impact: 'scope', rootCause: 'Mentalidad de pivote en startups' }, { type: 'team_burnout', severity: 'medium', description: 'Las jornadas largas causaron fatiga', impact: 'quality', rootCause: 'Plazos poco realistas' }], metrics: { avgVelocity: 40, bugRate: 0.28, meetingEfficiency: 2.5, teamMoraleProgression: [3.5, 3.0, 2.8, 2.5], deploymentFrequency: 'daily', codeReviewTimeAvg: 1.0 } },
    result: { lessonsLearned: ['La disciplina de alcance en el MVP es crítica', 'El burnout impacta la calidad'], successfulPractices: [{ practice: 'Feature flags para releases incrementales', impact: 'Feedback más rápido', replicable: true }], unsuccessfulPractices: [{ practice: 'Trabajar 50+ horas semanales', impact: 'Burnout del equipo', reason: 'Insostenible' }], recommendations: ['Proteger el alcance del MVP', 'Limitar las horas extra', 'Usar feature flags'] },
    metadata: { confidence: 0.6, isGeneric: true, basedOn: 'Análisis de proyectos de startups', tags: ['mobile', 'mvp', 'startup'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Plataforma de datos - enterprise',
      briefDescription: 'Data lake y plataforma de analítica para una empresa',
      estimatedDuration: { value: 12, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America', 'Asia'], timeOverlap: 3, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'high', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Python', 'Spark', 'AWS'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 20, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 6, criticalDependencies: 10, informationFlow: 'multidirectional', stakeholdersCount: 12 }
      }
    },
    solution: { completed: true, qualityScore: 4.2, clientSatisfaction: 4.5, teamMorale: 4.0, actualRisks: [{ type: 'knowledge_gaps', severity: 'medium', description: 'Curva de aprendizaje con el nuevo stack tecnológico', impact: 'schedule', rootCause: 'Tecnologías emergentes' }], metrics: { avgVelocity: 35, bugRate: 0.12, meetingEfficiency: 4.0, teamMoraleProgression: [3.8, 4.0, 4.0, 4.2], deploymentFrequency: 'bi-weekly', codeReviewTimeAvg: 2.5 } },
    result: { lessonsLearned: ['Una buena documentación evita problemas', 'La comunicación asíncrona funciona a escala'], successfulPractices: [{ practice: 'Documentación exhaustiva', impact: 'Transferencia de conocimiento fluida', replicable: true }, { practice: 'Comunicación "async-first"', impact: 'Productividad entre zonas horarias', replicable: true }], unsuccessfulPractices: [], recommendations: ['Invertir en documentación', 'Usar patrones asíncronos para equipos distribuidos'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Proyectos enterprise de datos', tags: ['data', 'enterprise', 'distributed'] }
  },

  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Desarrollo de plataforma IoT',
      briefDescription: 'Plataforma de recopilación y monitorización de datos IoT',
      estimatedDuration: { value: 10, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe', 'Asia'], timeOverlap: 4, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 3, culturalDiversity: 'high', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Python', 'MQTT', 'TimescaleDB', 'React'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'high' },
        team: { size: 12, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 5, criticalDependencies: 8, informationFlow: 'bidirectional', stakeholdersCount: 7 }
      }
    },
    solution: { completed: true, qualityScore: 4.0, clientSatisfaction: 4.2, teamMorale: 3.8, actualRisks: [{ type: 'dependency_blockage', severity: 'medium', description: 'Retrasos del proveedor de hardware impactaron el cronograma', impact: 'schedule', rootCause: 'Dependencia externa' }], metrics: { avgVelocity: 30, bugRate: 0.15, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.8, 3.8, 4.0], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.0 } },
    result: { lessonsLearned: ['Las dependencias de hardware necesitan colchones', 'Los simuladores aceleran las pruebas'], successfulPractices: [{ practice: 'Construir simuladores de hardware', impact: 'Permitió desarrollo en paralelo', replicable: true }], unsuccessfulPractices: [{ practice: 'Esperar a la entrega del hardware', impact: 'Retrasos iniciales', reason: 'Sin estrategia de simulación' }], recommendations: ['Construir simuladores para dependencias de hardware', 'Añadir un 30% de colchón por retrasos de proveedores'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Estudios de proyectos IoT', tags: ['iot', 'hardware', 'real-time'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Implementación de API Gateway',
      briefDescription: 'API Gateway central para un ecosistema de microservicios',
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
    result: { lessonsLearned: ['Los requisitos claros evitan problemas', 'Una buena sincronización del equipo es crítica con infraestructura compartida'], successfulPractices: [{ practice: 'Sincronización periódica con equipos consumidores', impact: 'Alineación y feedback temprano', replicable: true }, { practice: 'Documentación de API exhaustiva', impact: 'Adopción fluida', replicable: true }], unsuccessfulPractices: [], recommendations: ['Mantener comunicación clara con todos los equipos dependientes', 'Invertir mucho en documentación y ejemplos'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'Implementaciones de API Gateway', tags: ['api', 'infrastructure', 'integration'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Pipeline de Machine Learning',
      briefDescription: 'Pipeline de entrenamiento y despliegue de modelos ML',
      estimatedDuration: { value: 7, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America', 'Europe'], timeOverlap: 5, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'medium', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Python', 'TensorFlow', 'MLflow', 'Kubernetes'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 10, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'medium', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 3, criticalDependencies: 6, informationFlow: 'bidirectional', stakeholdersCount: 5 }
      }
    },
    solution: { completed: true, qualityScore: 3.8, clientSatisfaction: 4.0, teamMorale: 3.5, actualRisks: [{ type: 'scope_creep', severity: 'high', description: 'Los criterios de rendimiento del modelo fueron cambiando', impact: 'scope', rootCause: 'Incertidumbre en proyectos ML' }], metrics: { avgVelocity: 25, bugRate: 0.18, meetingEfficiency: 3.5, teamMoraleProgression: [3.8, 3.5, 3.5, 3.8], deploymentFrequency: 'weekly', codeReviewTimeAvg: 3.0 } },
    result: { lessonsLearned: ['Los requisitos en ML son inherentemente inciertos', 'El enfoque iterativo es esencial'], successfulPractices: [{ practice: 'Revisiones periódicas del rendimiento con stakeholders', impact: 'Alineó expectativas', replicable: true }], unsuccessfulPractices: [{ practice: 'Fijar un objetivo de precisión desde el inicio', impact: 'Expectativas poco realistas', reason: 'Naturaleza de ML' }], recommendations: ['Aceptar la incertidumbre en proyectos ML', 'Usar enfoque iterativo con revisiones periódicas', 'Definir rangos de rendimiento, no objetivos fijos'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Patrones de proyectos ML', tags: ['ml', 'ai', 'data-science'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Endurecimiento de seguridad',
      briefDescription: 'Auditoría de seguridad y remediación de la aplicación',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 3, culturalDiversity: 'low', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Security Tools', 'OWASP'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'partial', requiresSpecializedTools: true, sharedInfrastructureDependency: 'very_high' },
        team: { size: 7, weeklyHours: 40, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'medium', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 10, criticalDependencies: 15, informationFlow: 'multidirectional', stakeholdersCount: 20 }
      }
    },
    solution: { completed: true, qualityScore: 4.5, clientSatisfaction: 4.8, teamMorale: 4.0, actualRisks: [{ type: 'dependency_blockage', severity: 'medium', description: 'Esperas a que otros equipos implementaran correcciones', impact: 'schedule', rootCause: 'Dependencias con múltiples equipos' }], metrics: { avgVelocity: 35, bugRate: 0.10, meetingEfficiency: 4.0, teamMoraleProgression: [3.8, 4.0, 4.0, 4.2], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.0 } },
    result: { lessonsLearned: ['La seguridad requiere apoyo de todos los equipos', 'Es crítico un marco de priorización'], successfulPractices: [{ practice: 'Priorización basada en riesgo', impact: 'Enfocó en problemas críticos', replicable: true }], unsuccessfulPractices: [{ practice: 'Tratar todos los hallazgos por igual', impact: 'Desperdicio de recursos al inicio', reason: 'Priorización incorrecta' }], recommendations: ['Usar priorización basada en riesgo', 'Conseguir sponsorship ejecutivo para iniciativas de seguridad'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Estudios de iniciativas de seguridad', tags: ['security', 'audit', 'cross-team'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Transformación DevOps',
      briefDescription: 'Implementación de CI/CD e infraestructura como código',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 4, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Terraform', 'Jenkins', 'Docker', 'AWS'], experienceLevel: 'mid', systemComplexity: 'high', documentationLevel: 'partial', requiresSpecializedTools: true, sharedInfrastructureDependency: 'very_high' },
        team: { size: 8, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'partial', toolsFragmentation: 'high', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 12, criticalDependencies: 18, informationFlow: 'multidirectional', stakeholdersCount: 15 }
      }
    },
    solution: { completed: true, qualityScore: 3.7, clientSatisfaction: 3.9, teamMorale: 3.3, actualRisks: [{ type: 'resistance_to_change', severity: 'high', description: 'Los equipos de desarrollo se resistieron a los nuevos procesos', impact: 'adoption', rootCause: 'Gestión del cambio cultural' }, { type: 'knowledge_gaps', severity: 'medium', description: 'Curva de aprendizaje del equipo con nuevas herramientas', impact: 'schedule', rootCause: 'Nuevo stack tecnológico' }], metrics: { avgVelocity: 28, bugRate: 0.20, meetingEfficiency: 3.2, teamMoraleProgression: [3.5, 3.3, 3.2, 3.5], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.8 } },
    result: { lessonsLearned: ['El cambio cultural es tan importante como el técnico', 'Invertir en formación compensa'], successfulPractices: [{ practice: 'Programa de champions en cada equipo', impact: 'Adopción desde la base', replicable: true }], unsuccessfulPractices: [{ practice: 'Mandato de arriba abajo sin formación', impact: 'Resistencia inicial', reason: 'Mala gestión del cambio' }], recommendations: ['Invertir en formación y workshops', 'Usar un modelo de champions para la adopción', 'Empezar con equipos piloto'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Estudios de transformación DevOps', tags: ['devops', 'transformation', 'culture'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Dashboard de analítica en tiempo real',
      briefDescription: 'Dashboard de business intelligence con datos en tiempo real',
      estimatedDuration: { value: 5, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 3, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['React', 'GraphQL', 'PostgreSQL', 'Kafka'], experienceLevel: 'mid', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: false, sharedInfrastructureDependency: 'medium' },
        team: { size: 9, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 2, criticalDependencies: 5, informationFlow: 'unidirectional', stakeholdersCount: 10 }
      }
    },
    solution: { completed: true, qualityScore: 3.9, clientSatisfaction: 4.1, teamMorale: 3.7, actualRisks: [{ type: 'scope_creep', severity: 'high', description: 'Solicitudes constantes de nuevos widgets', impact: 'scope', rootCause: 'Requisitos iniciales poco claros' }], metrics: { avgVelocity: 33, bugRate: 0.16, meetingEfficiency: 3.5, teamMoraleProgression: [3.5, 3.7, 3.7, 3.9], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.2 } },
    result: { lessonsLearned: ['Los requisitos de BI evolucionan: hay que planificarlo', 'Las demos a stakeholders aportan claridad'], successfulPractices: [{ practice: 'Demos semanales con stakeholders', impact: 'Feedback temprano evitó desperdicio', replicable: true }], unsuccessfulPractices: [{ practice: 'Construir todo desde el inicio', impact: 'Esfuerzo desperdiciado en funcionalidades no usadas', reason: 'Enfoque incorrecto' }], recommendations: ['Usar un enfoque iterativo con demos frecuentes', 'Construir primero el framework base y añadir widgets incrementalmente'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Estudios de proyectos BI', tags: ['bi', 'analytics', 'frontend'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Integración de pasarela de pago',
      briefDescription: 'Integración de pagos con múltiples proveedores',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 4, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Node.js', 'Stripe', 'PayPal API'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: false, sharedInfrastructureDependency: 'high' },
        team: { size: 6, weeklyHours: 40, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 3, criticalDependencies: 8, informationFlow: 'bidirectional', stakeholdersCount: 6 }
      }
    },
    solution: { completed: true, qualityScore: 4.3, clientSatisfaction: 4.6, teamMorale: 4.1, actualRisks: [{ type: 'dependency_blockage', severity: 'low', description: 'Cambios menores en APIs de proveedores', impact: 'maintenance', rootCause: 'Evolución de servicios externos' }], metrics: { avgVelocity: 36, bugRate: 0.09, meetingEfficiency: 4.2, teamMoraleProgression: [4.0, 4.1, 4.1, 4.3], deploymentFrequency: 'weekly', codeReviewTimeAvg: 1.8 } },
    result: { lessonsLearned: ['La capa de abstracción es crítica con múltiples proveedores', 'Las pruebas extensivas son clave en sistemas de pago'], successfulPractices: [{ practice: 'Capa de abstracción de proveedores', impact: 'Fácil añadir/cambiar proveedores', replicable: true }, { practice: 'Suite de pruebas exhaustiva', impact: 'Cero bugs de pago en producción', replicable: true }], unsuccessfulPractices: [], recommendations: ['Construir la capa de abstracción desde el día uno', 'Invertir fuerte en testing automatizado', 'Usar entornos sandbox de forma intensiva'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'Proyectos de integración de pagos', tags: ['payment', 'integration', 'third-party'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Plataforma SaaS multi-tenant',
      briefDescription: 'Construir un SaaS multi-tenant a partir de una app single-tenant',
      estimatedDuration: { value: 8, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 5, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Ruby on Rails', 'PostgreSQL', 'Redis'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'partial', requiresSpecializedTools: false, sharedInfrastructureDependency: 'very_high' },
        team: { size: 11, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'medium' },
        organizational: { involvedTeams: 4, criticalDependencies: 12, informationFlow: 'bidirectional', stakeholdersCount: 8 }
      }
    },
    solution: { completed: true, qualityScore: 3.6, clientSatisfaction: 3.8, teamMorale: 3.3, actualRisks: [{ type: 'technical_complexity', severity: 'very_high', description: 'Retos de aislamiento de datos', impact: 'quality', rootCause: 'Se subestimó la complejidad del multi-tenancy' }, { type: 'scope_underestimation', severity: 'high', description: 'Las funcionalidades de gestión de tenants aumentaron el alcance', impact: 'schedule', rootCause: 'Requisitos incompletos' }], metrics: { avgVelocity: 26, bugRate: 0.23, meetingEfficiency: 3.3, teamMoraleProgression: [3.5, 3.3, 3.2, 3.5], deploymentFrequency: 'weekly', codeReviewTimeAvg: 3.2 } },
    result: { lessonsLearned: ['El multi-tenancy fue más complejo de lo esperado', 'Los patrones de aislamiento de datos requieren diseño cuidadoso'], successfulPractices: [{ practice: 'Aislamiento por esquema (schema-based)', impact: 'Separación clara y seguridad', replicable: true }], unsuccessfulPractices: [{ practice: 'Subestimar la gestión de tenants', impact: 'Scope creep', reason: 'Análisis incompleto' }], recommendations: ['Diseñar la estrategia de aislamiento desde el principio', 'Incluir la gestión de tenants en el alcance inicial', 'Añadir un 40% de colchón por complejidad multi-tenant'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Proyectos de transformación SaaS', tags: ['saas', 'multi-tenant', 'architecture'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Implementación de cumplimiento (GDPR)',
      briefDescription: 'Cambios de cumplimiento GDPR en toda la aplicación',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 3, culturalDiversity: 'low', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Various'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'minimal', requiresSpecializedTools: false, sharedInfrastructureDependency: 'very_high' },
        team: { size: 10, weeklyHours: 40, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'waterfall', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'high', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 15, criticalDependencies: 25, informationFlow: 'multidirectional', stakeholdersCount: 20 }
      }
    },
    solution: { completed: true, qualityScore: 4.2, clientSatisfaction: 4.5, teamMorale: 3.5, actualRisks: [{ type: 'dependency_blockage', severity: 'high', description: 'Esperas a revisiones y aprobaciones legales', impact: 'schedule', rootCause: 'Cuellos de botella del proceso legal' }], metrics: { avgVelocity: 30, bugRate: 0.11, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.5, 3.4, 3.5], deploymentFrequency: 'bi-weekly', codeReviewTimeAvg: 2.5 } },
    result: { lessonsLearned: ['Las revisiones legales necesitan colchón', 'Los proyectos de cumplimiento requieren coordinación entre equipos'], successfulPractices: [{ practice: 'Comité central de compliance', impact: 'Enfoque consistente entre equipos', replicable: true }], unsuccessfulPractices: [{ practice: 'Cada equipo interpretó requisitos por su cuenta', impact: 'Inconsistencias al inicio', reason: 'Falta de coordinación' }], recommendations: ['Establecer una autoridad central de compliance', 'Añadir colchón significativo para revisiones legales', 'Documentar centralmente todas las decisiones de cumplimiento'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Estudios de proyectos de cumplimiento', tags: ['compliance', 'gdpr', 'legal'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Iniciativa de optimización de rendimiento',
      briefDescription: 'Mejoras de rendimiento a nivel de aplicación',
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
    result: { lessonsLearned: ['La optimización basada en datos evita desperdicio', 'Lo fácil (low-hanging fruit) debe ir primero'], successfulPractices: [{ practice: 'Presupuestos de rendimiento por página', impact: 'Objetivos claros y accountability', replicable: true }, { practice: 'Perfilar antes de optimizar', impact: 'Enfocado en cuellos de botella reales', replicable: true }], unsuccessfulPractices: [], recommendations: ['Perfilar siempre primero', 'Definir presupuestos de rendimiento', 'Priorizar por ratio impacto/esfuerzo', 'Automatizar pruebas de rendimiento'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'Estudios de optimización de rendimiento', tags: ['performance', 'optimization', 'technical'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Cumplimiento de accesibilidad (WCAG)',
      briefDescription: 'Llevar la aplicación al cumplimiento WCAG 2.1 AA',
      estimatedDuration: { value: 5, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'low', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['HTML', 'CSS', 'JavaScript', 'ARIA'], experienceLevel: 'mid', systemComplexity: 'medium', documentationLevel: 'partial', requiresSpecializedTools: true, sharedInfrastructureDependency: 'low' },
        team: { size: 8, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'B2' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 2, criticalDependencies: 3, informationFlow: 'unidirectional', stakeholdersCount: 4 }
      }
    },
    solution: { completed: true, qualityScore: 4.3, clientSatisfaction: 4.6, teamMorale: 4.0, actualRisks: [{ type: 'knowledge_gaps', severity: 'medium', description: 'Curva de aprendizaje del equipo con estándares WCAG', impact: 'schedule', rootCause: 'Nuevo conocimiento de dominio' }], metrics: { avgVelocity: 32, bugRate: 0.13, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.8, 4.0, 4.2], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.3 } },
    result: { lessonsLearned: ['La accesibilidad es más fácil si se integra desde el inicio', 'El testing automatizado captura la mayoría de problemas'], successfulPractices: [{ practice: 'Pruebas automatizadas de accesibilidad en CI/CD', impact: 'Detectó regresiones pronto', replicable: true }, { practice: 'Pruebas con usuarios y tecnología asistiva', impact: 'Encontró problemas reales', replicable: true }], unsuccessfulPractices: [{ practice: 'Solo pruebas manuales', impact: 'Se escaparon muchos problemas al inicio', reason: 'No escala' }], recommendations: ['Integrar pruebas de accesibilidad en CI/CD', 'Formar al equipo en estándares WCAG', 'Incluir usuarios con discapacidad en las pruebas'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Proyectos de accesibilidad', tags: ['accessibility', 'wcag', 'frontend'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Integración de chatbot y NLP',
      briefDescription: 'Chatbot de atención al cliente con NLP',
      estimatedDuration: { value: 6, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['North America', 'Asia'], timeOverlap: 4, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 3, culturalDiversity: 'high', realTimeCommunicationLevel: 'medium' },
        technical: { mainTechnologies: ['Python', 'Dialogflow', 'Node.js', 'WebSocket'], experienceLevel: 'senior', systemComplexity: 'high', documentationLevel: 'complete', requiresSpecializedTools: true, sharedInfrastructureDependency: 'medium' },
        team: { size: 9, weeklyHours: 40, distributedExperience: 'high', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'scrum', hasOnboarding: 'yes', hasCICD: 'yes', toolsFragmentation: 'medium', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 4, criticalDependencies: 6, informationFlow: 'bidirectional', stakeholdersCount: 8 }
      }
    },
    solution: { completed: true, qualityScore: 3.5, clientSatisfaction: 3.7, teamMorale: 3.4, actualRisks: [{ type: 'scope_creep', severity: 'high', description: 'Expectativas de precisión de NLP poco claras', impact: 'scope', rootCause: 'Incertidumbre en proyectos de IA' }, { type: 'dependency_blockage', severity: 'medium', description: 'Limitaciones del servicio NLP descubiertas tarde', impact: 'features', rootCause: 'Evaluación insuficiente' }], metrics: { avgVelocity: 27, bugRate: 0.21, meetingEfficiency: 3.2, teamMoraleProgression: [3.5, 3.4, 3.3, 3.5], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.8 } },
    result: { lessonsLearned: ['Las expectativas en proyectos de IA requieren gestión', 'Es esencial un fallback a humano'], successfulPractices: [{ practice: 'Ruta de escalado a humano', impact: 'Se mantuvo la satisfacción del usuario', replicable: true }], unsuccessfulPractices: [{ practice: 'Prometer 95% de precisión desde el inicio', impact: 'Expectativas poco realistas', reason: 'Incertidumbre de IA' }], recommendations: ['Definir expectativas realistas de IA', 'Construir fallback humano desde el día uno', 'Usar umbrales de confianza para escalar'] },
    metadata: { confidence: 0.7, isGeneric: true, basedOn: 'Estudios de proyectos de chatbots', tags: ['chatbot', 'nlp', 'ai'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: POC de integración blockchain',
      briefDescription: 'Prueba de concepto de una funcionalidad basada en blockchain',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'yes', weeklyMeetings: 4, culturalDiversity: 'low', realTimeCommunicationLevel: 'high' },
        technical: { mainTechnologies: ['Solidity', 'Ethereum', 'Web3.js'], experienceLevel: 'senior', systemComplexity: 'very_high', documentationLevel: 'minimal', requiresSpecializedTools: true, sharedInfrastructureDependency: 'low' },
        team: { size: 5, weeklyHours: 40, distributedExperience: 'low', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'partial', hasCICD: 'partial', toolsFragmentation: 'high', clarityOfRequirements: 'low' },
        organizational: { involvedTeams: 2, criticalDependencies: 4, informationFlow: 'unidirectional', stakeholdersCount: 5 }
      }
    },
    solution: { completed: true, qualityScore: 3.2, clientSatisfaction: 3.4, teamMorale: 3.8, actualRisks: [{ type: 'knowledge_gaps', severity: 'very_high', description: 'Curva de aprendizaje pronunciada con blockchain', impact: 'schedule', rootCause: 'Nuevo dominio tecnológico' }, { type: 'technical_complexity', severity: 'high', description: 'Bugs en smart contracts difíciles de corregir', impact: 'quality', rootCause: 'Naturaleza inmutable de blockchain' }], metrics: { avgVelocity: 20, bugRate: 0.30, meetingEfficiency: 3.5, teamMoraleProgression: [3.2, 3.5, 3.8, 3.8], deploymentFrequency: 'monthly', codeReviewTimeAvg: 4.5 } },
    result: { lessonsLearned: ['Blockchain tiene una curva de aprendizaje importante', 'Las estrategias de testing difieren de apps tradicionales'], successfulPractices: [{ practice: 'Pruebas extensivas en redes de test', impact: 'Detectó bugs críticos', replicable: true }], unsuccessfulPractices: [{ practice: 'Ir con prisa a producción (mainnet)', impact: 'Bug descubierto en producción', reason: 'Pruebas insuficientes' }], recommendations: ['Dar tiempo extra para aprendizaje', 'Usar redes de test de forma intensiva', 'Auditar smart contracts antes de mainnet', 'Valorar si blockchain es realmente necesario'] },
    metadata: { confidence: 0.6, isGeneric: true, basedOn: 'Estudios de POCs blockchain', tags: ['blockchain', 'poc', 'emerging-tech'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Implementación de observabilidad',
      briefDescription: 'Implementar monitorización, logging y trazas',
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
    result: { lessonsLearned: ['La observabilidad da retorno rápidamente', 'Empezar por las señales de oro'], successfulPractices: [{ practice: 'Priorizar SLIs/SLOs/SLAs primero', impact: 'Métricas claras de éxito', replicable: true }, { practice: 'Dashboards por equipo', impact: 'Ownership del equipo sobre métricas', replicable: true }], unsuccessfulPractices: [], recommendations: ['Empezar por señales de oro (latencia, tráfico, errores, saturación)', 'Definir SLOs con los equipos', 'Hacer dashboards accesibles a todos', 'Automatizar la gestión de alertas'] },
    metadata: { confidence: 0.9, isGeneric: true, basedOn: 'Proyectos de implementación de observabilidad', tags: ['observability', 'monitoring', 'devops'] }
  },
  {
    type: 'seed',
    source: 'literature',
    problem: {
      projectName: 'Genérico: Revisión de documentación técnica',
      briefDescription: 'Proyecto integral de documentación técnica',
      estimatedDuration: { value: 4, unit: 'months' },
      features: {
        coordination: { involvedCountries: ['Europe'], timeOverlap: 8, requiresSyncComm: 'only_critical_moments', weeklyMeetings: 2, culturalDiversity: 'low', realTimeCommunicationLevel: 'low' },
        technical: { mainTechnologies: ['Markdown', 'Documentation Tools'], experienceLevel: 'mid', systemComplexity: 'low', documentationLevel: 'minimal', requiresSpecializedTools: false, sharedInfrastructureDependency: 'low' },
        team: { size: 6, weeklyHours: 30, distributedExperience: 'medium', requiredLanguages: ['English'], languageProficiency: 'C1' },
        management: { methodology: 'kanban', hasOnboarding: 'yes', hasCICD: 'no', toolsFragmentation: 'low', clarityOfRequirements: 'high' },
        organizational: { involvedTeams: 10, criticalDependencies: 5, informationFlow: 'unidirectional', stakeholdersCount: 15 }
      }
    },
    solution: { completed: true, qualityScore: 4.4, clientSatisfaction: 4.7, teamMorale: 3.9, actualRisks: [{ type: 'knowledge_silos', severity: 'medium', description: 'Información dispersa entre equipos', impact: 'schedule', rootCause: 'No existía un repositorio central de conocimiento' }], metrics: { avgVelocity: 35, bugRate: 0.05, meetingEfficiency: 3.8, teamMoraleProgression: [3.5, 3.7, 3.9, 4.1], deploymentFrequency: 'weekly', codeReviewTimeAvg: 2.0 } },
    result: { lessonsLearned: ['El enfoque “documentation as code” funciona bien', 'Las contribuciones del equipo necesitan incentivos'], successfulPractices: [{ practice: 'Docs-as-code con control de versiones', impact: 'Mantenimiento y revisión sencillos', replicable: true }, { practice: 'Sesiones trimestrales de revisión de docs', impact: 'Mantuvo la documentación al día', replicable: true }], unsuccessfulPractices: [{ practice: 'Depender de voluntarios para contribuir', impact: 'Progreso lento', reason: 'Sin responsabilidad clara' }], recommendations: ['Tratar la documentación como un entregable de primera clase', 'Usar un enfoque docs-as-code', 'Hacer la documentación parte de la Definition of Done', 'Planificar sesiones regulares de revisión'] },
    metadata: { confidence: 0.8, isGeneric: true, basedOn: 'Estudios de proyectos de documentación', tags: ['documentation', 'knowledge', 'process'] }
  }
];

module.exports = SEED_CASES;
