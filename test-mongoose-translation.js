/**
 * Test translateRiskObject with Mongoose-like object
 */

const i18n = require('./src/i18n/i18n.service');

// Simulate a risk from MongoDB (Mongoose document)
const mockMongooseRisk = {
  _id: '507f1f77bcf86cd799439011',
  type: 'communication_breakdown',
  title: 'Fallo de comunicación',  // Stored in Spanish
  description: 'Problemas de comunicación que impiden la coordinación efectiva del equipo',
  category: 'coordination',
  severity: 'high',
  source: 'expert_rules',
  recommendations: [
    'Implementar actualizaciones asíncronas diarias',
    'Definir protocolos claros de escalación'
  ],
  indicators: [
    'Retrasos en respuestas',
    'Información no compartida'
  ],
  // Mongoose methods
  toObject: function() {
    const { toObject, toJSON, ...obj } = this;
    return obj;
  },
  toJSON: function() {
    const { toObject, toJSON, ...obj } = this;
    return obj;
  }
};

console.log('=== Test 1: Direct translation (like controller does) ===');
console.log('Original Title:', mockMongooseRisk.title);

const translated = i18n.translateRiskObject(mockMongooseRisk, 'en');
console.log('Translated Title:', translated.title);
console.log('Expected: Communication Breakdown');
console.log('Match:', translated.title === 'Communication Breakdown' ? '✓' : '✗');

console.log('\n=== Test 2: Check if recommendations changed ===');
console.log('Original recommendations:', mockMongooseRisk.recommendations);
console.log('Translated recommendations:', translated.recommendations);
console.log('Should be in English:', translated.recommendations[0]);

console.log('\n=== Test 3: Translation to Spanish ===');
const translatedES = i18n.translateRiskObject(mockMongooseRisk, 'es');
console.log('Title:', translatedES.title);
console.log('Expected: Fallo de comunicación');
console.log('Match:', translatedES.title === 'Fallo de comunicación' ? '✓' : '✗');

console.log('\n=== Summary ===');
if (translated.title === 'Communication Breakdown' && 
    translated.recommendations[0] === 'Implement daily asynchronous updates') {
  console.log('✓ Translation is working correctly');
} else {
  console.log('✗ Translation is NOT working');
  console.log('Actual title:', translated.title);
  console.log('Actual recommendation:', translated.recommendations[0]);
}
