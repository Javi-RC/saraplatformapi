/**
 * Fix script: Re-create CBR cases with titles preserved
 * 
 * This script deletes existing CBR cases and recreates them
 * with the new format that includes risk titles.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');
const CaseBase = require('./src/models/caseBase.model');
const projectService = require('./src/services/project.service');

async function recreateCases() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-db');
    console.log('✓ Connected to MongoDB\n');

    // Find all completed projects with CBR cases
    const completedProjects = await Project.find({ 
      status: 'completed' 
    }).populate('organization');

    console.log(`📊 Total completed projects: ${completedProjects.length}\n`);

    let recreated = 0;

    for (const project of completedProjects) {
      console.log(`\n📋 Project: ${project.projectName}`);
      
      // Find existing case
      const existingCase = await CaseBase.findOne({ 
        caseId: project._id 
      });

      if (!existingCase) {
        console.log('   ⏭️  No existing case');
        continue;
      }

      // Check if case has risks without titles
      const risksWithoutTitle = existingCase.solution?.actualRisks?.filter(r => !r.title) || [];
      
      if (risksWithoutTitle.length === 0) {
        console.log('   ✓ Case already has titles');
        continue;
      }

      console.log(`   🔄 Found ${risksWithoutTitle.length} risks without title`);
      console.log('   🗑️  Deleting old case...');
      
      // Delete old case
      await CaseBase.deleteOne({ _id: existingCase._id });
      
      console.log('   🚀 Recreating case with new format...');
      
      // Recreate case
      try {
        await projectService.autoSaveManualRisksToCBR(project._id.toString());
        console.log('   ✅ Case recreated successfully!');
        recreated++;
      } catch (error) {
        console.error(`   ❌ Error recreating case: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total completed projects: ${completedProjects.length}`);
    console.log(`✅ Cases recreated: ${recreated}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run fix
console.log('🔧 Recreating CBR cases with titles...\n');
recreateCases();
