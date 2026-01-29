/**
 * Test HTTP endpoint for getting project risks
 * This simulates a real HTTP request to the API
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const PROJECT_ID = '696f6ab457cf89417a8ca48c';

// You'll need to replace this with a valid JWT token
// You can get one by logging in through the frontend or using the /auth/login endpoint
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testHttpGetRisks() {
  try {
    console.log('Testing GET /api/projects/:id/risks endpoint...\n');
    
    const response = await axios.get(
      `${BASE_URL}/api/projects/${PROJECT_ID}/risks`,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('\n=== RESPONSE DATA ===');
    console.log('Project ID:', response.data.data.projectId);
    console.log('Project Name:', response.data.data.projectName);
    console.log('Risks Count:', response.data.data.risks?.length || 0);
    console.log('Metadata:', JSON.stringify(response.data.data.metadata, null, 2));
    console.log('Summary:', JSON.stringify(response.data.data.summary, null, 2));
    
    if (response.data.data.risks && response.data.data.risks.length > 0) {
      console.log('\n=== FIRST RISK ===');
      const firstRisk = response.data.data.risks[0];
      console.log('Type:', firstRisk.type);
      console.log('Title:', firstRisk.title);
      console.log('Severity:', firstRisk.severity);
      console.log('Probability:', firstRisk.probability);
      console.log('Confidence:', firstRisk.confidence);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('HTTP Error:', error.response.status);
      console.error('Error data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Check if JWT token is provided
if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
  console.log('❌ Please replace JWT_TOKEN with a valid token');
  console.log('\nTo get a token, you can:');
  console.log('1. Login through the frontend and copy the token from localStorage');
  console.log('2. Or use curl to login:');
  console.log('   curl -X POST http://localhost:3000/auth/login \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"email":"your@email.com","password":"yourpassword"}\'');
} else {
  testHttpGetRisks();
}
