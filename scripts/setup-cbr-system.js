/**
 * Setup Script: Initialize CBR Risk Prediction System
 * 
 * This script helps initialize the CBR system by:
 * 1. Loading seed cases into the database
 * 2. Verifying all models and indexes
 * 3. Running basic health checks
 * 
 * Usage:
 * node scripts/setup-cbr-system.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const CaseBase = require('../src/models/caseBase.model');
const Risk = require('../src/models/risk.model');
const seedCasesService = require('../src/services/seedCases.service');

async function setupCBRSystem() {
  try {
    console.log('🚀 Starting CBR Risk Prediction System Setup...\n');
    
    // 1. Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tfg-backend', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');
    
    // 2. Check if seed cases already exist
    console.log('🔍 Checking for existing seed cases...');
    const existingSeeds = await CaseBase.find({ type: 'seed' });
    
    if (existingSeeds.length > 0) {
      console.log(`⚠️  Found ${existingSeeds.length} existing seed cases`);
      console.log('   Do you want to reload them? (This will delete and recreate)');
      console.log('   To force reload, run: FORCE_RELOAD=true node scripts/setup-cbr-system.js\n');
      
      if (process.env.FORCE_RELOAD !== 'true') {
        console.log('ℹ️  Skipping seed case loading. Use FORCE_RELOAD=true to reload.\n');
      } else {
        console.log('🗑️  Deleting existing seed cases...');
        await seedCasesService.deleteSeedCases();
        console.log('✅ Deleted existing seed cases\n');
        
        console.log('📦 Loading seed cases...');
        const result = await seedCasesService.loadSeedCases();
        console.log(`✅ Loaded ${result.loaded} seed cases\n`);
      }
    } else {
      console.log('📦 Loading seed cases...');
      const result = await seedCasesService.loadSeedCases();
      console.log(`✅ Loaded ${result.loaded} seed cases\n`);
    }
    
    // 3. Verify seed cases
    console.log('✔️  Verifying seed cases...');
    const seeds = await seedCasesService.getSeedCases();
    console.log(`   Found ${seeds.length} seed cases:`);
    
    seeds.forEach((seed, index) => {
      const riskTypes = seed.solution.actualRisks.map(r => r.type);
      console.log(`   ${index + 1}. ${seed.problem.projectName}`);
      console.log(`      Risks: ${riskTypes.join(', ')}`);
      console.log(`      Delay: ${seed.solution.delayDays} days`);
      console.log(`      Budget: ${seed.solution.budgetOverrun}% overrun`);
    });
    console.log('');
    
    // 4. Verify indexes
    console.log('🔧 Verifying database indexes...');
    
    // Risk model indexes
    await Risk.createIndexes();
    console.log('   ✅ Risk indexes verified');
    
    // CaseBase model indexes
    await CaseBase.createIndexes();
    console.log('   ✅ CaseBase indexes verified\n');
    
    // 5. Display statistics
    console.log('📊 System Statistics:');
    
    const caseBaseStats = await CaseBase.getCaseBaseStats();
    console.log(`   Total Cases: ${caseBaseStats.total}`);
    console.log(`   - Seeds: ${caseBaseStats.byType.seed || 0}`);
    console.log(`   - Generic: ${caseBaseStats.byType.generic || 0}`);
    console.log(`   - Organizational: ${caseBaseStats.byType.organizational || 0}`);
    console.log(`   Average Quality: ${caseBaseStats.avgQuality.toFixed(2)}`);
    
    const riskCount = await Risk.countDocuments();
    console.log(`   Total Risks Tracked: ${riskCount}\n`);
    
    // 6. Display next steps
    console.log('✨ Setup Complete!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Create a project using the existing API');
    console.log('   2. Predict risks: POST /api/projects/:id/risks/predict');
    console.log('   3. View risks: GET /api/projects/:id/risks');
    console.log('   4. Complete project and capture outcome: POST /api/projects/:id/outcome');
    console.log('   5. View insights: GET /api/organizations/:id/risks/insights\n');
    
    console.log('📚 Documentation:');
    console.log('   - Full guide: CBR_RISK_SYSTEM_DOCUMENTATION.md');
    console.log('   - API endpoints: See risk.routes.js');
    console.log('   - Run tests: npm test -- risk-prediction.integration.test.js\n');
    
    console.log('🎯 Current System Phase: 1 (Bootstrap)');
    console.log('   Tree Weight: 90%, CBR Weight: 10%');
    console.log('   Phase will advance as you add organizational cases.\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Connection closed');
  }
}

// Run setup
setupCBRSystem();
