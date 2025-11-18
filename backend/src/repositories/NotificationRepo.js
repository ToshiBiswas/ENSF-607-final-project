// src/repositories/NotificationRepo.js
'use strict';

const { knex } = require('../config/db');
const TABLE = 'notifications';

class NotificationRepo {
  static get table() { return TABLE; }

  /**
   * Insert a notification.
   * Columns expected in DB: notification_id (PK), user_id, event_id (nullable),
   * title, message, send_at (timestamp).
   */
  static async insert({ userId, eventId = null, title, message, sendAt = new Date() }, trx = null) {
    if (!userId) throw new Error('userId is required');
    if (!title) throw new Error('title is required');
    if (!message) throw new Error('message is required');

    const q = trx || knex;
    const [id] = await q(this.table).insert({
      user_id: Number(userId),
      event_id: eventId != null ? Number(eventId) : null,
      title: String(title),
      message: String(message),
      send_at: new Date(sendAt)
    });

    return this.getById(id);
  }

  /** Get a single notification by id */
  static async getById(id) {
    const r = await knex(this.table).where({ notification_id: Number(id) }).first();
    return r ? this.#rowToModel(r) : null;
  }

  /**
   * List notifications for a user that are due (send_at <= now).
   * Optional "since" filter and "limit" cap.
   */
  static async listForUser(userId, {limit = 50 , since = null} = {}) {
    const now = new Date();
    const q = knex(this.table)
      .where('user_id', Number(userId))
      .andWhere('send_at', '<=', now)
      .orderBy('send_at', 'desc')
      .limit(Math.max(1, Math.min(Number(limit) || 50, 200)));

    if (since) q.andWhere('send_at', '>=', new Date(since));

    const rows = await q;
    return rows.map(this.#rowToModel);
  }

  /**
   * Delete all notifications linked to an event (used by EventService on delete/cancel).
   */
  static async deleteRemindersForEvent(eventId, trx = null) {
    const q = trx || knex;
    const deleted = await q(this.table).where({ event_id: Number(eventId) }).del();
    return { deleted };
  }

  /**
   * Delete one notification for a user (use this as "mark read" since there’s no read_at).
   */
  static async deleteForUser(notificationId, userId, trx = null) {
    const q = trx || knex;
    const deleted = await q(this.table)
      .where({ notification_id: Number(notificationId), user_id: Number(userId) })
      .del();
    return { deleted };
  }

  // ---- helpers ----
  static #rowToModel(r) {
    return {
      notificationId: r.notification_id,
      userId: r.user_id,
      eventId: r.event_id,
      title: r.title,
      message: r.message,
      sendAt: r.send_at
    };
  }
}

module.exports = { NotificationRepo };
