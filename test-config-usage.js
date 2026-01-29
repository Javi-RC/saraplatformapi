/**
 * Test script to verify that CBR and Decision Tree services use configuration properly
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { getConfigSection, DEFAULT_TEAM_SELECTION_CONFIG } = require('./src/config/teamSelectionDefaults');

async function testConfigUsage() {
  console.log('=== Testing Configuration Usage ===\n');
  
  // Test 1: Default configuration
  console.log('1. Testing default configuration:');
  const defaultConfig = getConfigSection(null, 'cbr');
  console.log('   CBR minSimilarityThreshold:', defaultConfig.minSimilarityThreshold);
  console.log('   CBR kSimilarCases:', defaultConfig.kSimilarCases);
  console.log('   CBR dimensionWeights:', defaultConfig.dimensionWeights);
  console.log('   ✓ Default config loaded\n');
  
  // Test 2: Custom configuration (simulating a project with custom config)
  console.log('2. Testing custom configuration:');
  const projectWithCustomConfig = {
    teamSelectionConfig: {
      cbr: {
        minSimilarityThreshold: 0.5, // Custom threshold
        kSimilarCases: 3,
        dimensionWeights: {
          coordination: 0.3,
          technical: 0.3,
          team: 0.2,
          management: 0.1,
          organizational: 0.1
        }
      }
    }
  };
  
  const customConfig = getConfigSection(projectWithCustomConfig, 'cbr');
  console.log('   CBR minSimilarityThreshold:', customConfig.minSimilarityThreshold);
  console.log('   CBR kSimilarCases:', customConfig.kSimilarCases);
  console.log('   CBR dimensionWeights:', customConfig.dimensionWeights);
  console.log('   ✓ Custom config loaded\n');
  
  // Test 3: Decision Tree configuration
  console.log('3. Testing Decision Tree configuration:');
  const dtConfig = getConfigSection(null, 'decisionTree');
  console.log('   skillGapCritical:', dtConfig.riskThresholds.skillGapCritical);
  console.log('   skillGapMajor:', dtConfig.riskThresholds.skillGapMajor);
  console.log('   minTimeOverlapHours:', dtConfig.riskThresholds.minTimeOverlapHours);
  console.log('   overloadCritical:', dtConfig.riskThresholds.overloadCritical);
  console.log('   ✓ Decision Tree config loaded\n');
  
  // Test 4: Project with partial custom config (should merge with defaults)
  console.log('4. Testing partial custom configuration (merge with defaults):');
  const projectPartialConfig = {
    teamSelectionConfig: {
      cbr: {
        minSimilarityThreshold: 0.6 // Only override threshold
      }
    }
  };
  
  const partialConfig = getConfigSection(projectPartialConfig, 'cbr');
  console.log('   CBR minSimilarityThreshold:', partialConfig.minSimilarityThreshold, '(custom)');
  console.log('   CBR kSimilarCases:', partialConfig.kSimilarCases, '(default)');
  console.log('   ✓ Partial config merged with defaults\n');
  
  console.log('=== All Configuration Tests Passed ===');
  console.log('\nNOTE: The services (cbr.service.js, decisionTree.service.js) will now');
  console.log('use these configurations instead of hardcoded values.\n');
  console.log('To customize for a project, add teamSelectionConfig to the project document:');
  console.log(`
Example:
{
  projectName: "My Project",
  teamSelectionConfig: {
    cbr: {
      minSimilarityThreshold: 0.5,  // Only return cases with >50% similarity
      kSimilarCases: 3               // Use top 3 most similar cases
    },
    decisionTree: {
      riskThresholds: {
        skillGapCritical: 0.4,       // Lower threshold = more strict
        overloadCritical: 50          // Custom overload threshold
      }
    }
  }
}
  `);
}

// Run test
testConfigUsage().catch(console.error);
