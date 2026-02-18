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
    description: 'Si el equipo está distribuido en zonas horarias con poco solapamiento, pueden surgir fallos de comunicación que retrasen entregas y generen malentendidos',
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
      'Utilizar herramientas de comunicación asíncrona eficaces',
      'Establecer normas de comunicación'
    ]
  },

  communication_tools_missing: {
    type: 'communication_tools_missing',
    title: 'Herramientas de comunicación inadecuadas',
    description: 'Si el proyecto involucra múltiples países y no se han definido herramientas de comunicación, surgirán problemas graves de coordinación al no contar con canales adecuados',
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
      'Implementar herramientas de comunicación tanto síncronas como asíncronas',
      'Establecer normas de comunicación claras'
    ]
  },

  // Cultural & Linguistic Risks (Hofstede)
  cultural_distance_risk: {
    type: 'cultural_distance_risk',
    title: 'Distancia socio-cultural elevada',
    description: 'Si hay personas de diferentes culturas en el proyecto, pueden surgir malentendidos derivados de la distancia socio-cultural que provoquen retrasos en las entregas',
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
      'Implementar formación socio-cultural',
      'Establecer normas de comunicación culturalmente sensibles',
      'Asignar mediadores culturales'
    ]
  },

  linguistic_distance_risk: {
    type: 'linguistic_distance_risk',
    title: 'Distancia socio-cultural lingüística',
    description: 'Si el equipo es multicultural y no todos los países hablan el idioma común del proyecto, pueden surgir problemas de distancia socio-cultural que dificulten la comprensión',
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
      'Proporcionar formación en el idioma común',
      'Emplear servicios de traducción',
      'Documentar en el mismo idioma',
      'Asignar facilitadores bilingües'
    ]
  },

  linguistic_distance_no_common_language: {
    type: 'linguistic_distance_no_common_language',
    title: 'Sin idioma común definido',
    description: 'Si el equipo multicultural no tiene definido un idioma común de proyecto, la falta de un mismo idioma compartido provocará malentendidos constantes y retrasos',
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
      'Definir un idioma común de proyecto',
      'Proporcionar formación lingüística',
      'Usar servicios de traducción',
      'Documentar todo en dicho idioma'
    ]
  },

  // Project Requirements Risks
  team_autonomy_risk: {
    type: 'team_autonomy_risk',
    title: 'Riesgo de autonomía del equipo',
    description: 'Si el proyecto requiere un alto nivel de autonomía del equipo, pueden surgir problemas si el equipo no está preparado para trabajar con ese grado de independencia',
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
      'Evaluar la capacidad real del equipo',
      'Proporcionar formación',
      'Ajustar la estructura de supervisión'
    ]
  },

  schedule_flexibility_risk: {
    type: 'schedule_flexibility_risk',
    title: 'Riesgo de flexibilidad horaria',
    description: 'Si el proyecto requiere alta flexibilidad horaria, pueden surgir problemas de coordinación y disponibilidad',
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
      'Evaluar la flexibilidad del equipo',
      'Establecer horas centrales',
      'Definir ventanas de disponibilidad'
    ]
  },

  travel_availability_risk: {
    type: 'travel_availability_risk',
    title: 'Riesgo de disponibilidad de viaje',
    description: 'Si el proyecto requiere alta disponibilidad para viajes, pueden producirse problemas logísticos y de coste',
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
      'Evaluar la disponibilidad del equipo',
      'Planificar viajes con antelación',
      'Priorizar reuniones virtuales',
      'Presupuestar los costes'
    ]
  },

  // Technical Risks
  skill_gap: {
    type: 'skill_gap',
    title: 'Brecha de habilidades',
    description: 'Si el equipo carece de varias tecnologías del proyecto o la cobertura tecnológica es inferior al 50%, surgirá un problema de habilidades que afectará la calidad y velocidad de desarrollo',
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
      'Contratar especialistas en las tecnologías críticas',
      'Implementar un programa de formación',
      'Añadir un perfil senior para mentoría'
    ]
  },

  tool_fragmentation: {
    type: 'tool_fragmentation',
    title: 'Fragmentación de herramientas',
    description: 'Si el proyecto utiliza varias herramientas sin integración, surgirá fragmentación de herramientas que generará confusión y pérdida de productividad',
    category: 'technical',
    typicalSeverities: ['low', 'medium'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Too many tools without integration',
    typicalIndicators: [
      '>5 herramientas principales'
    ],
    typicalRecommendations: [
      'Limitar el número de herramientas y asegurar su integración'
    ]
  },

  // Team Risks
  team_overload: {
    type: 'team_overload',
    title: 'Sobrecarga del equipo',
    description: 'Si los miembros del equipo trabajan en más de dos proyectos concurrentes, superan las 45 horas semanales o presentan alta tendencia al estrés, podrá surgir una sobrecarga de trabajo',
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
      'Redistribuir la carga de trabajo o contratar más recursos',
      'Reducir la concurrencia de proyectos o ampliar los plazos de entrega'
    ]
  },

  team_conflicts: {
    type: 'team_conflicts',
    title: 'Conflictos de equipo',
    description: 'Si existen choques de personalidad o mala comunicación entre miembros del equipo, podrán surgir conflictos que afectarán la productividad y el ambiente laboral',
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
      'Aplicar mediación de conflictos',
      'Realizar actividades de team building',
      'Clarificar roles y responsabilidades'
    ]
  },

  burnout_susceptibility: {
    type: 'burnout_susceptibility',
    title: 'Susceptibilidad al burnout',
    description: 'Si el equipo presenta neuroticismo alto, alta carga de trabajo y requiere comunicación síncrona con bajo solapamiento horario, podrán surgir burnout',
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
      'Definir límites claros de carga de trabajo',
      'Establecer topes de horas',
      'Promover políticas de bienestar y equilibrio vida-trabajo'
    ]
  },

  social_isolation: {
    type: 'social_isolation',
    title: 'Aislamiento social',
    description: 'Si el trabajo remoto supera el 70%, no hay reuniones presenciales anuales, no existe experiencia previa conjunta ni actividades de team building, puede producirse aislamiento social',
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
      'Fomentar canales de comunicación social',
      'Organizar actividades de team building remotas y presenciales',
      'Dar visibilidad al trabajo de cada miembro'
    ]
  },

  conflict_escalation_risk: {
    type: 'conflict_escalation_risk',
    title: 'Riesgo de escalada de conflictos',
    description: 'Si el equipo tiene baja amabilidad, alta diversidad cultural y múltiples equipos involucrados, podrán surgir riesgo de conflictos',
    category: 'team',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Unresolved conflicts, poor communication',
    typicalIndicators: [
      'Baja amabilidad promedio (<3)',
      'Alta diversidad cultural',
      'Personalidades conflictivas'
    ],
    typicalRecommendations: [
      'Establecer protocolos de comunicación claros',
      'Definir un proceso explícito de resolución de conflictos',
      'Asegurar claridad de roles y responsabilidades'
    ]
  },

  onboarding_issues: {
    type: 'onboarding_issues',
    title: 'Problemas de onboarding',
    description: 'Si el equipo está compuesto por nuevos miembros, no hay programa de mentoría ni documentación de onboarding, podrán surgir problemas de incorporación',
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
      'Implementar un programa de mentoría',
      'Crear un pack de bienvenida con documentación y contactos clave',
      'Programar reuniones de presentación'
    ]
  },

  // Management Risks
  dependency_blockage: {
    type: 'dependency_blockage',
    title: 'Bloqueo por dependencias',
    description: 'Si existen múltiples dependencias críticas y varios equipos, pueden producirse bloqueos que retrasen el proyecto',
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
      'Realizar reuniones semanales de sincronización',
      'Añadir tiempo de integración a la planificación',
      'Definir interfaces claras entre equipos'
    ]
  },

  scope_creep: {
    type: 'scope_creep',
    title: 'Aumento no controlado del alcance',
    description: 'Si la descripción del proyecto es vaga, la documentación incompleta y los roles clave no están definidos, podrá surgir el riesgo de aumento no controlado del alcance',
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
      'Realizar una reunión inicial de requisitos',
      'Definir un MVP claro',
      'Mantener alineación con los stakeholders'
    ]
  },

  process_mismatch: {
    type: 'process_mismatch',
    title: 'Desajuste de procesos',
    description: 'Si el proyecto carece de procesos de onboarding, CI/CD, presenta fragmentación de herramientas y baja experiencia en proyectos distribuidos, se producirá un desajuste de procesos',
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
      'Adaptar las ceremonias al trabajo distribuido',
      'Documentar los flujos de trabajo'
    ]
  },

  timezone_scheduling_gap: {
    type: 'timezone_scheduling_gap',
    title: 'Brecha de programación por zonas horarias',
    description: 'Si el proyecto tiene bajo solapamiento horario, tres o más zonas horarias distintas y reuniones frecuentes, surgirán brechas que dificulten la sincronización del equipo',
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
      'Establecer horas centrales de trabajo para todo el equipo',
      'Rotar los horarios de reuniones equitativamente',
      'Usar comunicación asíncrona',
      'Grabar reuniones importantes',
      'Asignar empleados con flexibilidad horaria'
    ]
  },

  role_clarity_gap: {
    type: 'role_clarity_gap',
    title: 'Falta de claridad de roles',
    description: 'Si el equipo supera los ocho miembros y los roles no están claramente definidos, podrá surgir falta de claridad',
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
      'Definir roles y responsabilidades',
      'Revisarlos al inicio del proyecto con todo el equipo'
    ]
  },

  // Organizational Risks
  knowledge_management_gap: {
    type: 'knowledge_management_gap',
    title: 'Brecha en gestión del conocimiento',
    description: 'Si el equipo es numeroso, no hay herramientas de gestión del conocimiento y la documentación es mínima, podrá surgir una brecha en la gestión del conocimiento',
    category: 'organizational',
    typicalSeverities: ['medium', 'high'],
    possibleSources: ['expert_rules', 'cbr'],
    isHofstedeRelated: false,
    triggerConditions: 'Knowledge silos, no documentation',
    typicalIndicators: [
      'Equipo demasiado grande >5 personas'
    ],
    typicalRecommendations: [
      'Implementar un sistema de gestión del conocimiento',
      'Mantener una wiki actualizada',
      'Documentar el trabajo de forma continua'
    ]
  },

  remote_work_support_gap: {
    type: 'remote_work_support_gap',
    title: 'Falta de soporte para trabajo remoto',
    description: 'Si el modo de trabajo no es presencial y no existen políticas, existirá falta de soporte para el trabajo remoto',
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
      'Definir políticas claras',
      'Proporcionar herramientas adecuadas',
      'Ofrecer soporte técnico y ergonómico'
    ]
  },

  change_resistance_risk: {
    type: 'change_resistance_risk',
    title: 'Resistencia al cambio',
    description: 'Si el equipo tiene baja apertura a la experiencia y el proyecto es de alta complejidad, podrá surgir resistencia al cambio',
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
      'Aplicar planes de adopción progresiva',
      'Mentoría en áreas nuevas',
      'Limitar cambios simultáneos'
    ]
  },

  digital_fatigue: {
    type: 'digital_fatigue',
    title: 'Fatiga digital',
    description: 'Si el trabajo es completamente remoto, hay un número elevado de reuniones y no existe política de desconexión, podrá surgir fatiga digital',
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
      'Establecer días sin reuniones',
      'Promover pausas',
      'Utilizar alternativas asíncronas'
    ]
  },

  work_life_boundary_blur: {
    type: 'work_life_boundary_blur',
    title: 'Difuminación de límites trabajo-vida',
    description: 'Si el modo de trabajo es remoto, no hay política de desconexión ni horario definido y los plazos son ajustados, podrá surgir burnout',
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
      'Respetar los horarios fuera de trabajo'
    ]
  },

  meeting_fatigue: {
    type: 'meeting_fatigue',
    title: 'Fatiga de reuniones',
    description: 'Si hay un número excesivo de reuniones, múltiples equipos distribuidos, podrá surgir burnout',
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
      'Limitar la duración de las reuniones',
      'Priorizar la comunicación asíncrona'
    ]
  },

  technostress_overload: {
    type: 'technostress_overload',
    title: 'Sobrecarga de tecnoestrés',
    description: 'Si el proyecto utiliza demasiadas herramientas digitales y no hay formación adecuada, podrán surgir sobrecarga',
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
      'Consolidar herramientas tecnológicas',
      'Proporcionar formación completa',
      'Realizar cambios de forma gradual'
    ]
  },

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
