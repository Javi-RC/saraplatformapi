describe('NotificationChannelFactory - Unit Tests', () => {
  let factory;

  beforeEach(() => {
    jest.resetModules();
    factory = require('../../../../src/services/notificationChannels/NotificationChannelFactory');
    factory.clearCache();
  });

  it('getAvailableChannels should include in_app, email, push', () => {
    const channels = factory.getAvailableChannels();
    expect(channels).toEqual(expect.arrayContaining(['in_app', 'email', 'push']));
  });

  it('getChannel should cache instances', () => {
    const c1 = factory.getChannel('in_app');
    const c2 = factory.getChannel('in_app');
    expect(c1).toBe(c2);
  });

  it('getChannel should throw for email when emailService is not configured', () => {
    expect(() => factory.getChannel('email')).toThrow('EmailService is not configured in the factory');
  });

  it('getChannel should create EmailChannel when emailService is configured', () => {
    factory.setEmailService({});
    const channel = factory.getChannel('email');
    expect(channel.getChannelType()).toBe('email');
  });

  it('registerChannel should return the same registered instance', () => {
    const custom = { send: jest.fn(), canSend: jest.fn(), getChannelType: () => 'custom' };
    factory.registerChannel('custom', custom);

    expect(factory.getChannel('custom')).toBe(custom);
  });

  it('getChannel should throw for unknown channel type', () => {
    expect(() => factory.getChannel('unknown')).toThrow('Canal de notificación desconocido: unknown');
  });
});
