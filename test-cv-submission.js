/**
 * Script de prueba para verificar el flujo de envío y aceptación de CV
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const cvRepository = require('./src/repositories/cv.repository');
const organizationRepository = require('./src/repositories/organization.repository');
const userRepository = require('./src/repositories/user.repository');

async function testCVFlow() {
  try {
    console.log('\n=== Test: Flujo de Envío y Aceptación de CV ===\n');

    // 1. Buscar un CV existente
    const cvs = await cvRepository.find({}, { limit: 1 });
    if (cvs.length === 0) {
      console.log('❌ No se encontraron CVs en la base de datos');
      return;
    }

    const cv = cvs[0];
    console.log('✅ CV encontrado:', {
      id: cv._id,
      userId: cv.userId,
      organization: cv.organization,
      status: cv.organizationStatus
    });

    // 2. Verificar el campo userId
    if (!cv.userId) {
      console.log('❌ El CV no tiene userId');
      return;
    }
    console.log('✅ Campo userId correcto:', cv.userId);

    // 3. Si el CV tiene organización, verificar empleados
    if (cv.organization && cv.organizationStatus === 'accepted') {
      const org = await organizationRepository.findById(cv.organization);
      if (org) {
        console.log('\n✅ Organización encontrada:', org.name);
        
        const employee = org.employees.find(
          emp => emp.user && emp.user.toString() === cv.userId.toString()
        );
        
        if (employee) {
          console.log('✅ Usuario encontrado en empleados de la organización');
          console.log('   - Posición:', employee.position || 'N/A');
          console.log('   - Departamento:', employee.department || 'N/A');
          console.log('   - Estado:', employee.status);
        } else {
          console.log('⚠️  Usuario NO encontrado en empleados de la organización');
          console.log('   Empleados en la organización:', org.employees.length);
        }
      }
    } else {
      console.log('\n⚠️  El CV no está aceptado o no tiene organización asignada');
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

testCVFlow();
