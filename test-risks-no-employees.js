const mongoose = require('mongoose');
require('dotenv').config();

async function testRisksWithoutEmployees() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const Project = require('./src/models/project.model');
    const riskPredictionService = require('./src/services/riskPrediction.service');
    
    // Find a project without employees
    const projectWithoutEmployees = await Project.findOne({
      $or: [
        { assignedEmployees: { $size: 0 } },
        { assignedEmployees: { $exists: false } }
      ]
    }).populate('organization');
    
    if (!projectWithoutEmployees) {
      console.log('❌ No project without employees found');
      process.exit(0);
    }
    
    console.log('✓ Found project:', projectWithoutEmployees.projectName);
    console.log('  Employees:', projectWithoutEmployees.assignedEmployees?.length || 0);
    console.log('  Organization:', projectWithoutEmployees.organization?.name || 'None');
    
    console.log('\n🔍 Predicting risks...');
    const result = await riskPredictionService.predictProjectRisks(projectWithoutEmployees._id);
    
    console.log('\n📊 Results:');
    console.log('  Total risks detected:', result.risks?.length || 0);
    console.log('  DT indicators:', result.metadata?.dtRisksCount || 0);
    console.log('  CBR risks:', result.metadata?.cbrRisksCount || 0);
    
    if (result.risks && result.risks.length > 0) {
      console.log('\n✅ RISKS DETECTED:');
      result.risks.forEach((risk, i) => {
        console.log(`  ${i+1}. [${risk.severity}] ${risk.title} (source: ${risk.source})`);
      });
    } else {
      console.log('\n❌ NO RISKS DETECTED');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRisksWithoutEmployees();
