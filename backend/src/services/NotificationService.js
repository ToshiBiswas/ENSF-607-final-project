/**
 * NotificationService
 * Bridges persistence (NotificationRepo) and transport (WebhookService).
 */
const { NotificationRepo } = require('../repositories/NotificationRepo');
const { WebhookService } = require('./WebhookService');

class NotificationService {
  /**
   * Create + deliver a notification.
   * Any transport failures are logged; the DB record still exists.
   */
  static async notify({ userId, type, message, eventId = null, paymentId = null }) {
    const n = await NotificationRepo.insert({ userId, type, message, eventId, paymentId });
    await WebhookService.send({
      type,
      message,
      user_id: userId,
      event_id: eventId,
      payment_id: paymentId,
      notification_id: n.notificationId
    });
    return n;
  }
}

module.exports = { NotificationService };
