const NotificationChannel = require('../../../../../src/services/notification/channels/NotificationChannel');

describe('NotificationChannel (base) - Unit Tests', () => {
  it('send should throw (must be implemented)', async () => {
    const base = new NotificationChannel();
    await expect(base.send({}, {})).rejects.toThrow('The send method must be implemented by the child class');
  });

  it('getChannelType should throw (must be implemented)', () => {
    const base = new NotificationChannel();
    expect(() => base.getChannelType()).toThrow('The getChannelType method must be implemented by the child class');
  });

  it('canSend should default to true', async () => {
    const base = new NotificationChannel();
    await expect(base.canSend({}, {})).resolves.toBe(true);
  });
});
