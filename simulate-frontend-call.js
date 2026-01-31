const mongoose = require('mongoose');
require('dotenv').config();

async function simulateFrontendCall() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    const Project = require('./src/models/project.model');
    const riskPredictionService = require('./src/services/riskPrediction.service');
    
    const project = await Project.findOne({ 
      projectName: /E-Commerce Platform Modernization/i 
    });
    
    if (!project) {
      console.log('❌ Project not found');
      process.exit(1);
    }
    
    console.log('✓ Found project:', project.projectName);
    console.log('  Project ID:', project._id);
    console.log('  Employees:', project.assignedEmployees?.length || 0);
    
    console.log('\n📡 Simulating GET /api/projects/:id/risks (what frontend calls):\n');
    
    // Simulate what the frontend endpoint does
    const result = await riskPredictionService.getProjectRiskPredictions(project._id);
    
    console.log('Response:');
    console.log('  Success: true');
    console.log('  Total Risks:', result.risks.length);
    console.log('  Project Name:', result.projectName);
    console.log('  Metadata:', JSON.stringify(result.metadata, null, 2));
    
    if (result.risks.length > 0) {
      console.log('\n✅ RISKS RETURNED:');
      result.risks.forEach((risk, i) => {
        console.log(`  ${i+1}. [${risk.severity}] ${risk.title}`);
      });
    } else {
      console.log('\n❌ NO RISKS RETURNED');
    }
    
    console.log('\n📊 Summary:');
    console.log('  ', JSON.stringify(result.summary, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

simulateFrontendCall();
