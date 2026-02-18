// Comprehensive Seed Currículos with Complete Data for ALL Employees
const seedCVs = async (users, organizations) => {
  console.log('\n📄 Creating comprehensive currículos with complete data for ALL employees...');
  
  const CV = require('../../src/models/cv.model');
  
  const cvs = [
    // Carlos - Senior Full Stack Developer
    {
      userId: users.find(u => u.email === 'carlos.dev@example.com')._id,
      organization: organizations[0]._id,
      organizationStatus: 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      contact: {
        email: 'carlos.dev@example.com',
        phones: [{ number: '+34 666 123 456', type: 'mobile' }],
        links: {
          linkedin: 'https://linkedin.com/in/carlosrodriguez',
          github: 'https://github.com/carlosdev',
          portfolio: 'https://carlosrodriguez.dev'
        },
        location: { city: 'Madrid', country: 'Spain' }
      },
      education: [
        {
          institution: 'Universidad Politécnica de Madrid',
          degree: 'Computer Science Degree',
          fieldOfStudy: 'Software Engineering',
          startDate: '2015',
          endDate: '2019',
          current: false,
          achievements: ['Graduated with honors', 'Dean\'s list 2018-2019']
        },
        {
          institution: 'Platzi',
          degree: 'Full Stack JavaScript Career',
          fieldOfStudy: 'Web Development',
          startDate: '2019',
          endDate: '2020',
          current: false
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Senior Full Stack Developer',
          startDate: '2021',
          endDate: '',
          current: true,
          description: 'Leading development of enterprise web applications',
          responsibilities: [
            'Architecting scalable Node.js backend services',
            'Leading team of 5 developers',
            'Implementing CI/CD pipelines',
            'Code review and mentoring junior developers'
          ],
          technologies: ['Node.js', 'React', 'MongoDB', 'Docker', 'AWS']
        },
        {
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          startDate: '2019',
          endDate: '2021',
          current: false,
          description: 'Developed and maintained multiple web applications',
          responsibilities: [
            'Built RESTful APIs with Express.js',
            'Created responsive frontends with React',
            'Managed PostgreSQL databases',
            'Implemented authentication systems'
          ],
          technologies: ['JavaScript', 'React', 'Express', 'PostgreSQL', 'Git']
        }
      ],
      skills: {
        technical: [
          { name: 'JavaScript', level: 'expert', category: 'language' },
          { name: 'TypeScript', level: 'advanced', category: 'language' },
          { name: 'Node.js', level: 'expert', category: 'runtime' },
          { name: 'React', level: 'advanced', category: 'framework' },
          { name: 'Express.js', level: 'expert', category: 'framework' },
          { name: 'MongoDB', level: 'advanced', category: 'database' },
          { name: 'PostgreSQL', level: 'advanced', category: 'database' },
          { name: 'Docker', level: 'intermediate', category: 'devops' },
          { name: 'AWS', level: 'intermediate', category: 'cloud' },
          { name: 'Git', level: 'expert', category: 'tool' }
        ],
        soft: ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Mentoring']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'C1' },
        { language: 'Portuguese', level: 'B1' }
      ],
      certifications: [
        {
          name: 'AWS Certified Developer Associate',
          issuer: 'Amazon Web Services',
          date: '2022',
          expiryDate: '2025'
        },
        {
          name: 'MongoDB Certified Developer',
          issuer: 'MongoDB University',
          date: '2021'
        }
      ],
      projects: [
        {
          name: 'E-commerce Platform Modernization',
          description: 'Led migration from monolith to microservices',
          technologies: ['Node.js', 'React', 'Docker', 'Kubernetes', 'MongoDB'],
          url: 'https://github.com/carlosdev/ecommerce-platform'
        }
      ],
      completenessScore: 95,
      isComplete: true,
      lastProcessedAt: new Date()
    },
    // Ana - Frontend Developer
    {
      userId: users.find(u => u.email === 'ana.frontend@example.com')._id,
      organization: organizations[0]._id,
      organizationStatus: 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      contact: {
        email: 'ana.frontend@example.com',
        phones: [{ number: '+34 677 234 567', type: 'mobile' }],
        links: {
          linkedin: 'https://linkedin.com/in/anamartinez',
          github: 'https://github.com/anafrontend',
          portfolio: 'https://anamartinez.design'
        },
        location: { city: 'Madrid', country: 'Spain' }
      },
      education: [
        {
          institution: 'Universidad Complutense de Madrid',
          degree: 'Design and Interactive Media Degree',
          fieldOfStudy: 'UX/UI Design',
          startDate: '2016',
          endDate: '2020',
          current: false
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Frontend Developer',
          startDate: '2020',
          endDate: '',
          current: true,
          description: 'Creating beautiful and functional user interfaces',
          responsibilities: [
            'Developing responsive web applications',
            'Implementing design systems',
            'Optimizing performance',
            'Collaborating with UX designers'
          ],
          technologies: ['React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Figma']
        }
      ],
      skills: {
        technical: [
          { name: 'React', level: 'expert', category: 'framework' },
          { name: 'Vue.js', level: 'advanced', category: 'framework' },
          { name: 'TypeScript', level: 'advanced', category: 'language' },
          { name: 'HTML', level: 'expert', category: 'language' },
          { name: 'CSS', level: 'expert', category: 'language' },
          { name: 'Tailwind CSS', level: 'advanced', category: 'framework' },
          { name: 'Figma', level: 'advanced', category: 'tool' },
          { name: 'Webpack', level: 'intermediate', category: 'tool' },
          { name: 'Jest', level: 'intermediate', category: 'testing' }
        ],
        soft: ['Creativity', 'Attention to Detail', 'Communication', 'Problem Solving']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'B2' }
      ],
      certifications: [
        {
          name: 'React Professional Certification',
          issuer: 'Meta',
          date: '2022'
        }
      ],
      completenessScore: 88,
      isComplete: true,
      lastProcessedAt: new Date()
    },
    // David - Backend Developer
    {
      userId: users.find(u => u.email === 'david.backend@example.com')._id,
      organization: organizations[0]._id,
      organizationStatus: 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      contact: {
        email: 'david.backend@example.com',
        phones: [{ number: '+52 55 1234 5678', type: 'mobile' }],
        links: {
          linkedin: 'https://linkedin.com/in/davidlopez',
          github: 'https://github.com/davidbackend'
        },
        location: { city: 'Mexico City', country: 'Mexico' }
      },
      education: [
        {
          institution: 'Instituto Tecnológico de México',
          degree: 'Systems Engineering',
          fieldOfStudy: 'Software Development',
          startDate: '2014',
          endDate: '2018',
          current: false
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Backend Developer',
          startDate: '2019',
          endDate: '',
          current: true,
          description: 'Building robust and scalable backend systems',
          responsibilities: [
            'Designing RESTful APIs',
            'Database optimization',
            'Implementing authentication and authorization',
            'Microservices architecture'
          ],
          technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka']
        }
      ],
      skills: {
        technical: [
          { name: 'Java', level: 'expert', category: 'language' },
          { name: 'Spring Boot', level: 'expert', category: 'framework' },
          { name: 'PostgreSQL', level: 'advanced', category: 'database' },
          { name: 'MySQL', level: 'advanced', category: 'database' },
          { name: 'Redis', level: 'intermediate', category: 'database' },
          { name: 'Kafka', level: 'intermediate', category: 'tool' },
          { name: 'Docker', level: 'intermediate', category: 'devops' },
          { name: 'Kubernetes', level: 'basic', category: 'devops' }
        ],
        soft: ['Analytical Thinking', 'Problem Solving', 'Team Work', 'Reliability']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'C1' }
      ],
      certifications: [
        {
          name: 'Oracle Certified Professional Java SE 11 Developer',
          issuer: 'Oracle',
          date: '2021'
        }
      ],
      completenessScore: 90,
      isComplete: true,
      lastProcessedAt: new Date()
    },
    // Laura - QA Engineer
    {
      userId: users.find(u => u.email === 'laura.qa@example.com')._id,
      organization: organizations[0]._id,
      organizationStatus: 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      contact: {
        email: 'laura.qa@example.com',
        phones: [{ number: '+54 11 2345 6789', type: 'mobile' }],
        links: {
          linkedin: 'https://linkedin.com/in/lauragonzalez',
          github: 'https://github.com/lauraqa'
        },
        location: { city: 'Buenos Aires', country: 'Argentina' }
      },
      education: [
        {
          institution: 'Universidad de Buenos Aires',
          degree: 'Computer Engineering',
          fieldOfStudy: 'Software Quality',
          startDate: '2015',
          endDate: '2020',
          current: false
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'QA Engineer',
          startDate: '2020',
          endDate: '',
          current: true,
          description: 'Ensuring software quality through comprehensive testing',
          responsibilities: [
            'Automated test development',
            'Manual testing',
            'Performance testing',
            'Test strategy planning'
          ],
          technologies: ['Selenium', 'Cypress', 'JMeter', 'Postman', 'Jenkins']
        }
      ],
      skills: {
        technical: [
          { name: 'Selenium', level: 'expert', category: 'testing' },
          { name: 'Cypress', level: 'advanced', category: 'testing' },
          { name: 'JMeter', level: 'intermediate', category: 'testing' },
          { name: 'Postman', level: 'advanced', category: 'tool' },
          { name: 'Jenkins', level: 'intermediate', category: 'devops' },
          { name: 'JavaScript', level: 'intermediate', category: 'language' },
          { name: 'Python', level: 'intermediate', category: 'language' }
        ],
        soft: ['Attention to Detail', 'Analytical Skills', 'Communication', 'Patience']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'B2' }
      ],
      certifications: [
        {
          name: 'ISTQB Certified Tester',
          issuer: 'ISTQB',
          date: '2021'
        }
      ],
      completenessScore: 85,
      isComplete: true,
      lastProcessedAt: new Date()
    },
    // Sarah - DevOps Engineer
    {
      userId: users.find(u => u.email === 'sarah.devops@example.com')._id,
      organization: organizations[1]._id,
      organizationStatus: 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      contact: {
        email: 'michael.arch@example.com',
        phones: [{ number: '+1 416 555 0456', type: 'mobile' }, { number: '+1 416 555 0789', type: 'work' }],
        links: {
          linkedin: 'https://linkedin.com/in/michaelbrown',
          github: 'https://github.com/michaelarch',
          portfolio: 'https://michaelbrown.tech'
        },
        location: { city: 'Toronto', country: 'Canada' }
      },
      education: [
        {
          institution: 'Stanford University',
          degree: 'Computer Science BS',
          fieldOfStudy: 'Cloud Computing',
          startDate: '2014',
          endDate: '2018',
          current: false
        }
      ],
      experience: [
        {
          company: 'Global Solutions Inc',
          position: 'DevOps Engineer',
          startDate: '2018',
          endDate: '',
          current: true,
          description: 'Building and maintaining CI/CD infrastructure',
          responsibilities: [
            'Managing Kubernetes clusters',
            'Implementing infrastructure as code',
            'Monitoring and incident response',
            'Security and compliance'
          ],
          technologies: ['AWS', 'Kubernetes', 'Terraform', 'Jenkins', 'Prometheus', 'Grafana']
        }
      ],
      skills: {
        technical: [
          { name: 'AWS', level: 'expert', category: 'cloud' },
          { name: 'Kubernetes', level: 'expert', category: 'devops' },
          { name: 'Docker', level: 'expert', category: 'devops' },
          { name: 'Terraform', level: 'advanced', category: 'devops' },
          { name: 'Jenkins', level: 'advanced', category: 'devops' },
          { name: 'Prometheus', level: 'advanced', category: 'tool' },
          { name: 'Grafana', level: 'advanced', category: 'tool' },
          { name: 'Python', level: 'intermediate', category: 'language' },
          { name: 'Bash', level: 'advanced', category: 'language' }
        ],
        soft: ['Problem Solving', 'Reliability', 'Communication', 'Automation Mindset']
      },
      languages: [
        { language: 'English', level: 'native' }
      ],
      certifications: [
        {
          name: 'AWS Certified Solutions Architect Professional',
          issuer: 'Amazon Web Services',
          date: '2022',
          expiryDate: '2025'
        },
        {
          name: 'Certified Kubernetes Administrator',
          issuer: 'CNCF',
          date: '2021',
          expiryDate: '2024'
        }
      ],
      completenessScore: 92,
      isComplete: true,
      lastProcessedAt: new Date()
    },
    // Pending users with currículos waiting review
    {
      userId: users.find(u => u.email === 'pending.user1@example.com')._id,
      organization: organizations[0]._id,
      organizationStatus: 'pending',
      submittedToOrganizationAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      contact: {
        email: 'pending.user1@example.com',
        phones: [{ number: '+55 11 98765 4321', type: 'mobile' }],
        links: {
          linkedin: 'https://linkedin.com/in/robertosilva',
          github: 'https://github.com/rsilva'
        },
        location: { city: 'São Paulo', country: 'Brazil' }
      },
      education: [
        {
          institution: 'Universidade de São Paulo',
          degree: 'Computer Science',
          fieldOfStudy: 'Software Engineering',
          startDate: '2016',
          endDate: '2020',
          current: false
        }
      ],
      experience: [
        {
          company: 'BrazilTech',
          position: 'Full Stack Developer',
          startDate: '2020',
          endDate: '2024',
          current: false,
          description: 'Developed web applications',
          responsibilities: ['Backend development', 'Frontend development'],
          technologies: ['Python', 'Django', 'React', 'PostgreSQL']
        }
      ],
      skills: {
        technical: [
          { name: 'Python', level: 'advanced', category: 'language' },
          { name: 'Django', level: 'advanced', category: 'framework' },
          { name: 'React', level: 'intermediate', category: 'framework' },
          { name: 'PostgreSQL', level: 'intermediate', category: 'database' }
        ],
        soft: ['Team Work', 'Communication']
      },
      languages: [
        { language: 'Portuguese', level: 'native' },
        { language: 'English', level: 'B2' },
        { language: 'Spanish', level: 'B1' }
      ],
      completenessScore: 75,
      isComplete: true,
      lastProcessedAt: new Date()
    }
  ];
  
  const createdCVs = await CV.insertMany(cvs);
  console.log(`✅ Created ${createdCVs.length} currículos`);
  return createdCVs;
};

module.exports = { seedCVs };
