/**
 * Test normalizeRiskFromCatalog with different languages
 */

const i18n = require('./src/i18n/i18n.service');
const { getRiskMetadata } = require('./src/config/riskCatalog');

// Simulate a risk object as it would come from decisionTree or CBR
const mockRisk = {
  type: 'communication_breakdown',
  title: 'Communication Risk',  // English hardcoded (from decisionTree)
  description: 'Some description',
  category: 'coordination',
  severity: 'high',
  source: 'expert_rules',
  recommendations: ['Old recommendation 1', 'Old recommendation 2']
};

console.log('=== Original Risk (as it comes from decisionTree) ===');
console.log('Title:', mockRisk.title);
console.log('Description:', mockRisk.description);
console.log('Recommendations:', mockRisk.recommendations);

// Simulate normalizeRiskFromCatalog function
function normalizeRiskFromCatalog(risk, lang = 'es') {
  console.log(`\n[Test] Normalizing risk ${risk?.type} with lang: ${lang}`);
  
  const metadata = getRiskMetadata(risk?.type);
  const translated = i18n.translateRisk(risk?.type, lang);
  
  console.log(`[Test] Translated title for ${risk?.type}:`, translated?.title);

  // Get translated recommendations from i18n, not from catalog (which is in Spanish)
  const translatedRecommendations = i18n.translateRecommendations(risk?.type, lang);
  const recommendations = Array.isArray(translatedRecommendations) && translatedRecommendations.length > 0
    ? translatedRecommendations
    : [];

  return {
    ...risk,
    title: translated?.title || risk?.title,
    description: translated?.description || risk?.description,
    category: metadata?.category || risk?.category || 'management',
    recommendations
  };
}

console.log('\n\n=== After normalizeRiskFromCatalog with lang=es ===');
const normalizedES = normalizeRiskFromCatalog(mockRisk, 'es');
console.log('Title:', normalizedES.title);
console.log('Description:', normalizedES.description);
console.log('Recommendations:', normalizedES.recommendations);

console.log('\n\n=== After normalizeRiskFromCatalog with lang=en ===');
const normalizedEN = normalizeRiskFromCatalog(mockRisk, 'en');
console.log('Title:', normalizedEN.title);
console.log('Description:', normalizedEN.description);
console.log('Recommendations:', normalizedEN.recommendations);

console.log('\n\n=== Test 2: Risk from CBR (catalog title in Spanish) ===');
const mockRiskCBR = {
  type: 'cultural_distance_risk',
  title: 'Distancia cultural elevada',  // Spanish from catalog
  description: 'Alta distancia cultural',
  category: 'team',
  severity: 'medium',
  source: 'cbr',
  recommendations: []
};

console.log('Original Title:', mockRiskCBR.title);

const normalizedCBR_ES = normalizeRiskFromCatalog(mockRiskCBR, 'es');
console.log('After normalize (es) Title:', normalizedCBR_ES.title);

const normalizedCBR_EN = normalizeRiskFromCatalog(mockRiskCBR, 'en');
console.log('After normalize (en) Title:', normalizedCBR_EN.title);

console.log('\n=== All tests completed ===');
