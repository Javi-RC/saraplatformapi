// AUTO-GENERATED Employee Profiles - 100+ Employees
// This script automatically generates 100+ employee profiles with diverse data
// Each employee has unique characteristics, roles, and experience levels

const fs = require('fs').promises;
const path = require('path');

// Base data for generation
const FIRST_NAMES = {
  male: ['Carlos', 'David', 'Michael', 'John', 'Robert', 'James', 'William', 'Richard', 'Thomas', 'Daniel', 
         'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Joshua', 'Kevin', 'Brian', 'George',
         'José', 'Luis', 'Miguel', 'Juan', 'Francisco', 'Pedro', 'Alejandro', 'Diego', 'Javier', 'Fernando',
         'Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Haruki', 'Ryu', 'Wei', 'Chen', 'Li', 'Zhang',
         'Raj', 'Amit', 'Arjun', 'Karan', 'Rohan', 'Vikram', 'Lucas', 'Gabriel', 'Rafael', 'Bruno'],
  female: ['Ana', 'Laura', 'Sarah', 'Emma', 'Jennifer', 'Maria', 'Patricia', 'Linda', 'Barbara', 'Elizabeth',
           'Jessica', 'Ashley', 'Emily', 'Samantha', 'Amanda', 'Melissa', 'Michelle', 'Stephanie', 'Nicole', 'Rebecca',
           'Sofia', 'Isabella', 'Camila', 'Valentina', 'Daniela', 'Gabriela', 'Andrea', 'Paula', 'Carolina', 'Mariana',
           'Yuki', 'Sakura', 'Hana', 'Aiko', 'Mei', 'Ling', 'Xia', 'Priya', 'Ananya', 'Diya',
           'Sophie', 'Chloe', 'Olivia', 'Mia', 'Charlotte', 'Amelia', 'Lily', 'Grace', 'Ella', 'Hannah']
};

const LAST_NAMES = {
  hispanic: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores',
             'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Jiménez', 'Hernández', 'Ruiz', 'Vargas'],
  english: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
            'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Walker', 'Hall', 'Allen'],
  asian: ['Tanaka', 'Suzuki', 'Takahashi', 'Yamamoto', 'Watanabe', 'Kobayashi', 'Wang', 'Li', 'Zhang', 'Liu',
          'Chen', 'Yang', 'Sharma', 'Kumar', 'Patel', 'Singh', 'Khan', 'Ali', 'Kim', 'Park'],
  european: ['Mueller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Dubois', 'Martin', 'Bernard', 'Rossi', 'Russo',
             'Silva', 'Santos', 'Ferreira', 'Costa', 'Alves', 'Novak', 'Kowalski', 'Andersson', 'Nielsen', 'Hansen']
};

const CITIES_BY_COUNTRY = {
  'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Bilbao'],
  'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Querétaro'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'San Miguel de Tucumán'],
  'United States': ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Seattle', 'Austin', 'Boston', 'Denver'],
  'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Leeds', 'Liverpool'],
  'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka'],
  'China': ['Beijing', 'Shanghai', 'Shenzhen', 'Guangzhou', 'Hangzhou', 'Chengdu', 'Nanjing'],
  'India': ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte'],
  'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg'],
  'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf'],
  'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Venice', 'Bologna'],
  'Colombia': ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga'],
  'Chile': ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco'],
  'Peru': ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Cusco', 'Piura'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'],
  'Netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  'Poland': ['Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk'],
  'Sweden': ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås']
};

const COUNTRIES = Object.keys(CITIES_BY_COUNTRY);

const POSITIONS = [
  { title: 'Senior Full Stack Developer', specialty: 'Full Stack Development', mainTech: ['JavaScript', 'Node.js', 'React'], levelRange: ['mid', 'senior'] },
  { title: 'Frontend Developer', specialty: 'Frontend & UX/UI', mainTech: ['React', 'TypeScript', 'CSS'], levelRange: ['junior', 'mid', 'senior'] },
  { title: 'Backend Developer', specialty: 'Backend Development', mainTech: ['Java', 'Spring Boot', 'PostgreSQL'], levelRange: ['junior', 'mid', 'senior'] },
  { title: 'Backend Engineer', specialty: 'Backend Development', mainTech: ['Python', 'FastAPI', 'PostgreSQL'], levelRange: ['junior', 'mid', 'senior'] },
  { title: 'QA Engineer', specialty: 'Quality Assurance & Test Automation', mainTech: ['Selenium', 'Cypress', 'JavaScript'], levelRange: ['junior', 'mid', 'senior'] },
  { title: 'DevOps Engineer', specialty: 'DevOps & Cloud Infrastructure', mainTech: ['AWS', 'Kubernetes', 'Terraform'], levelRange: ['mid', 'senior'] },
  { title: 'Solutions Architect', specialty: 'Software Architecture & System Design', mainTech: ['AWS', 'Microservices', 'Java'], levelRange: ['senior'] },
  { title: 'Mobile Developer', specialty: 'Mobile Development', mainTech: ['React Native', 'Swift', 'Kotlin'], levelRange: ['junior', 'mid', 'senior'] },
  { title: 'Data Scientist', specialty: 'Data Science & ML', mainTech: ['Python', 'TensorFlow', 'SQL'], levelRange: ['mid', 'senior'] },
  { title: 'Full Stack Engineer', specialty: 'Full Stack Development', mainTech: ['Python', 'Django', 'Vue.js'], levelRange: ['junior', 'mid', 'senior'] },
  { title: 'Frontend Engineer', specialty: 'Frontend & UX/UI', mainTech: ['Vue.js', 'TypeScript', 'Tailwind'], levelRange: ['mid', 'senior'] },
  { title: 'Software Engineer', specialty: 'Full Stack Development', mainTech: ['JavaScript', 'React', 'Node.js'], levelRange: ['junior', 'mid', 'senior'] },
  { title: 'Cloud Engineer', specialty: 'DevOps & Cloud Infrastructure', mainTech: ['Azure', 'Kubernetes', 'Docker'], levelRange: ['mid', 'senior'] },
  { title: 'Machine Learning Engineer', specialty: 'Data Science & ML', mainTech: ['Python', 'PyTorch', 'Kubernetes'], levelRange: ['mid', 'senior'] },
  { title: 'Site Reliability Engineer', specialty: 'DevOps & Cloud Infrastructure', mainTech: ['Kubernetes', 'Prometheus', 'Go'], levelRange: ['mid', 'senior'] },
  { title: 'Data Engineer', specialty: 'Data Science & ML', mainTech: ['Python', 'Spark', 'Airflow'], levelRange: ['mid', 'senior'] },
  { title: 'Security Engineer', specialty: 'Backend Development', mainTech: ['Python', 'Security Tools', 'Kubernetes'], levelRange: ['mid', 'senior'] },
  { title: 'UI/UX Designer', specialty: 'Frontend & UX/UI', mainTech: ['Figma', 'React', 'CSS'], levelRange: ['junior', 'mid', 'senior'] }
];

// Helper function to generate random employee
function generateRandomEmployee(index) {
  const isMale = Math.random() > 0.5;
  const country = COUNTRIES[index % COUNTRIES.length];
  const position = POSITIONS[index % POSITIONS.length];
  const level = position.levelRange[Math.floor(Math.random() * position.levelRange.length)];
  
  // Years based on level
  const yearsMap = { junior: [1, 2, 3], mid: [4, 5, 6, 7], senior: [8, 9, 10, 11, 12, 15] };
  const years = yearsMap[level][Math.floor(Math.random() * yearsMap[level].length)];
  
  // Generate name based on country
  let firstName, lastName;
  if (isMale) {
    firstName = FIRST_NAMES.male[Math.floor(Math.random() * FIRST_NAMES.male.length)];
  } else {
    firstName = FIRST_NAMES.female[Math.floor(Math.random() * FIRST_NAMES.female.length)];
  }
  
  // Select appropriate last name based on country
  if (['Spain', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru'].includes(country)) {
    lastName = LAST_NAMES.hispanic[Math.floor(Math.random() * LAST_NAMES.hispanic.length)];
  } else if (['United States', 'Canada', 'United Kingdom', 'Australia'].includes(country)) {
    lastName = LAST_NAMES.english[Math.floor(Math.random() * LAST_NAMES.english.length)];
  } else if (['Japan', 'China', 'India'].includes(country)) {
    lastName = LAST_NAMES.asian[Math.floor(Math.random() * LAST_NAMES.asian.length)];
  } else {
    lastName = LAST_NAMES.european[Math.floor(Math.random() * LAST_NAMES.european.length)];
  }
  
  const cities = CITIES_BY_COUNTRY[country];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  // Normalize email by removing accents
  const normalizeEmail = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };
  
  const email = `${normalizeEmail(firstName)}.${normalizeEmail(lastName)}${index}@example.com`;
  
  // Distribute across 3 organizations
  const orgIndex = index % 3;
  
  // Status: most accepted, some pending
  const orgStatus = index < 95 ? 'accepted' : 'pending';
  
  // Completeness score based on level
  const completenessBase = { junior: 85, mid: 92, senior: 96 };
  const completenessScore = completenessBase[level] + Math.floor(Math.random() * 4);
  
  return {
    email,
    orgIndex,
    orgStatus,
    name: `${firstName} ${lastName}`,
    position: level === 'senior' && !position.title.includes('Senior') ? `Senior ${position.title}` : position.title,
    level,
    years,
    specialty: position.specialty,
    mainTech: position.mainTech,
    city,
    country,
    completenessScore
  };
}

// Generate 100 employees (keeping original 12 + generating 88 more)
const COMPLETE_EMPLOYEE_DATA = {
  // Original 12 employees (preserved for consistency)
  employee_0: {
    email: 'carlos.dev@example.com',
    orgIndex: 0,
    name: 'Carlos Rodríguez Martín',
    position: 'Senior Full Stack Developer',
    level: 'senior',
    years: 8,
    specialty: 'Full Stack Development',
    mainTech: ['JavaScript', 'Node.js', 'React'],
    city: 'Madrid',
    country: 'Spain',
    completenessScore: 98
  },
  employee_1: {
    email: 'ana.frontend@example.com',
    orgIndex: 0,
    name: 'Ana Martínez Sánchez',
    position: 'Frontend Developer',
    level: 'mid',
    years: 5,
    specialty: 'Frontend & UX/UI',
    mainTech: ['React', 'TypeScript', 'CSS'],
    city: 'Madrid',
    country: 'Spain',
    completenessScore: 96
  },
  employee_2: {
    email: 'david.backend@example.com',
    orgIndex: 0,
    name: 'David López Fernández',
    position: 'Backend Developer',
    level: 'senior',
    years: 8,
    specialty: 'Backend Development',
    mainTech: ['Java', 'Spring Boot', 'PostgreSQL'],
    city: 'Mexico City',
    country: 'Mexico',
    completenessScore: 97
  },
  employee_3: {
    email: 'laura.qa@example.com',
    orgIndex: 0,
    name: 'Laura González Pérez',
    position: 'QA Engineer',
    level: 'senior',
    years: 5,
    specialty: 'Quality Assurance & Test Automation',
    mainTech: ['Selenium', 'Cypress', 'JavaScript'],
    city: 'Buenos Aires',
    country: 'Argentina',
    completenessScore: 95
  },
  employee_4: {
    email: 'sarah.devops@example.com',
    orgIndex: 1,
    name: 'Sarah Johnson Miller',
    position: 'DevOps Engineer',
    level: 'senior',
    years: 7,
    specialty: 'DevOps & Cloud Infrastructure',
    mainTech: ['AWS', 'Kubernetes', 'Terraform'],
    city: 'San Francisco',
    country: 'United States',
    completenessScore: 99
  },
  employee_5: {
    email: 'michael.arch@example.com',
    orgIndex: 1,
    name: 'Michael Brown Davis',
    position: 'Solutions Architect',
    level: 'senior',
    years: 10,
    specialty: 'Software Architecture & System Design',
    mainTech: ['AWS', 'Microservices', 'Java'],
    city: 'Toronto',
    country: 'Canada',
    completenessScore: 97
  },
  employee_6: {
    email: 'emma.mobile@example.com',
    orgIndex: 1,
    name: 'Emma Wilson Taylor',
    position: 'Mobile Developer',
    level: 'mid',
    years: 6,
    specialty: 'Mobile Development',
    mainTech: ['React Native', 'Swift', 'Kotlin'],
    city: 'London',
    country: 'United Kingdom',
    completenessScore: 94
  },
  employee_7: {
    email: 'yuki.fullstack@example.com',
    orgIndex: 2,
    name: 'Yamamoto Yuki',
    position: 'Full Stack Developer',
    level: 'mid',
    years: 6,
    specialty: 'Full Stack Development',
    mainTech: ['Python', 'Django', 'Vue.js'],
    city: 'Tokyo',
    country: 'Japan',
    completenessScore: 93
  },
  employee_8: {
    email: 'li.wei@example.com',
    orgIndex: 2,
    name: 'Li Wei',
    position: 'Backend Engineer',
    level: 'mid',
    years: 7,
    specialty: 'Backend Development',
    mainTech: ['Python', 'FastAPI', 'PostgreSQL'],
    city: 'Shanghai',
    country: 'China',
    completenessScore: 94
  },
  employee_9: {
    email: 'priya.data@example.com',
    orgIndex: 2,
    name: 'Priya Sharma',
    position: 'Data Scientist',
    level: 'mid',
    years: 5,
    specialty: 'Data Science & ML',
    mainTech: ['Python', 'TensorFlow', 'SQL'],
    city: 'Mumbai',
    country: 'India',
    completenessScore: 95
  },
  employee_10: {
    email: 'pending.user1@example.com',
    orgIndex: 0,
    orgStatus: 'pending',
    name: 'Roberto Silva Costa',
    position: 'Full Stack Developer',
    level: 'mid',
    years: 4,
    specialty: 'Full Stack Development',
    mainTech: ['Python', 'Django', 'React'],
    city: 'São Paulo',
    country: 'Brazil',
    completenessScore: 88
  },
  employee_11: {
    email: 'pending.user2@example.com',
    orgIndex: 0,
    orgStatus: 'pending',
    name: 'Sophie Martin Dubois',
    position: 'Frontend Developer',
    level: 'junior',
    years: 2,
    specialty: 'Frontend Development',
    mainTech: ['React', 'TypeScript', 'CSS'],
    city: 'Paris',
    country: 'France',
    completenessScore: 85
  }
};

// Generate 88 additional employees dynamically
for (let i = 12; i < 100; i++) {
  COMPLETE_EMPLOYEE_DATA[`employee_${i}`] = generateRandomEmployee(i);
}

// Export for use in comprehensive-seed.js
module.exports = { COMPLETE_EMPLOYEE_DATA };

// Instructions for integration:
// The comprehensive-seed.js file should be updated to use this data
// to generate complete CVs automatically for all employees
