/**
 * Script para importar empleados desde un archivo CSV
 * Uso: node scripts/import-employees-csv.js <archivo.csv> [organizationId]
 * Ejemplo: node scripts/import-employees-csv.js employees.csv
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../src/models/user.model');
const CV = require('../src/models/cv.model');

/**
 * Formato CSV esperado (primera fila = headers):
 * name,email,country,timezone,skills,yearsExperience,position,flexibleSchedule
 * 
 * Ejemplo:
 * Juan García,juan.garcia@example.com,España,Europe/Madrid,"JavaScript,React,Node.js",5,Full Stack Developer,true
 */

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

async function importFromCSV(filePath, organizationId = null) {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend');
    console.log('✅ Conectado a MongoDB\n');
    
    // Verificar archivo
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }
    
    console.log(`📄 Leyendo archivo: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(content);
    console.log(`✅ ${rows.length} filas encontradas\n`);
    
    // Buscar o crear organización
    if (!organizationId) {
      const Organization = require('../src/models/organization.model');
      let org = await Organization.findOne({ name: 'Tech Solutions SA' });
      
      if (!org) {
        console.log('📦 Creando organización de prueba...');
        
        // Crear usuario admin temporal
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
            phone: '+34 912 345 678'
          },
          admin: adminUser._id
        });
        
        adminUser.organization = org._id;
        await adminUser.save();
      }
      
      organizationId = org._id;
      console.log(`📦 Usando organización: ${org.name} (${organizationId})\n`);
    }
    
    const passwordHash = await bcrypt.hash('Test1234!', 10);
    let created = 0;
    let errors = 0;
    
    console.log('👥 Importando empleados...\n');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Crear usuario
        const userData = {
          name: row.name,
          email: row.email,
          passwordHash,
          role: 'employee',
          organization: organizationId,
          isConfirmed: true,
          country: row.country || 'España',
          timezone: row.timezone || 'Europe/Madrid',
          flexibleSchedule: row.flexibleSchedule === 'true' || row.flexibleSchedule === '1',
          createdAt: new Date()
        };
        
        const user = await User.create(userData);
        
        // Parsear skills
        const skills = row.skills ? 
          row.skills.split(',').map(s => ({
            name: s.trim(),
            level: 'intermediate',
            yearsOfExperience: parseInt(row.yearsExperience) || 3
          })) : [];
        
        // Crear CV
        const cvData = {
          userId: user._id,
          organization: organizationId,
          organizationStatus: 'accepted',
          contact: {
            email: row.email
          },
          skills,
          experience: row.position ? [{
            company: row.company || 'Previous Company',
            position: row.position,
            startDate: new Date().getFullYear() - (parseInt(row.yearsExperience) || 3),
            current: true,
            description: 'Experiencia en desarrollo de software'
          }] : [],
          crossCulturalExperience: {
            hasWorkedInternationally: row.hasInternationalExperience === 'true',
            mediationSkills: row.mediationSkills === 'true'
          },
          remoteWorkExperience: {
            yearsRemote: parseInt(row.yearsRemote) || 0,
            hasRemoteExperience: (parseInt(row.yearsRemote) || 0) > 0,
            timezoneFlexibility: row.flexibleSchedule === 'true'
          },
          communicationSkills: {
            documentationExperience: true,
            knowledgeManagementTools: row.kmTools ? row.kmTools.split(',').map(t => t.trim()) : []
          }
        };
        
        await CV.create(cvData);
        
        created++;
        if ((i + 1) % 10 === 0) {
          console.log(`   Importados ${i + 1}/${rows.length}...`);
        }
        
      } catch (error) {
        errors++;
        console.error(`   ❌ Error en fila ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Importación completada:`);
    console.log(`   - Creados: ${created}`);
    console.log(`   - Errores: ${errors}`);
    console.log(`   - Total: ${rows.length}`);
    console.log(`\n💡 Password para todos: Test1234!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar
const filePath = process.argv[2];
const organizationId = process.argv[3] || null;

if (!filePath) {
  console.error('❌ Debes proporcionar la ruta del archivo CSV');
  console.log('Uso: node scripts/import-employees-csv.js <archivo.csv> [organizationId]');
  process.exit(1);
}

console.log('════════════════════════════════════════════');
console.log('  📦 IMPORTACIÓN DE EMPLEADOS DESDE CSV');
console.log('════════════════════════════════════════════\n');

importFromCSV(filePath, organizationId)
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
