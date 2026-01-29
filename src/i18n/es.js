/**
 * Spanish translations for risk catalog
 * Contains all risk types, titles, descriptions, and recommendations in Spanish
 */

module.exports = {
  risks: {
    // Communication Risks
    communication_breakdown: {
      title: 'Fallo de comunicación',
      description: 'Problemas de comunicación que impiden la coordinación efectiva del equipo',
      indicators: {
        delays: 'Retrasos en respuestas',
        infoNotShared: 'Información no compartida',
        misunderstandings: 'Malentendidos frecuentes'
      },
      recommendations: {
        asyncUpdates: 'Implementar actualizaciones asíncronas diarias',
        escalationProtocols: 'Definir protocolos claros de escalación',
        asyncTools: 'Usar herramientas de comunicación asíncrona efectivas',
        communicationNorms: 'Establecer normas de comunicación'
      }
    },

    communication_tools_missing: {
      title: 'Herramientas de comunicación inadecuadas',
      description: 'Falta de herramientas de comunicación apropiadas según el solapamiento horario entre países',
      indicators: {
        limitedOverlap: 'Solapamiento horario limitado',
        insufficientTools: 'Herramientas insuficientes para coordinación'
      },
      recommendations: {
        asyncUpdates: 'Implementar actualizaciones asíncronas diarias',
        escalationProtocols: 'Definir protocolos claros de escalación',
        asyncTools: 'Usar herramientas de comunicación asíncrona efectivas',
        communicationNorms: 'Establecer normas de comunicación'
      }
    },

    // Cultural & Linguistic Risks
    cultural_distance_risk: {
      title: 'Distancia cultural elevada',
      description: 'Alta distancia cultural entre países del equipo según dimensiones de Hofstede',
      indicators: {
        culturalDistance: 'Distancia cultural entre países del equipo',
        differentValues: 'Diferentes valores en dimensiones de Hofstede',
        culturalMisunderstandings: 'Posibles malentendidos culturales'
      },
      recommendations: {
        culturalTraining: 'Implementar capacitación intercultural para el equipo',
        sensitiveCommunication: 'Establecer normas de comunicación sensibles culturalmente',
        culturalMediators: 'Asignar mediadores culturales en el equipo'
      }
    },

    linguistic_distance_risk: {
      title: 'Distancia lingüística',
      description: 'Barrera lingüística parcial - no todos los países hablan el idioma común',
      indicators: {
        differentLanguages: 'Diferentes idiomas oficiales en países del equipo',
        notAllSpeakCommon: 'No todos los miembros hablan el idioma común'
      },
      recommendations: {
        languageTraining: 'Proporcionar capacitación en el idioma común',
        translationServices: 'Usar servicios de traducción si es necesario',
        documentInCommon: 'Documentar en idioma común',
        bilingualFacilitators: 'Asignar facilitadores bilingües'
      }
    },

    linguistic_distance_no_common_language: {
      title: 'Sin idioma común definido',
      description: 'No existe un idioma común definido para el equipo multicultural',
      indicators: {
        multiculturalNoCommon: 'Equipo multicultural sin idioma común',
        highMisunderstandingRisk: 'Alto riesgo de malentendidos'
      },
      recommendations: {
        defineCommon: 'Definir idioma común para el proyecto',
        languageTraining: 'Proporcionar capacitación en el idioma común',
        translationServices: 'Usar servicios de traducción si es necesario',
        documentInCommon: 'Documentar en idioma común'
      }
    },

    // Project Requirements Risks
    team_autonomy_risk: {
      title: 'Riesgo de autonomía del equipo',
      description: 'El nivel de autonomía del equipo no cumple con los requisitos del proyecto',
      indicators: {
        autonomyMismatch: 'Nivel de autonomía requerido vs disponible',
        constantSupervision: 'Necesidad de supervisión constante'
      },
      recommendations: {
        evaluateAutonomy: 'Evaluar si el equipo puede trabajar con la autonomía requerida',
        training: 'Proporcionar capacitación si es necesario',
        adjustSupervision: 'Ajustar estructura de supervisión',
        assignLeaders: 'Asignar líderes técnicos si se requiere alta autonomía'
      }
    },

    schedule_flexibility_risk: {
      title: 'Riesgo de flexibilidad horaria',
      description: 'La flexibilidad horaria del equipo no cumple con los requisitos del proyecto',
      indicators: {
        flexibilityMismatch: 'Flexibilidad horaria requerida vs disponible',
        timezoneCoordination: 'Coordinación en diferentes zonas horarias'
      },
      recommendations: {
        evaluateFlexibility: 'Evaluar flexibilidad horaria del equipo',
        coreHours: 'Establecer horarios core si es necesario',
        asyncTools: 'Usar herramientas asíncronas',
        availabilityWindows: 'Definir ventanas de disponibilidad'
      }
    },

    travel_availability_risk: {
      title: 'Riesgo de disponibilidad de viaje',
      description: 'La disponibilidad de viaje del equipo no cumple con los requisitos del proyecto',
      indicators: {
        travelMismatch: 'Disponibilidad de viaje requerida vs disponible',
        inPersonMeetings: 'Necesidad de reuniones presenciales'
      },
      recommendations: {
        evaluateTravel: 'Evaluar disponibilidad de viaje del equipo',
        planAhead: 'Planificar viajes con anticipación',
        virtualMeetings: 'Usar reuniones virtuales cuando sea posible',
        budgetTravel: 'Presupuestar costos de viaje'
      }
    },

    // Technical Risks
    skill_gap: {
      title: 'Brecha de habilidades',
      description: 'Falta de habilidades técnicas necesarias en el equipo',
      indicators: {
        lowTechMatch: 'Match técnico <50%',
        missingTechnologies: '≥3 tecnologías faltantes',
        juniorInComplex: 'Experiencia junior en proyecto complejo'
      },
      recommendations: {
        hireSpecialists: 'Contratar especialistas en tecnologías críticas',
        intensiveTraining: 'Programa de capacitación intensiva',
        addSenior: 'Añadir un senior, para entrenamiento o tareas de mentoría'
      }
    },

    technical_infrastructure: {
      title: 'Problemas de infraestructura técnica',
      description: 'Infraestructura técnica inadecuada para el proyecto',
      indicators: {
        insufficientInfra: 'Infraestructura insuficiente',
        inadequateTools: 'Herramientas inadecuadas'
      },
      recommendations: {
        improveInfra: 'Evaluar y mejorar infraestructura',
        investTools: 'Invertir en herramientas adecuadas',
        cloudServices: 'Contratar servicios cloud si es necesario'
      }
    },

    quality_degradation: {
      title: 'Degradación de calidad',
      description: 'Riesgo de disminución en la calidad del producto',
      indicators: {
        lowConscientiousness: 'Baja consciencia del equipo',
        overloaded: 'Equipo sobrecargado',
        juniorTeam: 'Equipo junior',
        noCICD: 'Sin CI/CD',
        minimalDocs: 'Documentación mínima'
      },
      recommendations: {
        automatedTesting: 'Testing automatizado',
        specificDoD: 'Definition of Done muy específico',
        pairProgramming: 'Pair programming obligatorio',
        reviews: 'Revisiones'
      }
    },

    tool_fragmentation: {
      title: 'Fragmentación de herramientas',
      description: 'Uso excesivo o desorganizado de herramientas técnicas',
      indicators: {
        tooManyTools: '>5 herramientas principales'
      },
      recommendations: {
        limitTools: 'Máximo 3-4 herramientas principales'
      }
    },

    // Team Risks
    team_overload: {
      title: 'Sobrecarga del equipo',
      description: 'Equipo con excesiva carga de trabajo',
      indicators: {
        highHours: '>45h/semana promedio',
        concurrentProjects: '≥3 proyectos concurrentes',
        multipleOverloaded: 'Múltiples miembros sobrecargados'
      },
      recommendations: {
        redistributeOrHire: 'Redistribuir carga o contratar recursos',
        reduceConcurrency: 'Reducir concurrencia o extender plazos',
        extendDeadline: 'Extender fecha de finalización'
      }
    },

    team_conflicts: {
      title: 'Conflictos de equipo',
      description: 'Conflictos interpersonales dentro del equipo',
      indicators: {
        tensions: 'Tensiones interpersonales',
        poorCommunication: 'Comunicación deteriorada',
        lowMorale: 'Baja moral'
      },
      recommendations: {
        mediation: 'Mediación de conflictos',
        teamBuilding: 'Team building',
        clarifyRoles: 'Clarificar roles y responsabilidades'
      }
    },

    burnout_susceptibility: {
      title: 'Susceptibilidad al burnout',
      description: 'Riesgo de agotamiento profesional en el equipo',
      indicators: {
        highNeuroticism: 'Alto neuroticismo',
        highWorkload: 'Alta carga de trabajo',
        noWorkLife: 'Sin balance vida-trabajo',
        sustainedPressure: 'Presión sostenida'
      },
      recommendations: {
        hourLimits: 'Definir límites de carga horaria (tope de horas) Potenciar políticas de bienestar y conciliación familiar en la empresa'
      }
    },

    social_isolation: {
      title: 'Aislamiento social',
      description: 'Falta de interacción social en equipos remotos',
      indicators: {
        highRemote: '>70% trabajo remoto',
        noPriorFaceToFace: 'Equipo formado por personas sin comunicación face-to-face previa',
        noTeamExperience: 'Equipo sin experiencia previa trabajando juntos',
        noTeamBuilding: 'Sin actividades de team building'
      },
      recommendations: {
        socialChannels: 'Fomentar la utilización de canales de comunicación social (no solo trabajo)',
        teamBuildingActivities: 'Actividades de team building remotas o en persona',
        workVisibility: 'Visibilidad del trabajo de cada uno'
      }
    },

    conflict_escalation_risk: {
      title: 'Riesgo de escalada de conflictos',
      description: 'Conflictos menores pueden escalar sin resolución adecuada',
      indicators: {
        lowAgreeableness: 'Baja amabilidad promedio (<3)',
        highPressure: 'Alta presión(Revisar articulo para saber qué hacer cuando había mucha presión)',
        conflictivePersonalities: 'Personalidades conflictivas'
      },
      recommendations: {
        communicationProtocols: 'Establecer protocolos de comunicación (tono, tiempos de respuesta, escalación)',
        conflictProcess: 'Definir proceso explícito de resolución de conflictos (1:1 → mediación → escalación)',
        clarifyOwnership: 'Asegurar claridad de roles y ownership'
      }
    },

    onboarding_issues: {
      title: 'Problemas de onboarding',
      description: 'Dificultades en la integración de nuevos miembros',
      indicators: {
        manyNewMembers: '>30% miembros nuevos',
        inadequateOnboarding: 'Onboarding inadecuado',
        highComplexity: 'Alta complejidad del proyecto',
        remoteWork: 'Trabajo remoto'
      },
      recommendations: {
        mentoring: 'Implementar programa de mentoring',
        welcomePack: 'Crear welcome pack con videos, documentación y contactos clave'
      }
    },

    digital_fatigue: {
      title: 'Fatiga digital',
      description: 'Cansancio por uso excesivo de herramientas digitales',
      indicators: {
        highRemote: 'Alto porcentaje de trabajo remoto',
        manyTools: 'Múltiples herramientas digitales',
        screenTime: 'Tiempo prolongado frente a pantalla'
      },
      recommendations: {
        breakTime: 'Establecer pausas regulares',
        limitMeetings: 'Limitar reuniones virtuales',
        asynchronous: 'Priorizar comunicación asíncrona'
      }
    },

    work_life_boundary_blur: {
      title: 'Difuminación límites trabajo-vida',
      description: 'Dificultad para separar trabajo y vida personal en remoto',
      indicators: {
        alwaysOnCulture: 'Cultura de estar siempre disponible',
        noWorkSchedule: 'Sin horarios definidos',
        homeOffice: 'Trabajo desde casa sin límites'
      },
      recommendations: {
        clearSchedules: 'Establecer horarios claros',
        respectOffTime: 'Respetar tiempo fuera del trabajo',
        boundaries: 'Fomentar límites saludables'
      }
    },

    meeting_fatigue: {
      title: 'Fatiga de reuniones',
      description: 'Agotamiento por exceso de reuniones virtuales',
      indicators: {
        manyMeetings: 'Más de 5 reuniones diarias',
        longMeetings: 'Reuniones de más de 1 hora',
        noBreaks: 'Reuniones consecutivas sin pausas'
      },
      recommendations: {
        limitMeetings: 'Reducir número de reuniones',
        shorterMeetings: 'Hacer reuniones más cortas (25-50 min)',
        meetingFreeTime: 'Establecer bloques sin reuniones'
      }
    },

    timezone_scheduling_gap: {
      title: 'Brecha de programación por zonas horarias',
      description: 'Dificultades de coordinación por diferencias horarias',
      indicators: {
        lowOverlap: 'Bajo solapamiento horario (<3h)',
        manyTimezones: '≥3 zonas horarias',
        frequentMeetings: 'Reuniones frecuentes requeridas'
      },
      recommendations: {
        sharedHours: 'Establecer horas de trabajo para todo el equipo',
        rotateMeetings: 'Rotar horarios de reuniones equitativamente',
        asyncCommunication: 'Comunicación asíncrona',
        recordMeetings: 'Grabaciones de reuniones importantes',
        flexibleStaff: 'Asignar al equipo empleados con flexibilidad horaria, cuando sea posible',
        sharedDocs: 'Repositorios de documentación comunes para todos los equipos'
      }
    },

    role_clarity_gap: {
      title: 'Falta de claridad de roles',
      description: 'Roles y responsabilidades no están claramente definidos',
      indicators: {
        largeTeam: 'Equipo grande (>8)',
        noOrgChart: 'Sin matriz Organigrama',
        multipleTeams: 'Múltiples equipos'
      },
      recommendations: {
        defineRoles: 'Definir roles y responsabilidades claras',
        reviewRoles: 'Revisión de roles al inicio del proyecto con el equipo'
      }
    },

    knowledge_management_gap: {
      title: 'Brecha en gestión del conocimiento',
      description: 'Falta de sistemas para capturar y compartir conocimiento',
      indicators: {
        oversizedTeam: 'Equipo demasiado grande >5 personas'
      },
      recommendations: {
        knowledgeSystem: 'Implementar sistema de gestión del conocimiento (Confluence, Notion, SharePoint)',
        updatedWiki: 'Wiki del proyecto actualizada',
        dailyDocs: 'Documentación diaria de las tareas realizadas y problemas encontrados/resueltos(Gestión del conocimiento)'
      }
    },

    remote_work_support_gap: {
      title: 'Falta de soporte para trabajo remoto',
      description: 'Soporte organizacional inadecuado para trabajo remoto',
      indicators: {
        highRemote: '>50% trabajo remoto',
        noPolicies: 'Sin políticas de teletrabajo',
        noTools: 'Sin herramientas colaborativas',
        noTechSupport: 'Sin soporte técnico home office'
      },
      recommendations: {
        remotePolicies: 'Definir políticas claras de trabajo remoto',
        provideTools: 'Proveer herramientas software que apoyen al trabajo remoto',
        homeOfficeSupport: 'Soporte técnico para configuración home office(ergonomía)'
      }
    },

    technostress_overload: {
      title: 'Sobrecarga tecnológica',
      description: 'Estrés por exceso de tecnologías y herramientas',
      indicators: {
        tooManyTools: 'Demasiadas herramientas diferentes',
        complexTools: 'Herramientas complejas',
        constantUpdates: 'Cambios tecnológicos constantes'
      },
      recommendations: {
        standardizeTools: 'Estandarizar herramientas',
        training: 'Proporcionar capacitación adecuada',
        simplify: 'Simplificar stack tecnológico'
      }
    },

    change_resistance: {
      title: 'Resistencia al cambio',
      description: 'Resistencia del equipo a cambios en procesos o tecnologías',
      indicators: {
        lowOpenness: 'Baja apertura al cambio en el equipo',
        establishedRoutines: 'Rutinas muy establecidas',
        fearOfChange: 'Miedo a lo desconocido'
      },
      recommendations: {
        involveTeam: 'Involucrar al equipo en decisiones de cambio',
        incremental: 'Implementar cambios incrementales',
        communication: 'Comunicar claramente beneficios del cambio'
      }
    },

    change_resistance_risk: {
      title: 'Resistencia al cambio',
      description: 'Resistencia organizacional a cambios necesarios',
      indicators: {
        lowOpenness: 'Baja apertura a experiencias',
        manyNewTech: 'Múltiples tecnologías nuevas',
        methodChanges: 'Cambios metodológicos',
        experienceGap: 'Gap de experiencia'
      },
      recommendations: {
        adoptionPlan: 'Plan de adopción: checklist por sprint',
        pairingMentoring: 'pairing/mentoring en áreas nuevas',
        limitChanges: 'Limitar cambios simultáneos (una transición cada vez)'
      }
    },

    other: {
      title: 'Otro riesgo',
      description: 'Riesgo no clasificado',
      indicators: {},
      recommendations: {}
    },

    // Management Risks
    scope_creep: {
      title: 'Crecimiento no controlado del alcance',
      description: 'Expansión continua del alcance sin control adecuado',
      indicators: {
        frequentChanges: 'Cambios frecuentes en requisitos',
        poorDocumentation: 'Documentación deficiente',
        stakeholderPressure: 'Presión de stakeholders'
      },
      recommendations: {
        changeControl: 'Implementar proceso de control de cambios',
        clearScope: 'Definir alcance claramente',
        stakeholderManagement: 'Gestión activa de stakeholders'
      }
    },

    process_mismatch: {
      title: 'Procesos inadecuados',
      description: 'Los procesos no se ajustan a las necesidades del proyecto',
      indicators: {
        heavyProcess: 'Procesos muy pesados',
        lightProcess: 'Procesos insuficientes',
        poorAdherence: 'Baja adherencia a procesos'
      },
      recommendations: {
        adaptProcess: 'Adaptar procesos al contexto',
        rightSize: 'Ajustar nivel de formalidad',
        continuousImprovement: 'Mejora continua de procesos'
      }
    },

    dependency_blockage: {
      title: 'Bloqueos por dependencias',
      description: 'Dependencias externas que bloquean el progreso',
      indicators: {
        externalDependencies: 'Dependencias externas críticas',
        delays: 'Retrasos frecuentes',
        lackOfControl: 'Falta de control sobre dependencias'
      },
      recommendations: {
        identifyEarly: 'Identificar dependencias temprano',
        alternatives: 'Preparar alternativas',
        activeManagement: 'Gestión activa de dependencias'
      }
    },

    resource_unavailability: {
      title: 'Indisponibilidad de recursos',
      description: 'Recursos clave no disponibles cuando se necesitan',
      indicators: {
        keyPeopleUnavailable: 'Personas clave no disponibles',
        sharedResources: 'Recursos compartidos con otros proyectos',
        budgetConstraints: 'Restricciones presupuestarias'
      },
      recommendations: {
        resourcePlanning: 'Planificación detallada de recursos',
        buffers: 'Incluir buffers de recursos',
        alternatives: 'Identificar recursos alternativos'
      }
    },

    role_clarity_risk: {
      title: 'Falta de claridad en roles',
      description: 'Roles y responsabilidades no están claramente definidos',
      indicators: {
        overlappingRoles: 'Solapamiento de roles',
        gaps: 'Lagunas en responsabilidades',
        confusion: 'Confusión sobre quién hace qué'
      },
      recommendations: {
        raciMatrix: 'Crear matriz RACI',
        clearDefinitions: 'Definir roles claramente',
        communication: 'Comunicar roles al equipo'
      }
    },

    standards_compliance_gap: {
      title: 'Brecha en cumplimiento de estándares',
      description: 'No se cumplen los estándares requeridos del proyecto',
      indicators: {
        lackOfStandards: 'Falta de estándares definidos',
        poorCompliance: 'Bajo cumplimiento',
        noValidation: 'Sin validación de estándares'
      },
      recommendations: {
        defineStandards: 'Definir estándares claramente',
        training: 'Capacitar en estándares',
        validation: 'Implementar validación automática'
      }
    },

    team_insufficient: {
      title: 'Equipo insuficiente',
      description: 'El tamaño del equipo es inadecuado para el proyecto',
      indicators: {
        understaffed: 'Equipo por debajo del tamaño requerido',
        highWorkload: 'Alta carga de trabajo por persona',
        cannotMeetDeadlines: 'No se pueden cumplir plazos'
      },
      recommendations: {
        hire: 'Contratar más personal',
        reduceScope: 'Reducir alcance del proyecto',
        extendTimeline: 'Extender timeline del proyecto'
      }
    },

    // Requirements Risks
    unclear_requirements: {
      title: 'Requisitos poco claros',
      description: 'Los requisitos del proyecto no están claramente definidos o evolucionan constantemente',
      indicators: {
        ambiguousRequirements: 'Requisitos ambiguos o incompletos',
        frequentChanges: 'Cambios frecuentes en especificaciones',
        stakeholderDisagreement: 'Desacuerdo entre stakeholders',
        uncertaintyInScope: 'Incertidumbre en el alcance del proyecto'
      },
      recommendations: {
        clarifyRequirements: 'Realizar sesiones de clarificación de requisitos con stakeholders',
        documentRequirements: 'Documentar requisitos de forma detallada y obtener aprobación',
        iterativeApproach: 'Adoptar enfoque iterativo para validar requisitos temprano',
        prototypeValidation: 'Crear prototipos para validar entendimiento de requisitos'
      }
    },

    // External Dependencies Risks
    third_party_dependency: {
      title: 'Dependencia de terceros',
      description: 'El proyecto depende de servicios, APIs o componentes de terceros',
      indicators: {
        externalServices: 'Dependencia de servicios externos',
        apiIntegrations: 'Múltiples integraciones con APIs de terceros',
        vendorLockIn: 'Riesgo de bloqueo con proveedor',
        limitedControl: 'Control limitado sobre componentes externos'
      },
      recommendations: {
        evaluateVendors: 'Evaluar proveedores exhaustivamente antes de integrar',
        fallbackPlans: 'Preparar planes de contingencia para servicios críticos',
        abstractDependencies: 'Abstraer dependencias para facilitar cambios futuros',
        monitorThirdParty: 'Monitorear estado y rendimiento de servicios de terceros'
      }
    }
  },

  // Common terms
  common: {
    severity: {
      low: 'Bajo',
      medium: 'Medio',
      'medium-high': 'Medio-Alto',
      high: 'Alto',
      critical: 'Crítico',
      emerging: 'Emergente'
    },
    category: {
      coordination: 'Coordinación',
      technical: 'Técnico',
      team: 'Equipo',
      management: 'Gestión',
      organizational: 'Organizacional',
      other: 'Otro'
    },
    source: {
      expert_rules: 'Reglas expertas',
      expert_rules_enhanced: 'Reglas expertas mejoradas',
      expert_rules_hofstede: 'Dimensiones culturales Hofstede',
      expert_rules_linguistic: 'Análisis lingüístico',
      expert_rules_project_requirements: 'Requisitos de proyecto',
      expert_rules_early_warning: 'Señales de alerta temprana',
      cbr: 'Razonamiento basado en casos',
      combined: 'Combinado',
      seed_cases: 'Casos semilla',
      emerging_pattern: 'Patrón emergente',
      manual: 'Manual',
      predicted: 'Predicho',
      decision_tree: 'Árbol de decisión',
      system: 'Sistema'
    },
    phaseDescriptions: {
      1: 'Predicción basada en reglas expertas ({count} casos - insuficientes para CBR)',
      2: 'Combinando reglas expertas con experiencia de {count} proyectos (priorizando DT)',
      3: 'Priorizando experiencia de {count} proyectos similares (complementando con DT)',
      4: 'Predicción basada en experiencia de {count} proyectos similares (CBR maduro)'
    },
    status: {
      predicted: 'Predicho',
      occurred: 'Ocurrido',
      avoided: 'Evitado',
      mitigated: 'Mitigado',
      active: 'Activo',
      resolved: 'Resuelto',
      pending: 'Pendiente'
    }
  },

  // Notifications
  notifications: {
    priority: {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    },
    messages: {
      obtained_successfully: 'Notificaciones obtenidas correctamente',
      error_obtaining: 'Error al obtener notificaciones',
      count_obtained_successfully: 'Conteo obtenido correctamente',
      error_obtaining_count: 'Error al obtener el conteo',
      statistics_obtained_successfully: 'Estadísticas obtenidas correctamente',
      error_obtaining_statistics: 'Error al obtener estadísticas',
      marked_as_read: 'Notificación marcada como leída',
      error_marking_as_read: 'Error al marcar como leída',
      not_found: 'Notificación no encontrada',
      marked_as_read_multiple: '{count} notificaciones marcadas como leídas',
      error_marking_multiple: 'Error al marcar notificaciones',
      array_required: 'Se requiere un array de IDs de notificaciones',
      marked_as_read_all: '{count} notificaciones marcadas como leídas',
      error_marking_all: 'Error al marcar todas como leídas',
      archived: 'Notificación archivada',
      error_archiving: 'Error al archivar notificación',
      deleted_successfully: 'Notificación eliminada correctamente',
      error_deleting: 'Error al eliminar notificación',
      created_successfully: 'Notificación creada correctamente',
      error_creating: 'Error al crear notificación',
      required_fields: 'recipientId, type, title y message son requeridos',
      invalid_type: 'Tipo de notificación inválido',
      recipient_not_found: 'Usuario receptor no encontrado',
      bulk_sent_successfully: '{count} notificaciones enviadas correctamente',
      error_sending_bulk: 'Error al enviar notificaciones masivas',
      required_array_recipients: 'Se requiere un array de recipientIds',
      required_fields_bulk: 'type, title y message son requeridos',
      sent_to_role: '{count} notificaciones enviadas al rol {role}',
      error_sending_to_role: 'Error al enviar notificaciones por rol',
      required_fields_role: 'role, type, title y message son requeridos',
      sent_to_all: '{count} notificaciones enviadas a todos los usuarios',
      error_sending_to_all: 'Error al enviar notificaciones a todos'
    },
    // Traducciones de contenido de notificaciones por tipo
    content: {
      // Autenticación
      email_confirmation: {
        title: 'Confirmación de correo electrónico',
        message: 'Por favor confirma tu dirección de correo electrónico'
      },
      password_reset: {
        title: 'Restablecimiento de contraseña',
        message: 'Se ha solicitado un restablecimiento de contraseña'
      },
      // Cuenta
      account_updated: {
        title: 'Cuenta actualizada',
        message: 'Tu cuenta ha sido actualizada correctamente'
      },
      account_deletion_confirmed: {
        title: 'Eliminación de cuenta confirmada',
        message: '{userName}, tu cuenta ha sido eliminada correctamente. Todos tus datos personales han sido eliminados de nuestro sistema.'
      },
      account_deletion_requirements: {
        title: 'Requisitos para eliminar cuenta',
        message: 'Antes de poder eliminar tu cuenta: {blockerMessages}'
      },
      role_changed: {
        title: 'Rol modificado',
        message: 'Tu rol en {organizationName} ha sido modificado'
      },
      // CV
      cv_uploaded: {
        title: 'CV subido',
        message: 'Tu CV ha sido subido correctamente'
      },
      cv_processed: {
        title: 'CV procesado',
        message: 'Tu CV ha sido procesado correctamente'
      },
      cv_analysis_ready: {
        title: 'Análisis de CV listo',
        message: 'El análisis de tu CV está disponible'
      },
      cv_analysis_failed: {
        title: 'Error en análisis de CV',
        message: 'Ha ocurrido un error al analizar tu CV'
      },
      cv_submitted_to_org: {
        title: 'Nuevo CV recibido',
        message: '{userName} ha enviado su CV a {organizationName}'
      },
      cv_reviewed: {
        title: 'Actualización de CV',
        message: 'Tu CV enviado a {organizationName} ha sido revisado'
      },
      cv_status_changed: {
        title: 'Estado del CV actualizado',
        message: 'El estado de tu CV en {organizationName} ha cambiado a: {statusLabel}'
      },
      // Organización
      org_employee_added: {
        title: 'Vinculado a organización',
        message: 'Has sido añadido como empleado de {organizationName}'
      },
      org_employee_removed: {
        title: 'Vínculo con organización finalizado',
        message: 'Has sido removido de {organizationName}'
      },
      org_employee_status_changed: {
        title: 'Actualización de estado en organización',
        message: 'Tu vínculo con {organizationName} ha sido actualizado'
      },
      org_admin_added: {
        title: 'Promovido a administrador',
        message: 'Has sido añadido como administrador de {organizationName}'
      },
      org_settings_updated: {
        title: 'Configuración actualizada',
        message: 'La configuración de {organizationName} ha sido actualizada'
      },
      // Proyectos
      project_created: {
        title: 'Nuevo proyecto creado',
        message: 'Se ha creado un nuevo proyecto "{projectName}" en {organizationName}'
      },
      project_updated: {
        title: 'Proyecto actualizado',
        message: 'El proyecto "{projectName}" ha sido actualizado'
      },
      project_deleted: {
        title: 'Proyecto eliminado',
        message: 'El proyecto "{projectName}" ha sido eliminado por un administrador'
      },
      project_activated: {
        title: 'Proyecto activado',
        message: 'El proyecto "{projectName}" está ahora activo'
      },
      project_completed: {
        title: 'Proyecto completado',
        message: 'El proyecto "{projectName}" ha sido completado exitosamente'
      },
      project_cancelled: {
        title: 'Proyecto cancelado',
        message: 'El proyecto "{projectName}" ha sido cancelado'
      },
      assigned_to_project: {
        title: 'Asignado a proyecto',
        message: 'Has sido asignado al proyecto "{projectName}"'
      },
      removed_from_project: {
        title: 'Removido de proyecto',
        message: 'Has sido removido del proyecto "{projectName}"'
      },
      // BFI-44
      bfi44_completed: {
        title: 'Test BFI-44 completado',
        message: 'Has completado el test de personalidad BFI-44'
      },
      bfi44_reminder: {
        title: 'Recordatorio de BFI-44',
        message: 'No olvides completar tu test de personalidad BFI-44'
      },
      // Administrativas
      admin_announcement: {
        title: 'Anuncio del administrador',
        message: 'Nuevo anuncio del administrador'
      },
      system_update: {
        title: 'Actualización del sistema',
        message: 'El sistema ha sido actualizado'
      },
      // Genéricas
      custom: {
        title: 'Notificación',
        message: 'Tienes una nueva notificación'
      }
    }
  },

  // Post-Project translations
  postProject: {
    sections: {
      generalOutcome: 'Resultado General del Proyecto',
      predictedRisks: 'Riesgos Predichos',
      lessonsLearned: 'Lecciones Aprendidas'
    },
    fields: {
      completed: '¿Proyecto completado?',
      actualCompletedDate: 'Fecha real de finalización',
      qualityScore: 'Puntuación de calidad (1-5)',
      clientSatisfaction: 'Satisfacción del cliente (1-5)',
      teamMorale: 'Moral del equipo (1-5)',
      budgetOverrun: 'Desvío de presupuesto (%)',
      actualizedRisks: 'Riesgos que se materializaron',
      lessonsLearned: 'Lecciones aprendidas',
      successfulPractices: 'Prácticas exitosas',
      unsuccessfulPractices: 'Prácticas no exitosas',
      recommendations: 'Recomendaciones para futuros proyectos'
    },
    riskDescriptions: {
      communication_breakdown: 'Problemas de comunicación que impidieron la coordinación efectiva',
      process_mismatch: 'Los procesos no se ajustaron a las necesidades del proyecto',
      scope_creep: 'Expansión no controlada del alcance del proyecto',
      team_overload: 'El equipo estuvo sobrecargado de trabajo',
      quality_degradation: 'Disminución en la calidad del producto',
      unclear_requirements: 'Requisitos poco claros o en constante evolución',
      dependency_blockage: 'Bloqueos por dependencias externas',
      resource_unavailability: 'Recursos clave no disponibles cuando se necesitaban',
      timezone_scheduling_gap: 'Dificultades de coordinación por diferencias horarias',
      social_isolation: 'Falta de interacción social en el equipo',
      team_autonomy_risk: 'El nivel de autonomía del equipo no cumplió con los requisitos',
      schedule_flexibility_risk: 'La flexibilidad horaria no cumplió con los requisitos',
      travel_availability_risk: 'La disponibilidad de viaje no cumplió con los requisitos',
      skill_gap: 'Falta de habilidades técnicas en el equipo',
      cultural_distance_risk: 'Alta distancia cultural afectó la colaboración',
      linguistic_distance_risk: 'Barreras lingüísticas afectaron la comunicación',
      burnout_susceptibility: 'El equipo experimentó agotamiento profesional',
      conflict_escalation_risk: 'Conflictos menores escalaron sin resolución adecuada',
      onboarding_issues: 'Dificultades en la integración de nuevos miembros',
      third_party_dependency: 'Problemas con servicios o APIs de terceros'
    }
  }
};
