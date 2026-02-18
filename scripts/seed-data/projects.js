// Seed Projects with various states
const seedProjects = async (users, organizations) => {
  console.log('\n📊 Creating projects...');
  
  const techInnovOrg = organizations[0];
  const globalSolOrg = organizations[1];
  const asianTechOrg = organizations[2];
  
  const carlosId = users.find(u => u.email === 'carlos.dev@example.com')._id;
  const anaId = users.find(u => u.email === 'ana.frontend@example.com')._id;
  const davidId = users.find(u => u.email === 'david.backend@example.com')._id;
  const lauraId = users.find(u => u.email === 'laura.qa@example.com')._id;
  const sarahId = users.find(u => u.email === 'sarah.devops@example.com')._id;
  const michaelId = users.find(u => u.email === 'michael.arch@example.com')._id;
  const emmaId = users.find(u => u.email === 'emma.mobile@example.com')._id;
  const yukiId = users.find(u => u.email === 'yuki.fullstack@example.com')._id;
  const liWeiId = users.find(u => u.email === 'li.wei@example.com')._id;
  const priyaId = users.find(u => u.email === 'priya.data@example.com')._id;
  
  const projects = [
    // Active project in planning phase - Tech Innovators
    {
      projectName: 'Modernización de la plataforma de e-commerce',
      briefDescription: 'Migración de una plataforma legacy de e-commerce a una arquitectura moderna de microservicios con frontend React y backend Node.js',
      estimatedStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 130 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'only_critical_moments',
      realTimeCommunicationLevel: 'medium',
      weeklyMeetingsCount: 3,
      averageMeetingDuration: { value: 60, unit: 'minutes' },
      requiredAvailabilitySchedule: '10:00-16:00 UTC para reuniones críticas',
      requiredLanguages: ['Inglés', 'Español'],
      minimumLanguageProficiency: 'B2',
      mainTechnologies: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
      requiredExperienceLevel: 'senior',
      systemComplexity: 'high',
      sharedInfrastructureDependency: 'Infraestructura AWS compartida con otros equipos',
      requiresSpecializedTools: {
        needed: true,
        description: 'Kubernetes, ArgoCD, monitorización con Datadog'
      },
      documentationLevel: 'partial',
      involvedCountries: ['Spain', 'Mexico'],
      distributedWorkExperienceLevel: 'high',
      expectedTimeOverlap: { value: 6, unit: 'hours' },
      culturalDiversityLevel: 'medium',
      rolesAndResponsibilities: [
        { roleName: 'Líder técnico', responsibilities: ['Arquitectura y decisiones técnicas'], clarityScore: 5 },
        { roleName: 'Desarrollador Frontend', responsibilities: ['Componentes React y UI'], clarityScore: 4 },
        { roleName: 'Desarrollador Backend', responsibilities: ['API y microservicios'], clarityScore: 4 },
        { roleName: 'Ingeniero de QA', responsibilities: ['Automatización de pruebas'], clarityScore: 4 }
      ],
      criticalDependencies: ['API de pasarela de pago', 'Acceso a base de datos legacy', 'Configuración de CDN'],
      weeklyHoursPerMember: 35,
      methodology: 'scrum',
      sprintDuration: { value: 2, unit: 'weeks' },
      hasOnboardingProcess: 'yes',
      hasCICD: 'yes',
      toolsFragmentation: 'low',
      clarityOfRequirements: 'high',
      involvedTeams: [],
      informationFlowQuality: 'good',
      stakeholdersCount: 4,
      organization: techInnovOrg._id,
      projectManager: carlosId,
      status: 'draft',
      teamFormationApproach: 'manual',
      manualSelection: {
        selectedMembers: [
          { userId: anaId, role: 'Desarrollador Frontend' },
          { userId: davidId, role: 'Desarrollador Backend' },
          { userId: lauraId, role: 'Ingeniero de QA' }
        ]
      },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    
    // Active project in progress - Tech Innovators
    {
      projectName: 'Rediseño de la app de banca móvil',
      briefDescription: 'Rediseño completo de la aplicación de banca móvil para iOS y Android con mejor UX y nuevas funcionalidades',
      estimatedStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'yes',
      realTimeCommunicationLevel: 'high',
      weeklyMeetingsCount: 5,
      averageMeetingDuration: { value: 45, unit: 'minutes' },
      requiredAvailabilitySchedule: '09:00-18:00 hora local con 4h de solapamiento',
      requiredLanguages: ['Inglés'],
      minimumLanguageProficiency: 'C1',
      mainTechnologies: ['React Native', 'TypeScript', 'Firebase', 'REST API'],
      requiredExperienceLevel: 'mid',
      systemComplexity: 'medium',
      sharedInfrastructureDependency: 'Ninguna: infraestructura dedicada',
      requiresSpecializedTools: {
        needed: true,
        description: 'Figma, TestFlight, Firebase Analytics'
      },
      documentationLevel: 'complete',
      involvedCountries: ['Spain', 'Argentina'],
      distributedWorkExperienceLevel: 'medium',
      expectedTimeOverlap: { value: 4, unit: 'hours' },
      culturalDiversityLevel: 'low',
      rolesAndResponsibilities: [
        { roleName: 'Líder móvil', responsibilities: ['Arquitectura móvil'], clarityScore: 5 },
        { roleName: 'Diseñador UX', responsibilities: ['Diseño de experiencia de usuario'], clarityScore: 5 },
        { roleName: 'Desarrollador Móvil', responsibilities: ['Implementación de funcionalidades'], clarityScore: 4 }
      ],
      criticalDependencies: ['API bancaria', 'SDK de autenticación biométrica'],
      weeklyHoursPerMember: 40,
      methodology: 'kanban',
      sprintDuration: { value: 1, unit: 'weeks' },
      hasOnboardingProcess: 'yes',
      hasCICD: 'yes',
      toolsFragmentation: 'low',
      clarityOfRequirements: 'high',
      involvedTeams: [],
      informationFlowQuality: 'excellent',
      stakeholdersCount: 3,
      organization: techInnovOrg._id,
      projectManager: carlosId,
      status: 'active',
      teamFormationApproach: 'manual',
      manualSelection: {
        selectedMembers: [
          { userId: anaId, role: 'Diseñador UX' },
          { userId: davidId, role: 'Desarrollador Móvil' }
        ]
      },
      actualTeamMembers: [
        { userId: carlosId, assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { userId: anaId, assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        { userId: davidId, assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      ],
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    },
    
    // Completed project - Tech Innovators
    {
      projectName: 'Desarrollo del portal de clientes',
      briefDescription: 'Desarrollo de un portal de autoservicio con gestión de cuentas y funciones de soporte',
      estimatedStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      actualEndDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'only_critical_moments',
      realTimeCommunicationLevel: 'low',
      weeklyMeetingsCount: 2,
      averageMeetingDuration: { value: 30, unit: 'minutes' },
      requiredAvailabilitySchedule: 'Flexible con 2h de solapamiento diario',
      requiredLanguages: ['Inglés', 'Español'],
      minimumLanguageProficiency: 'B2',
      mainTechnologies: ['Vue.js', 'Node.js', 'PostgreSQL', 'Redis'],
      requiredExperienceLevel: 'mid',
      systemComplexity: 'medium',
      documentationLevel: 'complete',
      involvedCountries: ['Spain'],
      distributedWorkExperienceLevel: 'high',
      expectedTimeOverlap: { value: 8, unit: 'hours' },
      culturalDiversityLevel: 'low',
      rolesAndResponsibilities: [
        { roleName: 'Desarrollador Full Stack', responsibilities: ['Desarrollo end-to-end'], clarityScore: 5 }
      ],
      criticalDependencies: ['Integración con CRM'],
      weeklyHoursPerMember: 40,
      methodology: 'scrum',
      sprintDuration: { value: 2, unit: 'weeks' },
      hasOnboardingProcess: 'yes',
      hasCICD: 'yes',
      toolsFragmentation: 'low',
      clarityOfRequirements: 'high',
      involvedTeams: [],
      informationFlowQuality: 'good',
      stakeholdersCount: 2,
      organization: techInnovOrg._id,
      projectManager: carlosId,
      status: 'completed',
      teamFormationApproach: 'manual',
      actualTeamMembers: [
        { userId: carlosId, assignedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        { userId: anaId, assignedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        { userId: davidId, assignedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
        { userId: lauraId, assignedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
      ],
      createdAt: new Date(Date.now() - 185 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000)
    },
    
    // Active project - Global Solutions
    {
      projectName: 'Migración de infraestructura a la nube',
      briefDescription: 'Migración de infraestructura on-premise a la nube de AWS con requisito de cero downtime',
      estimatedStartDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'yes',
      realTimeCommunicationLevel: 'high',
      weeklyMeetingsCount: 4,
      averageMeetingDuration: { value: 90, unit: 'minutes' },
      requiredAvailabilitySchedule: '14:00-18:00 UTC para coordinación global',
      requiredLanguages: ['Inglés'],
      minimumLanguageProficiency: 'C1',
      mainTechnologies: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'Python'],
      requiredExperienceLevel: 'expert',
      systemComplexity: 'high',
      sharedInfrastructureDependency: 'Cuenta de AWS compartida con múltiples equipos',
      requiresSpecializedTools: {
        needed: true,
        description: 'AWS Control Tower, Terraform Cloud, Datadog'
      },
      documentationLevel: 'complete',
      involvedCountries: ['United States', 'United Kingdom'],
      distributedWorkExperienceLevel: 'high',
      expectedTimeOverlap: { value: 5, unit: 'hours' },
      culturalDiversityLevel: 'high',
      rolesAndResponsibilities: [
        { roleName: 'Arquitecto Cloud', responsibilities: ['Diseñar la arquitectura cloud'], clarityScore: 5 },
        { roleName: 'Líder DevOps', responsibilities: ['Implementar infraestructura como código'], clarityScore: 5 },
        { roleName: 'Ingeniero SRE', responsibilities: ['Asegurar la fiabilidad del sistema'], clarityScore: 4 }
      ],
      criticalDependencies: ['Configuración de cuenta de AWS', 'Conectividad de red', 'Auditoría de seguridad'],
      weeklyHoursPerMember: 40,
      methodology: 'scrum',
      sprintDuration: { value: 2, unit: 'weeks' },
      hasOnboardingProcess: 'yes',
      hasCICD: 'yes',
      toolsFragmentation: 'low',
      clarityOfRequirements: 'medium',
      involvedTeams: [],
      informationFlowQuality: 'good',
      stakeholdersCount: 6,
      organization: globalSolOrg._id,
      projectManager: sarahId,
      status: 'active',
      teamFormationApproach: 'manual',
      actualTeamMembers: [
        { userId: sarahId, assignedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
        { userId: michaelId, assignedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
        { userId: emmaId, assignedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) }
      ],
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
    },
    
    // Planning project - Asian Tech Hub
    {
      projectName: 'Motor de recomendaciones impulsado por IA',
      briefDescription: 'Desarrollo de un sistema de recomendación basado en aprendizaje automático para una plataforma de e-commerce',
      estimatedStartDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'only_critical_moments',
      realTimeCommunicationLevel: 'medium',
      weeklyMeetingsCount: 2,
      averageMeetingDuration: { value: 60, unit: 'minutes' },
      requiredAvailabilitySchedule: 'Compatible con zona horaria asiática',
      requiredLanguages: ['Inglés', 'Japonés'],
      minimumLanguageProficiency: 'B2',
      mainTechnologies: ['Python', 'TensorFlow', 'PostgreSQL', 'Redis', 'FastAPI'],
      requiredExperienceLevel: 'senior',
      systemComplexity: 'high',
      sharedInfrastructureDependency: 'Almacén de datos compartido',
      requiresSpecializedTools: {
        needed: true,
        description: 'MLflow, Jupyter, instancias de cómputo con GPU'
      },
      documentationLevel: 'partial',
      involvedCountries: ['Japan', 'China', 'India'],
      distributedWorkExperienceLevel: 'medium',
      expectedTimeOverlap: { value: 6, unit: 'hours' },
      culturalDiversityLevel: 'high',
      rolesAndResponsibilities: [
        { roleName: 'Ingeniero de ML', responsibilities: ['Desarrollo y entrenamiento de modelos'], clarityScore: 4 },
        { roleName: 'Científico de datos', responsibilities: ['Análisis de datos e ingeniería de características'], clarityScore: 4 },
        { roleName: 'Desarrollador Backend', responsibilities: ['API e integración'], clarityScore: 5 }
      ],
      criticalDependencies: ['Pipeline de datos de entrenamiento', 'Infraestructura de serving del modelo'],
      weeklyHoursPerMember: 40,
      methodology: 'agile',
      sprintDuration: { value: 1, unit: 'weeks' },
      hasOnboardingProcess: 'partial',
      hasCICD: 'yes',
      toolsFragmentation: 'medium',
      clarityOfRequirements: 'medium',
      involvedTeams: [],
      informationFlowQuality: 'acceptable',
      stakeholdersCount: 4,
      organization: asianTechOrg._id,
      projectManager: yukiId,
      status: 'draft',
      teamFormationApproach: 'automatic',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    },
    
    // Cancelled project - Global Solutions
    {
      projectName: 'Sustitución del sistema legacy',
      briefDescription: 'Sustitución completa del sistema legacy en mainframe (cancelado por restricciones presupuestarias)',
      estimatedStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      actualEndDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'no',
      realTimeCommunicationLevel: 'low',
      weeklyMeetingsCount: 1,
      averageMeetingDuration: { value: 30, unit: 'minutes' },
      requiredLanguages: ['Inglés'],
      minimumLanguageProficiency: 'B2',
      mainTechnologies: ['Java', 'Spring Boot', 'Oracle', 'COBOL'],
      requiredExperienceLevel: 'expert',
      systemComplexity: 'high',
      documentationLevel: 'minimal',
      involvedCountries: ['United States'],
      distributedWorkExperienceLevel: 'high',
      expectedTimeOverlap: { value: 8, unit: 'hours' },
      culturalDiversityLevel: 'low',
      rolesAndResponsibilities: [
        { roleName: 'Experto en sistemas legacy', responsibilities: ['Migración de COBOL'], clarityScore: 3 }
      ],
      criticalDependencies: ['Acceso al mainframe', 'Documentación'],
      weeklyHoursPerMember: 35,
      methodology: 'waterfall',
      hasOnboardingProcess: 'no',
      hasCICD: 'no',
      toolsFragmentation: 'high',
      clarityOfRequirements: 'low',
      involvedTeams: [],
      informationFlowQuality: 'poor',
      stakeholdersCount: 8,
      organization: globalSolOrg._id,
      projectManager: michaelId,
      status: 'cancelled',
      teamFormationApproach: 'manual',
      actualTeamMembers: [
        { userId: michaelId, assignedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
      ],
      cancellationReason: 'Restricciones presupuestarias y requisitos poco claros',
      cancelledAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000)
    }
  ];
  
  const createdProjects = await require('../../src/models/project.model').insertMany(projects);
  console.log(`✅ Created ${createdProjects.length} projects`);
  return createdProjects;
};

module.exports = { seedProjects };

