/**
 * Script para resetear la contraseña del Project Manager
 * Uso: node scripts/reset-pm-password.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/user.model');
const CV = require('../src/models/cv.model');
const Organization = require('../src/models/organization.model');

async function resetPMPassword() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend');
    console.log('✅ Conectado a MongoDB\n');
    
    const pmEmail = 'carlos.fernandez@techsolutions.com';
    const newPassword = 'PM1234!';
    
    console.log(`🔍 Buscando usuario: ${pmEmail}`);
    
    // Buscar el PM (necesitamos +passwordHash para actualizar)
    let pm = await User.findOne({ email: pmEmail }).select('+passwordHash');
    
    if (!pm) {
      console.log('❌ Usuario no encontrado');
      console.log('📦 Creando Project Manager...\n');
      
      // Buscar organización
      const org = await Organization.findOne({ name: 'Tech Solutions SA' });
      
      if (!org) {
        console.log('❌ Organización "Tech Solutions SA" no encontrada');
        console.log('💡 Ejecuta primero: node scripts/populate-employees.js');
        return;
      }
      
      // Crear PM
      pm = await User.create({
        name: 'Carlos Fernández',
        email: pmEmail,
        passwordHash: await bcrypt.hash(newPassword, 10),
        role: 'employee',
        organization: org._id,
        isConfirmed: true,
        country: 'España',
        timezone: 'Europe/Madrid',
        flexibleSchedule: true,
        createdAt: new Date()
      });
      
      console.log(`✅ Usuario creado: ${pm.name}`);
      
      // Crear CV para el PM
      await CV.create({
        userId: pm._id,
        organization: org._id,
        organizationStatus: 'accepted',
        contact: {
          email: pmEmail,
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
      
      console.log(`✅ CV creado`);
      
      // Añadir el PM a la organización con permisos
      org.employees.push({
        user: pm._id,
        position: 'Senior Project Manager',
        department: 'Technology',
        status: 'active',
        isProjectManager: true
      });
      await org.save();
      
      console.log(`✅ Añadido a organización con permisos de PM`);
      
    } else {
      console.log(`✅ Usuario encontrado: ${pm.name}`);
    }
    
    console.log(`   Role: ${pm.role}`);
    console.log(`   Organization: ${pm.organization}`);
    
    // Actualizar contraseña
    console.log(`\n🔐 Actualizando contraseña...`);
    pm.passwordHash = await bcrypt.hash(newPassword, 10);
    await pm.save();
    
    console.log(`\n✅ Contraseña actualizada exitosamente!`);
    console.log(`\n📋 CREDENCIALES:`);
    console.log(`   Email: ${pmEmail}`);
    console.log(`   Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

console.log('════════════════════════════════════════════');
console.log('  🔐 RESET DE CONTRASEÑA - PROJECT MANAGER');
console.log('════════════════════════════════════════════\n');

resetPMPassword()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
