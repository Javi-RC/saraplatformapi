/**
 * Test Decision Tree Configuration Flow
 * This script tests the complete configuration flow:
 * 1. Load a project
 * 2. Update skillGapCritical to 0
 * 3. Verify it's saved
 * 4. Predict risks
 * 5. Verify the configuration is being used
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');
const riskPredictionService = require('./src/services/riskPrediction.service');

async function testConfigFlow() {
  try {
    console.log('=== Testing Configuration Flow ===\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB\n');
    
    // Step 1: Find a project with assigned employees and main technologies
    const project = await Project.findOne({
      assignedEmployees: { $exists: true, $ne: [] },
      mainTechnologies: { $exists: true, $ne: [] }
    });
    
    if (!project) {
      console.log('✗ No suitable project found for testing');
      return;
    }
    
    console.log(`✓ Found project: ${project.projectName} (${project._id})`);
    console.log(`  Team size: ${project.assignedEmployees.length}`);
    console.log(`  Technologies: ${project.mainTechnologies.join(', ')}\n`);
    
    // Step 2: Check current configuration
    console.log('--- Current Configuration ---');
    const currentSkillGapCritical = project.teamSelectionConfig?.decisionTree?.riskThresholds?.skillGapCritical;
    console.log(`Current skillGapCritical: ${currentSkillGapCritical ?? 'not set (default: 0.5)'}\n`);
    
    // Step 3: Update configuration to set skillGapCritical to 0
    console.log('--- Updating Configuration ---');
    if (!project.teamSelectionConfig) {
      project.teamSelectionConfig = {};
    }
    if (!project.teamSelectionConfig.decisionTree) {
      project.teamSelectionConfig.decisionTree = {};
    }
    if (!project.teamSelectionConfig.decisionTree.riskThresholds) {
      project.teamSelectionConfig.decisionTree.riskThresholds = {};
    }
    
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapCritical = 0;
    project.markModified('teamSelectionConfig');
    project.markModified('teamSelectionConfig.decisionTree');
    project.markModified('teamSelectionConfig.decisionTree.riskThresholds');
    
    await project.save();
    console.log('✓ Saved skillGapCritical = 0\n');
    
    // Step 4: Reload project from database to verify save
    console.log('--- Verifying Save ---');
    const reloadedProject = await Project.findById(project._id);
    const savedValue = reloadedProject.teamSelectionConfig?.decisionTree?.riskThresholds?.skillGapCritical;
    console.log(`Reloaded skillGapCritical: ${savedValue}`);
    
    if (savedValue === 0) {
      console.log('✓ Configuration saved correctly\n');
    } else {
      console.log('✗ Configuration NOT saved correctly!\n');
      return;
    }
    
    // Step 5: Predict risks and observe console logs
    console.log('--- Predicting Risks ---');
    console.log('Watch for debug logs from DecisionTree service...\n');
    
    const prediction = await riskPredictionService.predictProjectRisks(project._id, 'es');
    
    console.log('\n--- Prediction Results ---');
    console.log(`Total risks detected: ${prediction.risks.length}`);
    
    // Look for skill gap risks
    const skillGapRisks = prediction.risks.filter(r => 
      r.riskId === 'skill_gap' || 
      r.category?.toLowerCase().includes('skill') ||
      r.name?.toLowerCase().includes('brecha')
    );
    
    console.log(`Skill gap risks found: ${skillGapRisks.length}`);
    
    if (skillGapRisks.length > 0) {
      console.log('\n⚠️  WARNING: Skill gap risks detected even with skillGapCritical=0!');
      console.log('This suggests the configuration is NOT being applied correctly.');
      skillGapRisks.forEach(risk => {
        console.log(`  - ${risk.name} (${risk.severity})`);
      });
    } else {
      console.log('\n✓ No skill gap risks detected (as expected with skillGapCritical=0)');
    }
    
    // Step 6: Reset configuration for future tests
    console.log('\n--- Cleanup ---');
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapCritical = 0.5;
    project.markModified('teamSelectionConfig');
    await project.save();
    console.log('✓ Reset skillGapCritical to default (0.5)');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the test
testConfigFlow();
