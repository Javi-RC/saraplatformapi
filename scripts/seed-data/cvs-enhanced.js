// Enhanced Comprehensive Seed Currículos with Complete Data for ALL Employees
// This file contains complete currículo data for every employee with all possible fields filled

const seedCVs = async (users, organizations) => {
  console.log('\n📄 Creating enhanced comprehensive currículos with complete data for ALL employees...');
  
  const CV = require('../../src/models/cv.model');
  
  // Helper function to generate complete currículo data
  const generateCompleteCV = (userEmail, orgIndex, profile) => {
    const user = users.find(u => u.email === userEmail);
    if (!user) return null;
    
    return {
      userId: user._id,
      organization: organizations[orgIndex]._id,
      organizationStatus: profile.orgStatus || 'accepted',
      submittedToOrganizationAt: new Date(Date.now() - (profile.daysAgo || 30) * 24 * 60 * 60 * 1000),
      contact: {
        email: userEmail,
        phones: profile.phones || [
          { number: profile.phone1, type: 'mobile' },
          { number: profile.phone2, type: 'work' }
        ],
        links: {
          linkedin: profile.linkedin,
          github: profile.github,
          portfolio: profile.portfolio,
          twitter: profile.twitter,
          medium: profile.medium,
          stackoverflow: profile.stackoverflow,
          dribbble: profile.dribbble,
          behance: profile.behance
        },
        location: {
          city: profile.city,
          country: profile.country,
          postalCode: profile.postalCode,
          address: profile.address
        }
      },
      education: profile.education || [],
      experience: profile.experience || [],
      skills: {
        technical: profile.technicalSkills || [],
        soft: profile.softSkills || []
      },
      languages: profile.languages || [],
      certifications: profile.certifications || [],
      projects: profile.projects || [],
      publications: profile.publications || [],
      volunteerWork: profile.volunteerWork || [],
      awards: profile.awards || [],
      summary: profile.summary || '',
      interests: profile.interests || [],
      availability: profile.availability || {
        noticePeriod: '1 month',
        availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes'
      },
      hobbies: profile.hobbies || [],
      references: profile.references || [],
      completenessScore: profile.completenessScore || 95,
      isComplete: true,
      lastProcessedAt: new Date()
    };
  };
  
  // Complete profiles for all employees
  const employeeProfiles = {
    // CARLOS - Senior Full Stack Developer
    'carlos.dev@example.com': {
      daysAgo: 60,
      phone1: '+34 666 123 456',
      phone2: '+34 912 345 678',
      linkedin: 'https://linkedin.com/in/carlosrodriguez',
      github: 'https://github.com/carlosdev',
      portfolio: 'https://carlosrodriguez.dev',
      twitter: 'https://twitter.com/carlosdev',
      city: 'Madrid',
      country: 'Spain',
      postalCode: '28013',
      address: 'Calle de Alcalá 45',
      education: [
        {
          institution: 'Universidad Politécnica de Madrid',
          degree: 'Master in Software Engineering',
          fieldOfStudy: 'Advanced Software Development',
          startDate: '2019',
          endDate: '2021',
          current: false,
          grade: '9.2/10',
          achievements: ['Best Master Thesis Award 2021', 'Research Publication in IEEE', 'Outstanding Graduate Award']
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
          current: false,
          grade: 'Excellent'
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Senior Full Stack Developer',
          startDate: '2021',
          endDate: '',
          current: true,
          description: 'Leading development of enterprise web applications using modern tech stack. Managing a team of 5 developers and overseeing architecture decisions for critical business systems.',
          responsibilities: [
            'Architecting scalable Node.js backend services with microservices pattern',
            'Leading team of 5 developers with daily standups and sprint planning',
            'Implementing CI/CD pipelines using GitHub Actions and Docker',
            'Code review and mentoring junior developers on best practices',
            'Performance optimization achieving 40% reduction in API response times',
            'Database design and optimization with MongoDB and PostgreSQL',
            'Security audits and implementation of OWASP best practices',
            'Stakeholder communication and project planning',
            'Technical documentation and knowledge sharing'
          ],
          technologies: ['Node.js', 'React', 'TypeScript', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Redis', 'GraphQL', 'Jest', 'GitHub Actions'],
          achievements: [
            'Reduced API response time by 40% through caching and optimization',
            'Led migration to microservices architecture handling 100k+ users',
            'Implemented automated testing increasing coverage from 45% to 85%',
            'Mentored 3 junior developers who got promoted to mid-level'
          ]
        },
        {
          company: 'StartupXYZ',
          position: 'Full Stack Developer',
          startDate: '2019',
          endDate: '2021',
          current: false,
          description: 'Developed and maintained multiple web applications for e-commerce and SaaS platforms serving 50k+ active users.',
          responsibilities: [
            'Built RESTful APIs with Express.js handling 10k+ daily requests',
            'Created responsive frontends with React and Redux',
            'Managed PostgreSQL databases with complex queries and optimization',
            'Implemented JWT-based authentication and OAuth2 integration',
            'Collaborated with UX/UI designers using Figma and Sketch',
            'Participated in Agile ceremonies and sprint planning',
            'Bug fixing and production support'
          ],
          technologies: ['JavaScript', 'React', 'Express', 'PostgreSQL', 'Git', 'Jenkins', 'Heroku', 'Redux', 'Stripe API'],
          achievements: [
            'Developed 3 major features adopted by 50k+ users',
            'Reduced deployment time by 60% with CI/CD automation',
            'Improved application performance by 35%'
          ]
        },
        {
          company: 'Freelance',
          position: 'Web Developer',
          startDate: '2017',
          endDate: '2019',
          current: false,
          description: 'Freelance web development for small businesses and startups, building custom websites and web applications.',
          responsibilities: [
            'Built custom WordPress themes and plugins for 15+ clients',
            'Created landing pages and corporate websites',
            'Provided maintenance and support services',
            'Client communication and requirements gathering',
            'Delivered projects on time and within budget'
          ],
          technologies: ['HTML', 'CSS', 'JavaScript', 'WordPress', 'PHP', 'MySQL', 'Bootstrap']
        }
      ],
      technicalSkills: [
        { name: 'JavaScript', level: 'expert', category: 'language', yearsOfExperience: 8 },
        { name: 'TypeScript', level: 'advanced', category: 'language', yearsOfExperience: 5 },
        { name: 'Python', level: 'intermediate', category: 'language', yearsOfExperience: 3 },
        { name: 'Java', level: 'intermediate', category: 'language', yearsOfExperience: 2 },
        { name: 'Node.js', level: 'expert', category: 'runtime', yearsOfExperience: 6 },
        { name: 'React', level: 'advanced', category: 'framework', yearsOfExperience: 6 },
        { name: 'Vue.js', level: 'intermediate', category: 'framework', yearsOfExperience: 2 },
        { name: 'Express.js', level: 'expert', category: 'framework', yearsOfExperience: 6 },
        { name: 'NestJS', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
        { name: 'Next.js', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
        { name: 'MongoDB', level: 'advanced', category: 'database', yearsOfExperience: 5 },
        { name: 'PostgreSQL', level: 'advanced', category: 'database', yearsOfExperience: 5 },
        { name: 'MySQL', level: 'intermediate', category: 'database', yearsOfExperience: 4 },
        { name: 'Redis', level: 'intermediate', category: 'database', yearsOfExperience: 3 },
        { name: 'Docker', level: 'intermediate', category: 'devops', yearsOfExperience: 4 },
        { name: 'Kubernetes', level: 'basic', category: 'devops', yearsOfExperience: 2 },
        { name: 'AWS', level: 'intermediate', category: 'cloud', yearsOfExperience: 4 },
        { name: 'Git', level: 'expert', category: 'tool', yearsOfExperience: 8 },
        { name: 'GraphQL', level: 'intermediate', category: 'tool', yearsOfExperience: 3 },
        { name: 'REST APIs', level: 'expert', category: 'tool', yearsOfExperience: 7 },
        { name: 'Jest', level: 'advanced', category: 'testing', yearsOfExperience: 5 },
        { name: 'Mocha', level: 'intermediate', category: 'testing', yearsOfExperience: 4 }
      ],
      softSkills: ['Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Mentoring', 'Time Management', 'Adaptability', 'Critical Thinking', 'Project Planning', 'Agile Methodologies'],
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
          date: '2022-06',
          expiryDate: '2025-06',
          credentialId: 'AWS-DEV-2022-123456',
          url: 'https://aws.amazon.com/verification'
        },
        {
          name: 'MongoDB Certified Developer',
          issuer: 'MongoDB University',
          date: '2021-03',
          credentialId: 'MONGO-DEV-2021-789',
          url: 'https://university.mongodb.com/certification'
        },
        {
          name: 'Professional Scrum Master I',
          issuer: 'Scrum.org',
          date: '2020-11',
          credentialId: 'PSM-I-2020-456'
        },
        {
          name: 'Node.js Application Developer',
          issuer: 'OpenJS Foundation',
          date: '2023-01',
          credentialId: 'JSNAD-2023-123'
        }
      ],
      projects: [
        {
          name: 'E-commerce Platform Modernization',
          description: 'Led complete migration of monolithic e-commerce platform to microservices architecture, improving scalability and reducing deployment time from weeks to hours.',
          role: 'Tech Lead & Architect',
          technologies: ['Node.js', 'React', 'Docker', 'Kubernetes', 'MongoDB', 'Redis', 'RabbitMQ', 'AWS', 'Terraform'],
          url: 'https://github.com/carlosdev/ecommerce-platform',
          startDate: '2022-01',
          endDate: '2023-03',
          highlights: [
            'Handled 100k+ daily active users with 99.9% uptime',
            'Reduced server costs by 30% through optimization',
            'Improved deployment frequency from monthly to daily',
            'Decreased average page load time from 3s to 800ms'
          ]
        },
        {
          name: 'Real-time Analytics Dashboard',
          description: 'Built comprehensive real-time analytics dashboard for business intelligence using WebSockets and streaming data processing.',
          role: 'Full Stack Developer',
          technologies: ['React', 'Node.js', 'Socket.io', 'D3.js', 'PostgreSQL', 'TimescaleDB'],
          url: 'https://github.com/carlosdev/analytics-dashboard',
          startDate: '2021-06',
          endDate: '2022-01',
          highlights: [
            'Processed 1M+ events per day',
            'Sub-second data visualization updates',
            'Used by 500+ business analysts'
          ]
        },
        {
          name: 'Open Source Contribution - ExpressJS',
          description: 'Active contributor to ExpressJS framework, contributed bug fixes and performance improvements.',
          role: 'Open Source Contributor',
          technologies: ['JavaScript', 'Node.js'],
          url: 'https://github.com/expressjs/express',
          startDate: '2020',
          current: true
        }
      ],
      publications: [
        {
          title: 'Optimizing Microservices Communication Patterns for High-Performance Systems',
          publisher: 'IEEE Software Engineering Conference',
          date: '2023-05',
          url: 'https://doi.org/10.1109/example.2023',
          description: 'Research paper on optimizing inter-service communication in microservices architectures'
        },
        {
          title: 'Best Practices for Node.js Application Security',
          publisher: 'Medium Engineering Blog',
          date: '2023-09',
          url: 'https://medium.com/@carlosdev/nodejs-security'
        }
      ],
      volunteerWork: [
        {
          organization: 'Code.org',
          role: 'Programming Instructor',
          description: 'Teaching programming basics to high school students from underrepresented communities',
          startDate: '2020-09',
          current: true,
          hoursPerWeek: 4
        },
        {
          organization: 'FreeCodeCamp Madrid',
          role: 'Mentor',
          description: 'Mentoring beginners learning web development',
          startDate: '2021-01',
          current: true,
          hoursPerWeek: 2
        }
      ],
      awards: [
        {
          title: 'Best Master Thesis 2021',
          issuer: 'Universidad Politécnica de Madrid',
          date: '2021-07',
          description: 'Awarded for research on microservices optimization and performance'
        },
        {
          title: 'Employee of the Year 2022',
          issuer: 'Tech Innovators',
          date: '2022-12',
          description: 'Recognition for outstanding technical leadership and project delivery'
        }
      ],
      summary: 'Senior Full Stack Developer with 8+ years of experience in building scalable web applications. Specialized in JavaScript ecosystem (Node.js, React) and cloud technologies. Proven track record of leading teams and delivering high-impact projects that serve 100k+ users. Expert in microservices architecture, RESTful APIs, and DevOps practices. Passionate about clean code, best practices, continuous learning, and mentoring junior developers. Strong communicator with experience in stakeholder management and technical leadership.',
      interests: ['Open Source', 'Machine Learning', 'DevOps', 'Cloud Computing', 'Microservices Architecture', 'System Design', 'Performance Optimization', 'Software Architecture'],
      hobbies: ['Reading tech blogs', 'Contributing to open source', 'Playing guitar', 'Hiking', 'Photography'],
      availability: {
        noticePeriod: '1 month',
        availableFrom: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes',
        preferredWorkArrangement: 'remote',
        travelWillingness: '25%'
      },
      references: [
        {
          name: 'María García López',
          position: 'CTO at Tech Innovators',
          email: 'admin.techinnov@example.com',
          phone: '+34 912 345 678',
          relationship: 'Direct Manager'
        }
      ],
      completenessScore: 98
    },
    
    // ANA - Frontend Developer
    'ana.frontend@example.com': {
      daysAgo: 45,
      phone1: '+34 677 234 567',
      phone2: '+34 915 678 901',
      linkedin: 'https://linkedin.com/in/anamartinez',
      github: 'https://github.com/anafrontend',
      portfolio: 'https://anamartinez.design',
      dribbble: 'https://dribbble.com/anamartinez',
      behance: 'https://behance.net/anamartinez',
      twitter: 'https://twitter.com/ana_frontend',
      city: 'Madrid',
      country: 'Spain',
      postalCode: '28015',
      address: 'Calle de Serrano 123',
      education: [
        {
          institution: 'Universidad Complutense de Madrid',
          degree: 'Design and Interactive Media Degree',
          fieldOfStudy: 'UX/UI Design',
          startDate: '2016',
          endDate: '2020',
          current: false,
          grade: '8.9/10',
          achievements: ['Best Design Project 2019', 'Erasmus Scholarship Recipient', 'Student Representative 2018-2019']
        },
        {
          institution: 'IronHack Madrid',
          degree: 'Frontend Development Bootcamp',
          fieldOfStudy: 'Web Development',
          startDate: '2020-01',
          endDate: '2020-03',
          current: false,
          grade: 'Excellent',
          achievements: ['Best Final Project', 'Hired immediately after graduation']
        },
        {
          institution: 'Interaction Design Foundation',
          degree: 'UX Design Professional Certificate',
          fieldOfStudy: 'User Experience Design',
          startDate: '2019',
          endDate: '2020',
          current: false
        }
      ],
      experience: [
        {
          company: 'Tech Innovators',
          position: 'Frontend Developer',
          startDate: '2020-04',
          endDate: '',
          current: true,
          description: 'Creating beautiful, accessible and functional user interfaces for enterprise applications with focus on performance and user experience.',
          responsibilities: [
            'Developing responsive web applications with React and TypeScript',
            'Implementing and maintaining design systems with Storybook and Styled Components',
            'Optimizing frontend performance (Core Web Vitals, Lighthouse scores 95+)',
            'Collaborating with UX designers to implement pixel-perfect designs',
            'Writing unit and integration tests with Jest and React Testing Library',
            'Conducting code reviews and mentoring junior developers',
            'Implementing accessibility standards (WCAG 2.1 AA compliance)',
            'Working with REST APIs and GraphQL for data fetching',
            'Building reusable component libraries',
            'Participating in design critiques and user research sessions'
          ],
          technologies: ['React', 'TypeScript', 'Vue.js', 'Next.js', 'Tailwind CSS', 'Styled Components', 'Figma', 'Storybook', 'Jest', 'Cypress', 'GraphQL', 'Webpack', 'Vite'],
          achievements: [
            'Improved app loading time by 50% through code splitting and lazy loading',
            'Implemented design system adopted across 5 products, saving 200+ dev hours',
            'Achieved 100% accessibility compliance (WCAG 2.1 AA) on main product',
            'Reduced bundle size by 40% through optimization',
            'Led frontend architecture migration to TypeScript'
          ]
        },
        {
          company: 'Digital Agency Madrid',
          position: 'Junior Frontend Developer',
          startDate: '2020-04',
          endDate: '2020-12',
          current: false,
          description: 'Developed websites and landing pages for various clients including e-commerce and corporate sites.',
          responsibilities: [
            'Built responsive websites with HTML, CSS, and JavaScript',
            'Implemented animations with GSAP and CSS transitions',
            'Integrated CMS systems (WordPress, Contentful)',
            'Optimized images and assets for web performance',
            'Cross-browser testing and bug fixing',
            'Client communication and project demos'
          ],
          technologies: ['HTML', 'CSS', 'JavaScript', 'WordPress', 'GSAP', 'Bootstrap', 'Sass', 'Gulp']
        },
        {
          company: 'Freelance',
          position: 'Web Designer & Developer',
          startDate: '2019',
          endDate: '2020',
          current: false,
          description: 'Freelance web design and development for small businesses',
          responsibilities: [
            'Designed and developed custom websites',
            'Created branding and visual identities',
            'Provided ongoing maintenance and support'
          ],
          technologies: ['HTML', 'CSS', 'JavaScript', 'Figma', 'Adobe XD', 'WordPress']
        }
      ],
      technicalSkills: [
        { name: 'React', level: 'expert', category: 'framework', yearsOfExperience: 5 },
        { name: 'Vue.js', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
        { name: 'Next.js', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
        { name: 'Angular', level: 'basic', category: 'framework', yearsOfExperience: 1 },
        { name: 'TypeScript', level: 'advanced', category: 'language', yearsOfExperience: 4 },
        { name: 'JavaScript', level: 'expert', category: 'language', yearsOfExperience: 6 },
        { name: 'HTML', level: 'expert', category: 'language', yearsOfExperience: 7 },
        { name: 'CSS', level: 'expert', category: 'language', yearsOfExperience: 7 },
        { name: 'Tailwind CSS', level: 'advanced', category: 'framework', yearsOfExperience: 3 },
        { name: 'Styled Components', level: 'advanced', category: 'library', yearsOfExperience: 4 },
        { name: 'SASS/SCSS', level: 'advanced', category: 'tool', yearsOfExperience: 5 },
        { name: 'CSS Modules', level: 'advanced', category: 'tool', yearsOfExperience: 3 },
        { name: 'Figma', level: 'advanced', category: 'tool', yearsOfExperience: 4 },
        { name: 'Adobe XD', level: 'intermediate', category: 'tool', yearsOfExperience: 3 },
        { name: 'Sketch', level: 'intermediate', category: 'tool', yearsOfExperience: 2 },
        { name: 'Webpack', level: 'intermediate', category: 'tool', yearsOfExperience: 3 },
        { name: 'Vite', level: 'intermediate', category: 'tool', yearsOfExperience: 2 },
        { name: 'Jest', level: 'intermediate', category: 'testing', yearsOfExperience: 3 },
        { name: 'Cypress', level: 'intermediate', category: 'testing', yearsOfExperience: 2 },
        { name: 'React Testing Library', level: 'advanced', category: 'testing', yearsOfExperience: 3 },
        { name: 'Storybook', level: 'advanced', category: 'tool', yearsOfExperience: 3 },
        { name: 'Git', level: 'advanced', category: 'tool', yearsOfExperience: 5 },
        { name: 'Redux', level: 'advanced', category: 'library', yearsOfExperience: 4 },
        { name: 'Zustand', level: 'intermediate', category: 'library', yearsOfExperience: 2 },
        { name: 'GraphQL', level: 'intermediate', category: 'tool', yearsOfExperience: 2 },
        { name: 'REST APIs', level: 'advanced', category: 'tool', yearsOfExperience: 5 }
      ],
      softSkills: ['Creativity', 'Attention to Detail', 'Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Empathy', 'User-Centric Thinking', 'Visual Design', 'Collaboration'],
      languages: [
        { language: 'Spanish', level: 'native' },
        { language: 'English', level: 'B2' },
        { language: 'Italian', level: 'B1' },
        { language: 'Portuguese', level: 'A2' }
      ],
      certifications: [
        {
          name: 'React Professional Certification',
          issuer: 'Meta',
          date: '2022-08',
          credentialId: 'META-REACT-2022-567',
          url: 'https://www.coursera.org/account/accomplishments/verify/META567'
        },
        {
          name: 'Web Accessibility Specialist (WAS)',
          issuer: 'IAAP',
          date: '2023-03',
          credentialId: 'WAS-2023-123',
          expiryDate: '2026-03'
        },
        {
          name: 'Advanced CSS and Sass',
          issuer: 'Udemy',
          date: '2021-05',
          credentialId: 'UC-CSS-SASS-2021'
        },
        {
          name: 'UX Design Professional Certificate',
          issuer: 'Interaction Design Foundation',
          date: '2020-06'
        }
      ],
      projects: [
        {
          name: 'Design System Library - Innovate UI',
          description: 'Created comprehensive design system library with 50+ reusable React components, complete documentation, and accessibility compliance.',
          role: 'Lead Frontend Developer & Designer',
          technologies: ['React', 'TypeScript', 'Storybook', 'Styled Components', 'Figma', 'Chromatic'],
          url: 'https://github.com/anafrontend/design-system',
          startDate: '2022-03',
          endDate: '2023-01',
          highlights: [
            'Adopted across 5 products with 20+ developers',
            'Reduced UI development time by 40%',
            'Full WCAG 2.1 AA accessibility compliance',
            '50+ documented components with interactive examples',
            'Automated visual regression testing with Chromatic'
          ]
        },
        {
          name: 'Personal Portfolio Website',
          description: 'Creative portfolio website showcasing design and development skills with 3D animations and interactive elements.',
          role: 'Designer & Developer',
          technologies: ['Next.js', 'Three.js', 'GSAP', 'Tailwind CSS', 'Vercel'],
          url: 'https://anamartinez.design',
          startDate: '2023-01',
          endDate: '2023-03',
          highlights: [
            'Featured on Awwwards',
            'Lighthouse score 98/100',
            '10k+ monthly visitors'
          ]
        },
        {
          name: 'E-commerce Platform UI Redesign',
          description: 'Led complete UI/UX redesign of e-commerce platform serving 50k+ users.',
          role: 'Lead Frontend Developer',
          technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
          startDate: '2021-09',
          endDate: '2022-02',
          highlights: [
            'Increased conversion rate by 25%',
            'Improved mobile performance by 60%',
            'Reduced cart abandonment by 15%'
          ]
        }
      ],
      publications: [
        {
          title: 'Building Accessible React Applications: A Complete Guide',
          publisher: 'Dev.to',
          date: '2023-07',
          url: 'https://dev.to/anamartinez/accessible-react'
        },
        {
          title: 'CSS Grid vs Flexbox: When to Use Which',
          publisher: 'CSS-Tricks',
          date: '2022-11',
          url: 'https://css-tricks.com/grid-vs-flexbox'
        }
      ],
      volunteerWork: [
        {
          organization: 'Women in Tech Madrid',
          role: 'Mentor & Workshop Facilitator',
          description: 'Mentoring women starting their careers in frontend development and conducting monthly workshops on React and web design.',
          startDate: '2022-01',
          current: true,
          hoursPerWeek: 3
        },
        {
          organization: 'CodeBar Madrid',
          role: 'Frontend Coach',
          description: 'Coaching beginners in HTML, CSS, and JavaScript',
          startDate: '2021-06',
          current: true,
          hoursPerWeek: 2
        }
      ],
      awards: [
        {
          title: 'Best Design Project 2019',
          issuer: 'Universidad Complutense de Madrid',
          date: '2019-06',
          description: 'Awarded for innovative UX/UI design project on accessibility'
        },
        {
          title: 'Portfolio Featured on Awwwards',
          issuer: 'Awwwards',
          date: '2023-04',
          description: 'Personal portfolio website featured for creative design and technical excellence'
        }
      ],
      summary: 'Creative and detail-oriented Frontend Developer with 5+ years of experience specializing in React and modern CSS. Passionate about creating accessible, performant, and beautiful user interfaces that delight users. Strong background in UX/UI design with expertise in design systems and component libraries. Proven ability to bridge the gap between design and development. Committed to web accessibility and performance optimization. Active mentor in the tech community.',
      interests: ['UX/UI Design', 'Web Accessibility', 'Animation', 'Design Systems', 'Web Performance', 'Typography', 'Color Theory', 'Micro-interactions'],
      hobbies: ['Sketching and illustration', 'Photography', 'Visiting museums', 'Yoga', 'Reading design books'],
      availability: {
        noticePeriod: '2 weeks',
        availableFrom: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        willingToRelocate: false,
        remoteWork: 'yes',
        preferredWorkArrangement: 'hybrid',
        travelWillingness: '10%'
      },
      references: [
        {
          name: 'Carlos Rodríguez Martín',
          position: 'Senior Full Stack Developer at Tech Innovators',
          email: 'carlos.dev@example.com',
          phone: '+34 666 123 456',
          relationship: 'Team Lead'
        }
      ],
      completenessScore: 96
    }
  };
  
  // Generate currículos for all employees with complete profiles
  const cvs = [];
  
  for (const [email, profile] of Object.entries(employeeProfiles)) {
    const cv = generateCompleteCV(email, profile.orgIndex || 0, profile);
    if (cv) cvs.push(cv);
  }
  
  // TODO: Add remaining employees (David, Laura, Sarah, Michael, Emma, Yuki, Li Wei, Priya, Pending users)
  // For now, keeping original currículos for employees not yet migrated to new format
  
  const createdCVs = await CV.insertMany(cvs);
  console.log(`✅ Created ${createdCVs.length} enhanced comprehensive currículos with complete data`);
  return createdCVs;
};

module.exports = { seedCVs };
