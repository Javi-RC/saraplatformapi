const mongoose = require('mongoose');
require('dotenv').config();

async function testFullFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const Project = require('./src/models/project.model');
    const Risk = require('./src/models/risk.model');
    const riskPredictionService = require('./src/services/riskPrediction.service');
    
    const project = await Project.findOne({ 
      projectName: /E-Commerce Platform Modernization/i 
    });
    
    if (!project) {
      console.log('❌ Project not found');
      process.exit(1);
    }
    
    console.log('📋 Project:', project.projectName);
    console.log('   ID:', project._id);
    console.log('   Employees:', project.assignedEmployees?.length || 0);
    
    // Step 1: Delete existing predictions
    console.log('\n🗑️  Deleting existing risk predictions...');
    const deleted = await Risk.deleteMany({ project: project._id });
    console.log(`   Deleted ${deleted.deletedCount} risks`);
    
    // Step 2: Run prediction (simulating POST /api/projects/:id/risks/predict)
    console.log('\n🔮 Running POST /api/projects/:id/risks/predict...');
    const startTime = Date.now();
    
    const result = await riskPredictionService.predictProjectRisks(project._id);
    
    const duration = Date.now() - startTime;
    console.log(`   ✅ Prediction completed in ${duration}ms`);
    
    // Step 3: Verify what was saved
    console.log('\n💾 Checking what was saved in DB...');
    const savedRisks = await Risk.find({ project: project._id });
    console.log(`   Saved risks: ${savedRisks.length}`);
    
    // Step 4: Check response
    console.log('\n📤 Response to frontend:');
    console.log('   Success: true');
    console.log('   Total risks:', result.risks?.length || 0);
    console.log('   Message:', result.message);
    
    if (result.risks && result.risks.length > 0) {
      console.log('\n✅ RISKS DETECTED:');
      result.risks.forEach((risk, i) => {
        console.log(`   ${i+1}. [${risk.severity}] ${risk.title} (${risk.source})`);
      });
    } else {
      console.log('\n❌ NO RISKS IN RESPONSE!');
      console.log('   This is the problem your frontend is seeing!');
    }
    
    console.log('\n📊 Metadata:');
    console.log('   Case Base Size:', result.metadata?.caseBaseSize);
    console.log('   Tree Weight:', result.metadata?.weights?.decisionTree);
    console.log('   CBR Weight:', result.metadata?.weights?.cbr);
    console.log('   DT Risks:', result.metadata?.sources?.decisionTree);
    console.log('   CBR Risks:', result.metadata?.sources?.cbr);
    console.log('   Combined:', result.metadata?.sources?.combined);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFullFlow();
