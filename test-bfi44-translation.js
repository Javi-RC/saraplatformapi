/**
 * Test BFI-44 Translation
 * Verifica que el cuestionario BFI-44 se traduce correctamente
 */

const BFI44Service = require('./src/services/bfi44.service');

console.log('=== Testing BFI-44 Translation ===\n');

// Test Spanish
console.log('📋 Spanish (es):');
const questionnaireES = BFI44Service.getQuestionnaire('es');
console.log('  Inventory:', questionnaireES.inventory);
console.log('  Description:', questionnaireES.description);
console.log('  Instructions:', questionnaireES.instructions);
console.log('  Scale 1:', questionnaireES.scale[1]);
console.log('  Scale 5:', questionnaireES.scale[5]);
console.log('  First question:', questionnaireES.questions[0].text);
console.log('  Last question:', questionnaireES.questions[43].text);
console.log('  Total questions:', questionnaireES.questions.length);

console.log('\n📋 English (en):');
const questionnaireEN = BFI44Service.getQuestionnaire('en');
console.log('  Inventory:', questionnaireEN.inventory);
console.log('  Description:', questionnaireEN.description);
console.log('  Instructions:', questionnaireEN.instructions);
console.log('  Scale 1:', questionnaireEN.scale[1]);
console.log('  Scale 5:', questionnaireEN.scale[5]);
console.log('  First question:', questionnaireEN.questions[0].text);
console.log('  Last question:', questionnaireEN.questions[43].text);
console.log('  Total questions:', questionnaireEN.questions.length);

// Verification
console.log('\n✅ Verification:');
const isSpanishCorrect = questionnaireES.questions[0].text === 'Es conversador/a';
const isEnglishCorrect = questionnaireEN.questions[0].text === 'Is talkative';
const hasAllQuestions = questionnaireES.questions.length === 44 && questionnaireEN.questions.length === 44;

console.log('  Spanish translation:', isSpanishCorrect ? '✓ OK' : '✗ FAIL');
console.log('  English translation:', isEnglishCorrect ? '✓ OK' : '✗ FAIL');
console.log('  All 44 questions present:', hasAllQuestions ? '✓ OK' : '✗ FAIL');

if (isSpanishCorrect && isEnglishCorrect && hasAllQuestions) {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed');
  process.exit(1);
}
