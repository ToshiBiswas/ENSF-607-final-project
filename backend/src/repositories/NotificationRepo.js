/**
 * NotificationRepo
 * Persists notifications so users can retrieve a delivery history.
 */
const { knex } = require('../config/db');
const { Notification } = require('../domain/Notification');
const { UserRepo } = require('./UserRepo');
const { EventRepo } = require('./EventRepo');
const { PaymentRepo } = require('./PaymentRepo');

class NotificationRepo {
  static async insert({ userId, eventId = null, paymentId = null, type = 'general', message }) {
    const [id] = await knex('notifications').insert({
      user_id: userId,
      event_id: eventId,
      payment_id: paymentId,
      type, message
    });
    return this.findById(id);
  }

  static async findById(id) {
    const r = await knex('notifications').where({ notification_id: id }).first();
    if (!r) return null;
    const [user, event, payment] = await Promise.all([
      UserRepo.findById(r.user_id),
      r.event_id ? EventRepo.findById(r.event_id) : null,
      r.payment_id ? PaymentRepo.findById(r.payment_id) : null
    ]);
    return new Notification({ notificationId: r.notification_id, user, event, payment, type: r.type, message: r.message, sentAt: r.sent_at, readAt: r.read_at });
  }
}

module.exports = { NotificationRepo };
