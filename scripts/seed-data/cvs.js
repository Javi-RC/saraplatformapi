// ============================================================================
// COMPREHENSIVE SEED CVs - AUTO-GENERATED COMPLETE DATA FOR ALL EMPLOYEES
// ============================================================================
// This module automatically generates complete, realistic CV data for all employees
// Each CV includes: education, experience, skills, certifications, projects, etc.
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
        degree: 'Master of Science',
        fieldOfStudy: profile.specialty,
        startDate: String(2022 - profile.years + 4),
        endDate: String(2022 - profile.years + 6),
        current: false,
        grade: `${(8.5 + Math.random() * 1.3).toFixed(1)}/10`,
        achievements: [
          'Graduated with honors',
          'Research publication',
          'Best thesis award'
        ]
      });
    }
    
    // Bachelor's degree
    education.push({
      institution: uni,
      degree: profile.level === 'senior' ? 'Computer Science Degree' : 'Bachelor of Computer Science',
      fieldOfStudy: 'Computer Science',
      startDate: String(2022 - profile.years),
      endDate: String(2022 - profile.years + 4),
      current: false,
      grade: `${(8.0 + Math.random() * 1.5).toFixed(1)}/10`,
      achievements: [
        'Dean\'s list',
        'Best student project',
        'Academic excellence award'
      ]
    });
    
    // Additional certifications/courses
    education.push({
      institution: 'Online Learning Platform',
      degree: `Professional Certificate in ${profile.specialty}`,
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
      description: `Leading ${profile.specialty.toLowerCase()} initiatives and delivering high-impact projects for enterprise clients.`,
      responsibilities: [
        `Developing and maintaining ${profile.mainTech[0]} applications`,
        `Collaborating with cross-functional teams`,
        `Code review and mentoring junior developers`,
        `Implementing best practices and design patterns`,
        `Participating in architecture and design decisions`,
        `Performance optimization and bug fixing`,
        `Writing comprehensive technical documentation`,
        `Leading sprint planning and retrospectives`
      ],
      technologies: [...profile.mainTech, 'Git', 'Docker', 'CI/CD', 'Agile', 'Scrum'],
      achievements: [
        'Improved system performance by 40%',
        'Led successful migration project',
        'Mentored 3+ junior developers',
        'Delivered 5+ major features on time'
      ]
    });
    
    // Previous position(s)
    if (profile.years >= 3) {
      experience.push({
        company: 'Previous Tech Company',
        position: profile.level === 'senior' ? profile.position.replace('Senior ', '') : 'Junior ' + profile.position,
        startDate: String(startYear),
        endDate: String(startYear + Math.floor(profile.years * 0.5)),
        current: false,
        description: `Developed software solutions using ${profile.mainTech[0]} and related technologies.`,
        responsibilities: [
          'Built and maintained software applications',
          'Collaborated with team members',
          'Participated in code reviews',
          'Fixed bugs and optimized performance',
          'Wrote unit and integration tests'
        ],
        technologies: profile.mainTech,
        achievements: [
          'Delivered multiple successful projects',
          'Improved code quality through refactoring'
        ]
      });
    }
    
    // Internship for those with 5+ years
    if (profile.years >= 5 && profile.level !== 'junior') {
      experience.push({
        company: 'Tech Startup',
        position: 'Software Developer Intern',
        startDate: String(startYear - 1),
        endDate: String(startYear),
        current: false,
        description: 'Internship focusing on software development and learning industry best practices.',
        responsibilities: [
          'Assisted in developing features',
          'Participated in team meetings',
          'Learned company codebase and practices'
        ],
        technologies: profile.mainTech.slice(0, 2)
      });
    }
    
    return experience;
  },
  
  // Generate technical skills with realistic levels
  generateTechnicalSkills(profile) {
    const skillsBySpecialty = {
      'Full Stack Development': [
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
      'Frontend & UX/UI': [
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
      'Backend Development': [
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
      'Quality Assurance & Test Automation': [
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
      'DevOps & Cloud Infrastructure': [
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
      'Software Architecture & System Design': [
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
      'Mobile Development': [
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
      'Data Science & ML': [
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
    
    return skillsBySpecialty[profile.specialty] || skillsBySpecialty['Full Stack Development'];
  },
  
  // Generate soft skills
  generateSoftSkills(profile) {
    const allSoftSkills = [
      'Communication', 'Problem Solving', 'Teamwork', 'Leadership', 
      'Time Management', 'Adaptability', 'Critical Thinking', 'Creativity',
      'Attention to Detail', 'Collaboration', 'Mentoring', 'Agile Methodologies',
      'Project Planning', 'Stakeholder Management', 'Analytical Thinking'
    ];
    
    // Senior gets more leadership skills
    if (profile.level === 'senior') {
      return ['Leadership', 'Mentoring', 'Communication', 'Problem Solving', 
              'Team Collaboration', 'Project Planning', 'Time Management', 
              'Critical Thinking', 'Stakeholder Management', 'Adaptability'];
    }
    
    // Mid-level and junior
    return allSoftSkills.slice(0, 8);
  },
  
  // Generate certifications
  generateCertifications(profile) {
    const certsBySpecialty = {
      'Full Stack Development': [
        { name: 'AWS Certified Developer', issuer: 'AWS', date: '2022', expiryDate: '2025' },
        { name: 'MongoDB Certified Developer', issuer: 'MongoDB', date: '2021' },
        { name: 'Node.js Application Developer', issuer: 'OpenJS Foundation', date: '2023' }
      ],
      'Frontend & UX/UI': [
        { name: 'React Professional Certification', issuer: 'Meta', date: '2022' },
        { name: 'Web Accessibility Specialist', issuer: 'IAAP', date: '2023' },
        { name: 'UX Design Professional Certificate', issuer: 'IDF', date: '2021' }
      ],
      'Backend Development': [
        { name: 'Oracle Certified Professional Java SE 11', issuer: 'Oracle', date: '2021', expiryDate: '2026' },
        { name: 'Spring Professional Certification', issuer: 'VMware', date: '2022' },
        { name: 'AWS Certified Solutions Architect', issuer: 'AWS', date: '2023', expiryDate: '2026' }
      ],
      'Quality Assurance & Test Automation': [
        { name: 'ISTQB Certified Tester Foundation Level', issuer: 'ISTQB', date: '2020' },
        { name: 'ISTQB Advanced Level Test Analyst', issuer: 'ISTQB', date: '2021' },
        { name: 'Selenium WebDriver Certification', issuer: 'Udemy', date: '2020' }
      ],
      'DevOps & Cloud Infrastructure': [
        { name: 'AWS Certified Solutions Architect Professional', issuer: 'AWS', date: '2022', expiryDate: '2025' },
        { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2021', expiryDate: '2024' },
        { name: 'HashiCorp Certified Terraform Associate', issuer: 'HashiCorp', date: '2022' }
      ],
      'Software Architecture & System Design': [
        { name: 'AWS Certified Solutions Architect Professional', issuer: 'AWS', date: '2021', expiryDate: '2024' },
        { name: 'TOGAF 9 Certified', issuer: 'The Open Group', date: '2022' },
        { name: 'Google Cloud Professional Architect', issuer: 'Google', date: '2023' }
      ],
      'Mobile Development': [
        { name: 'iOS App Development Certification', issuer: 'Apple', date: '2022' },
        { name: 'Android Associate Developer', issuer: 'Google', date: '2021' },
        { name: 'React Native Certification', issuer: 'Meta', date: '2023' }
      ],
      'Data Science & ML': [
        { name: 'TensorFlow Developer Certificate', issuer: 'Google', date: '2022' },
        { name: 'AWS Certified Machine Learning', issuer: 'AWS', date: '2023' },
        { name: 'Data Science Professional Certificate', issuer: 'IBM', date: '2021' }
      ]
    };
    
    return (certsBySpecialty[profile.specialty] || certsBySpecialty['Full Stack Development']).slice(0, profile.level === 'senior' ? 4 : 2);
  },
  
  // Generate projects
  generateProjects(profile) {
    const projectTypes = {
      'Full Stack Development': 'E-commerce Platform',
      'Frontend & UX/UI': 'Design System Library',
      'Backend Development': 'Microservices Backend',
      'Quality Assurance & Test Automation': 'Test Automation Framework',
      'DevOps & Cloud Infrastructure': 'Cloud Infrastructure Platform',
      'Software Architecture & System Design': 'Enterprise Architecture',
      'Mobile Development': 'Mobile App',
      'Data Science & ML': 'Machine Learning Pipeline'
    };
    
    return [
      {
        name: projectTypes[profile.specialty] || 'Software Project',
        description: `Comprehensive project showcasing ${profile.specialty.toLowerCase()} expertise`,
        role: profile.level === 'senior' ? 'Tech Lead' : 'Developer',
        technologies: profile.mainTech,
        startDate: '2022',
        endDate: '2023',
        highlights: [
          'Delivered on time and within budget',
          'Improved performance significantly',
          'Received positive user feedback'
        ]
      }
    ];
  },
  
  // Generate languages
  generateLanguages(profile) {
    const nativeLanguages = {
      'Spain': 'Spanish',
      'Mexico': 'Spanish',
      'Argentina': 'Spanish',
      'United States': 'English',
      'Canada': 'English',
      'United Kingdom': 'English',
      'Japan': 'Japanese',
      'China': 'Mandarin',
      'India': 'Hindi',
      'Brazil': 'Portuguese',
      'France': 'French'
    };
    
    const languages = [
      { language: nativeLanguages[profile.country] || 'English', level: 'native' },
      { language: 'English', level: profile.country === 'United States' || profile.country === 'United Kingdom' || profile.country === 'Canada' ? 'native' : 'C1' }
    ];
    
    // Add third language for some profiles
    if (profile.level === 'senior' || profile.years >= 6) {
      const thirdLang = { language: 'Spanish', level: 'B1' };
      if (!languages.find(l => l.language === 'Spanish')) {
        languages.push(thirdLang);
      }
    }
    
    return languages;
  }
};

// Main seed function
const seedCVs = async (users, organizations) => {
  console.log('\n📄 Creating auto-generated comprehensive CVs for ALL employees...');
  
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
          address: `${Math.floor(Math.random() * 999 + 1)} Main Street`
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
          organization: 'Tech Community',
          role: 'Mentor',
          description: 'Mentoring junior developers',
          startDate: '2022',
          current: true
        }
      ] : [],
      awards: profile.level === 'senior' ? [
        {
          title: 'Excellence Award',
          issuer: 'Company',
          date: '2023',
          description: 'Recognition for outstanding performance'
        }
      ] : [],
      summary: `${profile.level === 'senior' ? 'Senior' : profile.level === 'mid' ? 'Mid-level' : 'Junior'} ${profile.position} with ${profile.years}+ years of experience in ${profile.specialty.toLowerCase()}. Specialized in ${profile.mainTech.join(', ')}. Proven track record of delivering high-quality solutions and collaborating effectively with cross-functional teams. Passionate about continuous learning and best practices.`,
      interests: ['Technology', 'Innovation', 'Open Source', 'Learning', 'Problem Solving'],
      hobbies: ['Reading', 'Coding', 'Music', 'Travel'],
      availability: {
        noticePeriod: profile.level === 'senior' ? '1 month' : '2 weeks',
        availableFrom: new Date(Date.now() + (profile.level === 'senior' ? 30 : 14) * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes'
      },
      completenessScore: profile.completenessScore,
      isComplete: true,
      lastProcessedAt: new Date()
    };
    
    cvs.push(cv);
    console.log(`  ✓ Generated complete CV for ${profile.name} (${profile.position})`);
  }
  
  const createdCVs = await CV.insertMany(cvs);
  console.log(`\n✅ Created ${createdCVs.length} auto-generated comprehensive CVs with complete data`);
  console.log(`   Average completeness score: ${Math.round(cvs.reduce((sum, cv) => sum + cv.completenessScore, 0) / cvs.length)}%`);
  
  return createdCVs;
};

module.exports = { seedCVs };
