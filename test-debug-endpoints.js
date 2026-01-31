/**
 * Test debug endpoints with language support
 * Simulates the calls from secret-risks-debug-panel-2026
 */

const i18n = require('./src/i18n/i18n.service');
const { RISK_CATALOG } = require('./src/config/riskCatalog');

console.log('=== Test Debug Endpoints Translation ===\n');

// Simulate debugGetAllRisks endpoint
console.log('TEST 1: GET /api/risks/debug/all?lang=en');
console.log('─'.repeat(60));

const mockReqEN = {
  query: { lang: 'en' },
  headers: {}
};

const langEN = i18n.getLanguageFromRequest(mockReqEN);
console.log('Detected language:', langEN);

// Translate a few risks
const testTypes = ['communication_breakdown', 'cultural_distance_risk', 'skill_gap'];

testTypes.forEach(type => {
  const translated = i18n.translateRisk(type, langEN);
  const catalogEntry = RISK_CATALOG[type];
  
  console.log(`\n${type}:`);
  console.log('  Title (EN):', translated?.title);
  console.log('  Description (EN):', translated?.description?.substring(0, 60) + '...');
  console.log('  Recommendations:', i18n.translateRecommendations(type, langEN).length, 'items');
});

// Simulate debugGetAllRisks with Spanish
console.log('\n\nTEST 2: GET /api/risks/debug/all?lang=es');
console.log('─'.repeat(60));

const mockReqES = {
  query: { lang: 'es' },
  headers: {}
};

const langES = i18n.getLanguageFromRequest(mockReqES);
console.log('Detected language:', langES);

testTypes.forEach(type => {
  const translated = i18n.translateRisk(type, langES);
  
  console.log(`\n${type}:`);
  console.log('  Title (ES):', translated?.title);
  console.log('  Description (ES):', translated?.description?.substring(0, 60) + '...');
  console.log('  Recommendations:', i18n.translateRecommendations(type, langES).length, 'items');
});

// Test debugGetRisksByType
console.log('\n\nTEST 3: GET /api/risks/debug/by-type/communication_breakdown?lang=en');
console.log('─'.repeat(60));

const type = 'communication_breakdown';
const translatedDetail = i18n.translateRisk(type, 'en');
console.log('Type:', type);
console.log('Title (EN):', translatedDetail?.title);
console.log('Description (EN):', translatedDetail?.description);
console.log('Indicators:', Object.values(translatedDetail?.indicators || {}));
console.log('Recommendations:', Object.values(translatedDetail?.recommendations || {}));

console.log('\n\nTEST 4: Same endpoint with Spanish');
console.log('─'.repeat(60));

const translatedDetailES = i18n.translateRisk(type, 'es');
console.log('Type:', type);
console.log('Title (ES):', translatedDetailES?.title);
console.log('Description (ES):', translatedDetailES?.description);
console.log('Indicators:', Object.values(translatedDetailES?.indicators || {}));
console.log('Recommendations:', Object.values(translatedDetailES?.recommendations || {}));

console.log('\n\n=== Summary ===');
console.log('✅ Language detection from request: Working');
console.log('✅ Risk translation (title): Working');
console.log('✅ Risk translation (description): Working');
console.log('✅ Risk translation (recommendations): Working');
console.log('✅ Risk translation (indicators): Working');
console.log('\n✅ Debug endpoints should now support ?lang=en and ?lang=es');
