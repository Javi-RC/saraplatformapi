/**
 * Test for risk translation
 * This test verifies that risks are correctly translated based on language parameter
 */

const i18n = require('./src/i18n/i18n.service');

// Test 1: Translate a specific risk in Spanish
console.log('=== Test 1: Spanish Translation ===');
const riskES = i18n.translateRisk('communication_breakdown', 'es');
console.log('Type: communication_breakdown');
console.log('Language: es');
console.log('Title:', riskES.title);
console.log('Description:', riskES.description);
console.log('Recommendations:', riskES.recommendations);

console.log('\n=== Test 2: English Translation ===');
const riskEN = i18n.translateRisk('communication_breakdown', 'en');
console.log('Type: communication_breakdown');
console.log('Language: en');
console.log('Title:', riskEN.title);
console.log('Description:', riskEN.description);
console.log('Recommendations:', riskEN.recommendations);

console.log('\n=== Test 3: Recommendations in Spanish ===');
const recsES = i18n.translateRecommendations('cultural_distance_risk', 'es');
console.log('Type: cultural_distance_risk');
console.log('Language: es');
console.log('Recommendations:', recsES);

console.log('\n=== Test 4: Recommendations in English ===');
const recsEN = i18n.translateRecommendations('cultural_distance_risk', 'en');
console.log('Type: cultural_distance_risk');
console.log('Language: en');
console.log('Recommendations:', recsEN);

console.log('\n=== All tests completed ===');
