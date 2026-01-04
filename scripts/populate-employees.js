/**
 * Script para poblar la base de datos con empleados de prueba
 * Uso: node scripts/populate-employees.js [cantidad]
 * Ejemplo: node scripts/populate-employees.js 50
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user.model');
const CV = require('../src/models/cv.model');

// Datos de ejemplo realistas
const FIRST_NAMES = [
  'María', 'Juan', 'Ana', 'Carlos', 'Laura', 'David', 'Elena', 'Miguel',
  'Sofia', 'Pedro', 'Carmen', 'Javier', 'Isabel', 'Antonio', 'Rosa',
  'Francisco', 'Marta', 'José', 'Lucia', 'Manuel', 'Patricia', 'Daniel',
  'Andrea', 'Rafael', 'Cristina', 'Alejandro', 'Beatriz', 'Fernando',
  'Natalia', 'Ricardo', 'Paula', 'Alberto', 'Raquel', 'Sergio', 'Silvia',
  'Jorge', 'Teresa', 'Luis', 'Pilar', 'Ángel', 'Inés', 'Víctor', 'Alicia',
  'Roberto', 'Eva', 'Diego', 'Clara', 'Pablo', 'Nuria', 'Adrián'
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez',
  'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández',
  'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
  'Serrano', 'Blanco', 'Molina', 'Castro', 'Ortiz', 'Rubio', 'Marín',
  'Sanz', 'Iglesias', 'Nuñez', 'Medina', 'Garrido', 'Santos'
];

const SKILLS = [
  // Frontend
  'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue.js', 'HTML5', 'CSS3',
  'Next.js', 'Redux', 'Tailwind CSS', 'Bootstrap', 'Webpack', 'Vite',
  // Backend
  'Node.js', 'Express.js', 'Python', 'Django', 'Flask', 'FastAPI', 'Java',
  'Spring Boot', 'C#', '.NET Core', 'Ruby', 'Rails', 'Go', 'PHP', 'Laravel',
  // Databases
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'DynamoDB',
  'Oracle', 'SQL Server', 'Cassandra', 'Neo4j',
  // Cloud & DevOps
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
  'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'ArgoCD',
  // Other
  'Git', 'REST APIs', 'GraphQL', 'Microservices', 'gRPC', 'RabbitMQ',
  'Kafka', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Agile', 'Scrum'
];

const COMPANIES = [
  'TechCorp', 'Innovatech', 'DataSolutions', 'CloudFirst', 'DevMasters',
  'CodeFactory', 'DigitalWorks', 'SmartSystems', 'NextGen Tech', 'Pixel Labs',
  'ByteForce', 'WebCrafters', 'AppGenius', 'SoftwarePro', 'TechVision'
];

const POSITIONS = [
  'Software Developer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'DevOps Engineer', 'Data Engineer',
  'QA Engineer', 'Solutions Architect', 'Technical Lead',
  'Senior Developer', 'Junior Developer'
];

const COUNTRIES = [
  { name: 'España', timezone: 'Europe/Madrid' },
  { name: 'México', timezone: 'America/Mexico_City' },
  { name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires' },
  { name: 'Colombia', timezone: 'America/Bogota' },
  { name: 'Chile', timezone: 'America/Santiago' },
  { name: 'Perú', timezone: 'America/Lima' },
  { name: 'Estados Unidos', timezone: 'America/New_York' },
  { name: 'Reino Unido', timezone: 'Europe/London' },
  { name: 'Alemania', timezone: 'Europe/Berlin' },
  { name: 'Francia', timezone: 'Europe/Paris' }
];

const KM_TOOLS = [
  'Confluence', 'Notion', 'SharePoint', 'Jira', 'Wiki', 'GitHub Wiki',
  'GitBook', 'Markdown', 'Obsidian', 'Roam Research'
];

const LANGUAGES = [
  { language: 'Español', level: 'nativo' },
  { language: 'Inglés', level: 'fluido' },
  { language: 'Inglés', level: 'avanzado' },
  { language: 'Inglés', level: 'intermedio' },
  { language: 'Francés', level: 'básico' },
  { language: 'Alemán', level: 'básico' },
  { language: 'Portugués', level: 'intermedio' },
  { language: 'Inglés', level: 'C1' },
  { language: 'Inglés', level: 'B2' }
];

// Función para generar un número aleatorio
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para seleccionar elementos aleatorios de un array
function randomSample(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Función para generar un email único
function generateEmail(firstName, lastName, index) {
  const cleanFirst = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const cleanLast = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return `${cleanFirst}.${cleanLast}${index}@example.com`;
}

// Función para generar un usuario
async function generateUser(index, organizationId) {
  const firstName = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
  const lastName1 = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
  const lastName2 = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
  const fullName = `${firstName} ${lastName1} ${lastName2}`;
  const location = COUNTRIES[randomInt(0, COUNTRIES.length - 1)];
  
  const passwordHash = await bcrypt.hash('Test1234!', 10);
  
  return {
    email: generateEmail(firstName, lastName1, index),
    name: fullName,
    passwordHash,
    role: 'employee',
    organization: organizationId,
    isConfirmed: true,
    country: location.name,
    timezone: location.timezone,
    flexibleSchedule: Math.random() > 0.5,
    preferredWorkingHours: {
      start: randomInt(7, 10) + ':00',
      end: randomInt(16, 19) + ':00'
    },
    createdAt: new Date(),
    lastLogin: new Date()
  };
}

// Función para generar experiencia laboral
function generateExperience(count) {
  const experiences = [];
  let currentYear = new Date().getFullYear();
  
  for (let i = 0; i < count; i++) {
    const yearsAgo = randomInt(1, 10);
    const duration = randomInt(6, 36); // meses
    const startYear = currentYear - yearsAgo;
    const endYear = i === 0 ? null : startYear + Math.floor(duration / 12);
    
    experiences.push({
      company: COMPANIES[randomInt(0, COMPANIES.length - 1)],
      position: POSITIONS[randomInt(0, POSITIONS.length - 1)],
      startDate: `${startYear}-${String(randomInt(1, 12)).padStart(2, '0')}`,
      endDate: endYear ? `${endYear}-${String(randomInt(1, 12)).padStart(2, '0')}` : null,
      current: i === 0 && Math.random() > 0.3,
      description: 'Desarrollo de aplicaciones web y APIs REST. Trabajo en equipo ágil.',
      achievements: [
        'Implementación de microservicios',
        'Optimización de rendimiento',
        'Mentoría a juniors'
      ]
    });
  }
  
  return experiences;
}

// Función para generar un CV
function generateCV(userId, organizationId) {
  const yearsExperience = randomInt(1, 15);
  const skillCount = randomInt(5, 15);
  const selectedSkills = randomSample(SKILLS, skillCount);
  const experienceCount = Math.min(Math.ceil(yearsExperience / 2), 5);
  
  // Calcular nivel de experiencia
  let experienceLevel;
  if (yearsExperience < 3) experienceLevel = 'junior';
  else if (yearsExperience < 7) experienceLevel = 'mid';
  else experienceLevel = 'senior';
  
  return {
    userId,
    organization: organizationId,
    organizationStatus: 'accepted',
    contact: {
      email: null, // Se usa el del usuario
      phones: [{
        number: `+34 ${randomInt(600, 799)} ${randomInt(100, 999)} ${randomInt(100, 999)}`,
        type: 'mobile'
      }],
      links: {
        github: Math.random() > 0.5 ? `https://github.com/user${randomInt(1, 999)}` : null,
        linkedin: Math.random() > 0.7 ? `https://linkedin.com/in/user${randomInt(1, 999)}` : null
      }
    },
    education: [{
      institution: 'Universidad Politécnica',
      degree: 'Ingeniería Informática',
      fieldOfStudy: 'Desarrollo de Software',
      startDate: '2010',
      endDate: '2014',
      current: false
    }],
    experience: generateExperience(experienceCount),
    skills: selectedSkills.map(skill => ({
      name: skill,
      level: ['básico', 'intermedio', 'avanzado', 'experto'][randomInt(1, 3)],
      yearsOfExperience: randomInt(1, Math.min(yearsExperience, 10))
    })),
    languages: randomSample(LANGUAGES, randomInt(2, 4)),
    certifications: Math.random() > 0.6 ? [
      {
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        dateObtained: `${new Date().getFullYear() - randomInt(1, 3)}`
      }
    ] : [],
    
    // ============================================
    // NEW: Enhanced fields for risk detection
    // ============================================
    crossCulturalExperience: {
      hasWorkedInternationally: Math.random() > 0.4,
      countriesWorkedIn: Math.random() > 0.4 ? randomSample(['USA', 'UK', 'Germany', 'Spain'], randomInt(1, 3)) : [],
      languagesSpoken: randomInt(2, 4),
      mediationSkills: Math.random() > 0.7
    },
    
    remoteWorkExperience: {
      yearsRemote: Math.random() > 0.3 ? randomInt(1, 5) : 0,
      hasRemoteExperience: Math.random() > 0.3,
      preferredWorkModel: ['remote', 'hybrid', 'on-site'][randomInt(0, 2)],
      timezoneFlexibility: Math.random() > 0.5
    },
    
    communicationSkills: {
      documentationExperience: Math.random() > 0.4,
      presentationSkills: Math.random() > 0.5,
      knowledgeManagementTools: Math.random() > 0.5 ? randomSample(KM_TOOLS, randomInt(1, 3)) : [],
      effectiveCommunicator: Math.random() > 0.3
    },
    
    bfi44Profile: {
      hasCompletedBFI44: Math.random() > 0.5,
      scores: {
        extraversion: randomInt(20, 40),
        agreeableness: randomInt(25, 40),
        conscientiousness: randomInt(25, 45),
        neuroticism: randomInt(10, 35),
        openness: randomInt(25, 45)
      }
    },
    
    summary: `Profesional con ${yearsExperience} años de experiencia en desarrollo de software. Especializado en ${selectedSkills.slice(0, 3).join(', ')}.`,
    availability: {
      immediate: Math.random() > 0.7,
      startDate: Math.random() > 0.7 ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  };
}

// Función principal
async function populateEmployees(count = 50, organizationId = null) {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend');
    console.log('✅ Conectado a MongoDB\n');
    
    // Si no se proporciona organizationId, buscar o crear una
    if (!organizationId) {
      const Organization = require('../src/models/organization.model');
      let org = await Organization.findOne({ name: 'Tech Solutions SA' });
      
      if (!org) {
        console.log('📦 Creando organización de prueba...');
        
        // Primero crear un usuario admin temporal
        const adminUser = await User.create({
          name: 'Admin Temporal',
          email: 'admin.temporal@techsolutions.com',
          passwordHash: await bcrypt.hash('Admin1234!', 10),
          role: 'org_admin',
          isConfirmed: true,
          createdAt: new Date()
        });
        
        org = await Organization.create({
          name: 'Tech Solutions SA',
          description: 'Empresa de desarrollo de software',
          industry: 'software_development',
          size: '201-500',
          contact: {
            email: 'info@techsolutions.com',
            phone: '+34 912 345 678',
            website: 'https://techsolutions.com'
          },
          address: {
            street: 'Calle Principal 123',
            city: 'Madrid',
            country: 'España',
            postalCode: '28001'
          },
          admin: adminUser._id,
          remoteWorkConfiguration: {
            hasRemoteWorkPolicy: true,
            providesTechSupport: true,
            vpnAccess: true
          },
          developmentPractices: {
            hasCICD: true,
            usesVersionControl: true,
            hasCodeReview: true
          },
          knowledgeManagement: {
            hasKnowledgeBase: true,
            documentationPlatform: 'Confluence'
          }
        });
        
        // Actualizar el admin con la organización
        adminUser.organization = org._id;
        await adminUser.save();
        
        // Crear un Project Manager para pruebas
        const pmUser = await User.create({
          name: 'Carlos Fernández',
          email: 'carlos.fernandez@techsolutions.com',
          passwordHash: await bcrypt.hash('PM1234!', 10),
          role: 'employee',
          organization: org._id,
          isConfirmed: true,
          country: 'España',
          timezone: 'Europe/Madrid',
          flexibleSchedule: true,
          createdAt: new Date()
        });
        
        // Crear CV para el PM
        await CV.create({
          userId: pmUser._id,
          organization: org._id,
          organizationStatus: 'accepted',
          contact: {
            email: 'carlos.fernandez@techsolutions.com',
            phones: [{ number: '+34 600 123 456', type: 'mobile' }]
          },
          education: [{
            institution: 'Universidad Politécnica de Madrid',
            degree: 'Máster en Dirección de Proyectos',
            fieldOfStudy: 'Project Management',
            startDate: '2015',
            endDate: '2017'
          }],
          experience: [{
            company: 'Tech Solutions SA',
            position: 'Senior Project Manager',
            startDate: '2017-09',
            current: true,
            description: 'Gestión de proyectos de desarrollo de software, coordinación de equipos distribuidos'
          }],
          skills: [
            { name: 'Project Management', level: 'experto', yearsOfExperience: 7 },
            { name: 'Agile', level: 'experto', yearsOfExperience: 7 },
            { name: 'Scrum', level: 'experto', yearsOfExperience: 7 },
            { name: 'Jira', level: 'avanzado', yearsOfExperience: 6 },
            { name: 'Risk Management', level: 'avanzado', yearsOfExperience: 5 }
          ],
          languages: [
            { language: 'Español', level: 'nativo' },
            { language: 'Inglés', level: 'fluido' }
          ],
          certifications: [
            { name: 'PMP - Project Management Professional', issuer: 'PMI', dateObtained: '2019' },
            { name: 'Certified ScrumMaster', issuer: 'Scrum Alliance', dateObtained: '2018' }
          ],
          crossCulturalExperience: {
            hasWorkedInternationally: true,
            countriesWorkedIn: ['España', 'USA', 'UK'],
            languagesSpoken: 2,
            mediationSkills: true
          },
          remoteWorkExperience: {
            yearsRemote: 5,
            hasRemoteExperience: true,
            preferredWorkModel: 'hybrid',
            timezoneFlexibility: true
          },
          communicationSkills: {
            documentationExperience: true,
            presentationSkills: true,
            knowledgeManagementTools: ['Confluence', 'Jira', 'Notion'],
            effectiveCommunicator: true
          },
          bfi44Profile: {
            hasCompletedBFI44: true,
            scores: {
              extraversion: 38,
              agreeableness: 40,
              conscientiousness: 42,
              neuroticism: 18,
              openness: 40
            }
          },
          summary: 'Project Manager experimentado con más de 7 años liderando equipos distribuidos. Especializado en metodologías ágiles y gestión de riesgos.'
        });
        
        // Añadir el PM a la organización con permisos
        org.employees.push({
          user: pmUser._id,
          position: 'Senior Project Manager',
          department: 'Technology',
          status: 'active',
          isProjectManager: true
        });
        await org.save();
        
        console.log(`✅ Organización creada: ${org._id}`);
        console.log(`✅ Admin creado: ${adminUser.email}`);
        console.log(`✅ Project Manager creado: ${pmUser.email}\n`);
      }
      
      organizationId = org._id;
    }
    
    console.log(`👥 Creando ${count} empleados...\n`);
    
    const users = [];
    const cvs = [];
    
    for (let i = 0; i < count; i++) {
      const userData = await generateUser(i, organizationId);
      const user = await User.create(userData);
      users.push(user);
      
      const cvData = generateCV(user._id, organizationId);
      const cv = await CV.create(cvData);
      cvs.push(cv);
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Creados ${i + 1}/${count} empleados...`);
      }
    }
    
    console.log(`\n✅ ${users.length} empleados creados exitosamente`);
    console.log(`✅ ${cvs.length} CVs creados exitosamente`);
    
    // Añadir empleados al array de la organización
    console.log(`\n📝 Registrando empleados en la organización...`);
    const Organization = require('../src/models/organization.model');
    const org = await Organization.findById(organizationId);
    
    if (org) {
      for (const user of users) {
        // Verificar si el empleado ya está en el array
        const exists = org.employees.some(emp => emp.user.toString() === user._id.toString());
        
        if (!exists) {
          org.employees.push({
            user: user._id,
            position: 'Software Developer',
            department: 'Technology',
            status: 'active',
            isProjectManager: false
          });
        }
      }
      
      await org.save();
      console.log(`✅ ${users.length} empleados registrados en la organización`);
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`   - Organización: ${organizationId}`);
    console.log(`   - Total empleados: ${users.length}`);
    console.log(`\n👤 CREDENCIALES DE ACCESO:`);
    console.log(`\n   🔑 ADMIN (Administrador de Organización):`);
    console.log(`      Email: admin.temporal@techsolutions.com`);
    console.log(`      Password: Admin1234!`);
    console.log(`\n   🔑 PROJECT MANAGER (Para crear proyectos):`);
    console.log(`      Email: carlos.fernandez@techsolutions.com`);
    console.log(`      Password: PM1234!`);
    console.log(`\n   🔑 EMPLEADOS (Para selección de equipo):`);
    console.log(`      Email ejemplo: ${users[0].email}`);
    console.log(`      Password para todos: Test1234!`);
    console.log(`\n💡 SIGUIENTE PASO:`);
    console.log(`   1. Login como Project Manager (carlos.fernandez@techsolutions.com)`);
    console.log(`   2. Crear un proyecto con los nuevos campos`);
    console.log(`   3. Analizar riesgos → Verás los 13 tipos detectados`);
    console.log(`   4. Seleccionar equipo → Recomendaciones por Manhattan distance`);
    console.log(`   5. Ver cómo cambian los riesgos al añadir/quitar miembros`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar el script
const count = parseInt(process.argv[2]) || 50;
const organizationId = process.argv[3] || null;

console.log('════════════════════════════════════════════');
console.log('  📦 SCRIPT DE POBLACIÓN DE EMPLEADOS');
console.log('════════════════════════════════════════════\n');

populateEmployees(count, organizationId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
