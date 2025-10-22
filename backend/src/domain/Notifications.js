/**
 * Domain: Notification
 * --------------------
 * Immutable(ish) value object representing a single notification.
 * - Keeps DB concerns out of the rest of your app.
 * - Maps DB snake_case ↔ domain camelCase.
 */
class Notification {
  constructor({
    id,           // notification_id (PK)
    user,       // FK → users.user_id
    eventId = null,
    message,
    sentAt = null,
    readAt = null,
    createdAt = null,
  }) {
    this.id = id;
    this.user = user;
    this.eventId = eventId;
    this.message = message;
    this.sentAt = sentAt;
    this.readAt = readAt;
    this.createdAt = createdAt;
  }

  /** Public API DTO (snake_case) to keep responses consistent with the rest of your backend. */
  toDTO() {
    return {
      notification_id: this.id,
      user_id: this.user,
      event_id: this.eventId,
      message: this.message,
      sent_at: this.sentAt,
      read_at: this.readAt,
      created_at: this.createdAt,
    };
  }

  // ---------- DB row mappers ----------
  static fromRow(row) {
    if (!row) return null;
    return new Notification({
      id: row.notification_id,
      user: row.user_id,
      eventId: row.event_id ?? null,
      message: row.message,
      sentAt: row.sent_at ?? null,
      readAt: row.read_at ?? null,
      createdAt: row.created_at ?? null,
    });
  }

  static toDTOs(list) {
    return (list || []).map((n) => n.toDTO());
  }
}

module.exports = { Notification };
