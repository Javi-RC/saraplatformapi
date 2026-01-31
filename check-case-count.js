/**
 * Check case count for organizations
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CaseBase = require('./src/models/caseBase.model');
const Organization = require('./src/models/organization.model');

async function checkCaseCounts() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tfg-backend';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all organizations
    const orgs = await Organization.find({});
    
    // Get seed cases
    const seedCases = await CaseBase.find({ type: 'seed' });
    console.log(`📚 Total Seed Cases (global): ${seedCases.length}\n`);

    for (const org of orgs) {
      console.log(`🏢 Organization: ${org.organizationName}`);
      console.log(`   ID: ${org._id}`);
      
      // Get real cases for this org
      const realCases = await CaseBase.find({ 
        organization: org._id,
        type: 'real'
      });
      
      // Get stats using the method
      const stats = await CaseBase.getCaseBaseStats(org._id);
      
      console.log(`   Real Cases: ${realCases.length}`);
      console.log(`   Stats Total: ${stats.total}`);
      console.log(`   Stats byType: Real=${stats.byType.real}, Seed=${stats.byType.seed}, Synthetic=${stats.byType.synthetic}`);
      
      // Determine phase
      const total = stats.total;
      let phase;
      if (total < 10) phase = 1;
      else if (total < 20) phase = 2;
      else if (total < 40) phase = 3;
      else phase = 4;
      
      console.log(`   📊 PHASE: ${phase}\n`);
    }

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCaseCounts();
