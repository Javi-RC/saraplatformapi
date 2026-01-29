jest.mock('../../../src/models/caseBase.model', () => ({
  find: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn()
}));

const CaseBase = require('../../../src/models/caseBase.model');
const seedService = require('../../../src/services/seedCases.service');

describe('seedCases.service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loadSeedCases should return loaded=false when seeds already exist', async () => {
    CaseBase.find.mockResolvedValue(new Array(seedService.SEED_CASES.length).fill({}));

    const result = await seedService.loadSeedCases();

    expect(result.loaded).toBe(false);
    expect(result.message).toContain('already exist');
    expect(CaseBase.create).not.toHaveBeenCalled();
  });

  it('loadSeedCases should insert seeds when missing', async () => {
    CaseBase.find.mockResolvedValue([]);
    CaseBase.create.mockResolvedValue({ _id: '1', problem: { projectName: 'P' }, type: 'seed' });

    const result = await seedService.loadSeedCases('org-1');

    expect(result.loaded).toBe(true);
    expect(result.count).toBe(seedService.SEED_CASES.length);
    expect(CaseBase.create).toHaveBeenCalledTimes(seedService.SEED_CASES.length);
  });

  it('deleteSeedCases should return deletedCount', async () => {
    CaseBase.deleteMany.mockResolvedValue({ deletedCount: 3 });

    const result = await seedService.deleteSeedCases();

    expect(result.deleted).toBe(3);
  });
});
