/**
 * Script para sincronizar empleados con el array employees de la organización
 * Uso: node scripts/sync-employees-to-org.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Organization = require('../src/models/organization.model');

async function syncEmployees() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend');
    console.log('✅ Conectado a MongoDB\n');
    
    console.log('🔍 Buscando empleados...');
    
    // Buscar todos los usuarios que tienen organización asignada
    const employees = await User.find({ 
      role: 'employee',
      organization: { $exists: true, $ne: null }
    });
    
    console.log(`📊 Encontrados ${employees.length} empleados con organización asignada\n`);
    
    if (employees.length === 0) {
      console.log('✅ No hay empleados que sincronizar');
      return;
    }
    
    // Agrupar por organización
    const employeesByOrg = {};
    
    for (const employee of employees) {
      const orgId = employee.organization.toString();
      if (!employeesByOrg[orgId]) {
        employeesByOrg[orgId] = [];
      }
      employeesByOrg[orgId].push(employee);
    }
    
    console.log(`📦 Encontradas ${Object.keys(employeesByOrg).length} organizaciones\n`);
    
    let totalAdded = 0;
    let totalSkipped = 0;
    
    // Sincronizar cada organización
    for (const [orgId, orgEmployees] of Object.entries(employeesByOrg)) {
      const org = await Organization.findById(orgId);
      
      if (!org) {
        console.log(`⚠️  Organización ${orgId} no encontrada, saltando ${orgEmployees.length} empleados`);
        totalSkipped += orgEmployees.length;
        continue;
      }
      
      console.log(`\n📋 Organización: ${org.name}`);
      console.log(`   Empleados en BD: ${orgEmployees.length}`);
      console.log(`   Empleados en array: ${org.employees.length}`);
      
      let added = 0;
      
      for (const employee of orgEmployees) {
        // Verificar si ya está en el array
        const exists = org.employees.some(emp => 
          emp.user.toString() === employee._id.toString()
        );
        
        if (!exists) {
          org.employees.push({
            user: employee._id,
            position: 'Software Developer',
            department: 'Technology',
            status: 'active',
            isProjectManager: false
          });
          added++;
        } else {
          totalSkipped++;
        }
      }
      
      if (added > 0) {
        await org.save();
        totalAdded += added;
        console.log(`   ✅ ${added} empleados añadidos al array`);
      } else {
        console.log(`   ℹ️  Todos los empleados ya estaban registrados`);
      }
    }
    
    console.log(`\n\n═══════════════════════════════════════`);
    console.log(`📊 RESUMEN:`);
    console.log(`   Total empleados: ${employees.length}`);
    console.log(`   Añadidos al array: ${totalAdded}`);
    console.log(`   Ya existían: ${totalSkipped}`);
    console.log(`═══════════════════════════════════════\n`);
    
    console.log('✅ Sincronización completada!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

console.log('════════════════════════════════════════════');
console.log('  📦 SINCRONIZACIÓN DE EMPLEADOS');
console.log('════════════════════════════════════════════\n');

syncEmployees()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
