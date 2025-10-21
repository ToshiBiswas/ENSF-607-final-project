/**
 * Model: Notifications (collection/model class)
 * ---------------------------------------------
 * Responsibilities:
 *  - Encapsulate all DB access for notifications.
 *  - Map rows ↔ domain (Notification).
 *  - Provide transaction-aware write methods for refund flows, deletions, etc.
 *
 * Usage:
 *   const notificationsModel = new Notifications(); // or use the default export instance
 *   await notificationsModel.create(trx, {...});
 */

const defaultDb = require('../db');
const { Notification } = require('../domain/Notification');

const TABLE = 'notifications';

// tiny helper for mapping lists
const mapRows = (rows) => rows.map(Notification.fromRow);

class Notifications {
  /**
   * @param {Knex} db Optional injected knex instance (useful for testing)
   */
  constructor(db = defaultDb) {
    this.db = db;
  }

  // ----------------- CREATE -----------------

  /**
   * Create a single notification.
   * Process:
   *  1) Compose insert payload (snake_case)
   *  2) INSERT ... RETURNING id (MySQL: read back by last insert id)
   *  3) Re-read to hydrate the domain object
   */
  async create(trx, { user_id, event_id = null, message, sent_at = null, read_at = null }) {
    const q = trx ?? this.db;

    const insertRow = {
      user_id,
      event_id: event_id ?? null,
      message,
      sent_at: sent_at ?? q.fn.now(),
      read_at: read_at ?? null,
    };

    const [id] = await q(TABLE).insert(insertRow);
    const row = await q(TABLE).where({ notification_id: id }).first();
    return Notification.fromRow(row);
  }

  /**
   * Bulk-create notifications.
   * Process:
   *  1) Map inputs to snake_case rows
   *  2) INSERT many (single round trip)
   *  3) Re-fetch latest N by descending PK, then reverse to preserve call order
   */
  async bulkCreate(trx, rows) {
    const q = trx ?? this.db;
    if (!rows || !rows.length) return [];

    const insertRows = rows.map((r) => ({
      user_id: r.user_id,
      event_id: r.event_id ?? null,
      message: r.message,
      sent_at: r.sent_at ?? q.fn.now(),
      read_at: r.read_at ?? null,
    }));

    await q(TABLE).insert(insertRows);

    const reRead = await q(TABLE)
      .select('*')
      .orderBy('notification_id', 'desc')
      .limit(insertRows.length);

    return mapRows(reRead.reverse());
  }

  // ----------------- READ -----------------

  /**
   * Fetch latest notifications for a user (cursor-based with afterId).
   * Process:
   *  1) Build base query filtered by user_id
   *  2) Apply cursor if provided (notification_id < afterId)
   *  3) Order by newest first, limit
   */
  async findByUser(user_id, { limit = 50, afterId } = {}) {
    let q = this.db(TABLE).where({ user_id }).orderBy('notification_id', 'desc').limit(limit);
    if (afterId) q = q.andWhere('notification_id', '<', afterId);
    const rows = await q;
    return mapRows(rows);
  }

  /**
   * Fetch only unread notifications (read_at IS NULL).
   */
  async findUnreadByUser(user_id, { limit = 50 } = {}) {
    const rows = await this.db(TABLE)
      .where({ user_id })
      .whereNull('read_at')
      .orderBy('notification_id', 'desc')
      .limit(limit);
    return mapRows(rows);
  }

  // ----------------- UPDATE -----------------

  /**
   * Mark a specific notification as read.
   * Process:
   *  1) UPDATE read_at = NOW()
   *  2) Re-read and return hydrated domain object
   */
  async markRead(trx, notification_id) {
    const q = trx ?? this.db;
    await q(TABLE).where({ notification_id }).update({ read_at: q.fn.now() });
    const row = await q(TABLE).where({ notification_id }).first();
    return Notification.fromRow(row);
  }

  /**
   * Mark all unread notifications for a user as read in one query.
   * Returns last 50 (read) notifications hydrated.
   */
  async markAllReadForUser(trx, user_id) {
    const q = trx ?? this.db;
    await q(TABLE).where({ user_id }).whereNull('read_at').update({ read_at: q.fn.now() });
    const rows = await q(TABLE).where({ user_id }).orderBy('notification_id', 'desc').limit(50);
    return mapRows(rows);
  }

  // ----------------- DELETE -----------------

  /**
   * Delete notifications by event_id (useful when deleting/canceling an event).
   * Typically called inside the same transaction as refunds.
   */
  async deleteByEvent(trx, event_id) {
    const q = trx ?? this.db;
    return q(TABLE).where({ event_id }).del();
  }

  // ----------------- DTO helpers -----------------

  toDTO(n) { return n?.toDTO?.(); }
  toDTOs(list) { return Notification.toDTOs(list); }
}

// Export both the class and a default instance (like your other models)
module.exports = new Notifications();
module.exports.Notifications = Notifications;
