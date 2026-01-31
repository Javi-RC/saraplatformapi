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
      projectName: 'E-Commerce Platform Modernization',
      briefDescription: 'Migration of legacy e-commerce platform to modern microservices architecture with React frontend and Node.js backend',
      estimatedStartDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 130 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'only_critical_moments',
      realTimeCommunicationLevel: 'medium',
      weeklyMeetingsCount: 3,
      averageMeetingDuration: { value: 60, unit: 'minutes' },
      requiredAvailabilitySchedule: '10:00-16:00 UTC for critical meetings',
      requiredLanguages: ['English', 'Spanish'],
      minimumLanguageProficiency: 'B2',
      mainTechnologies: ['React', 'Node.js', 'MongoDB', 'Docker', 'AWS'],
      requiredExperienceLevel: 'senior',
      systemComplexity: 'high',
      sharedInfrastructureDependency: 'AWS infrastructure shared with other teams',
      requiresSpecializedTools: {
        needed: true,
        description: 'Kubernetes, ArgoCD, Datadog monitoring'
      },
      documentationLevel: 'partial',
      involvedCountries: ['Spain', 'Mexico'],
      distributedWorkExperienceLevel: 'high',
      expectedTimeOverlap: { value: 6, unit: 'hours' },
      culturalDiversityLevel: 'medium',
      rolesAndResponsibilities: [
        { roleName: 'Tech Lead', responsibilities: ['Architecture and technical decisions'], clarityScore: 5 },
        { roleName: 'Frontend Developer', responsibilities: ['React components and UI'], clarityScore: 4 },
        { roleName: 'Backend Developer', responsibilities: ['API and microservices'], clarityScore: 4 },
        { roleName: 'QA Engineer', responsibilities: ['Test automation'], clarityScore: 4 }
      ],
      criticalDependencies: ['Payment gateway API', 'Legacy database access', 'CDN setup'],
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
          { userId: anaId, role: 'Frontend Developer' },
          { userId: davidId, role: 'Backend Developer' },
          { userId: lauraId, role: 'QA Engineer' }
        ]
      },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    
    // Active project in progress - Tech Innovators
    {
      projectName: 'Mobile Banking App Redesign',
      briefDescription: 'Complete redesign of mobile banking application for iOS and Android with improved UX and new features',
      estimatedStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'yes',
      realTimeCommunicationLevel: 'high',
      weeklyMeetingsCount: 5,
      averageMeetingDuration: { value: 45, unit: 'minutes' },
      requiredAvailabilitySchedule: '09:00-18:00 local time with 4h overlap',
      requiredLanguages: ['English'],
      minimumLanguageProficiency: 'C1',
      mainTechnologies: ['React Native', 'TypeScript', 'Firebase', 'REST API'],
      requiredExperienceLevel: 'mid',
      systemComplexity: 'medium',
      sharedInfrastructureDependency: 'None - dedicated infrastructure',
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
        { roleName: 'Mobile Lead', responsibilities: ['Mobile architecture'], clarityScore: 5 },
        { roleName: 'UX Designer', responsibilities: ['User experience design'], clarityScore: 5 },
        { roleName: 'Mobile Developer', responsibilities: ['Feature implementation'], clarityScore: 4 }
      ],
      criticalDependencies: ['Banking API', 'Biometric authentication SDK'],
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
          { userId: anaId, role: 'UX Designer' },
          { userId: davidId, role: 'Mobile Developer' }
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
      projectName: 'Customer Portal Development',
      briefDescription: 'Development of self-service customer portal with account management and support features',
      estimatedStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      actualEndDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'only_critical_moments',
      realTimeCommunicationLevel: 'low',
      weeklyMeetingsCount: 2,
      averageMeetingDuration: { value: 30, unit: 'minutes' },
      requiredAvailabilitySchedule: 'Flexible with 2h daily overlap',
      requiredLanguages: ['English', 'Spanish'],
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
        { roleName: 'Full Stack Developer', responsibilities: ['End to end development'], clarityScore: 5 }
      ],
      criticalDependencies: ['CRM integration'],
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
      projectName: 'Cloud Infrastructure Migration',
      briefDescription: 'Migration of on-premise infrastructure to AWS cloud with zero downtime requirement',
      estimatedStartDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'yes',
      realTimeCommunicationLevel: 'high',
      weeklyMeetingsCount: 4,
      averageMeetingDuration: { value: 90, unit: 'minutes' },
      requiredAvailabilitySchedule: '14:00-18:00 UTC for global coordination',
      requiredLanguages: ['English'],
      minimumLanguageProficiency: 'C1',
      mainTechnologies: ['AWS', 'Terraform', 'Kubernetes', 'Docker', 'Python'],
      requiredExperienceLevel: 'expert',
      systemComplexity: 'high',
      sharedInfrastructureDependency: 'Shared AWS account with multiple teams',
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
        { roleName: 'Cloud Architect', responsibilities: ['Design cloud architecture'], clarityScore: 5 },
        { roleName: 'DevOps Lead', responsibilities: ['Implement infrastructure as code'], clarityScore: 5 },
        { roleName: 'Site Reliability Engineer', responsibilities: ['Ensure system reliability'], clarityScore: 4 }
      ],
      criticalDependencies: ['AWS account setup', 'Network connectivity', 'Security audit'],
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
      projectName: 'AI-Powered Recommendation Engine',
      briefDescription: 'Development of machine learning based recommendation system for e-commerce platform',
      estimatedStartDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'only_critical_moments',
      realTimeCommunicationLevel: 'medium',
      weeklyMeetingsCount: 2,
      averageMeetingDuration: { value: 60, unit: 'minutes' },
      requiredAvailabilitySchedule: 'Asian timezone friendly',
      requiredLanguages: ['English', 'Japanese'],
      minimumLanguageProficiency: 'B2',
      mainTechnologies: ['Python', 'TensorFlow', 'PostgreSQL', 'Redis', 'FastAPI'],
      requiredExperienceLevel: 'senior',
      systemComplexity: 'high',
      sharedInfrastructureDependency: 'Shared data warehouse',
      requiresSpecializedTools: {
        needed: true,
        description: 'MLflow, Jupyter, GPU compute instances'
      },
      documentationLevel: 'partial',
      involvedCountries: ['Japan', 'China', 'India'],
      distributedWorkExperienceLevel: 'medium',
      expectedTimeOverlap: { value: 6, unit: 'hours' },
      culturalDiversityLevel: 'high',
      rolesAndResponsibilities: [
        { roleName: 'ML Engineer', responsibilities: ['Model development and training'], clarityScore: 4 },
        { roleName: 'Data Scientist', responsibilities: ['Data analysis and feature engineering'], clarityScore: 4 },
        { roleName: 'Backend Developer', responsibilities: ['API and integration'], clarityScore: 5 }
      ],
      criticalDependencies: ['Training data pipeline', 'Model serving infrastructure'],
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
      projectName: 'Legacy System Replacement',
      briefDescription: 'Complete replacement of legacy mainframe system - cancelled due to budget constraints',
      estimatedStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      actualStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      actualEndDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      requiresSynchronousCommunication: 'no',
      realTimeCommunicationLevel: 'low',
      weeklyMeetingsCount: 1,
      averageMeetingDuration: { value: 30, unit: 'minutes' },
      requiredLanguages: ['English'],
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
        { roleName: 'Legacy Systems Expert', responsibilities: ['COBOL migration'], clarityScore: 3 }
      ],
      criticalDependencies: ['Mainframe access', 'Documentation'],
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
      cancellationReason: 'Budget constraints and unclear requirements',
      cancelledAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000)
    }
  ];
  
  const createdProjects = await require('../../src/models/project.model').insertMany(projects);
  console.log(`✅ Created ${createdProjects.length} projects`);
  return createdProjects;
};

module.exports = { seedProjects };

