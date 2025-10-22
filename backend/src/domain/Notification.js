/**
 * Domain Model: Notification
 * User-visible messages that are also broadcast to external webhooks.
 */
class Notification {
  constructor({ notificationId, user, event = null, payment = null, type = 'general', message, sentAt = new Date(), readAt = null }) {
    this.notificationId = notificationId;
    this.user = user;
    this.event = event;
    this.payment = payment;
    this.type = type;
    this.message = message;
    this.sentAt = new Date(sentAt);
    this.readAt = readAt ? new Date(readAt) : null;
  }
}

module.exports = { Notification };
