/**
 * Fix script: Apply auto-save CBR to existing completed projects
 * 
 * This script finds all completed projects without CBR cases
 * and creates cases for them using the new autoSaveManualRisksToCBR method
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');
const Risk = require('./src/models/risk.model');
const CaseBase = require('./src/models/caseBase.model');
const projectService = require('./src/services/project.service');

async function fixCompletedProjects() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-db');
    console.log('✓ Connected to MongoDB\n');

    // Find all completed projects
    const completedProjects = await Project.find({ 
      status: 'completed' 
    }).populate('organization');

    console.log(`📊 Total completed projects: ${completedProjects.length}\n`);

    if (completedProjects.length === 0) {
      console.log('No completed projects found.');
      process.exit(0);
    }

    // Check each project
    let fixed = 0;
    let skipped = 0;
    let noRisks = 0;

    for (const project of completedProjects) {
      console.log(`\n📋 Project: ${project.projectName}`);
      console.log(`   ID: ${project._id}`);
      console.log(`   Completed: ${project.actualEndDate || 'unknown'}`);

      // Check if CBR case exists
      const existingCase = await CaseBase.findOne({ 
        caseId: project._id 
      });

      if (existingCase) {
        console.log('   ✓ CBR case already exists');
        skipped++;
        continue;
      }

      // Check manual risks
      const manualRisks = await Risk.find({
        project: project._id,
        source: 'manual'
      });

      console.log(`   📊 Manual risks: ${manualRisks.length}`);

      if (manualRisks.length === 0) {
        console.log('   ⚠ No manual risks to save');
        noRisks++;
        continue;
      }

      // Show risks
      manualRisks.forEach((risk, idx) => {
        console.log(`      ${idx + 1}. ${risk.title} (${risk.severity})`);
      });

      // Apply auto-save
      try {
        console.log('   🚀 Creating CBR case...');
        await projectService.autoSaveManualRisksToCBR(project._id.toString());
        
        // Verify case was created
        const newCase = await CaseBase.findOne({ 
          caseId: project._id 
        });

        if (newCase) {
          console.log('   ✅ CBR case created successfully!');
          console.log(`      Risks saved: ${newCase.solution?.actualRisks?.length || 0}`);
          fixed++;
        } else {
          console.log('   ❌ Case creation failed');
        }

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total completed projects: ${completedProjects.length}`);
    console.log(`✅ Cases created: ${fixed}`);
    console.log(`⏭️  Already had cases: ${skipped}`);
    console.log(`⚠️  No manual risks: ${noRisks}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run fix
console.log('🔧 Fixing completed projects without CBR cases...\n');
fixCompletedProjects();
