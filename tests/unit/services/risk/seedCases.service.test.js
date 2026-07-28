jest.mock('../../../../src/repositories', () => ({
  caseBaseRepository: {
    find: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  }
}));

const { caseBaseRepository } = require('../../../../src/repositories');
const seedService = require('../../../../src/services/risk/seedCases.service');

describe('seedCases.service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loadSeedCases should return loaded=false when seeds already exist', async () => {
    caseBaseRepository.find.mockResolvedValue(new Array(seedService.SEED_CASES.length).fill({}));

    const result = await seedService.loadSeedCases();

    expect(result.loaded).toBe(false);
    expect(result.message).toContain('already exist');
    expect(caseBaseRepository.create).not.toHaveBeenCalled();
  });

  it('loadSeedCases should insert seeds when missing', async () => {
    caseBaseRepository.find.mockResolvedValue([]);
    caseBaseRepository.create.mockResolvedValue({ _id: '1', problem: { projectName: 'P' }, type: 'seed' });

    const result = await seedService.loadSeedCases('org-1');

    expect(result.loaded).toBe(true);
    expect(result.count).toBe(seedService.SEED_CASES.length);
    expect(caseBaseRepository.create).toHaveBeenCalledTimes(seedService.SEED_CASES.length);
  });

  it('deleteSeedCases should return deletedCount', async () => {
    caseBaseRepository.deleteMany.mockResolvedValue({ deletedCount: 3 });

    const result = await seedService.deleteSeedCases();

    expect(result.deleted).toBe(3);
  });
});
