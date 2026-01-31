/**
 * Test to verify Decision Tree Configuration Impact
 * Tests PERMISSIVE vs STRICT configuration
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./src/models/project.model');
const riskPredictionService = require('./src/services/riskPrediction.service');

async function testConfigImpact() {
  try {
    console.log('=== Testing Configuration Impact ===\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Find a project with team and technologies
    const project = await Project.findOne({
      assignedEmployees: { $exists: true, $ne: [] },
      mainTechnologies: { $exists: true, $ne: [] }
    });
    
    if (!project) {
      console.log('✗ No suitable project found');
      return;
    }
    
    console.log(`Project: ${project.projectName} (${project._id})\n`);
    
    // ==========================================
    // TEST 1: PERMISSIVE Configuration (should minimize risks)
    // ==========================================
    console.log('--- TEST 1: PERMISSIVE Configuration ---');
    console.log('Setting ultra-permissive thresholds...');
    
    if (!project.teamSelectionConfig) project.teamSelectionConfig = {};
    if (!project.teamSelectionConfig.decisionTree) project.teamSelectionConfig.decisionTree = {};
    if (!project.teamSelectionConfig.decisionTree.riskThresholds) {
      project.teamSelectionConfig.decisionTree.riskThresholds = {};
    }
    
    // PERMISSIVE: Almost impossible to trigger
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapCritical = 0;        // Match < 0% = impossible
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapMajor = 0;           // Match < 0% = impossible
    project.teamSelectionConfig.decisionTree.riskThresholds.minTechnologiesThreshold = 100; // Need 100+ missing techs
    project.teamSelectionConfig.decisionTree.riskThresholds.maxJuniorRatio = 1.0;        // Allow 100% juniors
    project.teamSelectionConfig.decisionTree.riskThresholds.minProficiencyThreshold = 1.0; // Accept minimum proficiency
    
    project.markModified('teamSelectionConfig');
    await project.save();
    
    console.log('Config applied:');
    console.log('  skillGapCritical: 0 (impossible to trigger)');
    console.log('  skillGapMajor: 0 (impossible to trigger)');
    console.log('  minTechnologiesThreshold: 100 (need 100+ missing)');
    console.log('  maxJuniorRatio: 1.0 (allow all juniors)');
    console.log('  minProficiencyThreshold: 1.0 (accept minimum)\n');
    
    const permissiveResult = await riskPredictionService.predictProjectRisks(project._id, 'es');
    const permissiveSkillGapRisks = permissiveResult.dtRisks.filter(r => r.type === 'skill_gap');
    
    console.log(`Total DT risks: ${permissiveResult.dtRisks.length}`);
    console.log(`Skill gap risks: ${permissiveSkillGapRisks.length}`);
    if (permissiveSkillGapRisks.length > 0) {
      console.log('⚠️  SKILL GAP RISKS DETECTED (should be 0 with permissive config!)');
      permissiveSkillGapRisks.forEach(r => {
        console.log(`  - ${r.title} (${r.severity})`);
        console.log(`    Indicators: ${JSON.stringify(r.indicators)}`);
      });
    } else {
      console.log('✓ No skill gap risks (as expected)\n');
    }
    
    // ==========================================
    // TEST 2: STRICT Configuration (should maximize risks)
    // ==========================================
    console.log('\n--- TEST 2: STRICT Configuration ---');
    console.log('Setting ultra-strict thresholds...');
    
    // STRICT: Very easy to trigger
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapCritical = 1.0;      // Match < 100% = critical
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapMajor = 1.0;         // Match < 100% = major
    project.teamSelectionConfig.decisionTree.riskThresholds.minTechnologiesThreshold = 1; // Any missing tech (min=1)
    project.teamSelectionConfig.decisionTree.riskThresholds.maxJuniorRatio = 0;          // No juniors allowed
    project.teamSelectionConfig.decisionTree.riskThresholds.minProficiencyThreshold = 5.0; // Need perfect proficiency
    
    project.markModified('teamSelectionConfig');
    await project.save();
    
    console.log('Config applied:');
    console.log('  skillGapCritical: 1.0 (any match < 100%)');
    console.log('  skillGapMajor: 1.0 (any match < 100%)');
    console.log('  minTechnologiesThreshold: 1 (any missing tech)');
    console.log('  maxJuniorRatio: 0 (no juniors allowed)');
    console.log('  minProficiencyThreshold: 5.0 (need perfect)\n');
    
    const strictResult = await riskPredictionService.predictProjectRisks(project._id, 'es');
    const strictSkillGapRisks = strictResult.dtRisks.filter(r => r.type === 'skill_gap');
    
    console.log(`Total DT risks: ${strictResult.dtRisks.length}`);
    console.log(`Skill gap risks: ${strictSkillGapRisks.length}`);
    if (strictSkillGapRisks.length > 0) {
      console.log('✓ SKILL GAP RISKS DETECTED (as expected with strict config)');
      strictSkillGapRisks.forEach(r => {
        console.log(`  - ${r.title} (${r.severity})`);
      });
    } else {
      console.log('⚠️  No skill gap risks (unexpected with strict config!)\n');
    }
    
    // ==========================================
    // COMPARISON
    // ==========================================
    console.log('\n--- COMPARISON ---');
    console.log(`Permissive config: ${permissiveSkillGapRisks.length} skill gap risks`);
    console.log(`Strict config: ${strictSkillGapRisks.length} skill gap risks`);
    
    const difference = strictSkillGapRisks.length - permissiveSkillGapRisks.length;
    console.log(`Difference: ${difference} risks`);
    
    if (difference === 0) {
      console.log('\n❌ CONFIGURATION HAS NO EFFECT - This is the bug!');
    } else {
      console.log('\n✅ Configuration works correctly');
    }
    
    // Reset to defaults
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapCritical = 0.5;
    project.teamSelectionConfig.decisionTree.riskThresholds.skillGapMajor = 0.7;
    project.teamSelectionConfig.decisionTree.riskThresholds.minTechnologiesThreshold = 3;
    project.teamSelectionConfig.decisionTree.riskThresholds.maxJuniorRatio = 0.6;
    project.teamSelectionConfig.decisionTree.riskThresholds.minProficiencyThreshold = 2.0;
    project.markModified('teamSelectionConfig');
    await project.save();
    console.log('\n✓ Reset to default configuration');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

testConfigImpact();
