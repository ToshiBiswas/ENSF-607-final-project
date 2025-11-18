jest.mock('../../repositories/NotificationRepo', () => ({
  NotificationRepo: { insert: jest.fn() }
}));
jest.mock('../../services/WebhookService', () => ({
  WebhookService: { send: jest.fn() }
}));

const { NotificationRepo } = require('../../repositories/NotificationRepo');
const { WebhookService } = require('../../services/WebhookService');
const { NotificationService } = require('../../services/NotificationService');

test('inserts DB record then sends webhook payload', async () => {
  NotificationRepo.insert.mockResolvedValue({ notificationId: 77 });
  const out = await NotificationService.notify({ userId: 1, type:'payment_approved', message:'ok', eventId: 2, paymentId: 3 });

  expect(NotificationRepo.insert).toHaveBeenCalledWith({ userId: 1, type:'payment_approved', message:'ok', eventId: 2, paymentId: 3 });
  expect(WebhookService.send).toHaveBeenCalledWith(expect.objectContaining({ notification_id: 77 }));
  expect(out.notificationId).toBe(77);
});
