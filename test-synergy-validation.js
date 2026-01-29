/**
 * Quick test to verify synergy weights validation
 */

const { validateTeamSelectionConfig, DEFAULT_TEAM_SELECTION_CONFIG } = require('./src/config/teamSelectionDefaults');

console.log('🧪 Testing Synergy Weights Validation\n');

// Test 1: Valid configuration (sums to 1.0)
console.log('Test 1: Valid configuration (0.25 + 0.45 + 0.30 = 1.0)');
const validConfig = {
  phase2: {
    synergyWeights: {
      roleDiversityWeight: 0.25,
      projectFitWeight: 0.45,
      previousCollaborationsWeight: 0.30
    }
  }
};

const result1 = validateTeamSelectionConfig(validConfig);
console.log('Result:', result1.valid ? '✅ VALID' : '❌ INVALID');
if (!result1.valid) {
  console.log('Errors:', result1.errors);
}
console.log('');

// Test 2: Invalid configuration (missing previousCollaborationsWeight)
console.log('Test 2: Invalid - only two weights (0.25 + 0.45 = 0.70)');
const invalidConfig = {
  phase2: {
    synergyWeights: {
      roleDiversityWeight: 0.25,
      projectFitWeight: 0.45
    }
  }
};

const result2 = validateTeamSelectionConfig(invalidConfig);
console.log('Result:', result2.valid ? '✅ VALID' : '❌ INVALID');
if (!result2.valid) {
  console.log('Errors:', result2.errors);
}
console.log('');

// Test 3: Default configuration
console.log('Test 3: Default configuration from system');
const result3 = validateTeamSelectionConfig(DEFAULT_TEAM_SELECTION_CONFIG);
console.log('Result:', result3.valid ? '✅ VALID' : '❌ INVALID');
if (!result3.valid) {
  console.log('Errors:', result3.errors);
}
console.log('');

// Test 4: Sum > 1.0
console.log('Test 4: Invalid - sum > 1.0 (0.40 + 0.40 + 0.40 = 1.20)');
const invalidConfig2 = {
  phase2: {
    synergyWeights: {
      roleDiversityWeight: 0.40,
      projectFitWeight: 0.40,
      previousCollaborationsWeight: 0.40
    }
  }
};

const result4 = validateTeamSelectionConfig(invalidConfig2);
console.log('Result:', result4.valid ? '✅ VALID' : '❌ INVALID');
if (!result4.valid) {
  console.log('Errors:', result4.errors);
}

console.log('\n✨ All tests completed!');
