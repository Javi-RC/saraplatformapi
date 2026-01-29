const mongoose = require('mongoose');
require('dotenv').config();

const BFI44Response = require('./src/models/bfi44.model');
const User = require('./src/models/user.model');

async function checkDuplicates() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tfg-db';
    console.log('🔗 Conectando a MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB\n');

    const targetUserId = '6940e0a300a1a234c306493b';
    console.log('🔍 Investigando userId:', targetUserId);
    console.log('─'.repeat(80));

    // Buscar el usuario
    const user = await User.findById(targetUserId);
    if (user) {
      console.log('👤 Usuario encontrado:');
      console.log('   Email:', user.email);
      console.log('   Nombre:', user.name);
      console.log('   Role:', user.role);
      console.log('');
    } else {
      console.log('❌ Usuario NO encontrado en User collection');
      console.log('');
    }

    // Buscar TODOS los perfiles BFI-44 de este usuario
    const profiles = await BFI44Response.find({ userId: targetUserId });
    
    console.log(`📊 Perfiles BFI-44 encontrados: ${profiles.length}`);
    console.log('─'.repeat(80));

    if (profiles.length === 0) {
      console.log('❌ No hay perfiles BFI-44 para este usuario');
    } else {
      profiles.forEach((profile, index) => {
        console.log(`\n📋 Perfil #${index + 1}:`);
        console.log('   _id:', profile._id.toString());
        console.log('   userId:', profile.userId.toString());
        console.log('   createdAt:', profile.createdAt);
        console.log('   updatedAt:', profile.updatedAt);
        
        if (profile.results) {
          console.log('   Results:', JSON.stringify(profile.results, null, 2));
        } else {
          console.log('   ⚠️  Results: NO HAY RESULTADOS');
        }

        if (profile.responses) {
          console.log('   Responses:', profile.responses.length, 'respuestas');
        }
      });

      // Análisis de duplicados
      console.log('\n' + '='.repeat(80));
      console.log('📈 ANÁLISIS DE DUPLICADOS:');
      console.log('='.repeat(80));

      if (profiles.length > 1) {
        console.log(`⚠️  Se encontraron ${profiles.length} perfiles para el mismo userId`);
        console.log('\n🕐 Ordenados por fecha de creación:');
        
        const sorted = [...profiles].sort((a, b) => a.createdAt - b.createdAt);
        sorted.forEach((p, i) => {
          const hasResults = p.results && Object.keys(p.results).length > 0;
          console.log(`   ${i + 1}. ${p._id} - ${p.createdAt.toISOString()} ${hasResults ? '✅ Con resultados' : '❌ Sin resultados'}`);
        });

        console.log('\n💡 Recomendación:');
        const validProfiles = profiles.filter(p => p.results && Object.keys(p.results).length > 0);
        if (validProfiles.length === 1) {
          console.log(`   ✅ Hay 1 perfil válido con resultados`);
          console.log(`   🗑️  Puedes eliminar los otros ${profiles.length - 1} perfiles sin resultados`);
        } else if (validProfiles.length > 1) {
          const latest = validProfiles.sort((a, b) => b.createdAt - a.createdAt)[0];
          console.log(`   ✅ Hay ${validProfiles.length} perfiles con resultados`);
          console.log(`   📅 El más reciente es: ${latest._id} (${latest.createdAt.toISOString()})`);
          console.log(`   🗑️  Considera eliminar los ${validProfiles.length - 1} perfiles más antiguos`);
        } else {
          console.log(`   ❌ Ningún perfil tiene resultados válidos`);
        }
      } else {
        console.log('✅ No hay duplicados para este usuario');
      }
    }

    console.log('\n' + '─'.repeat(80));
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkDuplicates();
