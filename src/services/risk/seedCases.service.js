/**
 * Seed Cases Service
 * Provides initial generic cases for CBR system bootstrap
 * Based on project management literature and industry best practices
 */

const { caseBaseRepository } = require('../../repositories');
const AppError = require('../../utils/AppError');

const SEED_CASES = require('../../data/seedCases.data');

/**
 * Load seed cases into database for an organization
 */
async function loadSeedCases(organizationId = null) {
  try {
    const existingSeeds = await caseBaseRepository.find({ type: 'seed' });
    
    if (existingSeeds.length >= SEED_CASES.length) {
      return {
        loaded: false,
        count: existingSeeds.length,
        message: 'Seed cases already exist in database'
      };
    }
    
    const seedDocs = SEED_CASES.map(seedCase => ({
      ...seedCase,
      ...(organizationId ? { organization: organizationId } : {})
    }));
    
    // Insert one by one to avoid duplicate key errors on caseId index
    const inserted = [];
    for (const doc of seedDocs) {
      try {
        const result = await caseBaseRepository.create(doc);
        inserted.push(result);
      } catch (err) {
        // Skip if duplicate, but log other errors
        if (err.code !== 11000) {
          console.warn('Warning: Could not insert seed case:', err.message);
        }
      }
    }
    
    return {
      loaded: true,
      count: inserted.length,
      cases: inserted.map(c => ({
        id: c._id,
        projectName: c.problem.projectName,
        type: c.type
      })),
      message: `Successfully loaded ${inserted.length} seed cases`
    };
    
  } catch (error) {
    console.error('Error loading seed cases:', error);
    throw new AppError('SEED_CASES_LOAD_FAILED', 500, `Failed to load seed cases: ${error.message}`);
  }
}

/**
 * Get all available seed cases
 */
async function getSeedCases() {
  const seeds = await caseBaseRepository.find({ type: 'seed' });
  
  return seeds.map(seed => ({
    id: seed._id,
    projectName: seed.problem.projectName,
    description: seed.problem.briefDescription,
    source: seed.metadata.basedOn,
    mainRisks: seed.solution.actualRisks.map(r => r.type),
    outcome: {
      completed: seed.solution.completed,
      delayDays: seed.solution.delayDays,
      budgetOverrun: seed.solution.budgetOverrun
    }
  }));
}

/**
 * Delete all seed cases (for testing/reset)
 */
async function deleteSeedCases() {
  const result = await caseBaseRepository.deleteMany({ type: 'seed' });
  
  return {
    deleted: result.deletedCount,
    message: `Deleted ${result.deletedCount} seed cases`
  };
}

module.exports = {
  loadSeedCases,
  getSeedCases,
  deleteSeedCases,
  SEED_CASES
};
