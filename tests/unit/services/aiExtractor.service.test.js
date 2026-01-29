describe('aiExtractor.service - Unit Tests', () => {
  function freshService() {
    jest.resetModules();
    return require('../../../src/services/aiExtractor.service');
  }

  it('_getApiEndpoint should include the current model', () => {
    process.env.GEMINI_API_KEY = 'x';
    const svc = freshService();

    const url = svc._getApiEndpoint();
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain(svc._getCurrentModel());
  });

  it('_canUseCurrentModel should return false when model is in cooldown', () => {
    process.env.GEMINI_API_KEY = 'x';
    const svc = freshService();

    const model = svc._getCurrentModel();
    svc.modelCooldown[model] = Date.now() + 60_000;

    expect(svc._canUseCurrentModel()).toBe(false);
  });

  it('_switchToNextModel should set cooldown for previous model and advance index', () => {
    process.env.GEMINI_API_KEY = 'x';
    const svc = freshService();

    const prev = svc._getCurrentModel();
    const ok = svc._switchToNextModel();

    expect(ok).toBe(true);
    expect(svc.modelCooldown[prev]).toBeGreaterThan(Date.now());
    expect(svc._getCurrentModel()).not.toBe(prev);
  });
});
