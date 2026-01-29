require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Organization = require('./src/models/organization.model');

async function fixOAuthUserOrganization() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuarios OAuth sin organización
    const oauthUsers = await User.find({
      oauthProvider: { $exists: true },
      $or: [
        { organization: { $exists: false } },
        { organization: null }
      ]
    }).select('-passwordHash');

    console.log(`\n📊 Encontrados ${oauthUsers.length} usuarios OAuth sin organización:\n`);

    for (const user of oauthUsers) {
      console.log(`\n--- Usuario ---`);
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('OAuth Provider:', user.oauthProvider);
      console.log('Role:', user.role);
      console.log('Organization:', user.organization);
    }

    if (oauthUsers.length > 0) {
      // Buscar una organización de ejemplo para asignar
      const organization = await Organization.findOne({});
      
      if (!organization) {
        console.log('\n⚠️  No hay organizaciones en la base de datos.');
        console.log('Creando organización de ejemplo...');
        
        const newOrg = await Organization.create({
          name: 'Default Organization',
          description: 'Organización por defecto para usuarios OAuth',
          status: 'active'
        });
        
        console.log('✅ Organización creada:', newOrg.name, '- ID:', newOrg._id);
        
        // Asignar a todos los usuarios OAuth
        for (const user of oauthUsers) {
          user.organization = newOrg._id;
          user.role = user.role === 'unassigned' ? 'employee' : user.role;
          await user.save();
          console.log(`✅ Asignado usuario ${user.email} a ${newOrg.name}`);
        }
      } else {
        console.log(`\n📋 Organización encontrada: ${organization.name} (${organization._id})`);
        console.log('Asignando organización a los usuarios OAuth...\n');
        
        for (const user of oauthUsers) {
          user.organization = organization._id;
          user.role = user.role === 'unassigned' ? 'employee' : user.role;
          await user.save();
          console.log(`✅ Asignado usuario ${user.email} (${user.role}) a ${organization.name}`);
        }
      }
    } else {
      console.log('\n✅ Todos los usuarios OAuth ya tienen organización asignada.');
    }

    // Mostrar resumen final
    console.log('\n\n📊 Resumen de todos los usuarios:');
    const allUsers = await User.find({})
      .populate('organization', 'name')
      .select('email name role organization')
      .limit(10);
    
    for (const user of allUsers) {
      console.log(`\n${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Organization: ${user.organization ? user.organization.name : '❌ Sin organización'}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOAuthUserOrganization();
