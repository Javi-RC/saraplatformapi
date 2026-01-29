// Comprehensive Seed CVs with Complete Data
const seedCVs = async (users, organizations) => {
  console.log('\n📄 Creating comprehensive CVs with complete data...');
  
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
        phones: [
          { number: '+34 666 123 456', type: 'mobile' },
          { number: '+34 912 345 678', type: 'work' }
        ],
        links: {
          linkedin: 'https://linkedin.com/in/carlosrodriguez',
          github: 'https://github.com/carlosdev',
          portfolio: 'https://carlosrodriguez.dev',
          twitter: 'https://twitter.com/carlosdev'
        },
        location: { 
          city: 'Madrid', 
          country: 'Spain',
          postalCode: '28013',
          address: 'Calle de Alcalá 45'
        }
      },
      education: [
        {
          institution: 'Universidad Politécnica de Madrid',
          degree: 'Master in Software Engineering',
          fieldOfStudy: 'Advanced Software Development',
          startDate: '2019',
          endDate: '2021',
          current: false,
          grade: '9.2/10',
          achievements: ['Best Master Thesis Award 2021', 'Research Publication in IEEE']
        },
        {
          institution: 'Universidad Politécnica de Madrid',
          degree: 'Computer Science Degree',
          fieldOfStudy: 'Software Engineering',
          startDate: '2015',
          endDate: '2019',
          current: false,
          grade: '8.7/10',
          achievements: ['Graduated with honors', 'Dean\'s list 2018-2019', 'Best Student Project 2018']
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
          description: 'Leading development of enterprise web applications using modern tech stack. Managing a team of 5 developers and overseeing architecture decisions.',
          responsibilities: [
            'Architecting scalable Node.js backend services with microservices pattern',
            'Leading team of 5 developers with daily standups and sprint planning',
            'Implementing CI/CD pipelines using GitHub Actions and Docker',
            'Code review and mentoring junior developers on best practices',
            'Performance optimization achieving 40% reduction in API response times',
            'Database design and optimization with MongoDB and PostgreSQL',
            'Security audits and implementation of OWASP best practices'
          ],
          technologies: ['Node.js', 'React', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Redis', 'GraphQL'],
          achievements: [
            'Reduced API response time by 40%',
            'Led migration to microservices architecture',
            'Implemented automated testing increasing coverage to 85%'
          ]
        },
        {
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          startDate: '2019',
          endDate: '2021',
          current: false,
          description: 'Developed and maintained multiple web applications for e-commerce and SaaS platforms',
          responsibilities: [
            'Built RESTful APIs with Express.js handling 10k+ daily requests',
            'Created responsive frontends with React and Redux',
            'Managed PostgreSQL databases with complex queries and optimization',
            'Implemented JWT-based authentication and OAuth2 integration',
            'Collaborated with UX/UI designers using Figma and Sketch',
            'Participated in Agile ceremonies and sprint planning'
          ],
          technologies: ['JavaScript', 'React', 'Express', 'PostgreSQL', 'Git', 'Jenkins', 'Heroku'],
          achievements: [
            'Developed 3 major features adopted by 50k+ users',
            'Reduced deployment time by 60% with CI/CD automation'
          ]
        },
        {
          company: 'Freelance',
          position: 'Web Developer',
          startDate: '2017',
          endDate: '2019',
          current: false,
          description: 'Freelance web development for small businesses and startups',
          responsibilities: [
            'Built custom WordPress themes and plugins',
            'Created landing pages and corporate websites',
            'Provided maintenance and support services'
          ],
          technologies: ['HTML', 'CSS', 'JavaScript', 'WordPress', 'PHP', 'MySQL']
        }
      ],
      skills: {
        technical: [
          { name: 'JavaScript', level: 'expert', category: 'language', yearsOfExperience: 8 },
          { name: 'TypeScript', level: 'advanced', category: 'language', yearsOfExperience: 5 },
          { name: 'Python', level: 'intermediate', category: 'language', yearsOfExperience: 3 },
          { name: 'Node.js', level: 'expert', category: 'runtime', yearsOfExperience: 6 },
          { name: 'React', level: 'advanced', category: 'framework', yearsOfExperience: 6 },
          { name: 'Express.js', level: 'expert', category: 'framework', yearsOfExperience: 6 },
          { name: 'NestJS', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
          { name: 'MongoDB', level: 'advanced', category: 'database', yearsOfExperience: 5 },
          { name: 'PostgreSQL', level: 'advanced', category: 'database', yearsOfExperience: 5 },
          { name: 'Redis', level: 'intermediate', category: 'database', yearsOfExperience: 3 },
          { name: 'Docker', level: 'intermediate', category: 'devops', yearsOfExperience: 4 },
          { name: 'Kubernetes', level: 'basic', category: 'devops', yearsOfExperience: 2 },
          { name: 'AWS', level: 'intermediate', category: 'cloud', yearsOfExperience: 4 },
          { name: 'Git', level: 'expert', category: 'tool', yearsOfExperience: 8 },
          { name: 'GraphQL', level: 'intermediate', category: 'tool', yearsOfExperience: 3 }
        ],
        soft: ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Mentoring', 'Time Management', 'Adaptability', 'Critical Thinking']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'C1' },
        { language: 'Portuguese', level: 'B1' },
        { language: 'French', level: 'A2' }
      ],
      certifications: [
        {
          name: 'AWS Certified Developer Associate',
          issuer: 'Amazon Web Services',
          date: '2022',
          expiryDate: '2025',
          credentialId: 'AWS-DEV-2022-123456'
        },
        {
          name: 'MongoDB Certified Developer',
          issuer: 'MongoDB University',
          date: '2021',
          credentialId: 'MONGO-DEV-2021-789'
        },
        {
          name: 'Professional Scrum Master I',
          issuer: 'Scrum.org',
          date: '2020',
          credentialId: 'PSM-I-2020-456'
        }
      ],
      projects: [
        {
          name: 'E-commerce Platform Modernization',
          description: 'Led complete migration of monolithic e-commerce platform to microservices architecture, improving scalability and reducing deployment time',
          role: 'Tech Lead',
          technologies: ['Node.js', 'React', 'Docker', 'Kubernetes', 'MongoDB', 'Redis', 'RabbitMQ'],
          url: 'https://github.com/carlosdev/ecommerce-platform',
          startDate: '2022',
          endDate: '2023',
          highlights: [
            'Handled 100k+ daily active users',
            'Reduced server costs by 30%',
            'Improved deployment frequency from monthly to daily'
          ]
        },
        {
          name: 'Real-time Analytics Dashboard',
          description: 'Built real-time analytics dashboard for business intelligence using WebSockets and streaming data',
          role: 'Full Stack Developer',
          technologies: ['React', 'Node.js', 'Socket.io', 'D3.js', 'PostgreSQL'],
          url: 'https://github.com/carlosdev/analytics-dashboard',
          startDate: '2021',
          endDate: '2022'
        }
      ],
      publications: [
        {
          title: 'Optimizing Microservices Communication Patterns',
          publisher: 'IEEE Software Engineering Conference',
          date: '2023',
          url: 'https://doi.org/10.1109/example.2023'
        }
      ],
      volunteerWork: [
        {
          organization: 'Code.org',
          role: 'Programming Instructor',
          description: 'Teaching programming basics to high school students',
          startDate: '2020',
          current: true
        }
      ],
      awards: [
        {
          title: 'Best Master Thesis 2021',
          issuer: 'Universidad Politécnica de Madrid',
          date: '2021',
          description: 'Awarded for research on microservices optimization'
        }
      ],
      summary: 'Senior Full Stack Developer with 8+ years of experience in building scalable web applications. Specialized in JavaScript ecosystem (Node.js, React) and cloud technologies. Proven track record of leading teams and delivering high-impact projects. Passionate about clean code, best practices, and continuous learning.',
      interests: ['Open Source', 'Machine Learning', 'DevOps', 'Cloud Computing', 'Microservices Architecture'],
      availability: {
        noticePeriod: '1 month',
        availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes'
      },
      completenessScore: 98,
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
        phones: [
          { number: '+34 677 234 567', type: 'mobile' },
          { number: '+34 915 678 901', type: 'home' }
        ],
        links: {
          linkedin: 'https://linkedin.com/in/anamartinez',
          github: 'https://github.com/anafrontend',
          portfolio: 'https://anamartinez.design',
          dribbble: 'https://dribbble.com/anamartinez',
          behance: 'https://behance.net/anamartinez'
        },
        location: { 
          city: 'Madrid', 
          country: 'Spain',
          postalCode: '28015',
          address: 'Calle de Serrano 123'
        }
      },
      education: [
        {
          institution: 'Universidad Complutense de Madrid',
          degree: 'Design and Interactive Media Degree',
          fieldOfStudy: 'UX/UI Design',
          startDate: '2016',
          endDate: '2020',
          current: false,
          grade: '8.9/10',
          achievements: ['Best Design Project 2019', 'Erasmus Scholarship Recipient']
        },
        {
          institution: 'IronHack Madrid',
          degree: 'Frontend Development Bootcamp',
          fieldOfStudy: 'Web Development',
          startDate: '2020',
          endDate: '2020',
          current: false,
          grade: 'Excellent'
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Frontend Developer',
          startDate: '2020',
          endDate: '',
          current: true,
          description: 'Creating beautiful, accessible and functional user interfaces for enterprise applications',
          responsibilities: [
            'Developing responsive web applications with React and TypeScript',
            'Implementing and maintaining design systems with Storybook',
            'Optimizing frontend performance (Core Web Vitals, Lighthouse scores 95+)',
            'Collaborating with UX designers to implement pixel-perfect designs',
            'Writing unit and integration tests with Jest and React Testing Library',
            'Conducting code reviews and mentoring junior developers',
            'Implementing accessibility standards (WCAG 2.1 AA)',
            'Working with REST APIs and GraphQL'
          ],
          technologies: ['React', 'TypeScript', 'Vue.js', 'Next.js', 'Tailwind CSS', 'Styled Components', 'Figma', 'Storybook', 'Jest', 'Cypress'],
          achievements: [
            'Improved app loading time by 50% through code splitting and lazy loading',
            'Implemented design system adopted across 5 products',
            'Achieved 100% accessibility compliance on main product'
          ]
        },
        {
          company: 'Digital Agency Madrid',
          position: 'Junior Frontend Developer',
          startDate: '2020',
          endDate: '2020',
          current: false,
          description: 'Developed websites and landing pages for various clients',
          responsibilities: [
            'Built responsive websites with HTML, CSS, and JavaScript',
            'Implemented animations with GSAP and CSS',
            'Integrated CMS systems (WordPress, Contentful)',
            'Optimized images and assets for web performance'
          ],
          technologies: ['HTML', 'CSS', 'JavaScript', 'WordPress', 'GSAP', 'Bootstrap']
        }
      ],
      skills: {
        technical: [
          { name: 'React', level: 'expert', category: 'framework', yearsOfExperience: 5 },
          { name: 'Vue.js', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
          { name: 'Next.js', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
          { name: 'TypeScript', level: 'advanced', category: 'language', yearsOfExperience: 4 },
          { name: 'JavaScript', level: 'expert', category: 'language', yearsOfExperience: 6 },
          { name: 'HTML', level: 'expert', category: 'language', yearsOfExperience: 7 },
          { name: 'CSS', level: 'expert', category: 'language', yearsOfExperience: 7 },
          { name: 'Tailwind CSS', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
          { name: 'Styled Components', level: 'advanced', category: 'library', yearsOfExperience: 4 },
          { name: 'SASS/SCSS', level: 'advanced', category: 'tool', yearsOfExperience: 5 },
          { name: 'Figma', level: 'advanced', category: 'tool', yearsOfExperience: 4 },
          { name: 'Adobe XD', level: 'intermediate', category: 'tool', yearsOfExperience: 3 },
          { name: 'Webpack', level: 'intermediate', category: 'tool', yearsOfExperience: 3 },
          { name: 'Vite', level: 'intermediate', category: 'tool', yearsOfExperience: 2 },
          { name: 'Jest', level: 'intermediate', category: 'testing', yearsOfExperience: 3 },
          { name: 'Cypress', level: 'intermediate', category: 'testing', yearsOfExperience: 2 },
          { name: 'Storybook', level: 'advanced', category: 'tool', yearsOfExperience: 3 },
          { name: 'Git', level: 'advanced', category: 'tool', yearsOfExperience: 5 }
        ],
        soft: ['Creativity', 'Attention to Detail', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Empathy', 'User-Centric Thinking']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'B2' },
        { language: 'Italian', level: 'B1' }
      ],
      certifications: [
        {
          name: 'React Professional Certification',
          issuer: 'Meta',
          date: '2022',
          credentialId: 'META-REACT-2022-567'
        },
        {
          name: 'Web Accessibility Specialist',
          issuer: 'IAAP',
          date: '2023',
          credentialId: 'WAS-2023-123'
        },
        {
          name: 'Advanced CSS and Sass',
          issuer: 'Udemy',
          date: '2021'
        }
      ],
      projects: [
        {
          name: 'Design System Library',
          description: 'Created comprehensive design system library with 50+ reusable components',
          role: 'Lead Frontend Developer',
          technologies: ['React', 'TypeScript', 'Storybook', 'Styled Components'],
          url: 'https://github.com/anafrontend/design-system',
          startDate: '2022',
          endDate: '2023',
          highlights: [
            'Adopted across 5 products',
            'Reduced development time by 40%',
            'Full accessibility compliance'
          ]
        },
        {
          name: 'Personal Portfolio',
          description: 'Creative portfolio website showcasing design and development skills',
          role: 'Designer & Developer',
          technologies: ['Next.js', 'Three.js', 'GSAP', 'Tailwind CSS'],
          url: 'https://anamartinez.design',
          startDate: '2023',
          endDate: '2023'
        }
      ],
      volunteerWork: [
        {
          organization: 'Women in Tech Madrid',
          role: 'Mentor',
          description: 'Mentoring women starting their careers in frontend development',
          startDate: '2022',
          current: true
        }
      ],
      awards: [
        {
          title: 'Best Design Project 2019',
          issuer: 'Universidad Complutense de Madrid',
          date: '2019'
        }
      ],
      summary: 'Creative Frontend Developer with 5+ years of experience specializing in React and modern CSS. Passionate about creating accessible, performant, and beautiful user interfaces. Strong background in UX/UI design with expertise in design systems and component libraries.',
      interests: ['UX/UI Design', 'Accessibility', 'Animation', 'Design Systems', 'Web Performance'],
      availability: {
        noticePeriod: '2 weeks',
        availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes'
      },
      completenessScore: 96,
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
        phones: [
          { number: '+52 55 1234 5678', type: 'mobile' },
          { number: '+52 55 8765 4321', type: 'work' }
        ],
        links: {
          linkedin: 'https://linkedin.com/in/davidlopez',
          github: 'https://github.com/davidbackend',
          stackoverflow: 'https://stackoverflow.com/users/davidlopez'
        },
        location: { 
          city: 'Mexico City', 
          country: 'Mexico',
          postalCode: '03100',
          address: 'Av. Insurgentes Sur 1458'
        }
      },
      education: [
        {
          institution: 'Instituto Tecnológico de México',
          degree: 'Systems Engineering',
          fieldOfStudy: 'Software Development',
          startDate: '2014',
          endDate: '2018',
          current: false,
          grade: '9.1/10',
          achievements: ['Academic Excellence Award', 'Best Capstone Project 2018']
        },
        {
          institution: 'Oracle University',
          degree: 'Java Professional Certification Program',
          fieldOfStudy: 'Java Development',
          startDate: '2018',
          endDate: '2019',
          current: false
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Senior Backend Developer',
          startDate: '2021',
          endDate: '',
          current: true,
          description: 'Building robust and scalable backend systems for enterprise applications',
          responsibilities: [
            'Designing and implementing RESTful APIs with Spring Boot',
            'Database design and optimization (PostgreSQL, MySQL)',
            'Implementing authentication and authorization (OAuth2, JWT)',
            'Building microservices architecture with Spring Cloud',
            'Message queue integration (RabbitMQ, Kafka)',
            'Performance tuning and optimization',
            'Writing comprehensive unit and integration tests',
            'API documentation with Swagger/OpenAPI',
            'Implementing caching strategies with Redis',
            'Code review and mentoring junior developers'
          ],
          technologies: ['Java', 'Spring Boot', 'Spring Cloud', 'PostgreSQL', 'MySQL', 'Redis', 'Kafka', 'RabbitMQ', 'Docker', 'AWS'],
          achievements: [
            'Optimized database queries reducing response time by 60%',
            'Implemented caching system reducing server load by 45%',
            'Led migration to microservices architecture'
          ]
        },
        {
          company: 'Tech Innovators',
          position: 'Backend Developer',
          startDate: '2019',
          endDate: '2021',
          current: false,
          description: 'Developed backend services for various client projects',
          responsibilities: [
            'Building RESTful APIs with Spring Boot and Express.js',
            'Database management and query optimization',
            'Implementing authentication systems',
            'Integration with third-party services',
            'Writing automated tests'
          ],
          technologies: ['Java', 'Spring Boot', 'Node.js', 'PostgreSQL', 'MongoDB', 'Git']
        },
        {
          company: 'Freelance',
          position: 'Backend Developer',
          startDate: '2018',
          endDate: '2019',
          current: false,
          description: 'Freelance backend development for startups',
          responsibilities: [
            'Built APIs for mobile applications',
            'Database design and implementation',
            'Server deployment and maintenance'
          ],
          technologies: ['Java', 'Spring', 'MySQL', 'Heroku']
        }
      ],
      skills: {
        technical: [
          { name: 'Java', level: 'expert', category: 'language', yearsOfExperience: 8 },
          { name: 'Spring Boot', level: 'expert', category: 'framework', yearsOfExperience: 6 },
          { name: 'Spring Cloud', level: 'advanced', category: 'framework', yearsOfExperience: 4 },
          { name: 'Hibernate', level: 'advanced', category: 'framework', yearsOfExperience: 5 },
          { name: 'PostgreSQL', level: 'advanced', category: 'database', yearsOfExperience: 6 },
          { name: 'MySQL', level: 'advanced', category: 'database', yearsOfExperience: 7 },
          { name: 'MongoDB', level: 'intermediate', category: 'database', yearsOfExperience: 3 },
          { name: 'Redis', level: 'intermediate', category: 'database', yearsOfExperience: 3 },
          { name: 'Kafka', level: 'intermediate', category: 'tool', yearsOfExperience: 2 },
          { name: 'RabbitMQ', level: 'intermediate', category: 'tool', yearsOfExperience: 3 },
          { name: 'Docker', level: 'intermediate', category: 'devops', yearsOfExperience: 4 },
          { name: 'Kubernetes', level: 'basic', category: 'devops', yearsOfExperience: 2 },
          { name: 'AWS', level: 'intermediate', category: 'cloud', yearsOfExperience: 3 },
          { name: 'Git', level: 'advanced', category: 'tool', yearsOfExperience: 7 },
          { name: 'Maven', level: 'advanced', category: 'tool', yearsOfExperience: 6 },
          { name: 'Gradle', level: 'intermediate', category: 'tool', yearsOfExperience: 3 },
          { name: 'JUnit', level: 'advanced', category: 'testing', yearsOfExperience: 6 },
          { name: 'Mockito', level: 'advanced', category: 'testing', yearsOfExperience: 5 }
        ],
        soft: ['Analytical Thinking', 'Problem Solving', 'Team Work', 'Reliability', 'Communication', 'Detail-Oriented', 'Self-Motivated']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'C1' },
        { language: 'Portuguese', level: 'A2' }
      ],
      certifications: [
        {
          name: 'Oracle Certified Professional Java SE 11 Developer',
          issuer: 'Oracle',
          date: '2021',
          expiryDate: '2026',
          credentialId: 'OCP-JAVA11-2021-789'
        },
        {
          name: 'Spring Professional Certification',
          issuer: 'VMware',
          date: '2022',
          credentialId: 'SPRING-PRO-2022-456'
        },
        {
          name: 'AWS Certified Solutions Architect Associate',
          issuer: 'Amazon Web Services',
          date: '2023',
          expiryDate: '2026',
          credentialId: 'AWS-SAA-2023-123'
        }
      ],
      projects: [
        {
          name: 'Microservices E-commerce Backend',
          description: 'Designed and implemented microservices architecture for e-commerce platform handling 50k+ daily transactions',
          role: 'Backend Lead',
          technologies: ['Java', 'Spring Boot', 'Spring Cloud', 'PostgreSQL', 'Kafka', 'Redis', 'Docker'],
          url: 'https://github.com/davidbackend/ecommerce-microservices',
          startDate: '2022',
          endDate: '2023',
          highlights: [
            'Handled 50k+ daily transactions',
            'Reduced response time by 60%',
            '99.9% uptime'
          ]
        },
        {
          name: 'Real-time Analytics API',
          description: 'Built high-performance API for real-time data analytics',
          role: 'Backend Developer',
          technologies: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka'],
          startDate: '2021',
          endDate: '2022'
        }
      ],
      volunteerWork: [
        {
          organization: 'CoderDojo Mexico City',
          role: 'Programming Mentor',
          description: 'Teaching Java and software development to teenagers',
          startDate: '2021',
          current: true
        }
      ],
      awards: [
        {
          title: 'Best Capstone Project 2018',
          issuer: 'Instituto Tecnológico de México',
          date: '2018',
          description: 'Developed innovative backend system for university management'
        }
      ],
      summary: 'Senior Backend Developer with 8+ years of experience specializing in Java and Spring ecosystem. Expert in building scalable microservices architectures and high-performance APIs. Strong knowledge of databases, caching, and message queuing systems. Passionate about clean code and software architecture.',
      interests: ['Microservices', 'Cloud Computing', 'System Architecture', 'Performance Optimization', 'Open Source'],
      availability: {
        noticePeriod: '1 month',
        availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes'
      },
      completenessScore: 97,
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
        phones: [
          { number: '+54 11 2345 6789', type: 'mobile' },
          { number: '+54 11 9876 5432', type: 'home' }
        ],
        links: {
          linkedin: 'https://linkedin.com/in/lauragonzalez',
          github: 'https://github.com/lauraqa',
          medium: 'https://medium.com/@lauraqa'
        },
        location: { 
          city: 'Buenos Aires', 
          country: 'Argentina',
          postalCode: 'C1425',
          address: 'Av. Santa Fe 2845'
        }
      },
      education: [
        {
          institution: 'Universidad de Buenos Aires',
          degree: 'Computer Engineering',
          fieldOfStudy: 'Software Quality',
          startDate: '2015',
          endDate: '2020',
          current: false,
          grade: '8.8/10',
          achievements: ['Best Student Project in QA', 'Teaching Assistant for Software Testing course']
        },
        {
          institution: 'ISTQB',
          degree: 'Advanced Level Test Analyst',
          fieldOfStudy: 'Software Testing',
          startDate: '2021',
          endDate: '2021',
          current: false
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Senior QA Engineer',
          startDate: '2022',
          endDate: '',
          current: true,
          description: 'Leading quality assurance efforts for enterprise applications',
          responsibilities: [
            'Developing and maintaining automated test suites (Selenium, Cypress)',
            'Creating comprehensive test plans and test strategies',
            'Performing manual exploratory testing',
            'API testing with Postman and Rest Assured',
            'Performance testing with JMeter and k6',
            'Leading test automation initiatives',
            'Mentoring junior QA engineers',
            'Integrating tests into CI/CD pipelines',
            'Bug tracking and reporting with Jira',
            'Collaborating with developers on testability improvements'
          ],
          technologies: ['Selenium', 'Cypress', 'JMeter', 'Postman', 'Rest Assured', 'Jenkins', 'Git', 'Jira', 'TestRail', 'JavaScript', 'Python', 'Java'],
          achievements: [
            'Reduced bug escape rate by 45% through comprehensive test automation',
            'Implemented automated testing reducing regression testing time by 70%',
            'Achieved 85% test automation coverage'
          ]
        },
        {
          company: 'Tech Innovators',
          position: 'QA Engineer',
          startDate: '2020',
          endDate: '2022',
          current: false,
          description: 'Ensuring software quality through comprehensive testing',
          responsibilities: [
            'Writing and executing test cases',
            'Automated test development with Selenium',
            'Manual testing of web and mobile applications',
            'Bug reporting and tracking',
            'Regression testing'
          ],
          technologies: ['Selenium', 'Postman', 'Jira', 'TestNG', 'Java', 'Git']
        },
        {
          company: 'QualitySoft Argentina',
          position: 'Junior QA Tester',
          startDate: '2019',
          endDate: '2020',
          current: false,
          description: 'Manual testing for various client projects',
          responsibilities: [
            'Executing manual test cases',
            'Bug reporting',
            'Smoke and sanity testing',
            'User acceptance testing support'
          ],
          technologies: ['Jira', 'TestLink', 'Selenium']
        }
      ],
      skills: {
        technical: [
          { name: 'Selenium WebDriver', level: 'expert', category: 'testing', yearsOfExperience: 5 },
          { name: 'Cypress', level: 'advanced', category: 'testing', yearsOfExperience: 3 },
          { name: 'JMeter', level: 'intermediate', category: 'testing', yearsOfExperience: 3 },
          { name: 'Postman', level: 'advanced', category: 'tool', yearsOfExperience: 5 },
          { name: 'Rest Assured', level: 'advanced', category: 'testing', yearsOfExperience: 3 },
          { name: 'Jenkins', level: 'intermediate', category: 'devops', yearsOfExperience: 3 },
          { name: 'Git', level: 'advanced', category: 'tool', yearsOfExperience: 5 },
          { name: 'JavaScript', level: 'intermediate', category: 'language', yearsOfExperience: 4 },
          { name: 'Python', level: 'intermediate', category: 'language', yearsOfExperience: 3 },
          { name: 'Java', level: 'intermediate', category: 'language', yearsOfExperience: 4 },
          { name: 'SQL', level: 'intermediate', category: 'language', yearsOfExperience: 5 },
          { name: 'TestNG', level: 'advanced', category: 'testing', yearsOfExperience: 4 },
          { name: 'Cucumber', level: 'intermediate', category: 'testing', yearsOfExperience: 2 },
          { name: 'Jira', level: 'expert', category: 'tool', yearsOfExperience: 5 },
          { name: 'TestRail', level: 'advanced', category: 'tool', yearsOfExperience: 3 }
        ],
        soft: ['Attention to Detail', 'Analytical Skills', 'Communication', 'Patience', 'Critical Thinking', 'Problem Solving', 'Teamwork', 'Time Management']
      },
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'B2' },
        { language: 'Portuguese', level: 'B1' }
      ],
      certifications: [
        {
          name: 'ISTQB Certified Tester Foundation Level',
          issuer: 'ISTQB',
          date: '2020',
          credentialId: 'ISTQB-CTFL-2020-456'
        },
        {
          name: 'ISTQB Advanced Level Test Analyst',
          issuer: 'ISTQB',
          date: '2021',
          credentialId: 'ISTQB-CTAL-TA-2021-789'
        },
        {
          name: 'Selenium WebDriver with Java',
          issuer: 'Udemy',
          date: '2020'
        },
        {
          name: 'API Testing with Postman',
          issuer: 'Udemy',
          date: '2021'
        }
      ],
      projects: [
        {
          name: 'E2E Test Automation Framework',
          description: 'Developed comprehensive end-to-end test automation framework using Selenium and Cypress',
          role: 'QA Lead',
          technologies: ['Selenium', 'Cypress', 'JavaScript', 'Java', 'TestNG', 'Jenkins'],
          url: 'https://github.com/lauraqa/e2e-framework',
          startDate: '2022',
          endDate: '2023',
          highlights: [
            '85% test automation coverage',
            'Reduced regression testing time by 70%',
            'Integrated with CI/CD pipeline'
          ]
        },
        {
          name: 'Performance Testing Suite',
          description: 'Created performance testing suite for API load testing',
          role: 'Performance Tester',
          technologies: ['JMeter', 'Python', 'Grafana'],
          startDate: '2022',
          endDate: '2022'
        }
      ],
      publications: [
        {
          title: 'Best Practices for Test Automation in Agile Teams',
          publisher: 'Medium',
          date: '2023',
          url: 'https://medium.com/@lauraqa/test-automation-agile'
        }
      ],
      volunteerWork: [
        {
          organization: 'Women in QA',
          role: 'Community Organizer',
          description: 'Organizing workshops and events for women in quality assurance',
          startDate: '2022',
          current: true
        }
      ],
      awards: [
        {
          title: 'Best Student Project in QA',
          issuer: 'Universidad de Buenos Aires',
          date: '2019',
          description: 'Developed innovative automated testing framework'
        }
      ],
      summary: 'Senior QA Engineer with 5+ years of experience in manual and automated testing. Expert in building test automation frameworks and ensuring software quality. Strong knowledge of various testing methodologies and tools. ISTQB Advanced Level certified. Passionate about test automation and continuous improvement.',
      interests: ['Test Automation', 'Performance Testing', 'Continuous Integration', 'Agile Methodologies', 'Quality Engineering'],
      availability: {
        noticePeriod: '2 weeks',
        availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes'
      },
      completenessScore: 95,
      isComplete: true,
      lastProcessedAt: new Date()
    },
    
    // Sarah - DevOps Engineer (Continued in next message due to length)
    {
      userId: users.find(u => u.email === 'sarah.devops@example.com')._id,
      organization: organizations[1]._id,
      organizationStatus: 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      contact: {
        email: 'sarah.devops@example.com',
        phones: [
          { number: '+1 415 555 0123', type: 'mobile' },
          { number: '+1 415 555 0456', type: 'work' }
        ],
        links: {
          linkedin: 'https://linkedin.com/in/sarahjohnson',
          github: 'https://github.com/sarahdevops',
          twitter: 'https://twitter.com/sarahdevops'
        },
        location: { 
          city: 'San Francisco', 
          country: 'United States',
          postalCode: '94103',
          address: '123 Market Street'
        }
      },
      education: [
        {
          institution: 'Stanford University',
          degree: 'Master of Science in Computer Science',
          fieldOfStudy: 'Distributed Systems',
          startDate: '2016',
          endDate: '2018',
          current: false,
          grade: '3.9/4.0',
          achievements: ['Graduate Research Fellowship', 'Published thesis on container orchestration']
        },
        {
          institution: 'Stanford University',
          degree: 'Computer Science BS',
          fieldOfStudy: 'Cloud Computing',
          startDate: '2012',
          endDate: '2016',
          current: false,
          grade: '3.8/4.0',
          achievements: ['Dean\'s List all 4 years', 'Undergraduate Research Assistant']
        }
      ],
      experience: [
        {
          company: 'Global Solutions Inc',
          position: 'Senior DevOps Engineer',
          startDate: '2021',
          endDate: '',
          current: true,
          description: 'Leading DevOps initiatives and infrastructure automation',
          responsibilities: [
            'Managing multi-region Kubernetes clusters (100+ nodes)',
            'Implementing infrastructure as code with Terraform and CloudFormation',
            'Building and maintaining CI/CD pipelines (Jenkins, GitLab CI, GitHub Actions)',
            'Monitoring and observability with Prometheus, Grafana, and ELK stack',
            'Security and compliance (SOC2, ISO 27001)',
            'Cost optimization reducing cloud spend by 35%',
            'Disaster recovery and backup strategies',
            'Mentoring DevOps engineers',
            'On-call rotation and incident response',
            'Automating deployment processes'
          ],
          technologies: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'Prometheus', 'Grafana', 'ELK', 'Python', 'Bash', 'Go'],
          achievements: [
            'Reduced deployment time from 2 hours to 15 minutes',
            'Achieved 99.99% uptime for production systems',
            'Reduced cloud costs by 35% through optimization',
            'Implemented zero-downtime deployment strategy'
          ]
        },
        {
          company: 'Global Solutions Inc',
          position: 'DevOps Engineer',
          startDate: '2018',
          endDate: '2021',
          current: false,
          description: 'Building and maintaining CI/CD infrastructure',
          responsibilities: [
            'Managing Kubernetes clusters',
            'Implementing infrastructure as code',
            'Building CI/CD pipelines',
            'Monitoring and alerting',
            'Security hardening'
          ],
          technologies: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Jenkins', 'Prometheus', 'Python']
        }
      ],
      skills: {
        technical: [
          { name: 'AWS', level: 'expert', category: 'cloud', yearsOfExperience: 7 },
          { name: 'Kubernetes', level: 'expert', category: 'devops', yearsOfExperience: 6 },
          { name: 'Docker', level: 'expert', category: 'devops', yearsOfExperience: 7 },
          { name: 'Terraform', level: 'advanced', category: 'devops', yearsOfExperience: 5 },
          { name: 'Ansible', level: 'advanced', category: 'devops', yearsOfExperience: 4 },
          { name: 'Jenkins', level: 'advanced', category: 'devops', yearsOfExperience: 6 },
          { name: 'GitLab CI', level: 'advanced', category: 'devops', yearsOfExperience: 4 },
          { name: 'GitHub Actions', level: 'advanced', category: 'devops', yearsOfExperience: 3 },
          { name: 'Prometheus', level: 'advanced', category: 'tool', yearsOfExperience: 5 },
          { name: 'Grafana', level: 'advanced', category: 'tool', yearsOfExperience: 5 },
          { name: 'ELK Stack', level: 'intermediate', category: 'tool', yearsOfExperience: 4 },
          { name: 'Python', level: 'intermediate', category: 'language', yearsOfExperience: 6 },
          { name: 'Bash', level: 'advanced', category: 'language', yearsOfExperience: 7 },
          { name: 'Go', level: 'intermediate', category: 'language', yearsOfExperience: 3 },
          { name: 'Git', level: 'expert', category: 'tool', yearsOfExperience: 8 },
          { name: 'Linux', level: 'expert', category: 'os', yearsOfExperience: 8 },
          { name: 'Helm', level: 'advanced', category: 'tool', yearsOfExperience: 4 },
          { name: 'ArgoCD', level: 'intermediate', category: 'tool', yearsOfExperience: 2 }
        ],
        soft: ['Problem Solving', 'Reliability', 'Communication', 'Automation Mindset', 'Leadership', 'Collaboration', 'Adaptability', 'Critical Thinking']
      },
      languages: [
        { language: 'English', level: 'native' },
        { language: 'Spanish', level: 'B1' }
      ],
      certifications: [
        {
          name: 'AWS Certified Solutions Architect Professional',
          issuer: 'Amazon Web Services',
          date: '2022',
          expiryDate: '2025',
          credentialId: 'AWS-SAP-2022-789'
        },
        {
          name: 'AWS Certified DevOps Engineer Professional',
          issuer: 'Amazon Web Services',
          date: '2023',
          expiryDate: '2026',
          credentialId: 'AWS-DOP-2023-456'
        },
        {
          name: 'Certified Kubernetes Administrator',
          issuer: 'CNCF',
          date: '2021',
          expiryDate: '2024',
          credentialId: 'CKA-2021-123'
        },
        {
          name: 'Certified Kubernetes Application Developer',
          issuer: 'CNCF',
          date: '2022',
          expiryDate: '2025',
          credentialId: 'CKAD-2022-456'
        },
        {
          name: 'HashiCorp Certified Terraform Associate',
          issuer: 'HashiCorp',
          date: '2022',
          expiryDate: '2024',
          credentialId: 'TERRAFORM-2022-789'
        }
      ],
      projects: [
        {
          name: 'Multi-Cloud Kubernetes Platform',
          description: 'Designed and implemented multi-cloud Kubernetes platform supporting AWS, GCP, and Azure',
          role: 'Lead DevOps Engineer',
          technologies: ['Kubernetes', 'Terraform', 'ArgoCD', 'Prometheus', 'Grafana'],
          startDate: '2022',
          endDate: '2023',
          highlights: [
            'Managed 100+ Kubernetes nodes',
            '99.99% uptime',
            'Reduced cross-cloud deployment complexity'
          ]
        },
        {
          name: 'Infrastructure Automation Framework',
          description: 'Built comprehensive infrastructure automation framework',
          role: 'DevOps Engineer',
          technologies: ['Terraform', 'Ansible', 'Python', 'AWS'],
          url: 'https://github.com/sarahdevops/infra-automation',
          startDate: '2021',
          endDate: '2022'
        }
      ],
      publications: [
        {
          title: 'Optimizing Container Orchestration at Scale',
          publisher: 'Stanford Master\'s Thesis',
          date: '2018'
        }
      ],
      volunteerWork: [
        {
          organization: 'Girls Who Code',
          role: 'Mentor',
          description: 'Teaching coding and cloud computing to high school girls',
          startDate: '2020',
          current: true
        }
      ],
      summary: 'Senior DevOps Engineer with 7+ years of experience in cloud infrastructure, Kubernetes, and automation. Expert in AWS, container orchestration, and CI/CD. Multiple AWS and CNCF certifications. Passionate about infrastructure as code, automation, and building reliable systems.',
      interests: ['Cloud Native', 'Kubernetes', 'Site Reliability Engineering', 'Infrastructure as Code', 'Observability'],
      availability: {
        noticePeriod: '1 month',
        availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        willingToRelocate: true,
        remoteWork: 'yes'
      },
      completenessScore: 99,
      isComplete: true,
      lastProcessedAt: new Date()
    }
  ];
  
  // Add more employees with complete CVs (Michael, Emma, Yuki, Li Wei, Priya, Pending users)
  // Continue pattern with full details...
  
  const createdCVs = await CV.insertMany(cvs);
  console.log(`✅ Created ${createdCVs.length} comprehensive CVs`);
  return createdCVs;
};

module.exports = { seedCVs };
