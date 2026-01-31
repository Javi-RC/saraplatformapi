/**
 * Clean script: Delete CBR case without title to allow recreation
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CaseBase = require('./src/models/caseBase.model');

async function cleanCase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-db');
    console.log('✓ Connected to MongoDB\n');

    // Find case without title
    const casesWithoutTitle = await CaseBase.find({
      'solution.actualRisks.title': { $exists: false }
    });

    console.log(`📊 Found ${casesWithoutTitle.length} cases without title in risks\n`);

    if (casesWithoutTitle.length === 0) {
      console.log('✓ All cases have titles!');
      process.exit(0);
    }

    for (const caseDoc of casesWithoutTitle) {
      console.log(`🗑️  Deleting case: ${caseDoc.problem.projectName}`);
      console.log(`   Case ID: ${caseDoc._id}`);
      console.log(`   Project ID: ${caseDoc.caseId}`);
      
      await CaseBase.deleteOne({ _id: caseDoc._id });
      console.log('   ✅ Deleted\n');
    }

    console.log('✅ All old cases cleaned!');
    console.log('💡 Now you can complete the project again to recreate the case with titles.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

cleanCase();
