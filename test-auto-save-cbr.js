/**
 * Test script: Auto-save manual risks to CBR when completing project
 * 
 * This script verifies that when a project is completed,
 * manual risks are automatically saved to the CBR system.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');
const Risk = require('./src/models/risk.model');
const CaseBase = require('./src/models/caseBase.model');
const projectService = require('./src/services/project.service');

async function testAutoSaveCBR() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-db');
    console.log('✓ Connected to MongoDB');

    // Find a completed project with manual risks
    const completedProject = await Project.findOne({ 
      status: 'completed' 
    }).populate('organization');

    if (!completedProject) {
      console.log('⚠ No completed projects found. Creating test scenario...');
      
      // Find an active project to test
      const activeProject = await Project.findOne({ 
        status: 'active' 
      }).populate('organization');

      if (!activeProject) {
        console.log('✗ No active projects found to test');
        process.exit(1);
      }

      console.log(`\n📋 Testing with project: ${activeProject.projectName}`);
      
      // Check manual risks
      const manualRisks = await Risk.find({
        project: activeProject._id,
        source: 'manual'
      });

      console.log(`📊 Manual risks found: ${manualRisks.length}`);

      if (manualRisks.length === 0) {
        console.log('⚠ No manual risks found. Add some manual risks first.');
        process.exit(0);
      }

      // Show manual risks
      console.log('\n📝 Manual risks:');
      manualRisks.forEach((risk, idx) => {
        console.log(`  ${idx + 1}. ${risk.title} (${risk.severity})`);
      });

      // Check if CBR case already exists
      const existingCase = await CaseBase.findOne({ 
        caseId: activeProject._id 
      });

      if (existingCase) {
        console.log('\n⚠ CBR case already exists for this project');
        console.log(`   Case ID: ${existingCase._id}`);
        console.log(`   Risks in case: ${existingCase.solution?.actualRisks?.length || 0}`);
        process.exit(0);
      }

      console.log('\n🚀 Testing auto-save when completing project...');
      console.log('   (This is a dry-run test, will not actually complete the project)');
      
      // Simulate calling autoSaveManualRisksToCBR
      try {
        await projectService.autoSaveManualRisksToCBR(activeProject._id.toString());
        console.log('✓ Auto-save successful!');

        // Verify case was created
        const newCase = await CaseBase.findOne({ 
          caseId: activeProject._id 
        });

        if (newCase) {
          console.log('\n✓ CBR Case created successfully!');
          console.log(`   Case ID: ${newCase._id}`);
          console.log(`   Risks saved: ${newCase.solution?.actualRisks?.length || 0}`);
          console.log(`   Organization: ${newCase.organization}`);
          console.log(`   Type: ${newCase.type}`);
          
          // Show saved risks
          if (newCase.solution?.actualRisks?.length > 0) {
            console.log('\n📝 Risks saved in CBR:');
            newCase.solution.actualRisks.forEach((risk, idx) => {
              console.log(`  ${idx + 1}. ${risk.type} - ${risk.severity} - Occurred: ${risk.occurred}`);
            });
          }
        } else {
          console.log('✗ CBR case was not created');
        }

      } catch (error) {
        console.error('✗ Auto-save failed:', error.message);
      }

    } else {
      console.log(`\n📋 Found completed project: ${completedProject.projectName}`);
      
      // Check if CBR case exists
      const cbrCase = await CaseBase.findOne({ 
        caseId: completedProject._id 
      });

      if (cbrCase) {
        console.log('\n✓ CBR case exists for this completed project');
        console.log(`   Case ID: ${cbrCase._id}`);
        console.log(`   Risks in case: ${cbrCase.solution?.actualRisks?.length || 0}`);
        console.log(`   Created at: ${cbrCase.createdAt}`);
      } else {
        console.log('\n✗ No CBR case found for this completed project');
        console.log('   This is the problem we are fixing!');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run test
testAutoSaveCBR();
