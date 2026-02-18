/**
 * Diccionarios de datos para extracción de currículos
 * Contiene listas de tecnologías, ciudades, idiomas y secciones comunes
 */

const dictionaries = {
  sectionKeywords: {
    contact: ['contacto', 'contact', 'información personal', 'personal information', 'datos personales', 'información de contacto'],
    education: ['educación', 'education', 'formación académica', 'estudios', 'academic background', 'titulación', 'formación'],
    experience: ['experiencia', 'experience', 'experiencia laboral', 'historial laboral', 'trabajo', 'work experience', 'employment', 'experiencia profesional', 'trayectoria profesional'],
    skills: ['habilidades', 'skills', 'competencias', 'tecnologías', 'technologies', 'conocimientos técnicos', 'technical skills', 'habilidades técnicas', 'stack tecnológico', 'tech stack'],
    languages: ['idiomas', 'languages', 'lenguajes'],
    projects: ['proyectos', 'projects', 'mis proyectos', 'portfolio'],
    certifications: ['certificaciones', 'certifications', 'certificados', 'certificates', 'cursos', 'formación complementaria'],
    achievements: ['logros', 'achievements', 'premios', 'awards', 'publicaciones', 'publications', 'reconocimientos', 'logros y premios']
  },

  technologies: {
    languages: [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 
      'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB',
      'Perl', 'Shell', 'Bash', 'PowerShell', 'HTML', 'CSS', 'SQL'
    ],
    
    frontend: [
      'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Nuxt.js', 
      'Gatsby', 'Ember.js', 'Backbone.js', 'jQuery', 'Bootstrap', 
      'Tailwind CSS', 'Material-UI', 'Ant Design'
    ],
    
    backend: [
      'Node.js', 'Express', 'Nest.js', 'Django', 'Flask', 'FastAPI',
      'Spring Boot', 'Spring', 'Hibernate', 'ASP.NET', '.NET Core',
      'Laravel', 'Symfony', 'Ruby on Rails', 'Gin', 'Echo'
    ],
    
    databases: [
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
      'SQL Server', 'MariaDB', 'Cassandra', 'DynamoDB', 'Firebase',
      'Firestore', 'Elasticsearch', 'Neo4j', 'CouchDB'
    ],
    
    cloud: [
      'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Google Cloud Platform', 'Heroku', 'DigitalOcean',
      'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions',
      'CircleCI', 'Travis CI', 'Terraform', 'Ansible', 'Chef', 'Puppet'
    ],
    
    tools: [
      'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence',
      'Slack', 'VS Code', 'IntelliJ', 'Eclipse', 'PyCharm', 'Postman',
      'Swagger', 'GraphQL', 'REST', 'API', 'Microservices', 'Agile',
      'Scrum', 'Kanban', 'TDD', 'CI/CD', 'Linux', 'Unix', 'Windows'
    ]
  },

  technologyNormalizations: {
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'react.js': 'React',
    'reactjs': 'React',
    'vue.js': 'Vue',
    'vuejs': 'Vue',
    'angular.js': 'Angular',
    'angularjs': 'Angular',
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'py': 'Python',
    'aws': 'Amazon Web Services',
    'gcp': 'Google Cloud Platform',
    'k8s': 'Kubernetes',
    'postgres': 'PostgreSQL',
    'mongo': 'MongoDB',
    'mysql': 'MySQL',
    'sql server': 'Microsoft SQL Server',
    'mssql': 'Microsoft SQL Server'
  },

  languageLevels: {
    spanish: ['nativo', 'nativa', 'lengua materna', 'native'],
    bilingual: ['bilingüe', 'bilingual'],
    fluent: ['fluido', 'fluida', 'fluent'],
    advanced: ['avanzado', 'avanzada', 'advanced', 'c1', 'c2'],
    intermediate: ['intermedio', 'intermedia', 'intermediate', 'b1', 'b2'],
    basic: ['básico', 'básica', 'basic', 'a1', 'a2']
  },

  commonLanguages: [
    'Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués',
    'Chino', 'Japonés', 'Coreano', 'Árabe', 'Ruso', 'Holandés',
    'Spanish', 'English', 'French', 'German', 'Italian', 'Portuguese',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch'
  ],

  cities: {
    spain: [
      'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga',
      'Murcia', 'Palma', 'Las Palmas', 'Bilbao', 'Alicante', 'Córdoba',
      'Valladolid', 'Vigo', 'Gijón', 'Hospitalet', "L'Hospitalet", 'Vitoria',
      'Granada', 'Elche', 'Oviedo', 'Badalona', 'Cartagena', 'Terrassa',
      'Jerez', 'Sabadell', 'Móstoles', 'Santa Cruz', 'Pamplona', 'Almería',
      'Fuenlabrada', 'Leganés', 'Donostia', 'San Sebastián', 'Burgos',
      'Santander', 'Castellón', 'Alcalá', 'Albacete', 'Getafe', 'Salamanca'
    ],
    international: [
      'London', 'Paris', 'Berlin', 'Rome', 'Amsterdam', 'Brussels',
      'Lisbon', 'Dublin', 'Vienna', 'Prague', 'Warsaw', 'Budapest',
      'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston',
      'Seattle', 'Toronto', 'Vancouver', 'Montreal', 'Mexico City',
      'Buenos Aires', 'São Paulo', 'Rio de Janeiro', 'Santiago', 'Bogotá'
    ]
  },

  countries: [
    'España', 'France', 'Germany', 'Italy', 'Portugal', 'United Kingdom',
    'Ireland', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
    'United States', 'Canada', 'Mexico', 'Argentina', 'Brazil', 'Chile',
    'Colombia', 'Peru', 'Venezuela', 'China', 'Japan', 'South Korea',
    'India', 'Australia', 'New Zealand'
  ],

  experienceKeywords: [
    'desarrollador', 'developer', 'engineer', 'ingeniero',
    'software engineer', 'frontend developer', 'backend developer',
    'full stack', 'fullstack', 'devops', 'sre', 'site reliability',
    'tech lead', 'team lead', 'engineering manager', 'scrum master',
    'product owner', 'qa', 'tester', 'automation engineer',
    'data engineer', 'data scientist', 'ml engineer', 'security engineer',
    'cloud architect', 'solutions architect', 'principal engineer',
    'staff engineer', 'senior', 'junior', 'mid-level', 'remoto', 'remote',
    'híbrido', 'hybrid', 'presencial', 'on-site'
  ],

  degreeKeywords: [
    'grado', 'licenciatura', 'ingeniería informática', 'ingeniería software',
    'computer science', 'sistemas', 'telecomunicaciones', 'máster', 'master',
    'mba', 'doctorado', 'phd', 'bootcamp', 'técnico', 'certificado',
    'diplomatura', 'fp', 'formación profesional', 'degree', 'bachelor',
    'master\'s', 'doctorate', 'computer engineering', 'software engineering',
    'data science', 'cybersecurity'
  ],

  certificationKeywords: [
    'certified', 'certificado', 'certification', 'certificación',
    'professional', 'profesional', 'associate', 'expert', 'specialist',
    'aws', 'azure', 'gcp', 'kubernetes', 'ckad', 'cka', 'cks',
    'oracle', 'cisco', 'comptia', 'pmp', 'csm', 'psm', 'safe',
    'terraform', 'docker', 'jenkins', 'scrum', 'agile'
  ],

  departments: [
    'Ingeniería de Software',
    'Frontend',
    'Backend',
    'Full Stack',
    'DevOps',
    'SRE',
    'QA y Testing',
    'Arquitectura',
    'Data Engineering',
    'Data Science',
    'Machine Learning',
    'Ciberseguridad',
    'Cloud Infrastructure',
    'Product Management',
    'UX/UI Design',
    'Mobile Development'
  ],

  workModes: [
    'remoto',
    'remote',
    'híbrido',
    'hybrid',
    'presencial',
    'on-site',
    'flexible',
    'distributed',
    'distribuido'
  ],

  remoteSoftSkills: [
    'comunicación asíncrona',
    'autogestión',
    'trabajo remoto',
    'colaboración distribuida',
    'autonomía',
    'comunicación escrita',
    'gestión del tiempo',
    'adaptabilidad',
    'proactividad',
    'resolución de problemas',
    'trabajo en equipo distribuido'
  ]
};

/**
 * Obtiene todas las tecnologías en un array plano
 */
dictionaries.getAllTechnologies = function() {
  const allTech = [];
  Object.values(this.technologies).forEach(category => {
    allTech.push(...category);
  });
  return allTech;
};

/**
 * Obtiene todas las ciudades en un array plano
 */
dictionaries.getAllCities = function() {
  return [...this.cities.spain, ...this.cities.international];
};

/**
 * Normaliza un nombre de tecnología
 */
dictionaries.normalizeTechnology = function(tech) {
  const techLower = tech.toLowerCase().trim();
  return this.technologyNormalizations[techLower] || tech.trim();
};

/**
 * Detecta la categoría de una tecnología
 */
dictionaries.detectTechnologyCategory = function(tech) {
  const techNormalized = this.normalizeTechnology(tech);
  
  for (const [category, techs] of Object.entries(this.technologies)) {
    if (techs.some(t => t.toLowerCase() === techNormalized.toLowerCase())) {
      switch(category) {
        case 'languages': return 'lenguaje';
        case 'frontend': return 'framework';
        case 'backend': return 'framework';
        case 'databases': return 'base_datos';
        case 'cloud': return 'cloud';
        case 'tools': return 'herramienta';
        default: return 'otro';
      }
    }
  }
  
  return 'otro';
};

module.exports = dictionaries;
