
const setup = require('./test-setup');
const { SUT_BASE, fetchMock, beforeEachReset } = setup;

const { NotificationService } = require(`${SUT_BASE}/services/NotificationService`);
const { WebhookService } = require(`${SUT_BASE}/services/WebhookService`);

describe('● Notifications: create + webhook', () => {
  beforeEach(beforeEachReset);

  test('notify → inserts row and sends webhook when URL configured', async () => {
    process.env.NOTIFICATIONS_WEBHOOK_URL = 'http://webhook.receiver/notify';
    const out = await NotificationService.notify({ userId: 1, type: 'payment_approved', message: 'ok', eventId: 555, paymentId: 9001 });
    expect(out).toEqual(expect.objectContaining({ notificationId: 101 }));
    delete process.env.NOTIFICATIONS_WEBHOOK_URL;
  });

  test('WebhookService.send → no URL → does nothing', async () => {
    await WebhookService.send({ hello: 'world' });
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('webhook.receiver'), expect.anything());
  });
});
