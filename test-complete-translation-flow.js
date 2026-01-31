/**
 * Complete flow test: Predict in one language, query in another
 * This test simulates the exact scenario the user reported
 */

const i18n = require('./src/i18n/i18n.service');

console.log('=== SCENARIO: Predict risks in Spanish, then query in English ===\n');

// Step 1: Risk prediction happens in Spanish (lang=es)
console.log('STEP 1: POST /api/projects/123/risks/predict?lang=es');
console.log('Risk gets saved to MongoDB with Spanish text...\n');

const riskInDB = {
  _id: '507f1f77bcf86cd799439011',
  type: 'communication_breakdown',
  title: 'Fallo de comunicación',  // Saved in Spanish
  description: 'Problemas de comunicación que impiden la coordinación efectiva del equipo',
  category: 'coordination',
  severity: 'high',
  source: 'expert_rules',
  recommendations: [
    'Implementar actualizaciones asíncronas diarias',
    'Definir protocolos claros de escalación',
    'Usar herramientas de comunicación asíncrona efectivas',
    'Establecer normas de comunicación'
  ],
  indicators: [
    'Retrasos en respuestas',
    'Información no compartida',
    'Malentendidos frecuentes'
  ],
  // Simulate Mongoose document
  toObject: function() {
    return {
      _id: this._id,
      type: this.type,
      title: this.title,
      description: this.description,
      category: this.category,
      severity: this.severity,
      source: this.source,
      recommendations: this.recommendations,
      indicators: this.indicators
    };
  }
};

console.log('Risk stored in MongoDB:');
console.log('  - Title:', riskInDB.title);
console.log('  - First recommendation:', riskInDB.recommendations[0]);
console.log('  - First indicator:', riskInDB.indicators[0]);

// Step 2: User queries risks in English (lang=en)
console.log('\nSTEP 2: GET /api/projects/123/risks?lang=en');
console.log('Controller translates the risk using translateRiskObject...\n');

const translatedRisk = i18n.translateRiskObject(riskInDB, 'en');

console.log('Risk returned to client:');
console.log('  - Title:', translatedRisk.title);
console.log('  - First recommendation:', translatedRisk.recommendations[0]);
console.log('  - First indicator:', translatedRisk.indicators[0]);

// Validation
console.log('\n=== VALIDATION ===');
const titleCorrect = translatedRisk.title === 'Communication Breakdown';
const recCorrect = translatedRisk.recommendations[0] === 'Implement daily asynchronous updates';
const indCorrect = translatedRisk.indicators[0] === 'Response delays';

console.log('Title translated correctly:', titleCorrect ? '✓ YES' : '✗ NO');
console.log('  Expected: "Communication Breakdown"');
console.log('  Got:', translatedRisk.title);

console.log('\nRecommendations translated correctly:', recCorrect ? '✓ YES' : '✗ NO');
console.log('  Expected: "Implement daily asynchronous updates"');
console.log('  Got:', translatedRisk.recommendations[0]);

console.log('\nIndicators translated correctly:', indCorrect ? '✓ YES' : '✗ NO');
console.log('  Expected: "Response delays"');
console.log('  Got:', translatedRisk.indicators[0]);

// Step 3: Try the opposite - query in Spanish after predicting in English
console.log('\n\n=== OPPOSITE SCENARIO: Predict in English, query in Spanish ===\n');

const riskInDB2 = {
  _id: '507f1f77bcf86cd799439012',
  type: 'cultural_distance_risk',
  title: 'High Cultural Distance',  // Saved in English
  description: 'High cultural distance between team countries',
  category: 'team',
  severity: 'medium',
  source: 'expert_rules',
  recommendations: [
    'Implement cross-cultural training for the team',
    'Establish culturally sensitive communication norms'
  ],
  toObject: function() {
    return {
      _id: this._id,
      type: this.type,
      title: this.title,
      description: this.description,
      category: this.category,
      severity: this.severity,
      source: this.source,
      recommendations: this.recommendations
    };
  }
};

console.log('Risk stored in MongoDB (English):');
console.log('  - Title:', riskInDB2.title);

const translatedRisk2 = i18n.translateRiskObject(riskInDB2, 'es');

console.log('\nRisk returned to client (Spanish):');
console.log('  - Title:', translatedRisk2.title);
console.log('  - First recommendation:', translatedRisk2.recommendations[0]);

const title2Correct = translatedRisk2.title === 'Distancia cultural elevada';
const rec2Correct = translatedRisk2.recommendations[0] === 'Implementar capacitación intercultural para el equipo';

console.log('\n=== VALIDATION ===');
console.log('Title translated correctly:', title2Correct ? '✓ YES' : '✗ NO');
console.log('  Expected: "Distancia cultural elevada"');
console.log('  Got:', translatedRisk2.title);

console.log('\nRecommendations translated correctly:', rec2Correct ? '✓ YES' : '✗ NO');
console.log('  Expected: "Implementar capacitación intercultural para el equipo"');
console.log('  Got:', translatedRisk2.recommendations[0]);

// Final summary
console.log('\n\n=== FINAL SUMMARY ===');
if (titleCorrect && recCorrect && indCorrect && title2Correct && rec2Correct) {
  console.log('✅ ALL TESTS PASSED - Translation system is working correctly!');
  console.log('Users can predict in one language and query in another language.');
} else {
  console.log('❌ SOME TESTS FAILED - There are still issues with translation.');
}
