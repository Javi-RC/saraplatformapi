const mongoose = require('mongoose');
require('dotenv').config();

async function listAllProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const Project = require('./src/models/project.model');
    const Risk = require('./src/models/risk.model');
    
    const projects = await Project.find()
      .select('_id projectName assignedEmployees status')
      .sort({ projectName: 1 });
    
    console.log(`Found ${projects.length} projects:\n`);
    
    for (const project of projects) {
      const riskCount = await Risk.countDocuments({ project: project._id });
      const employeeCount = project.assignedEmployees?.length || 0;
      
      console.log(`📋 ${project.projectName}`);
      console.log(`   ID: ${project._id}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Employees: ${employeeCount}`);
      console.log(`   Risks: ${riskCount}`);
      console.log('');
    }
    
    console.log('\n💡 To test from frontend, use one of these IDs in your API call:');
    console.log(`   GET http://localhost:3001/api/projects/{PROJECT_ID}/risks`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllProjects();
