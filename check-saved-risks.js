const mongoose = require('mongoose');
require('dotenv').config();

async function checkSavedRisks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const Project = require('./src/models/project.model');
    const Risk = require('./src/models/risk.model');
    
    const project = await Project.findOne({ 
      projectName: /E-Commerce Platform Modernization/i 
    });
    
    if (!project) {
      console.log('❌ Project not found');
      process.exit(1);
    }
    
    console.log('✓ Found project:', project.projectName);
    console.log('  Project ID:', project._id);
    
    // Check saved risks
    const savedRisks = await Risk.find({ project: project._id });
    
    console.log('\n📊 Saved Risks in Database:');
    console.log('  Total:', savedRisks.length);
    
    if (savedRisks.length > 0) {
      console.log('\n  Risks:');
      savedRisks.forEach((risk, i) => {
        console.log(`  ${i+1}. [${risk.severity}] ${risk.title} (source: ${risk.source}, status: ${risk.status})`);
      });
    } else {
      console.log('  ❌ NO RISKS SAVED IN DATABASE');
      console.log('\n💡 Solution:');
      console.log('  You need to call POST /api/projects/:id/risks/predict first');
      console.log('  This will run the prediction and save the risks to the database');
      console.log('  Then GET /api/projects/:id/risks will return them');
    }
    
    console.log('\n📝 Risk Prediction Metadata:');
    console.log('  ', project.riskPredictionMetadata || 'None');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSavedRisks();
