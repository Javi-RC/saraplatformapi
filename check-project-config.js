/**
 * Script to check project configuration
 * Run: node check-project-config.js <projectName>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');

async function checkProjectConfig() {
  const projectName = process.argv[2];
  
  if (!projectName) {
    console.error('Usage: node check-project-config.js <projectName>');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    const project = await Project.findOne({ projectName: new RegExp(projectName, 'i') });
    
    if (!project) {
      console.error(`❌ Project "${projectName}" not found`);
      console.log('\nAvailable projects:');
      const allProjects = await Project.find({}, 'projectName');
      allProjects.forEach(p => console.log(`  - ${p.projectName}`));
      process.exit(1);
    }
    
    console.log('=== PROJECT CONFIGURATION ===\n');
    console.log('Project Name:', project.projectName);
    console.log('Project ID:', project._id);
    console.log('\n--- Team Selection Config ---');
    
    if (project.teamSelectionConfig) {
      console.log('✓ Has custom teamSelectionConfig\n');
      
      if (project.teamSelectionConfig.cbr) {
        console.log('CBR Configuration:');
        console.log('  minSimilarityThreshold:', project.teamSelectionConfig.cbr.minSimilarityThreshold);
        console.log('  kSimilarCases:', project.teamSelectionConfig.cbr.kSimilarCases);
        if (project.teamSelectionConfig.cbr.dimensionWeights) {
          console.log('  dimensionWeights:', project.teamSelectionConfig.cbr.dimensionWeights);
        }
      } else {
        console.log('⚠️  No CBR configuration (will use defaults)');
      }
      
      console.log('\nFull teamSelectionConfig:');
      console.log(JSON.stringify(project.teamSelectionConfig, null, 2));
    } else {
      console.log('⚠️  No teamSelectionConfig found (will use defaults)');
      console.log('\nDefault values will be:');
      console.log('  minSimilarityThreshold: 0.3');
      console.log('  kSimilarCases: 5');
    }
    
    console.log('\n=== HOW TO SET CUSTOM CONFIG ===\n');
    console.log('To set minSimilarityThreshold to 1.0 (100%):');
    console.log(`
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');

await mongoose.connect(process.env.MONGODB_URI);

await Project.updateOne(
  { projectName: "${project.projectName}" },
  {
    $set: {
      'teamSelectionConfig.cbr.minSimilarityThreshold': 1.0,
      'teamSelectionConfig.cbr.kSimilarCases': 5
    }
  }
);
    `);
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkProjectConfig();
