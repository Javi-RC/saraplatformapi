/**
 * Script de prueba para verificar que al aceptar un CV se agrega el empleado
 */

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cvRepository = require('./src/repositories/cv.repository');
const organizationRepository = require('./src/repositories/organization.repository');

async function testAcceptCV() {
  try {
    console.log('\n=== Test: Aceptar CV y Agregar Empleado ===\n');

    // 1. Buscar un CV pendiente
    const pendingCVs = await cvRepository.find({
      organizationStatus: 'pending',
      organization: { $ne: null }
    }, { limit: 1 });

    if (pendingCVs.length === 0) {
      console.log('⚠️  No hay CVs pendientes. Buscando cualquier CV con organización...');
      
      const anyCVs = await cvRepository.find({
        organization: { $ne: null }
      }, { limit: 1 });
      
      if (anyCVs.length === 0) {
        console.log('❌ No se encontraron CVs con organización asignada');
        return;
      }
      
      var cv = anyCVs[0];
    } else {
      var cv = pendingCVs[0];
    }

    console.log('✅ CV encontrado:');
    console.log('   - ID:', cv._id);
    console.log('   - userId:', cv.userId);
    console.log('   - userId type:', typeof cv.userId, cv.userId.constructor.name);
    console.log('   - organization:', cv.organization);
    console.log('   - status:', cv.organizationStatus);

    // 2. Obtener la organización
    const org = await organizationRepository.findById(cv.organization);
    if (!org) {
      console.log('❌ Organización no encontrada');
      return;
    }

    console.log('\n✅ Organización encontrada:', org.name);
    console.log('   - Empleados actuales:', org.employees.length);

    // 3. Verificar si el usuario ya está como empleado
    const existingEmployee = org.employees.find(
      emp => emp.user.toString() === cv.userId.toString()
    );

    console.log('\n🔍 Verificando empleado:');
    console.log('   - cv.userId:', cv.userId);
    console.log('   - cv.userId.toString():', cv.userId.toString());
    
    if (existingEmployee) {
      console.log('✅ Usuario YA ES empleado:');
      console.log('   - Position:', existingEmployee.position);
      console.log('   - Department:', existingEmployee.department);
      console.log('   - Status:', existingEmployee.status);
      console.log('   - JoinedAt:', existingEmployee.joinedAt);
    } else {
      console.log('❌ Usuario NO está en la lista de empleados');
      console.log('\n📋 Empleados actuales de la organización:');
      org.employees.forEach((emp, idx) => {
        console.log(`   ${idx + 1}. user: ${emp.user} (${typeof emp.user})`);
        console.log(`      status: ${emp.status}`);
        console.log(`      position: ${emp.position || 'N/A'}`);
      });
    }

    // 4. Simular agregar empleado manualmente para verificar
    console.log('\n🧪 Simulando agregar empleado manualmente...');
    const testUserId = cv.userId;
    
    const testEmployee = org.employees.find(
      emp => emp.user && emp.user.toString() === testUserId.toString()
    );
    
    if (!testEmployee) {
      console.log('   Agregando usuario como empleado de prueba (no se guardará)...');
      org.employees.push({
        user: testUserId,
        position: 'Test Position',
        department: 'Test Department',
        joinedAt: new Date(),
        status: 'active'
      });
      console.log('   ✅ Usuario agregado en memoria (no persistido)');
      console.log('   Total empleados después de agregar:', org.employees.length);
    } else {
      console.log('   Usuario ya existe como empleado');
    }

    console.log('\n=== Test Completado ===\n');

  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión cerrada');
  }
}

testAcceptCV();
