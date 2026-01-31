/**
 * Test script to verify i18n implementation
 * Run: node test-i18n.js
 */

const i18n = require('./src/i18n/i18n.service');

console.log('=== Testing i18n Service ===\n');

// Test 1: Translate risk in Spanish
console.log('1. Risk in Spanish:');
const riskES = i18n.translateRisk('communication_breakdown', 'es');
console.log('   Title:', riskES.title);
console.log('   Description:', riskES.description);
console.log('');

// Test 2: Translate risk in English
console.log('2. Risk in English:');
const riskEN = i18n.translateRisk('communication_breakdown', 'en');
console.log('   Title:', riskEN.title);
console.log('   Description:', riskEN.description);
console.log('');

// Test 3: Translate indicators
console.log('3. Indicators in English:');
const indicators = i18n.translateIndicators('skill_gap', 'en');
indicators.forEach((ind, i) => console.log(`   ${i + 1}. ${ind}`));
console.log('');

// Test 4: Translate recommendations
console.log('4. Recommendations in English:');
const recommendations = i18n.translateRecommendations('skill_gap', 'en');
recommendations.forEach((rec, i) => console.log(`   ${i + 1}. ${rec}`));
console.log('');

// Test 5: Translate severity
console.log('5. Severity translations:');
console.log('   ES - High:', i18n.translateSeverity('high', 'es'));
console.log('   EN - High:', i18n.translateSeverity('high', 'en'));
console.log('');

// Test 6: Translate category
console.log('6. Category translations:');
console.log('   ES - Coordination:', i18n.translateCategory('coordination', 'es'));
console.log('   EN - Coordination:', i18n.translateCategory('coordination', 'en'));
console.log('');

// Test 7: Translate source
console.log('7. Source translations:');
console.log('   ES - Expert rules:', i18n.translateSource('expert_rules', 'es'));
console.log('   EN - Expert rules:', i18n.translateSource('expert_rules', 'en'));
console.log('');

// Test 8: Phase description
console.log('8. Phase descriptions:');
console.log('   ES - Phase 2:', i18n.translatePhaseDescription(2, 25, 'es'));
console.log('   EN - Phase 2:', i18n.translatePhaseDescription(2, 25, 'en'));
console.log('');

// Test 9: Translate full risk object
console.log('9. Full risk object translation:');
const mockRisk = {
  type: 'team_overload',
  title: 'Sobrecarga del equipo', // This should be replaced
  description: 'Old description',
  severity: 'high',
  category: 'team',
  indicators: [],
  recommendations: []
};

const translatedRisk = i18n.translateRiskObject(mockRisk, 'en');
console.log('   Title:', translatedRisk.title);
console.log('   Description:', translatedRisk.description);
console.log('');

// Test 10: Language validation
console.log('10. Language validation:');
console.log('   "es" is valid:', i18n.isValidLanguage('es'));
console.log('   "en" is valid:', i18n.isValidLanguage('en'));
console.log('   "fr" is valid:', i18n.isValidLanguage('fr'));
console.log('');

console.log('=== All tests completed successfully! ===');
