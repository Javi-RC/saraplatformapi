// ============================================================================
// COMPREHENSIVE SEED CURRÍCULOS - AUTO-GENERATED COMPLETE DATA FOR ALL EMPLOYEES
// ============================================================================
// This module automatically generates complete, realistic currículo data for all employees
// Each currículo includes: education, experience, skills, certifications, projects, etc.
// ============================================================================

const { COMPLETE_EMPLOYEE_DATA } = require('./employee-profiles');

// Helper functions to generate realistic data based on profile
const generators = {
  // Generate complete education history
  generateEducation(profile) {
    const universities = {
      'Spain': ['Universidad Politécnica de Madrid', 'Universidad Complutense de Madrid', 'Universidad de Barcelona'],
      'Mexico': ['Instituto Tecnológico de México', 'UNAM', 'Tec de Monterrey'],
      'Argentina': ['Universidad de Buenos Aires', 'Universidad Nacional de Córdoba'],
      'United States': ['Stanford University', 'MIT', 'UC Berkeley'],
      'Canada': ['University of Toronto', 'McGill University', 'UBC'],
      'United Kingdom': ['Imperial College London', 'University of Cambridge', 'UCL'],
      'Japan': ['University of Tokyo', 'Kyoto University', 'Waseda University'],
      'China': ['Tsinghua University', 'Peking University', 'Fudan University'],
      'India': ['IIT Bombay', 'IIT Delhi', 'BITS Pilani'],
      'Brazil': ['Universidade de São Paulo', 'UNICAMP', 'UFRJ'],
      'France': ['École Polytechnique', 'Sorbonne University', 'ENS Paris']
    };
    
    const uni = universities[profile.country]?.[0] || 'State University';
    const education = [];
    
    // Master's degree for senior profiles
    if (profile.level === 'senior') {
      education.push({
        institution: uni,
        degree: 'Máster en Ciencias',
        fieldOfStudy: profile.specialty,
        startDate: String(2022 - profile.years + 4),
        endDate: String(2022 - profile.years + 6),
        current: false,
        grade: `${(8.5 + Math.random() * 1.3).toFixed(1)}/10`,
        achievements: [
          'Graduado con honores',
          'Publicación de investigación',
          'Premio a la mejor tesis'
        ]
      });
    }
    
    // Bachelor's degree
    education.push({
      institution: uni,
      degree: profile.level === 'senior' ? 'Grado en Ingeniería Informática' : 'Grado en Ingeniería Informática',
      fieldOfStudy: 'Informática',
      startDate: String(2022 - profile.years),
      endDate: String(2022 - profile.years + 4),
      current: false,
      grade: `${(8.0 + Math.random() * 1.5).toFixed(1)}/10`,
      achievements: [
        'Lista de honor',
        'Mejor proyecto de estudiante',
        'Premio a la excelencia académica'
      ]
    });
    
    // Additional certifications/courses
    education.push({
      institution: 'Plataforma de aprendizaje online',
      degree: `Certificado profesional en ${profile.specialty}`,
      fieldOfStudy: profile.specialty,
      startDate: String(2022 - Math.floor(profile.years / 2)),
      endDate: String(2022 - Math.floor(profile.years / 2) + 1),
      current: false
    });
    
    return education;
  },
  
  // Generate complete work experience
  generateExperience(profile) {
    const experience = [];
    const currentYear = 2024;
    const startYear = currentYear - profile.years;
    
    // Current position
    experience.push({
      company: profile.orgIndex === 0 ? 'Tech Innovators' : profile.orgIndex === 1 ? 'Global Solutions Inc' : 'Asian Tech Hub',
      position: profile.position,
      startDate: String(startYear + Math.floor(profile.years * 0.6)),
      endDate: '',
      current: true,
      description: `Liderando iniciativas de ${profile.specialty.toLowerCase()} y entregando proyectos de alto impacto para clientes enterprise.`,
      responsibilities: [
        `Desarrollar y mantener aplicaciones en ${profile.mainTech[0]}`,
        `Colaborar con equipos multifuncionales`,
        `Revisión de código y mentoring a perfiles junior`,
        `Implementar buenas prácticas y patrones de diseño`,
        `Participar en decisiones de arquitectura y diseño`,
        `Optimización de rendimiento y corrección de bugs`,
        `Redactar documentación técnica completa`,
        `Liderar la planificación de sprints y retrospectivas`
      ],
      technologies: [...profile.mainTech, 'Git', 'Docker', 'CI/CD', 'Agile', 'Scrum'],
      achievements: [
        'Mejoró el rendimiento del sistema en un 40%',
        'Lideró un proyecto de migración exitoso',
        'Mentorizó a 3+ desarrolladores junior',
        'Entregó 5+ funcionalidades importantes a tiempo'
      ]
    });
    
    // Previous position(s)
    if (profile.years >= 3) {
      experience.push({
        company: 'Empresa tecnológica anterior',
        position: profile.level === 'senior' ? profile.position.replace('Senior ', '') : 'Junior ' + profile.position,
        startDate: String(startYear),
        endDate: String(startYear + Math.floor(profile.years * 0.5)),
        current: false,
        description: `Desarrolló soluciones de software usando ${profile.mainTech[0]} y tecnologías relacionadas.`,
        responsibilities: [
          'Construyó y mantuvo aplicaciones de software',
          'Colaboró con miembros del equipo',
          'Participó en revisiones de código',
          'Corrigió bugs y optimizó rendimiento',
          'Escribió pruebas unitarias e integración'
        ],
        technologies: profile.mainTech,
        achievements: [
          'Entregó múltiples proyectos exitosos',
          'Mejoró la calidad del código mediante refactorización'
        ]
      });
    }
    
    // Internship for those with 5+ years
    if (profile.years >= 5 && profile.level !== 'junior') {
      experience.push({
        company: 'Tech Startup',
        position: 'Becario de desarrollo de software',
        startDate: String(startYear - 1),
        endDate: String(startYear),
        current: false,
        description: 'Prácticas enfocadas en desarrollo de software y aprendizaje de buenas prácticas de la industria.',
        responsibilities: [
          'Ayudó en el desarrollo de funcionalidades',
          'Participó en reuniones de equipo',
          'Aprendió el codebase y las prácticas de la empresa'
        ],
        technologies: profile.mainTech.slice(0, 2)
      });
    }
    
    return experience;
  },
  
  // Generate technical skills with realistic levels
  generateTechnicalSkills(profile) {
    const skillsBySpecialty = {
      'Desarrollo Full Stack': [
        { name: 'JavaScript', level: 'expert', category: 'language', years: profile.years },
        { name: 'TypeScript', level: 'advanced', category: 'language', years: Math.floor(profile.years * 0.7) },
        { name: 'Node.js', level: 'expert', category: 'runtime', years: Math.floor(profile.years * 0.8) },
        { name: 'React', level: 'advanced', category: 'framework', years: Math.floor(profile.years * 0.8) },
        { name: 'Express', level: 'advanced', category: 'framework', years: Math.floor(profile.years * 0.7) },
        { name: 'MongoDB', level: 'advanced', category: 'database', years: Math.floor(profile.years * 0.6) },
        { name: 'PostgreSQL', level: 'advanced', category: 'database', years: Math.floor(profile.years * 0.6) },
        { name: 'Docker', level: 'intermediate', category: 'devops', years: Math.floor(profile.years * 0.5) },
        { name: 'Git', level: 'expert', category: 'tool', years: profile.years },
        { name: 'REST APIs', level: 'expert', category: 'tool', years: profile.years },
        { name: 'GraphQL', level: 'intermediate', category: 'tool', years: Math.floor(profile.years * 0.4) },
        { name: 'Jest', level: 'advanced', category: 'testing', years: Math.floor(profile.years * 0.6) }
      ],
      'Frontend y UX/UI': [
        { name: 'React', level: 'expert', category: 'framework', years: profile.years },
        { name: 'TypeScript', level: 'advanced', category: 'language', years: Math.floor(profile.years * 0.8) },
        { name: 'JavaScript', level: 'expert', category: 'language', years: profile.years + 1 },
        { name: 'HTML', level: 'expert', category: 'language', years: profile.years + 2 },
        { name: 'CSS', level: 'expert', category: 'language', years: profile.years + 2 },
        { name: 'Vue.js', level: 'advanced', category: 'framework', years: Math.floor(profile.years * 0.6) },
        { name: 'Next.js', level: 'advanced', category: 'framework', years: Math.floor(profile.years * 0.6) },
        { name: 'Tailwind CSS', level: 'advanced', category: 'framework', years: Math.floor(profile.years * 0.6) },
        { name: 'SASS/SCSS', level: 'advanced', category: 'tool', years: profile.years },
        { name: 'Figma', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.8) },
        { name: 'Storybook', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.6) },
        { name: 'Jest', level: 'intermediate', category: 'testing', years: Math.floor(profile.years * 0.6) },
        { name: 'Cypress', level: 'intermediate', category: 'testing', years: Math.floor(profile.years * 0.4) },
        { name: 'Webpack', level: 'intermediate', category: 'tool', years: Math.floor(profile.years * 0.6) },
        { name: 'Git', level: 'advanced', category: 'tool', years: profile.years }
      ],
      'Desarrollo Backend': [
        { name: 'Java', level: 'expert', category: 'language', years: profile.years },
        { name: 'Spring Boot', level: 'expert', category: 'framework', years: Math.floor(profile.years * 0.8) },
        { name: 'Python', level: 'advanced', category: 'language', years: Math.floor(profile.years * 0.6) },
        { name: 'PostgreSQL', level: 'advanced', category: 'database', years: profile.years },
        { name: 'MySQL', level: 'advanced', category: 'database', years: profile.years },
        { name: 'MongoDB', level: 'intermediate', category: 'database', years: Math.floor(profile.years * 0.4) },
        { name: 'Redis', level: 'intermediate', category: 'database', years: Math.floor(profile.years * 0.4) },
        { name: 'Kafka', level: 'intermediate', category: 'tool', years: Math.floor(profile.years * 0.3) },
        { name: 'Docker', level: 'intermediate', category: 'devops', years: Math.floor(profile.years * 0.5) },
        { name: 'Kubernetes', level: 'basic', category: 'devops', years: Math.floor(profile.years * 0.3) },
        { name: 'AWS', level: 'intermediate', category: 'cloud', years: Math.floor(profile.years * 0.4) },
        { name: 'Git', level: 'advanced', category: 'tool', years: profile.years },
        { name: 'JUnit', level: 'advanced', category: 'testing', years: Math.floor(profile.years * 0.8) },
        { name: 'REST APIs', level: 'expert', category: 'tool', years: profile.years }
      ],
      'Aseguramiento de Calidad y Automatización de Pruebas': [
        { name: 'Selenium', level: 'expert', category: 'testing', years: profile.years },
        { name: 'Cypress', level: 'advanced', category: 'testing', years: Math.floor(profile.years * 0.6) },
        { name: 'JMeter', level: 'intermediate', category: 'testing', years: Math.floor(profile.years * 0.6) },
        { name: 'Postman', level: 'advanced', category: 'tool', years: profile.years },
        { name: 'Rest Assured', level: 'advanced', category: 'testing', years: Math.floor(profile.years * 0.6) },
        { name: 'JavaScript', level: 'intermediate', category: 'language', years: Math.floor(profile.years * 0.8) },
        { name: 'Python', level: 'intermediate', category: 'language', years: Math.floor(profile.years * 0.6) },
        { name: 'Java', level: 'intermediate', category: 'language', years: Math.floor(profile.years * 0.8) },
        { name: 'Jenkins', level: 'intermediate', category: 'devops', years: Math.floor(profile.years * 0.6) },
        { name: 'Git', level: 'advanced', category: 'tool', years: profile.years },
        { name: 'Jira', level: 'expert', category: 'tool', years: profile.years },
        { name: 'TestNG', level: 'advanced', category: 'testing', years: Math.floor(profile.years * 0.8) },
        { name: 'Cucumber', level: 'intermediate', category: 'testing', years: Math.floor(profile.years * 0.4) }
      ],
      'DevOps e Infraestructura Cloud': [
        { name: 'AWS', level: 'expert', category: 'cloud', years: profile.years },
        { name: 'Kubernetes', level: 'expert', category: 'devops', years: Math.floor(profile.years * 0.8) },
        { name: 'Docker', level: 'expert', category: 'devops', years: profile.years },
        { name: 'Terraform', level: 'advanced', category: 'devops', years: Math.floor(profile.years * 0.7) },
        { name: 'Ansible', level: 'advanced', category: 'devops', years: Math.floor(profile.years * 0.6) },
        { name: 'Jenkins', level: 'advanced', category: 'devops', years: profile.years },
        { name: 'GitLab CI', level: 'advanced', category: 'devops', years: Math.floor(profile.years * 0.6) },
        { name: 'Prometheus', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.7) },
        { name: 'Grafana', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.7) },
        { name: 'Python', level: 'intermediate', category: 'language', years: Math.floor(profile.years * 0.8) },
        { name: 'Bash', level: 'advanced', category: 'language', years: profile.years },
        { name: 'Git', level: 'expert', category: 'tool', years: profile.years },
        { name: 'Linux', level: 'expert', category: 'other', years: profile.years },
        { name: 'Helm', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.6) }
      ],
      'Arquitectura de Software y Diseño de Sistemas': [
        { name: 'Java', level: 'expert', category: 'language', years: profile.years },
        { name: 'Python', level: 'advanced', category: 'language', years: Math.floor(profile.years * 0.7) },
        { name: 'AWS', level: 'expert', category: 'cloud', years: profile.years },
        { name: 'Microservices', level: 'expert', category: 'other', years: Math.floor(profile.years * 0.8) },
        { name: 'System Design', level: 'expert', category: 'other', years: profile.years },
        { name: 'Kubernetes', level: 'advanced', category: 'devops', years: Math.floor(profile.years * 0.7) },
        { name: 'Docker', level: 'advanced', category: 'devops', years: profile.years },
        { name: 'PostgreSQL', level: 'advanced', category: 'database', years: profile.years },
        { name: 'MongoDB', level: 'advanced', category: 'database', years: Math.floor(profile.years * 0.7) },
        { name: 'Redis', level: 'advanced', category: 'database', years: Math.floor(profile.years * 0.6) },
        { name: 'Kafka', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.6) },
        { name: 'GraphQL', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.5) },
        { name: 'REST APIs', level: 'expert', category: 'tool', years: profile.years },
        { name: 'Git', level: 'expert', category: 'tool', years: profile.years }
      ],
      'Desarrollo Móvil': [
        { name: 'React Native', level: 'expert', category: 'framework', years: profile.years },
        { name: 'Swift', level: 'advanced', category: 'language', years: Math.floor(profile.years * 0.8) },
        { name: 'Kotlin', level: 'advanced', category: 'language', years: Math.floor(profile.years * 0.7) },
        { name: 'JavaScript', level: 'expert', category: 'language', years: profile.years + 1 },
        { name: 'TypeScript', level: 'advanced', category: 'language', years: Math.floor(profile.years * 0.8) },
        { name: 'iOS Development', level: 'advanced', category: 'mobile', years: Math.floor(profile.years * 0.8) },
        { name: 'Android Development', level: 'advanced', category: 'mobile', years: Math.floor(profile.years * 0.7) },
        { name: 'Firebase', level: 'advanced', category: 'tool', years: Math.floor(profile.years * 0.7) },
        { name: 'REST APIs', level: 'advanced', category: 'tool', years: profile.years },
        { name: 'Redux', level: 'advanced', category: 'other', years: Math.floor(profile.years * 0.8) },
        { name: 'Jest', level: 'intermediate', category: 'testing', years: Math.floor(profile.years * 0.6) },
        { name: 'Git', level: 'advanced', category: 'tool', years: profile.years }
      ],
      'Ciencia de Datos y ML': [
        { name: 'Python', level: 'expert', category: 'language', years: profile.years },
        { name: 'TensorFlow', level: 'advanced', category: 'framework', years: Math.floor(profile.years * 0.7) },
        { name: 'PyTorch', level: 'advanced', category: 'framework', years: Math.floor(profile.years * 0.6) },
        { name: 'Scikit-learn', level: 'expert', category: 'other', years: Math.floor(profile.years * 0.8) },
        { name: 'Pandas', level: 'expert', category: 'other', years: profile.years },
        { name: 'NumPy', level: 'expert', category: 'other', years: profile.years },
        { name: 'SQL', level: 'expert', category: 'language', years: profile.years },
        { name: 'PostgreSQL', level: 'advanced', category: 'database', years: Math.floor(profile.years * 0.8) },
        { name: 'MongoDB', level: 'intermediate', category: 'database', years: Math.floor(profile.years * 0.5) },
        { name: 'Jupyter', level: 'expert', category: 'tool', years: profile.years },
        { name: 'R', level: 'intermediate', category: 'language', years: Math.floor(profile.years * 0.6) },
        { name: 'Git', level: 'advanced', category: 'tool', years: profile.years },
        { name: 'Docker', level: 'intermediate', category: 'devops', years: Math.floor(profile.years * 0.5) }
      ]
    };
    
    return skillsBySpecialty[profile.specialty] || skillsBySpecialty['Desarrollo Full Stack'];
  },
  
  // Generate soft skills
  generateSoftSkills(profile) {
    const allSoftSkills = [
      'Comunicación', 'Resolución de problemas', 'Trabajo en equipo', 'Liderazgo',
      'Gestión del tiempo', 'Adaptabilidad', 'Pensamiento crítico', 'Creatividad',
      'Atención al detalle', 'Colaboración', 'Mentoría', 'Metodologías ágiles',
      'Planificación de proyecto', 'Gestión de stakeholders', 'Pensamiento analítico'
    ];
    
    // Senior gets more leadership skills
    if (profile.level === 'senior') {
          return ['Liderazgo', 'Mentoría', 'Comunicación', 'Resolución de problemas',
            'Colaboración de equipo', 'Planificación de proyecto', 'Gestión del tiempo',
            'Pensamiento crítico', 'Gestión de stakeholders', 'Adaptabilidad'];
    }
    
    // Mid-level and junior
    return allSoftSkills.slice(0, 8);
  },
  
  // Generate certifications
  generateCertifications(profile) {
    const certsBySpecialty = {
      'Desarrollo Full Stack': [
        { name: 'AWS Certified Developer', issuer: 'AWS', date: '2022', expiryDate: '2025' },
        { name: 'MongoDB Certified Developer', issuer: 'MongoDB', date: '2021' },
        { name: 'Node.js Application Developer', issuer: 'OpenJS Foundation', date: '2023' }
      ],
      'Frontend y UX/UI': [
        { name: 'React Professional Certification', issuer: 'Meta', date: '2022' },
        { name: 'Web Accessibility Specialist', issuer: 'IAAP', date: '2023' },
        { name: 'UX Design Professional Certificate', issuer: 'IDF', date: '2021' }
      ],
      'Desarrollo Backend': [
        { name: 'Oracle Certified Professional Java SE 11', issuer: 'Oracle', date: '2021', expiryDate: '2026' },
        { name: 'Spring Professional Certification', issuer: 'VMware', date: '2022' },
        { name: 'AWS Certified Solutions Architect', issuer: 'AWS', date: '2023', expiryDate: '2026' }
      ],
      'Aseguramiento de Calidad y Automatización de Pruebas': [
        { name: 'ISTQB Certified Tester Foundation Level', issuer: 'ISTQB', date: '2020' },
        { name: 'ISTQB Advanced Level Test Analyst', issuer: 'ISTQB', date: '2021' },
        { name: 'Selenium WebDriver Certification', issuer: 'Udemy', date: '2020' }
      ],
      'DevOps e Infraestructura Cloud': [
        { name: 'AWS Certified Solutions Architect Professional', issuer: 'AWS', date: '2022', expiryDate: '2025' },
        { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2021', expiryDate: '2024' },
        { name: 'HashiCorp Certified Terraform Associate', issuer: 'HashiCorp', date: '2022' }
      ],
      'Arquitectura de Software y Diseño de Sistemas': [
        { name: 'AWS Certified Solutions Architect Professional', issuer: 'AWS', date: '2021', expiryDate: '2024' },
        { name: 'TOGAF 9 Certified', issuer: 'The Open Group', date: '2022' },
        { name: 'Google Cloud Professional Architect', issuer: 'Google', date: '2023' }
      ],
      'Desarrollo Móvil': [
        { name: 'iOS App Development Certification', issuer: 'Apple', date: '2022' },
        { name: 'Android Associate Developer', issuer: 'Google', date: '2021' },
        { name: 'React Native Certification', issuer: 'Meta', date: '2023' }
      ],
      'Ciencia de Datos y ML': [
        { name: 'TensorFlow Developer Certificate', issuer: 'Google', date: '2022' },
        { name: 'AWS Certified Machine Learning', issuer: 'AWS', date: '2023' },
        { name: 'Data Science Professional Certificate', issuer: 'IBM', date: '2021' }
      ]
    };
    
    return (certsBySpecialty[profile.specialty] || certsBySpecialty['Desarrollo Full Stack']).slice(0, profile.level === 'senior' ? 4 : 2);
  },
  
  // Generate projects
  generateProjects(profile) {
    const projectTypes = {
      'Desarrollo Full Stack': 'Plataforma de e-commerce',
      'Frontend y UX/UI': 'Librería de Design System',
      'Desarrollo Backend': 'Backend de microservicios',
      'Aseguramiento de Calidad y Automatización de Pruebas': 'Framework de automatización de pruebas',
      'DevOps e Infraestructura Cloud': 'Plataforma de infraestructura cloud',
      'Arquitectura de Software y Diseño de Sistemas': 'Arquitectura enterprise',
      'Desarrollo Móvil': 'Aplicación móvil',
      'Ciencia de Datos y ML': 'Pipeline de machine learning'
    };
    
    return [
      {
        name: projectTypes[profile.specialty] || 'Proyecto de software',
        description: `Proyecto completo que demuestra experiencia en ${profile.specialty.toLowerCase()}`,
        role: profile.level === 'senior' ? 'Líder técnico' : 'Desarrollador',
        technologies: profile.mainTech,
        startDate: '2022',
        endDate: '2023',
        highlights: [
          'Entregado a tiempo y dentro de presupuesto',
          'Mejoró significativamente el rendimiento',
          'Recibió feedback positivo de usuarios'
        ]
      }
    ];
  },
  
  // Generate languages
  generateLanguages(profile) {
    const nativeLanguages = {
      'Spain': 'Español',
      'Mexico': 'Español',
      'Argentina': 'Español',
      'United States': 'Inglés',
      'Canada': 'Inglés',
      'United Kingdom': 'Inglés',
      'Japan': 'Japonés',
      'China': 'Mandarín',
      'India': 'Hindi',
      'Brazil': 'Portugués',
      'France': 'Francés'
    };
    
    const languages = [
      { language: nativeLanguages[profile.country] || 'Inglés', level: 'native' },
      { language: 'Inglés', level: profile.country === 'United States' || profile.country === 'United Kingdom' || profile.country === 'Canada' ? 'native' : 'C1' }
    ];
    
    // Add third language for some profiles
    if (profile.level === 'senior' || profile.years >= 6) {
      const thirdLang = { language: 'Español', level: 'B1' };
      if (!languages.find(l => l.language === 'Español')) {
        languages.push(thirdLang);
      }
    }
    
    return languages;
  }
};

// Main seed function
const seedCVs = async (users, organizations) => {
  console.log('\n📄 Creating auto-generated comprehensive currículos for ALL employees...');
  
  const CV = require('../../src/models/cv.model');
  const cvs = [];
  
  for (const [key, profile] of Object.entries(COMPLETE_EMPLOYEE_DATA)) {
    const user = users.find(u => u.email === profile.email);
    if (!user) {
      console.log(`⚠️  User not found: ${profile.email}`);
      continue;
    }
    
    const cv = {
      userId: user._id,
      organization: organizations[profile.orgIndex]._id,
      organizationStatus: profile.orgStatus || 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - (60 - (Object.keys(COMPLETE_EMPLOYEE_DATA).indexOf(key) * 5)) * 24 * 60 * 60 * 1000),
      contact: {
        email: profile.email,
        phones: [
          { number: `+${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}`, type: 'mobile' },
          { number: `+${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)}`, type: 'work' }
        ],
        links: {
          linkedin: `https://linkedin.com/in/${profile.name.toLowerCase().replace(/\s+/g, '')}`,
          github: `https://github.com/${profile.name.split(' ')[0].toLowerCase()}`,
          portfolio: `https://${profile.name.split(' ')[0].toLowerCase()}.dev`
        },
        location: {
          city: profile.city,
          country: profile.country,
          postalCode: String(Math.floor(Math.random() * 90000 + 10000)),
          address: `${Math.floor(Math.random() * 999 + 1)} Calle Principal`
        }
      },
      education: generators.generateEducation(profile),
      experience: generators.generateExperience(profile),
      skills: {
        technical: generators.generateTechnicalSkills(profile),
        soft: generators.generateSoftSkills(profile)
      },
      languages: generators.generateLanguages(profile),
      certifications: generators.generateCertifications(profile),
      projects: generators.generateProjects(profile),
      volunteerWork: profile.level === 'senior' || profile.years >= 5 ? [
        {
          organization: 'Comunidad tecnológica',
          role: 'Mentor',
          description: 'Mentorización de desarrolladores junior',
          startDate: '2022',
          current: true
        }
      ] : [],
      awards: profile.level === 'senior' ? [
        {
          title: 'Premio a la Excelencia',
          issuer: 'Empresa',
          date: '2023',
          description: 'Reconocimiento por un rendimiento destacado'
        }
      ] : [],
      summary: `${profile.level === 'senior' ? 'Senior' : profile.level === 'mid' ? 'Intermedio' : 'Junior'} ${profile.position} con ${profile.years}+ años de experiencia en ${profile.specialty.toLowerCase()}. Especializado en ${profile.mainTech.join(', ')}. Con experiencia demostrable entregando soluciones de alta calidad y colaborando eficazmente con equipos multifuncionales. Apasionado por el aprendizaje continuo y las buenas prácticas.`,
      interests: ['Tecnología', 'Innovación', 'Open Source', 'Aprendizaje', 'Resolución de problemas'],
      hobbies: ['Lectura', 'Programación', 'Música', 'Viajes'],
      availability: {
        noticePeriod: profile.level === 'senior' ? '1 mes' : '2 semanas',
        availableFrom: new Date(Date.now() + (profile.level === 'senior' ? 30 : 14) * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'sí'
      },
      completenessScore: profile.completenessScore,
      isComplete: true,
      lastProcessedAt: new Date()
    };
    
    cvs.push(cv);
    console.log(`  ✓ Generated complete currículo for ${profile.name} (${profile.position})`);
  }
  
  const createdCVs = await CV.insertMany(cvs);
  console.log(`\n✅ Created ${createdCVs.length} auto-generated comprehensive currículos with complete data`);
  console.log(`   Average completeness score: ${Math.round(cvs.reduce((sum, cv) => sum + cv.completenessScore, 0) / cvs.length)}%`);
  
  return createdCVs;
};

module.exports = { seedCVs };
