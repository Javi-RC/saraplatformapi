/**
 * Spanish translations for risk catalog
 * Contains all risk types, titles, descriptions, and recommendations in Spanish
 */

module.exports = {
  risks: {
    // Communication Risks
    communication_breakdown: {
      title: 'Fallo de comunicación',
      description: 'Si el equipo está distribuido en zonas horarias con poco solapamiento, pueden surgir fallos de comunicación que retrasen entregas y generen malentendidos',
      indicators: {
        delays: 'Retrasos en respuestas',
        infoNotShared: 'Información no compartida',
        misunderstandings: 'Malentendidos frecuentes'
      },
      recommendations: {
        asyncUpdates: 'Implementar actualizaciones asíncronas diarias',
        asyncTools: 'Utilizar herramientas de comunicación asíncrona eficaces',
        communicationNorms: 'Establecer normas de comunicación'
      }
    },

    communication_tools_missing: {
      title: 'Herramientas de comunicación inadecuadas',
      description: 'Si el proyecto involucra múltiples países y no se han definido herramientas de comunicación, surgirán problemas graves de coordinación al no contar con canales adecuados',
      indicators: {
        limitedOverlap: 'Solapamiento horario limitado',
        insufficientTools: 'Herramientas insuficientes para coordinación'
      },
      recommendations: {
        syncAsyncTools: 'Implementar herramientas de comunicación tanto síncronas como asíncronas',
        communicationNorms: 'Establecer normas de comunicación claras'
      }
    },

    // Cultural & Linguistic Risks
    cultural_distance_risk: {
      title: 'Distancia socio-cultural elevada',
      description: 'Si hay personas de diferentes culturas en el proyecto, pueden surgir malentendidos derivados de la distancia socio-cultural que provoquen retrasos en las entregas',
      indicators: {
        culturalDistance: 'Distancia cultural entre países del equipo',
        differentValues: 'Diferentes valores en dimensiones de Hofstede',
        culturalMisunderstandings: 'Posibles malentendidos culturales'
      },
      recommendations: {
        culturalTraining: 'Implementar formación socio-cultural',
        sensitiveCommunication: 'Establecer normas de comunicación culturalmente sensibles',
        culturalMediators: 'Asignar mediadores culturales'
      }
    },

    linguistic_distance_risk: {
      title: 'Distancia socio-cultural lingüística',
      description: 'Si el equipo es multicultural y no todos los países hablan el idioma común del proyecto, pueden surgir problemas de distancia socio-cultural que dificulten la comprensión',
      indicators: {
        differentLanguages: 'Diferentes idiomas oficiales en países del equipo',
        notAllSpeakCommon: 'No todos los miembros hablan el idioma común'
      },
      recommendations: {
        languageTraining: 'Proporcionar formación en el idioma común',
        translationServices: 'Emplear servicios de traducción',
        documentInCommon: 'Documentar en el mismo idioma',
        bilingualFacilitators: 'Asignar facilitadores bilingües'
      }
    },

    linguistic_distance_no_common_language: {
      title: 'Sin idioma común definido',
      description: 'Si el equipo multicultural no tiene definido un idioma común de proyecto, la falta de un mismo idioma compartido provocará malentendidos constantes y retrasos',
      indicators: {
        multiculturalNoCommon: 'Equipo multicultural sin idioma común',
        highMisunderstandingRisk: 'Alto riesgo de malentendidos'
      },
      recommendations: {
        defineCommon: 'Definir un idioma común de proyecto',
        languageTraining: 'Proporcionar formación lingüística',
        translationServices: 'Usar servicios de traducción',
        documentInCommon: 'Documentar todo en dicho idioma'
      }
    },

    // Project Requirements Risks
    team_autonomy_risk: {
      title: 'Riesgo de autonomía del equipo',
      description: 'Si el proyecto requiere un alto nivel de autonomía del equipo, pueden surgir problemas si el equipo no está preparado para trabajar con ese grado de independencia',
      indicators: {
        autonomyMismatch: 'Nivel de autonomía requerido vs disponible',
        constantSupervision: 'Necesidad de supervisión constante'
      },
      recommendations: {
        evaluateAutonomy: 'Evaluar la capacidad real del equipo',
        training: 'Proporcionar formación',
        adjustSupervision: 'Ajustar la estructura de supervisión'
      }
    },

    schedule_flexibility_risk: {
      title: 'Riesgo de flexibilidad horaria',
      description: 'Si el proyecto requiere flexibilidad horaria por haber distintos husos horarios pueden surgir problemas de coordinación y de poca disponibilidad horaria de los empleados.',
      indicators: {
        flexibilityMismatch: 'Flexibilidad horaria requerida vs disponible',
        timezoneCoordination: 'Coordinación en diferentes zonas horarias'
      },
      recommendations: {
        evaluateFlexibility: 'Establecer las reuniones en horas comunes',
        coreHours: 'Cada miembro del equipo tiene que definir su ventana de disponibilidad',
        availabilityWindows: 'Premiar, si es posible, a las personas que estén disponibles fuera del horario de trabajo'
      }
    },

    travel_availability_risk: {
      title: 'Riesgo de disponibilidad de viaje',
      description: 'Si el proyecto requiere alta disponibilidad para viajes, pueden producirse problemas logísticos y de coste',
      indicators: {
        travelMismatch: 'Disponibilidad de viaje requerida vs disponible',
        inPersonMeetings: 'Necesidad de reuniones presenciales'
      },
      recommendations: {
        evaluateTravel: 'Evaluar la disponibilidad del equipo',
        planAhead: 'Planificar viajes con antelación',
        virtualMeetings: 'Priorizar reuniones virtuales',
        budgetTravel: 'Presupuestar los costes'
      }
    },

    // Technical Risks
    skill_gap: {
      title: 'Brecha de habilidades',
      description: 'Si el equipo carece de varias tecnologías del proyecto o la cobertura tecnológica es inferior al 50%, surgirá un problema de habilidades que afectará la calidad y velocidad de desarrollo',
      indicators: {
        lowTechMatch: 'Match técnico <50%',
        missingTechnologies: '≥3 tecnologías faltantes',
        juniorInComplex: 'Experiencia junior en proyecto complejo'
      },
      recommendations: {
        hireSpecialists: 'Contratar especialistas en las tecnologías críticas',
        intensiveTraining: 'Implementar un programa de formación',
        addSenior: 'Añadir un perfil senior para mentoría'
      }
    },

    tool_fragmentation: {
      title: 'Fragmentación de herramientas',
      description: 'Si el proyecto utiliza varias herramientas sin integración, surgirá fragmentación de herramientas que generará confusión y pérdida de productividad',
      indicators: {
        tooManyTools: '>5 herramientas principales'
      },
      recommendations: {
        limitTools: 'Limitar el número de herramientas y asegurar su integración'
      }
    },

    // Team Risks
    team_overload: {
      title: 'Sobrecarga del equipo',
      description: 'Si los miembros del equipo trabajan en más de dos proyectos concurrentes, superan las 45 horas semanales o presentan alta tendencia al estrés, podrá surgir una sobrecarga de trabajo',
      indicators: {
        highHours: '>45h/semana promedio',
        concurrentProjects: '≥3 proyectos concurrentes',
        multipleOverloaded: 'Múltiples miembros sobrecargados'
      },
      recommendations: {
        redistributeOrHire: 'Redistribuir la carga de trabajo o contratar más recursos',
        reduceConcurrency: 'Reducir la concurrencia de proyectos o ampliar los plazos de entrega'
      }
    },

    team_conflicts: {
      title: 'Conflictos de equipo',
      description: 'Si existen choques de personalidad o mala comunicación entre miembros del equipo, podrán surgir conflictos que afectarán la productividad y el ambiente laboral',
      indicators: {
        tensions: 'Tensiones interpersonales',
        poorCommunication: 'Comunicación deteriorada',
        lowMorale: 'Baja moral'
      },
      recommendations: {
        mediation: 'Aplicar mediación de conflictos',
        teamBuilding: 'Realizar actividades de team building',
        clarifyRoles: 'Clarificar roles y responsabilidades'
      }
    },

    burnout_susceptibility: {
      title: 'Susceptibilidad al burnout',
      description: 'Si el equipo presenta neuroticismo alto, alta carga de trabajo y requiere comunicación síncrona con bajo solapamiento horario, podrán surgir burnout',
      indicators: {
        highNeuroticism: 'Alto neuroticismo',
        highWorkload: 'Alta carga de trabajo',
        noWorkLife: 'Sin balance vida-trabajo',
        sustainedPressure: 'Presión sostenida'
      },
      recommendations: {
        workloadLimits: 'Definir límites claros de carga de trabajo',
        hourCaps: 'Establecer topes de horas',
        wellnessPolicies: 'Promover políticas de bienestar y equilibrio vida-trabajo'
      }
    },

    social_isolation: {
      title: 'Aislamiento social',
      description: 'Si el trabajo remoto supera el 70%, no hay reuniones presenciales anuales, no existe experiencia previa conjunta ni actividades de team building, puede producirse aislamiento social',
      indicators: {
        highRemote: '>70% trabajo remoto',
        noPriorFaceToFace: 'Equipo formado por personas sin comunicación face-to-face previa',
        noTeamExperience: 'Equipo sin experiencia previa trabajando juntos',
        noTeamBuilding: 'Sin actividades de team building'
      },
      recommendations: {
        socialChannels: 'Fomentar canales de comunicación social',
        teamBuildingActivities: 'Organizar actividades de team building remotas y presenciales',
        workVisibility: 'Dar visibilidad al trabajo de cada miembro'
      }
    },

    conflict_escalation_risk: {
      title: 'Riesgo de escalada de conflictos',
      description: 'Si el equipo tiene baja amabilidad, alta diversidad cultural y múltiples equipos involucrados, podrán surgir riesgo de conflictos',
      indicators: {
        lowAgreeableness: 'Baja amabilidad promedio (<3)',
        highCulturalDiversity: 'Alta diversidad cultural',
        conflictivePersonalities: 'Personalidades conflictivas'
      },
      recommendations: {
        communicationProtocols: 'Establecer protocolos de comunicación claros',
        conflictProcess: 'Definir un proceso explícito de resolución de conflictos',
        clarifyOwnership: 'Asegurar claridad de roles y responsabilidades'
      }
    },

    onboarding_issues: {
      title: 'Problemas de onboarding',
      description: 'Si el equipo está compuesto por nuevos miembros, no hay programa de mentoría ni documentación de onboarding, podrán surgir problemas de incorporación',
      indicators: {
        manyNewMembers: '>30% miembros nuevos',
        inadequateOnboarding: 'Onboarding inadecuado',
        highComplexity: 'Alta complejidad del proyecto',
        remoteWork: 'Trabajo remoto'
      },
      recommendations: {
        mentoring: 'Implementar un programa de mentoría',
        welcomePack: 'Crear un pack de bienvenida con documentación y contactos clave',
        introMeetings: 'Programar reuniones de presentación'
      }
    },

    digital_fatigue: {
      title: 'Fatiga digital',
      description: 'Si el trabajo es completamente remoto, hay un número elevado de reuniones y no existe política de desconexión, podrá surgir fatiga digital',
      indicators: {
        highRemote: 'Alto porcentaje de trabajo remoto',
        manyTools: 'Múltiples herramientas digitales',
        screenTime: 'Tiempo prolongado frente a pantalla'
      },
      recommendations: {
        noMeetingDays: 'Establecer días sin reuniones',
        breaks: 'Promover pausas',
        asynchronous: 'Utilizar alternativas asíncronas'
      }
    },

    work_life_boundary_blur: {
      title: 'Difuminación límites trabajo-vida',
      description: 'Si el modo de trabajo es remoto, no hay política de desconexión ni horario definido y los plazos son ajustados, podrá surgir burnout',
      indicators: {
        alwaysOnCulture: 'Cultura de estar siempre disponible',
        noWorkSchedule: 'Sin horarios definidos',
        homeOffice: 'Trabajo desde casa sin límites'
      },
      recommendations: {
        disconnectionPolicy: 'Definir políticas claras de desconexión',
        respectOffTime: 'Respetar los horarios fuera de trabajo'
      }
    },

    meeting_fatigue: {
      title: 'Fatiga de reuniones',
      description: 'Si hay un número excesivo de reuniones, múltiples equipos distribuidos, podrá surgir burnout',
      indicators: {
        manyMeetings: 'Más de 5 reuniones diarias',
        longMeetings: 'Reuniones de más de 1 hora',
        noBreaks: 'Reuniones consecutivas sin pausas'
      },
      recommendations: {
        limitDuration: 'Limitar la duración de las reuniones',
        asyncAlternatives: 'Priorizar la comunicación asíncrona'
      }
    },

    timezone_scheduling_gap: {
      title: 'Brecha de programación por zonas horarias',
      description: 'Si el proyecto tiene bajo solapamiento horario, tres o más zonas horarias distintas y reuniones frecuentes, surgirán brechas que dificulten la sincronización del equipo',
      indicators: {
        lowOverlap: 'Bajo solapamiento horario (<3h)',
        manyTimezones: '≥3 zonas horarias',
        frequentMeetings: 'Reuniones frecuentes requeridas'
      },
      recommendations: {
        sharedHours: 'Establecer horas centrales de trabajo para todo el equipo',
        rotateMeetings: 'Rotar los horarios de reuniones equitativamente',
        asyncCommunication: 'Usar comunicación asíncrona',
        recordMeetings: 'Grabar reuniones importantes',
        flexibleStaff: 'Asignar empleados con flexibilidad horaria'
      }
    },

    role_clarity_gap: {
      title: 'Falta de claridad de roles',
      description: 'Si el equipo supera los ocho miembros y los roles no están claramente definidos, podrá surgir falta de claridad',
      indicators: {
        largeTeam: 'Equipo grande (>8)',
        noOrgChart: 'Sin matriz Organigrama',
        multipleTeams: 'Múltiples equipos'
      },
      recommendations: {
        defineRoles: 'Definir roles y responsabilidades',
        reviewRoles: 'Revisarlos al inicio del proyecto con todo el equipo'
      }
    },

    knowledge_management_gap: {
      title: 'Brecha en gestión del conocimiento',
      description: 'Si el equipo es numeroso, no hay herramientas de gestión del conocimiento y la documentación es mínima, podrá surgir una brecha en la gestión del conocimiento',
      indicators: {
        oversizedTeam: 'Equipo demasiado grande >5 personas'
      },
      recommendations: {
        knowledgeSystem: 'Implementar un sistema de gestión del conocimiento',
        updatedWiki: 'Mantener una wiki actualizada',
        continuousDocs: 'Documentar el trabajo de forma continua'
      }
    },

    remote_work_support_gap: {
      title: 'Falta de soporte para trabajo remoto',
      description: 'Si el modo de trabajo no es presencial y no existen políticas, existirá falta de soporte para el trabajo remoto',
      indicators: {
        highRemote: '>50% trabajo remoto',
        noPolicies: 'Sin políticas de teletrabajo',
        noTools: 'Sin herramientas colaborativas',
        noTechSupport: 'Sin soporte técnico home office'
      },
      recommendations: {
        remotePolicies: 'Definir políticas claras',
        provideTools: 'Proporcionar herramientas adecuadas',
        homeOfficeSupport: 'Ofrecer soporte técnico y ergonómico'
      }
    },

    technostress_overload: {
      title: 'Sobrecarga de tecnoestres',
      description: 'Si el proyecto utiliza demasiadas herramientas digitales y no hay formación adecuada, podrán surgir sobrecarga',
      indicators: {
        tooManyTools: 'Demasiadas herramientas diferentes',
        complexTools: 'Herramientas complejas',
        constantUpdates: 'Cambios tecnológicos constantes'
      },
      recommendations: {
        consolidateTools: 'Consolidar herramientas tecnológicas',
        training: 'Proporcionar formación completa',
        gradualChanges: 'Realizar cambios de forma gradual'
      }
    },

    change_resistance_risk: {
      title: 'Resistencia al cambio',
      description: 'Si el equipo tiene baja apertura a la experiencia y el proyecto es de alta complejidad, podrá surgir resistencia al cambio',
      indicators: {
        lowOpenness: 'Baja apertura a experiencias',
        manyNewTech: 'Múltiples tecnologías nuevas',
        methodChanges: 'Cambios metodológicos',
        experienceGap: 'Gap de experiencia'
      },
      recommendations: {
        adoptionPlan: 'Aplicar planes de adopción progresiva',
        pairingMentoring: 'Mentoría en áreas nuevas',
        limitChanges: 'Limitar cambios simultáneos'
      }
    },

    // Management Risks
    scope_creep: {
      title: 'Aumento no controlado del alcance',
      description: 'Si la descripción del proyecto es vaga, la documentación incompleta y los roles clave no están definidos, podrá surgir el riesgo de aumento no controlado del alcance',
      indicators: {
        frequentChanges: 'Cambios frecuentes en requisitos',
        poorDocumentation: 'Documentación deficiente',
        stakeholderPressure: 'Presión de stakeholders'
      },
      recommendations: {
        requirementsMeeting: 'Realizar una reunión inicial de requisitos',
        clearMVP: 'Definir un MVP claro',
        stakeholderAlignment: 'Mantener alineación con los stakeholders'
      }
    },

    process_mismatch: {
      title: 'Desajuste de procesos',
      description: 'Si el proyecto carece de procesos de onboarding, CI/CD, presenta fragmentación de herramientas y baja experiencia en proyectos distribuidos, se producirá un desajuste de procesos',
      indicators: {
        heavyProcess: 'Procesos muy pesados',
        lightProcess: 'Procesos insuficientes',
        poorAdherence: 'Baja adherencia a procesos'
      },
      recommendations: {
        adaptCeremonies: 'Adaptar las ceremonias al trabajo distribuido',
        documentWorkflows: 'Documentar los flujos de trabajo'
      }
    },

    dependency_blockage: {
      title: 'Bloqueos por dependencias',
      description: 'Si existen múltiples dependencias críticas y varios equipos, pueden producirse bloqueos que retrasen el proyecto',
      indicators: {
        externalDependencies: 'Dependencias externas críticas',
        delays: 'Retrasos frecuentes',
        lackOfControl: 'Falta de control sobre dependencias'
      },
      recommendations: {
        syncMeetings: 'Realizar reuniones semanales de sincronización',
        integrationTime: 'Añadir tiempo de integración a la planificación',
        clearInterfaces: 'Definir interfaces claras entre equipos'
      }
    },

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
      // Currículo
      cv_uploaded: {
        title: 'Currículo subido',
        message: 'Tu currículo ha sido subido correctamente'
      },
      cv_processed: {
        title: 'Currículo procesado',
        message: 'Tu currículo ha sido procesado correctamente'
      },
      cv_analysis_ready: {
        title: 'Análisis de currículo listo',
        message: 'El análisis de tu currículo está disponible'
      },
      cv_analysis_failed: {
        title: 'Error en análisis de currículo',
        message: 'Ha ocurrido un error al analizar tu currículo'
      },
      cv_submitted_to_org: {
        title: 'Nuevo currículo recibido',
        message: '{userName} ha enviado su currículo a {organizationName}'
      },
      cv_reviewed: {
        title: 'Actualización de currículo',
        message: 'Tu currículo enviado a {organizationName} ha sido revisado'
      },
      cv_status_changed: {
        title: 'Estado del currículo actualizado',
        message: 'El estado de tu currículo en {organizationName} ha cambiado a: {statusLabel}'
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
      dependency_blockage: 'Bloqueos por dependencias externas',
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
      onboarding_issues: 'Dificultades en la integración de nuevos miembros'
    }
  },

  // Team Synergy translations
  synergy: {
    // Availability messages
    notAvailable: {
      message: 'No hay datos de personalidad disponibles para los miembros del equipo',
      recommendation: 'Solicita a los miembros del equipo que completen la evaluación BFI-44'
    },

    // Team roles
    roles: {
      innovator: {
        name: 'Innovador/Creador',
        description: 'Genera nuevas ideas y soluciones creativas'
      },
      executor: {
        name: 'Ejecutor/Implementador',
        description: 'Completa las tareas de forma fiable y con disciplina'
      },
      facilitator: {
        name: 'Facilitador/Coordinador',
        description: 'Gestiona la comunicación del equipo y resuelve conflictos'
      },
      analyst: {
        name: 'Analista/Especialista',
        description: 'Análisis profundo y resolución técnica de problemas'
      },
      stabilizer: {
        name: 'Estabilizador/Supervisor',
        description: 'Mantiene la estabilidad del equipo bajo presión'
      }
    },

    // Project profiles
    projectProfiles: {
      innovation: {
        name: 'Innovación/Startup',
        description: 'Desarrollo de productos nuevos con tecnologías novedosas'
      },
      maintenance: {
        name: 'Legado/Mantenimiento',
        description: 'Mantenimiento y mejora de sistemas existentes'
      },
      crisis: {
        name: 'Crisis/Plazo ajustado',
        description: 'Proyectos de alta presión con plazos estrictos'
      },
      research: {
        name: 'Investigación/I+D',
        description: 'Proyectos exploratorios con resultados inciertos'
      },
      standard: {
        name: 'Desarrollo estándar',
        description: 'Proyecto típico de desarrollo de software'
      }
    },

    // Score levels
    levels: {
      excellent: 'excelente',
      good: 'bueno',
      fair: 'regular',
      poor: 'bajo'
    },

    // Inverse score levels (for risks)
    inverseLevels: {
      low: 'bajo',
      medium: 'medio',
      high: 'alto',
      critical: 'crítico'
    },

    // Metric messages
    messages: {
      complementarity: {
        excellent: 'Los miembros del equipo se complementan excelentemente',
        good: 'Buena complementariedad entre los miembros del equipo',
        fair: 'Complementariedad moderada — se puede mejorar',
        poor: 'Los miembros del equipo pueden ser demasiado similares o demasiado diferentes'
      },
      projectFit: {
        excellent: 'La personalidad del equipo es excelente para {projectType}',
        good: 'La personalidad del equipo es buena para {projectType}',
        fair: 'La personalidad del equipo es adecuada para {projectType}',
        poor: 'La personalidad del equipo puede no ser apropiada para {projectType}'
      },
      balance: {
        excellent: 'Los rasgos del equipo están bien equilibrados',
        good: 'Los rasgos del equipo están razonablemente equilibrados',
        fair: 'Los rasgos del equipo muestran cierto desequilibrio',
        poor: 'Los rasgos del equipo están significativamente desequilibrados'
      },
      previousCollaborations: {
        excellent: 'Excelente historial de colaboración — {percentage}% de las parejas han trabajado juntas',
        good: 'Buen historial de colaboración — {percentage}% de las parejas han trabajado juntas',
        fair: 'Historial de colaboración moderado — {percentage}% de las parejas han trabajado juntas',
        limited: 'Historial de colaboración limitado — solo {percentage}% de las parejas han trabajado juntas',
        none: 'No se detectaron colaboraciones previas — este es un equipo nuevo'
      },
      tooSmall: {
        complementarity: 'El equipo es demasiado pequeño para medir la complementariedad',
        collaborations: 'El equipo es demasiado pequeño para medir las colaboraciones previas'
      }
    },

    // Conflict risks (deprecated but translated for backward compatibility)
    conflictRisks: {
      high_stress_tendency: {
        description: 'El equipo tiene alto neuroticismo promedio — puede tener dificultades bajo presión',
        recommendation: 'Considerar formación en gestión del estrés y reuniones periódicas de seguimiento'
      },
      low_discipline: {
        description: 'El equipo tiene baja responsabilidad — riesgos de calidad y plazos',
        recommendation: 'Implementar procesos estrictos, revisiones de código y supervisión de gestión de proyectos'
      },
      personality_conflict: {
        description: 'Alta varianza en amabilidad — potencial de conflictos interpersonales',
        recommendation: 'Asignar un rol de facilitador y establecer protocolos de comunicación claros'
      },
      low_adaptability: {
        description: 'El equipo tiene baja apertura — puede resistirse a nuevas tecnologías o métodos',
        recommendation: 'Proporcionar tiempo extra para la adaptación y considerar programas de formación'
      },
      extreme_difference: {
        description: 'Diferencias extremas en {trait} ({min} a {max})',
        recommendation: 'Tener en cuenta los diferentes estilos de trabajo relacionados con {traitLower}'
      }
    },

    // Recommendations
    recommendations: {
      roleDiversity: {
        title: 'Mejorar la diversidad de roles',
        description: 'El equipo carece de diversidad en los roles de personalidad',
        actions: [
          'Considerar añadir miembros con perfiles de personalidad complementarios',
          'Identificar roles de equipo faltantes y reclutar en consecuencia',
          'Utilizar evaluaciones de personalidad en el proceso de contratación'
        ]
      },
      projectFit: {
        title: 'Mejorar la adecuación para proyectos de {projectType}',
        description: 'El perfil de personalidad del equipo no coincide con los requisitos del proyecto',
        actions: [
          'Buscar miembros con rasgos adecuados para {projectTypeLower}',
          'Proporcionar formación y apoyo para compensar las carencias de rasgos',
          'Ajustar el estilo de gestión del proyecto para adaptarse a la personalidad del equipo'
        ]
      },
      buildCohesion: {
        title: 'Construir cohesión de equipo',
        description: 'Historial de colaboración limitado detectado ({percentage}% de las parejas han trabajado juntas)',
        actions: [
          'Programar actividades de formación de equipo para crear relaciones',
          'Emparejar colaboradores experimentados con nuevos miembros del equipo como mentores',
          'Establecer canales y protocolos de comunicación claros desde el principio',
          'Considerar reuniones de seguimiento más frecuentes durante las fases iniciales del proyecto'
        ]
      },
      leverageSynergy: {
        title: 'Aprovechar la sinergia existente',
        description: 'Fuerte historial de colaboración ({percentage}% de las parejas han trabajado juntas)',
        actions: [
          'Capitalizar las dinámicas y flujos de trabajo existentes del equipo',
          'Usar patrones exitosos anteriores como plantillas',
          'Tener cuidado con el posible pensamiento grupal — fomentar perspectivas frescas'
        ]
      },
      success: {
        title: 'Excelente sinergia de equipo',
        description: 'El equipo muestra fuerte complementariedad de personalidad y equilibrio',
        actions: [
          'Mantener la composición actual del equipo',
          'Continuar monitorizando la dinámica del equipo',
          'Usar este equipo como plantilla para futuros proyectos'
        ]
      }
    },

    // Summary / explanation
    summary: {
      text: 'Este equipo tiene una sinergia {level} ({score}/100) para proyectos de tipo {projectType}. El equipo muestra {roleDiversityLevel} diversidad de roles y {projectFitLevel} adecuación a los requisitos del proyecto.'
    },

    // Strengths
    strengths: {
      roleDiversity: 'El equipo tiene {uniqueRoles} roles de personalidad diferentes, asegurando buena cobertura',
      projectFit: 'El perfil de personalidad del equipo coincide con los requisitos del proyecto {projectType}',
      previousCollaborations: 'Fuerte historial de colaboración con {totalCollaborations} proyecto(s) pasado(s) juntos'
    },

    // Concerns
    concerns: {
      roleDiversity: 'El equipo carece de diversidad en los roles de personalidad',
      projectFit: 'La personalidad del equipo puede no ser adecuada para este tipo de proyecto',
      previousCollaborations: 'Historial de colaboración limitado o inexistente'
    },

    // Incremental update note
    incrementalNote: 'El nuevo miembro aún no tiene perfil BFI-44. La sinergia se basa en el equipo existente.'
  },

  // Personality Optimizer translations
  personalityOptimizer: {
    // Addition validation messages (validateTeamAddition)
    addition: {
      noData: 'No se puede evaluar el impacto por falta de datos de personalidad — se procede según ajuste técnico',
      excellent: 'Excelente incorporación — mejora significativamente la sinergia del equipo',
      good: 'Buena incorporación — mejora la sinergia del equipo',
      neutral: 'Incorporación neutral — mantiene el nivel de sinergia actual',
      acceptable: 'Aceptable — ligera disminución de sinergia, pero puede estar justificada por las habilidades técnicas',
      warning: 'Advertencia — puede impactar negativamente la sinergia del equipo. Considere alternativas si están disponibles.'
    },

    // Improvement comparison messages (compareTeamSynergy)
    improvement: {
      noData: 'No se puede comparar por falta de datos de personalidad',
      significant: 'Mejora significativa en la sinergia del equipo',
      moderate: 'Mejora moderada en la sinergia del equipo',
      slight: 'Ligera mejora en la sinergia del equipo',
      noChange: 'Sin cambios en la sinergia del equipo',
      decreased: 'La sinergia del equipo disminuyó (puede priorizarse el ajuste técnico)'
    },

    // Hiring recommendations
    hiring: {
      notAvailable: 'No se pueden generar recomendaciones sin datos de personalidad',
      seekRole: 'Buscar {roleName} para cubrir el rol faltante en el equipo',
      higherTrait: '{trait} más alto',
      lowAverage: 'El promedio del equipo es bajo ({average})',
      veryHighTrait: '{trait} muy alto',
      highAverage: 'El promedio del equipo ya es alto ({average})',
      lowNeuroticism: 'Neuroticismo bajo (< 2.5)',
      balanceStress: 'Para equilibrar la alta tendencia al estrés del equipo',
      highConscientiousness: 'Responsabilidad alta (> 4.0)',
      improveDiscipline: 'Para mejorar la disciplina y fiabilidad del equipo'
    }
  }
};
