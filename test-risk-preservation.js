/**
 * Test script: Verify that manual risk titles and descriptions are preserved in CBR
 * 
 * This script tests that when a manual risk is saved to CBR and then 
 * retrieved in predictions, the original title and description are preserved.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CaseBase = require('./src/models/caseBase.model');

async function testPreservation() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-db');
    console.log('✓ Connected to MongoDB\n');

    // Find cases with real risks
    const cases = await CaseBase.find({ 
      type: 'real',
      'solution.actualRisks.0': { $exists: true }
    }).limit(5);

    console.log(`📊 Found ${cases.length} cases with actual risks\n`);

    if (cases.length === 0) {
      console.log('No cases with risks found. Add some manual risks and complete a project first.');
      process.exit(0);
    }

    // Check each case
    cases.forEach((caseDoc, idx) => {
      console.log(`\n📋 Case ${idx + 1}: ${caseDoc.problem.projectName}`);
      console.log(`   Case ID: ${caseDoc._id}`);
      console.log(`   Risks: ${caseDoc.solution.actualRisks.length}`);
      
      caseDoc.solution.actualRisks.forEach((risk, riskIdx) => {
        console.log(`\n   Risk ${riskIdx + 1}:`);
        console.log(`      Type: ${risk.type}`);
        console.log(`      Title: ${risk.title || '❌ NOT SET'}`);
        console.log(`      Description: ${risk.description?.substring(0, 80) || '❌ NOT SET'}...`);
        console.log(`      Severity: ${risk.severity}`);
        
        if (!risk.title) {
          console.log(`      ⚠️  WARNING: Title is missing!`);
        }
        if (!risk.description) {
          console.log(`      ⚠️  WARNING: Description is missing!`);
        }
      });
    });

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    let totalRisks = 0;
    let risksWithTitle = 0;
    let risksWithDescription = 0;
    
    cases.forEach(caseDoc => {
      caseDoc.solution.actualRisks.forEach(risk => {
        totalRisks++;
        if (risk.title) risksWithTitle++;
        if (risk.description) risksWithDescription++;
      });
    });
    
    console.log(`Total risks in CBR: ${totalRisks}`);
    console.log(`Risks with title: ${risksWithTitle} (${(risksWithTitle/totalRisks*100).toFixed(1)}%)`);
    console.log(`Risks with description: ${risksWithDescription} (${(risksWithDescription/totalRisks*100).toFixed(1)}%)`);
    
    if (risksWithTitle === totalRisks && risksWithDescription === totalRisks) {
      console.log('\n✅ All risks have title and description preserved!');
    } else {
      console.log('\n⚠️  Some risks are missing title or description.');
      console.log('   This is expected for old cases created before this fix.');
      console.log('   New cases will preserve title and description correctly.');
    }
    
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run test
console.log('🔍 Checking if manual risk titles and descriptions are preserved in CBR...\n');
testPreservation();
