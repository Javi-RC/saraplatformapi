require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Organization = require('./src/models/organization.model');

async function testUserOrganization() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuarios con todos los campos
    const users = await User.find({})
      .populate('organization', 'name title')
      .limit(5)
      .select('-passwordHash');

    console.log('\n📊 Usuarios en la base de datos:\n');
    users.forEach((user, index) => {
      console.log(`\n--- Usuario ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Organization (raw):', user.organization);
      console.log('Organization populated:', user.organization ? {
        _id: user.organization._id,
        name: user.organization.name,
        title: user.organization.title
      } : 'No tiene organización asignada');
      console.log('Has organization field:', user.schema.paths.hasOwnProperty('organization'));
    });

    console.log('\n\n🔍 Probando toJSON():');
    if (users.length > 0) {
      const userJson = users[0].toJSON();
      console.log('Keys en toJSON():', Object.keys(userJson));
      console.log('organization en JSON:', userJson.organization);
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUserOrganization();
