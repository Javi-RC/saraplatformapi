const InAppChannel = require('../../../../../src/services/notification/channels/InAppChannel');

describe('InAppChannel - Unit Tests', () => {
  it('send should return delivered status', async () => {
    const channel = new InAppChannel();
    const result = await channel.send({ title: 't' }, { isConfirmed: true });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        status: 'delivered',
        channel: 'in_app',
        deliveredAt: expect.any(Date)
      })
    );
  });

  it('canSend should return false when recipient is missing or not confirmed', async () => {
    const channel = new InAppChannel();

    await expect(channel.canSend({}, null)).resolves.toBe(false);
    await expect(channel.canSend({}, { isConfirmed: false })).resolves.toBe(false);
  });

  it('canSend should respect notificationPreferences.inApp=false', async () => {
    const channel = new InAppChannel();

    await expect(
      channel.canSend({}, { isConfirmed: true, notificationPreferences: { inApp: false } })
    ).resolves.toBe(false);
  });

  it('canSend should default to true when confirmed and no preferences', async () => {
    const channel = new InAppChannel();

    await expect(channel.canSend({}, { isConfirmed: true })).resolves.toBe(true);
  });
});
