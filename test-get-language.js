/**
 * Test getLanguageFromRequest function
 */

const i18n = require('./src/i18n/i18n.service');

// Test 1: With query parameter lang=en
console.log('=== Test 1: Query parameter lang=en ===');
const req1 = {
  query: { lang: 'en' },
  user: { preferredLanguage: 'es' },
  headers: { 'accept-language': 'es-ES,es;q=0.9' }
};
const lang1 = i18n.getLanguageFromRequest(req1);
console.log('Expected: en');
console.log('Result:', lang1);
console.log('Correct:', lang1 === 'en' ? '✓' : '✗');

// Test 2: With query parameter lang=es
console.log('\n=== Test 2: Query parameter lang=es ===');
const req2 = {
  query: { lang: 'es' },
  user: { preferredLanguage: 'en' },
  headers: { 'accept-language': 'en-US,en;q=0.9' }
};
const lang2 = i18n.getLanguageFromRequest(req2);
console.log('Expected: es');
console.log('Result:', lang2);
console.log('Correct:', lang2 === 'es' ? '✓' : '✗');

// Test 3: Without query parameter, user preference en
console.log('\n=== Test 3: User preference en ===');
const req3 = {
  query: {},
  user: { preferredLanguage: 'en' },
  headers: { 'accept-language': 'es-ES,es;q=0.9' }
};
const lang3 = i18n.getLanguageFromRequest(req3);
console.log('Expected: en');
console.log('Result:', lang3);
console.log('Correct:', lang3 === 'en' ? '✓' : '✗');

// Test 4: Without query, without user, Accept-Language header en
console.log('\n=== Test 4: Accept-Language header en ===');
const req4 = {
  query: {},
  headers: { 'accept-language': 'en-US,en;q=0.9' }
};
const lang4 = i18n.getLanguageFromRequest(req4);
console.log('Expected: en');
console.log('Result:', lang4);
console.log('Correct:', lang4 === 'en' ? '✓' : '✗');

// Test 5: Default case (no query, no user, no accept-language)
console.log('\n=== Test 5: Default (should be es) ===');
const req5 = {
  query: {},
  headers: {}
};
const lang5 = i18n.getLanguageFromRequest(req5);
console.log('Expected: es (default)');
console.log('Result:', lang5);
console.log('Correct:', lang5 === 'es' ? '✓' : '✗');

console.log('\n=== All tests completed ===');
