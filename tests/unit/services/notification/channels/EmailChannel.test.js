const EmailChannel = require('../../../../../src/services/notification/channels/EmailChannel');

describe('EmailChannel - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BREVO_API_KEY = 'test-key';
    process.env.EMAIL_SENDER_NAME = 'Sender';
    process.env.EMAIL_SENDER_EMAIL = 'sender@test.com';

    global.fetch = jest.fn();
  });

  it('canSend should return false when email missing or not confirmed', async () => {
    const channel = new EmailChannel({});

    await expect(channel.canSend({}, { isConfirmed: true })).resolves.toBe(false);
    await expect(channel.canSend({}, { email: 'a@b.com', isConfirmed: false })).resolves.toBe(false);
  });

  it('canSend should respect notificationPreferences.email=false', async () => {
    const channel = new EmailChannel({});

    await expect(
      channel.canSend({}, { email: 'a@b.com', isConfirmed: true, notificationPreferences: { email: false } })
    ).resolves.toBe(false);
  });

  it('buildEmailContent should include action button when actionUrl exists', () => {
    const channel = new EmailChannel({});
    const content = channel.buildEmailContent(
      { title: 'T', message: 'M', actionUrl: 'http://x', actionText: 'Go', priority: 'high' },
      { name: 'Alice' }
    );

    expect(content.subject).toBe('T');
    expect(content.html).toContain('Hello Alice');
    expect(content.html).toContain('http://x');
    expect(content.html).toContain('Go');
    expect(content.html).toContain('HIGH PRIORITY');
  });

  it('send should fail when recipient has no email', async () => {
    const channel = new EmailChannel({});

    const result = await channel.send({ title: 'T', message: 'M' }, { isConfirmed: true, name: 'Alice' });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        status: 'failed',
        channel: 'email',
        error: expect.stringContaining('email')
      })
    );
  });

  it('send should call Brevo API and return sent status', async () => {
    const channel = new EmailChannel({});

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ messageId: '123' })
    });

    const result = await channel.send(
      { title: 'T', message: 'M', priority: 'medium' },
      { email: 'to@test.com', name: 'Alice', isConfirmed: true }
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        status: 'sent',
        channel: 'email',
        sentAt: expect.any(Date)
      })
    );
  });

  it('send should return failed when Brevo API responds non-ok', async () => {
    const channel = new EmailChannel({});

    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('Bad Request')
    });

    const result = await channel.send(
      { title: 'T', message: 'M', priority: 'medium' },
      { email: 'to@test.com', name: 'Alice', isConfirmed: true }
    );

    expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    expect(result.error).toContain('Error sending email: 400');
  });
});
