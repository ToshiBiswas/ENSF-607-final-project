const { WebhookService } = require('../../services/WebhookService');

beforeEach(() => fetch.mockReset());

test('no-op when URL is missing', async () => {
  delete process.env.NOTIFICATIONS_WEBHOOK_URL;
  await WebhookService.send({ a: 1 });
  expect(fetch).not.toHaveBeenCalled();
  process.env.NOTIFICATIONS_WEBHOOK_URL = 'http://webhook.test';
});

test('posts payload and ignores non-ok with warn', async () => {
  fetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
  await WebhookService.send({ a: 1 }, 'http://webhook.test/override');
  expect(fetch).toHaveBeenCalled();
  expect(console.warn).toHaveBeenCalled();
});

test('logs network error rather than throw', async () => {
  fetch.mockRejectedValue(new Error('ENETDOWN'));
  await WebhookService.send({ a: 1 });
  expect(console.warn).toHaveBeenCalled();
});

test('returns after ok silently', async () => {
  fetch.mockResolvedValue({ ok: true, text: async () => '' });
  await WebhookService.send({ a: 1 });
  expect(fetch).toHaveBeenCalled();
});
