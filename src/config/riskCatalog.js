/**
 * Risk Catalog - Single Source of Truth
 * Centralized metadata for all risk types in the system
 * Used by both debug endpoints and risk analysis
 */

const RISK_CATALOG = {
  // Communication Risks
  communication_breakdown: {
    type: 'communication_breakdown',
    title: 'Fallo de comunicación',
    description: 'Problemas de comunicación que impiden la coordinación efectiva del equipo',
    category: 'coordination',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules', 'expert_rules_enhanced', 'cbr', 'combined'],
    isHofstedeRelated: false,
    triggerConditions: 'Team size, remote work percentage, timezone differences',
    typicalIndicators: [
      'Retrasos en respuestas',
      'Información no compartida',
      'Malentendidos frecuentes'
    ],
    typicalRecommendations: [
      'Implementar actualizaciones asíncronas diarias',
      'Definir protocolos claros de escalación',
      'Usar herramientas de comunicación asíncrona efectivas',
      'Establecer normas de comunicación'
    ]
  },

  communication_tools_missing: {
    type: 'communication_tools_missing',
    title: 'Herramientas de comunicación inadecuadas',
    description: 'Falta de herramientas de comunicación apropiadas según el solapamiento horario entre países',
    category: 'coordination',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules_enhanced'],
    isHofstedeRelated: true,
    algorithm: 'Time Overlap + Binomial Coefficient',
    formula: 'Max = C(n,2) × Z where n=countries, Z=tool count',
    triggerConditions: 'involvedCountries (≥2 países) + communicationTools',
    typicalIndicators: [
      'Solapamiento horario limitado',
      'Herramientas insuficientes para coordinación'
    ],
    typicalRecommendations: [
      'Implementar actualizaciones asíncronas diarias',
      'Definir protocolos claros de escalación',
      'Usar herramientas de comunicación asíncrona efectivas',
      'Establecer normas de comunicación'
    ]
  },

  // Cultural & Linguistic Risks (Hofstede)
  cultural_distance_risk: {
    type: 'cultural_distance_risk',
    title: 'Distancia cultural elevada',
    description: 'Alta distancia cultural entre países del equipo según dimensiones de Hofstede',
    category: 'team',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules_hofstede'],
    isHofstedeRelated: true,
    algorithm: 'Hofstede 6D Euclidean Distance',
    formula: 'sqrt(sum((dim1-dim2)^2)) across PDI, IDV, MAS, UAI, LTO, IND',
    triggerConditions: 'involvedCountries (≥2 países)',
    supportedCountries: 32,
    typicalIndicators: [
      'Distancia cultural entre países del equipo',
      'Diferentes valores en dimensiones de Hofstede',
      'Posibles malentendidos culturales'
    ],
    typicalRecommendations: [
      'Implementar capacitación intercultural para el equipo',
      'Establecer normas de comunicación sensibles culturalmente',
      'Asignar mediadores culturales en el equipo'
    ]
  },

  linguistic_distance_risk: {
    type: 'linguistic_distance_risk',
    title: 'Distancia lingüística',
    description: 'Barrera lingüística parcial - no todos los países hablan el idioma común',
    category: 'coordination',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules_linguistic'],
    isHofstedeRelated: true,
    algorithm: 'Language Overlap Analysis',
    formula: 'Score +1 per country speaking commonLanguage, 5 intervals',
    triggerConditions: 'involvedCountries + commonLanguage',
    typicalIndicators: [
      'Diferentes idiomas oficiales en países del equipo',
      'No todos los miembros hablan el idioma común'
    ],
    typicalRecommendations: [
      'Proporcionar capacitación en el idioma común',
      'Usar servicios de traducción si es necesario',
      'Documentar en idioma común',
      'Asignar facilitadores bilingües'
    ]
  },

  linguistic_distance_no_common_language: {
    type: 'linguistic_distance_no_common_language',
    title: 'Sin idioma común definido',
    description: 'No existe un idioma común definido para el equipo multicultural',
    category: 'coordination',
    typicalSeverities: ['high', 'critical'],
    possibleSources: ['expert_rules_linguistic'],
    isHofstedeRelated: true,
    algorithm: 'Language Overlap Analysis',
    triggerConditions: 'involvedCountries sin commonLanguage',
    typicalIndicators: [
      'Equipo multicultural sin idioma común',
      'Alto riesgo de malentendidos'
    ],
    typicalRecommendations: [
      'Definir idioma común para el proyecto',
      'Proporcionar capacitación en el idioma común',
      'Usar servicios de traducción si es necesario',
      'Documentar en idioma común'
    ]
  },

  // Project Requirements Risks
  team_autonomy_risk: {
    type: 'team_autonomy_risk',
    title: 'Riesgo de autonomía del equipo',
    description: 'El nivel de autonomía del equipo no cumple con los requisitos del proyecto',
    category: 'team',
    typicalSeverities: ['low', 'medium', 'high'],
    possibleSources: ['expert_rules_project_requirements'],
    isHofstedeRelated: true,
    algorithm: '1-5 Inverse Scale',
    formula: 'Risk = 6 - requiredAutonomyLevel',
    triggerConditions: 'requiredAutonomyLevel presente (1-5)',
    typicalIndicators: [
      'Nivel de autonomía requerido vs disponible',
      'Necesidad de supervisión constante'
    ],
    typicalRecommendations: [
      'Evaluar si el equipo puede trabajar con la autonomía requerida',
      'Proporcionar capacitación si es necesario',
      'Ajustar estructura de supervisión',
      'Asignar líderes técnicos si se requiere alta autonomía'
    ]
  },

  schedule_flexibility_risk: {
    type: 'schedule_flexibility_risk',
    title: 'Riesgo de flexibilidad horaria',
    description: 'La flexibilidad horaria del equipo no cumple con los requisitos del proyecto',
    category: 'management',
    typicalSeverities: ['low', 'medium', 'high'],
    possibleSources: ['expert_rules_project_requirements'],
    isHofstedeRelated: true,
    algorithm: '1-5 Inverse Scale',
    formula: 'Risk = 6 - requiredScheduleFlexibility',
    triggerConditions: 'requiredScheduleFlexibility presente (1-5)',
    typicalIndicators: [
      'Flexibilidad horaria requerida vs disponible',
      'Coordinación en diferentes zonas horarias'
    ],
    typicalRecommendations: [
      'Evaluar flexibilidad horaria del equipo',
      'Establecer horarios core si es necesario',
      'Usar herramientas asíncronas',
      'Definir ventanas de disponibilidad'
    ]
  },

  travel_availability_risk: {
    type: 'travel_availability_risk',
    title: 'Riesgo de disponibilidad de viaje',
    description: 'La disponibilidad de viaje del equipo no cumple con los requisitos del proyecto',
    category: 'management',
    typicalSeverities: ['low', 'medium', 'high'],
    possibleSources: ['expert_rules_project_requirements'],
    isHofstedeRelated: true,
    algorithm: '1-5 Inverse Scale',
    formula: 'Risk = 6 - requiredTravelAvailability',
    triggerConditions: 'requiredTravelAvailability presente (1-5)',
    typicalIndicators: [
      'Disponibilidad de viaje requerida vs disponible',
      'Necesidad de reuniones presenciales'
    ],
    typicalRecommendations: [
      'Evaluar disponibilidad de viaje del equipo',
      'Planificar viajes con anticipación',
      'Usar reuniones virtuales cuando sea posible',
      'Presupuestar costos de viaje'
    ]
  },

  // Technical Risks
  skill_gap: {
    type: 'skill_gap',
    title: 'Brecha de habilidades',
    description: 'Falta de habilidades técnicas necesarias en el equipo',
    category: 'technical',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules', 'cbr', 'combined'],
    isHofstedeRelated: false,
    triggerConditions: 'Technology stack complexity vs team experience',
    typicalIndicators: [
      'Match técnico <50%',
      '≥3 tecnologías faltantes',
      'Experiencia junior en proyecto complejo'
    ],
    typicalRecommendations: [
      'Contratar especialistas en tecnologías críticas',
      'Programa de capacitación intensiva',
      'Añadir un senior, para entrenamiento o tareas de mentoría'
    ]
  },

  technical_infrastructure: {
    type: 'technical_infrastructure',
    title: 'Problemas de infraestructura técnica',
    description: 'Infraestructura técnica inadecuada para el proyecto',
    category: 'technical',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Infrastructure requirements vs availability',
    typicalIndicators: [
      'Infraestructura insuficiente',
      'Herramientas inadecuadas'
    ],
    typicalRecommendations: [
      'Evaluar y mejorar infraestructura',
      'Invertir en herramientas adecuadas',
      'Contratar servicios cloud si es necesario'
    ]
  },

  quality_degradation: {
    type: 'quality_degradation',
    title: 'Degradación de calidad',
    description: 'Riesgo de disminución en la calidad del producto',
    category: 'technical',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Quality standards vs team practices',
    typicalIndicators: [
      'Baja consciencia del equipo',
      'Equipo sobrecargado',
      'Equipo junior',
      'Sin CI/CD',
      'Documentación mínima'
    ],
    typicalRecommendations: [
      'Testing automatizado',
      'Definition of Done muy específico',
      'Pair programming obligatorio',
      'Revisiones'
    ]
  },

  tool_fragmentation: {
    type: 'tool_fragmentation',
    title: 'Fragmentación de herramientas',
    description: 'Uso excesivo o desorganizado de herramientas técnicas',
    category: 'technical',
    typicalSeverities: ['low', 'medium'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Too many tools without integration',
    typicalIndicators: [
      '>5 herramientas principales'
    ],
    typicalRecommendations: [
      'Máximo 3-4 herramientas principales'
    ]
  },

  // Team Risks
  team_overload: {
    type: 'team_overload',
    title: 'Sobrecarga del equipo',
    description: 'Equipo con excesiva carga de trabajo',
    category: 'team',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Workload vs team capacity',
    typicalIndicators: [
      '>45h/semana promedio',
      '≥3 proyectos concurrentes',
      'Múltiples miembros sobrecargados'
    ],
    typicalRecommendations: [
      'Redistribuir carga o contratar recursos',
      'Reducir concurrencia o extender plazos',
      'Extender fecha de finalización'
    ]
  },

  team_conflicts: {
    type: 'team_conflicts',
    title: 'Conflictos de equipo',
    description: 'Conflictos interpersonales dentro del equipo',
    category: 'team',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Personality clashes, poor communication',
    typicalIndicators: [
      'Tensiones interpersonales',
      'Comunicación deteriorada',
      'Baja moral'
    ],
    typicalRecommendations: [
      'Mediación de conflictos',
      'Team building',
      'Clarificar roles y responsabilidades'
    ]
  },

  burnout_susceptibility: {
    type: 'burnout_susceptibility',
    title: 'Susceptibilidad al burnout',
    description: 'Riesgo de agotamiento profesional en el equipo',
    category: 'team',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'High workload, long hours, stress',
    typicalIndicators: [
      'Alto neuroticismo',
      'Alta carga de trabajo',
      'Sin balance vida-trabajo',
      'Presión sostenida'
    ],
    typicalRecommendations: [
      'Definir límites de carga horaria (tope de horas) Potenciar políticas  de bienestar y conciliación familiar en la empresa'
    ]
  },

  social_isolation: {
    type: 'social_isolation',
    title: 'Aislamiento social',
    description: 'Falta de interacción social en equipos remotos',
    category: 'team',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'High remote work percentage',
    typicalIndicators: [
      '>70% trabajo remoto',
      'Equipo formado por personas sin comunicación face-to-face previa',
      'Equipo sin experiencia previa trabajando juntos',
      'Sin actividades de team building'
    ],
    typicalRecommendations: [
      'Fomentar la utilización de canales de comunicación social (no solo trabajo)',
      'Actividades de team building remotas o en persona',
      'Visibilidad del trabajo de cada uno'
    ]
  },

  conflict_escalation_risk: {
    type: 'conflict_escalation_risk',
    title: 'Riesgo de escalada de conflictos',
    description: 'Conflictos menores pueden escalar sin resolución adecuada',
    category: 'team',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Unresolved conflicts, poor communication',
    typicalIndicators: [
      'Baja amabilidad promedio (<3)',
      'Alta presión(Revisar articulo para saber qué hacer cuando había mucha presión)',
      'Personalidades conflictivas'
    ],
    typicalRecommendations: [
      'Establecer protocolos de comunicación (tono, tiempos de respuesta, escalación)',
      'Definir proceso explícito de resolución de conflictos (1:1 → mediación → escalación)',
      'Asegurar claridad de roles y ownership'
    ]
  },

  onboarding_issues: {
    type: 'onboarding_issues',
    title: 'Problemas de onboarding',
    description: 'Dificultades en la integración de nuevos miembros',
    category: 'team',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'New team members, complex project',
    typicalIndicators: [
      '>30% miembros nuevos',
      'Onboarding inadecuado',
      'Alta complejidad del proyecto',
      'Trabajo remoto'
    ],
    typicalRecommendations: [
      'Implementar programa de mentoring',
      'Crear welcome pack con videos, documentación y contactos clave',
      'Programar reuniones introductorias'
    ]
  },

  // Management Risks
  dependency_blockage: {
    type: 'dependency_blockage',
    title: 'Bloqueo por dependencias',
    description: 'Dependencias externas o internas causan bloqueos',
    category: 'management',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'External dependencies, complex integrations',
    typicalIndicators: [
      '≥3 dependencias críticas',
      'Múltiples equipos externos',
      'Alta dependencia de infraestructura compartida'
    ],
    typicalRecommendations: [
      'Reuniones de sincronización semanales con los equipos',
      'Añadir a la planificación mas tiempo para integraciones',
      'Definir una interfaz de comunicación para partes distribuidas'
    ]
  },

  scope_creep: {
    type: 'scope_creep',
    title: 'Aumento no controlado del alcance',
    description: 'Expansión del alcance sin control adecuado',
    category: 'management',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Unclear requirements, weak change control',
    typicalIndicators: [
      'Requisitos poco claros',
      'Documentación mínima/inexistente',
      'Poco solape horario con el cliente'
    ],
    typicalRecommendations: [
      'Workshop detallado de requisitos (semana 1)',
      'Definir MVP claramente',
      'Alineación semanal con stakeholders'
    ]
  },

  process_mismatch: {
    type: 'process_mismatch',
    title: 'Desajuste de procesos',
    description: 'Procesos inadecuados para el proyecto',
    category: 'management',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Methodology vs project needs mismatch',
    typicalIndicators: [
      'Fragmentación de herramientas',
      'Sin CI/CD completo'
    ],
    typicalRecommendations: [
      'Adaptar ceremonias para trabajo distribuido',
      'Documentar workflows'
    ]
  },

  resource_unavailability: {
    type: 'resource_unavailability',
    title: 'Indisponibilidad de recursos',
    description: 'Recursos necesarios no disponibles',
    category: 'management',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Resource constraints, competing priorities',
    typicalIndicators: [
      'Dependencia de personas clave'
    ],
    typicalRecommendations: [
      'Crear backups',
      'Plan de contingencia para ausencias',
      'Documentación diaria de las tareas realizadas y problemas encontrados/resueltos(Gestión del conocimiento)'
    ]
  },

  timezone_scheduling_gap: {
    type: 'timezone_scheduling_gap',
    title: 'Brecha de programación por zonas horarias',
    description: 'Dificultades de coordinación por diferencias horarias',
    category: 'management',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Distributed team, timezone differences',
    typicalIndicators: [
      'Bajo overlap horario (<3h)',
      '≥3 zonas horarias',
      'Reuniones frecuentes requeridas'
    ],
    typicalRecommendations: [
      'Establecer horas de trabajo para todo el equipo',
      'Rotar horarios de reuniones equitativamente',
      'Comunicación asíncrona',
      'Grabaciones de reuniones importantes',
      'Asignar al equipo empleados con flexibilidad horaria, cuando sea posible',
      'Repositorios de documentación comunes para todos los equipos'
    ]
  },

  role_clarity_gap: {
    type: 'role_clarity_gap',
    title: 'Falta de claridad de roles',
    description: 'Roles y responsabilidades no están claramente definidos',
    category: 'management',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Unclear roles, overlapping responsibilities',
    typicalIndicators: [
      'Equipo grande (>8)',
      'Sin matriz Organigrama',
      'Múltiples equipos'
    ],
    typicalRecommendations: [
      'Definir roles y responsabilidades claras',
      'Revisión de roles al inicio del proyecto con el equipo'
    ]
  },

  // Organizational Risks
  knowledge_management_gap: {
    type: 'knowledge_management_gap',
    title: 'Brecha en gestión del conocimiento',
    description: 'Falta de sistemas para capturar y compartir conocimiento',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Knowledge silos, no documentation',
    typicalIndicators: [
      'Equipo demasiado grande >5 personas'
    ],
    typicalRecommendations: [
      'Implementar sistema de gestión del conocimiento (Confluence, Notion, SharePoint)',
      'Wiki del proyecto actualizada',
      'Documentación diaria de las tareas realizadas y problemas encontrados/resueltos(Gestión del conocimiento)'
    ]
  },

  remote_work_support_gap: {
    type: 'remote_work_support_gap',
    title: 'Falta de soporte para trabajo remoto',
    description: 'Soporte organizacional inadecuado para trabajo remoto',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'High remote work, lack of infrastructure',
    typicalIndicators: [
      '>50% trabajo remoto',
      'Sin políticas de teletrabajo',
      'Sin herramientas colaborativas',
      'Sin soporte técnico home office'
    ],
    typicalRecommendations: [
      'Definir políticas claras de trabajo remoto',
      'Proveer herramientas software que apoyen al trabajo remoto',
      'Soporte técnico para configuración home office(ergonomía)'
    ]
  },

  standards_compliance_gap: {
    type: 'standards_compliance_gap',
    title: 'Brecha en cumplimiento de estándares',
    description: 'No cumplimiento de estándares organizacionales',
    category: 'organizational',
    typicalSeverities: ['medium', 'high', 'critical'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Standards requirements, compliance needs',
    typicalIndicators: [
      'Alta diversidad cultural'
    ],
    typicalRecommendations: [
      'Revisiones cruzadas entre equipos',
      'Capacitación en estándares específicos'
    ]
  },

  change_resistance_risk: {
    type: 'change_resistance_risk',
    title: 'Resistencia al cambio',
    description: 'Resistencia organizacional a cambios necesarios',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Organizational changes, new processes',
    typicalIndicators: [
      'Baja apertura a experiencias',
      'Múltiples tecnologías nuevas',
      'Cambios metodológicos',
      'Gap de experiencia'
    ],
    typicalRecommendations: [
      'Plan de adopción: checklist por sprint',
      'pairing/mentoring en áreas nuevas',
      'Limitar cambios simultáneos (una transición cada vez)'
    ]
  },

  digital_fatigue: {
    type: 'digital_fatigue',
    title: 'Fatiga digital',
    description: 'Agotamiento por exceso de interacciones digitales',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'High digital interaction, remote work',
    typicalIndicators: [
      '100% trabajo remoto',
      'Exceso de videollamadas',
      'Interacción digital constante'
    ],
    typicalRecommendations: [
      'Establecer "no-meeting" days Promover reuniones con cámara opcional',
      'Incentivar pausas entre reuniones',
      'Alternativas asíncronas cuando sea posible'
    ]
  },

  work_life_boundary_blur: {
    type: 'work_life_boundary_blur',
    title: 'Difuminación de límites trabajo-vida',
    description: 'Falta de separación entre trabajo y vida personal',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Remote work, always-on culture',
    typicalIndicators: [
      'Trabajo remoto sin políticas claras',
      'Sin horarios definidos',
      'Cultura de disponibilidad 24/7'
    ],
    typicalRecommendations: [
      'Definir políticas claras de desconexión',
      'Establecer limitaciones horarias',
      'Respetar horas fuera de trabajo (Si el empleado no está disponible)'
    ]
  },

  meeting_fatigue: {
    type: 'meeting_fatigue',
    title: 'Fatiga de reuniones',
    description: 'Exceso de reuniones afectando productividad',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Too many meetings, inefficient meetings',
    typicalIndicators: [
      '>15 reuniones/semana',
      'Equipos distribuidos',
      'Reuniones largas e improductivas'
    ],
    typicalRecommendations: [
      'Limitar reuniones a 45 min máximo',
      'Considerar alternativas asíncronas'
    ]
  },

  technostress_overload: {
    type: 'technostress_overload',
    title: 'Sobrecarga de tecnoestrés',
    description: 'Estrés causado por tecnología y herramientas digitales',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Complex tools, constant notifications',
    typicalIndicators: [
      'Múltiples herramientas (>5)',
      'Cambios tecnológicos frecuentes',
      'Falta de capacitación'
    ],
    typicalRecommendations: [
      'Consolidar stack tecnológico',
      'Capacitación completa en herramientas',
      'Introducir cambios gradualmente'
    ]
  },

  // Other
  other: {
    type: 'other',
    title: 'Otro riesgo',
    description: 'Riesgo que no encaja en las categorías existentes',
    category: 'management',
    typicalSeverities: ['low', 'medium', 'high'],
    possibleSources: ['manual'],
    isHofstedeRelated: false,
    triggerConditions: 'Manual entry by PM',
    typicalIndicators: ['Casos específicos no cubiertos'],
    typicalRecommendations: [
      'Análisis caso por caso',
      'Identificación temprana de riesgos emergentes',
      'Plan de mitigación personalizado'
    ]
  }
};

/**
 * Get risk metadata by type
 * @param {string} type - Risk type
 * @returns {Object|null} Risk metadata or null if not found
 */
function getRiskMetadata(type) {
  return RISK_CATALOG[type] || null;
}

/**
 * Get all risk types
 * @returns {Array<string>} Array of all risk type identifiers
 */
function getAllRiskTypes() {
  return Object.keys(RISK_CATALOG);
}

/**
 * Get Hofstede-related risks
 * @returns {Array<Object>} Array of Hofstede-related risk metadata
 */
function getHofstedeRisks() {
  return Object.values(RISK_CATALOG).filter(risk => risk.isHofstedeRelated);
}

/**
 * Get traditional (non-Hofstede) risks
 * @returns {Array<Object>} Array of traditional risk metadata
 */
function getTraditionalRisks() {
  return Object.values(RISK_CATALOG).filter(risk => !risk.isHofstedeRelated);
}

/**
 * Get risks by category
 * @param {string} category - Category name
 * @returns {Array<Object>} Array of risk metadata for the category
 */
function getRisksByCategory(category) {
  return Object.values(RISK_CATALOG).filter(risk => risk.category === category);
}

module.exports = {
  RISK_CATALOG,
  getRiskMetadata,
  getAllRiskTypes,
  getHofstedeRisks,
  getTraditionalRisks,
  getRisksByCategory
};
