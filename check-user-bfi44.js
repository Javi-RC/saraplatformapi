const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const BFI44 = require('./src/models/bfi44.model');

async function checkUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/tfg-db');
    console.log('Connected to MongoDB');

    const email = 'javirodriguezcastellano@gmail.com';
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User NOT found with email:', email);
      process.exit(1);
    }
    
    console.log('\n✅ User found:');
    console.log('  ID:', user._id.toString());
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    
    // Find BFI44 profile
    console.log('\n🔍 Searching for BFI44 profile with userId:', user._id.toString());
    const bfi44 = await BFI44.findOne({ userId: user._id });
    
    if (!bfi44) {
      console.log('❌ NO BFI44 profile found for this user');
    } else {
      console.log('✅ BFI44 profile found!');
      console.log('  Created:', bfi44.createdAt);
      console.log('  Has results:', !!bfi44.results);
      console.log('  Results type:', typeof bfi44.results);
      
      if (bfi44.results) {
        console.log('  Results keys:', Object.keys(bfi44.results));
        console.log('\n  Personality Traits:');
        console.log('    Openness:', bfi44.results.Openness || 'N/A');
        console.log('    Conscientiousness:', bfi44.results.Conscientiousness || 'N/A');
        console.log('    Extraversion:', bfi44.results.Extraversion || 'N/A');
        console.log('    Agreeableness:', bfi44.results.Agreeableness || 'N/A');
        console.log('    Neuroticism:', bfi44.results.Neuroticism || 'N/A');
      }
    }
    
    // Search all BFI44 profiles to see if there are others
    console.log('\n📊 All BFI44 profiles in database:');
    const allBfi44 = await BFI44.find({}).limit(10);
    console.log('  Total profiles:', allBfi44.length);
    allBfi44.forEach(profile => {
      console.log(`    userId: ${profile.userId} | O=${profile.results?.Openness} C=${profile.results?.Conscientiousness}`);
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
