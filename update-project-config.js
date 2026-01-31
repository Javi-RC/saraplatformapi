/**
 * Script to update project CBR configuration
 * Run: node update-project-config.js <projectName> <minSimilarity>
 * Example: node update-project-config.js "My Project" 1.0
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');

async function updateProjectConfig() {
  const projectName = process.argv[2];
  const minSimilarity = parseFloat(process.argv[3]);
  
  if (!projectName || isNaN(minSimilarity)) {
    console.error('Usage: node update-project-config.js <projectName> <minSimilarity>');
    console.error('Example: node update-project-config.js "My Project" 1.0');
    console.error('\nminSimilarity should be between 0.0 and 1.0');
    console.error('  0.3 = 30% similarity (default)');
    console.error('  0.5 = 50% similarity');
    console.error('  1.0 = 100% similarity (exact match only)');
    process.exit(1);
  }
  
  if (minSimilarity < 0 || minSimilarity > 1) {
    console.error('❌ minSimilarity must be between 0.0 and 1.0');
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
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('Updating project:', project.projectName);
    console.log('Setting minSimilarityThreshold to:', minSimilarity, `(${(minSimilarity * 100).toFixed(0)}%)`);
    
    const result = await Project.updateOne(
      { _id: project._id },
      {
        $set: {
          'teamSelectionConfig.cbr.minSimilarityThreshold': minSimilarity
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✓ Configuration updated successfully!\n');
      
      // Verify the update
      const updatedProject = await Project.findById(project._id);
      console.log('Verification:');
      console.log('  minSimilarityThreshold:', updatedProject.teamSelectionConfig?.cbr?.minSimilarityThreshold || 'not set (will use default 0.3)');
      
      console.log('\n⚠️  IMPORTANT: Restart the server for changes to take effect!');
      console.log('   Run: npm start');
    } else {
      console.log('⚠️  No changes made (value might be the same)');
    }
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

updateProjectConfig();
