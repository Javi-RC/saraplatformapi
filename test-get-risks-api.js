/**
 * Test API call to get project risks
 */
require('dotenv').config();
const mongoose = require('mongoose');
const riskPredictionService = require('./src/services/riskPrediction.service');

const projectId = '696f6ab457cf89417a8ca48c';

async function testGetRisks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    console.log('\n=== CALLING riskPredictionService.getProjectRiskPredictions ===');
    const result = await riskPredictionService.getProjectRiskPredictions(projectId);
    
    console.log('\n=== RESULT ===');
    console.log('Project ID:', result.projectId);
    console.log('Project Name:', result.projectName);
    console.log('Risks count:', result.risks?.length || 0);
    console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
    console.log('Summary:', JSON.stringify(result.summary, null, 2));
    
    if (result.risks && result.risks.length > 0) {
      console.log('\n=== FIRST 3 RISKS ===');
      result.risks.slice(0, 3).forEach((risk, index) => {
        console.log(`\nRisk ${index + 1}:`);
        console.log('  Type:', risk.type);
        console.log('  Title:', risk.title);
        console.log('  Severity:', risk.severity);
        console.log('  Probability:', risk.probability);
        console.log('  Confidence:', risk.confidence);
        console.log('  Source:', risk.source);
      });
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

testGetRisks();
