const PushChannel = require('../../../../../src/services/notification/channels/PushChannel');

describe('PushChannel - Unit Tests', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('send should return failed and not implemented', async () => {
    const channel = new PushChannel();
    const result = await channel.send({ title: 'T' }, { _id: 'u1' });

    expect(warnSpy).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        status: 'failed',
        channel: 'push',
        error: 'Push channel not implemented'
      })
    );
  });

  it('canSend should return false when recipient missing or push disabled', async () => {
    const channel = new PushChannel();

    await expect(channel.canSend({}, null)).resolves.toBe(false);
    await expect(
      channel.canSend({}, { notificationPreferences: { push: false } })
    ).resolves.toBe(false);

    // Not implemented -> always false
    await expect(channel.canSend({}, { notificationPreferences: { push: true } })).resolves.toBe(false);
  });
});
