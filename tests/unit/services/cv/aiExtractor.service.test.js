describe('aiExtractor.service - Unit Tests', () => {
  let mockFetch;

  beforeAll(() => {
    mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue('Mocked 403 - no real API call')
    });
    global.fetch = mockFetch;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'x';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    mockFetch.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  function freshService() {
    jest.resetModules();
    return require('../../../../src/services/cv/aiExtractor.service');
  }

  it('_getApiEndpoint should include the current model', () => {
    const svc = freshService();

    const url = svc._getApiEndpoint();
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain(svc._getCurrentModel().name);
  });

  it('_canUseCurrentModel should return false when model is in cooldown', () => {
    const svc = freshService();

    const modelName = svc._getCurrentModel().name;
    svc.modelCooldown[modelName] = Date.now() + 60_000;

    expect(svc._canUseCurrentModel()).toBe(false);
  });

  it('_switchToNextModel should set cooldown for previous model and advance index', () => {
    const svc = freshService();

    const prevName = svc._getCurrentModel().name;
    const ok = svc._switchToNextModel();

    expect(ok).toBe(true);
    expect(svc.modelCooldown[prevName]).toBeGreaterThan(Date.now());
    expect(svc._getCurrentModel().name).not.toBe(prevName);
  });

  it('should skip models whose API key is not configured', () => {
    const svc = freshService();

    const first = svc._getCurrentModel();
    expect(first.keyEnv).toBe('GEMINI_API_KEY');
    expect(first.provider).toBe('gemini');
  });
});
