// repositories/NotificationRepo.js
'use strict';

/**
 * NotificationRepo
 * DB access for notifications and audience expansion.
 *
 * Assumed schema (adjust names if yours differ):
 *  - notifications(
 *      notification_id PK, event_id, type, reminder_type, message,
 *      send_at, audience, created_at, delivered_at
 *    )
 *  - users(user_id, email, name, ...)
 *  - tickets(event_id, user_id, ...)  // used to resolve "purchasers"
 */

const { knex } = require('../config/db');

class NotificationRepo {
  static table = 'notifications';

  static async insert({
    eventId,
    type,
    reminderType,
    message,
    sendAt,
    audience = 'broadcast',
  }) {
    const [id] = await knex(this.table).insert({
      event_id: eventId || null,
      type,
      reminder_type: reminderType || null,
      message,
      send_at: new Date(sendAt),
      audience,
      created_at: knex.fn.now(),
      delivered_at: null,
    });
    return this.getById(id);
  }

  static async getById(notificationId) {
    const row = await knex(this.table).where({ notification_id: notificationId }).first();
    return row
      ? {
          notificationId: row.notification_id,
          eventId: row.event_id,
          type: row.type,
          reminderType: row.reminder_type,
          message: row.message,
          sendAt: row.send_at,
          audience: row.audience,
          createdAt: row.created_at,
          deliveredAt: row.delivered_at,
        }
      : null;
  }

  static async markSent(notificationId, { deliveredAt }, trxExternal = null) {
    const db = trxExternal || knex;
    await db(this.table).where({ notification_id: notificationId }).update({ delivered_at: deliveredAt });
    return this.getById(notificationId);
  }

  /**
   * Expand due notifications into (user, notification) pairs for consistency
   * with prior logic. We *don’t* use the user in this no-realtime refactor,
   * but we keep the shape so upstream callers don’t break.
   */
  static async findDueWithRecipients(now = new Date(), limit = 100) {
    const due = await knex(this.table)
      .select('*')
      .whereNull('delivered_at')
      .andWhere('send_at', '<=', now)
      .orderBy('send_at', 'asc')
      .limit(limit);

    if (!due.length) return [];

    const jobs = [];
    for (const row of due) {
      const notification = {
        notificationId: row.notification_id,
        eventId: row.event_id,
        type: row.type,
        reminderType: row.reminder_type,
        message: row.message,
        sendAt: row.send_at,
        audience: row.audience,
      };

      // Expand recipients for shape only (not used to push anywhere now)
      if (row.audience === 'broadcast') {
        const users = await knex('users').select('user_id as userId', 'email', 'name');
        users.forEach((u) => jobs.push({ user: u, notification }));
      } else if (row.audience === 'purchasers') {
        const users = await knex('tickets')
          .join('users', 'tickets.user_id', 'users.user_id')
          .where('tickets.event_id', row.event_id)
          .distinct('users.user_id as userId', 'users.email', 'users.name');
        users.forEach((u) => jobs.push({ user: u, notification }));
      } else if (row.audience === 'user') {
        // If your schema stores a target user_id:
        const target = await knex('users')
          .select('user_id as userId', 'email', 'name')
          .where('user_id', row.user_id)
          .first();
        if (target) jobs.push({ user: target, notification });
      } else {
        // no recipients; still mark delivered to avoid reprocessing forever
        jobs.push({ user: null, notification });
      }
    }

    return jobs;
  }

  /**
   * Polling query: list delivered notifications relevant to a user.
   * since: optional Date/ISO to return only newer items (incremental polling).
   */
  static async listDeliveredRelevantToUser(userId, { limit = 50, since = null } = {}) {
    // Base: delivered notifications (global)
    let q = knex(this.table)
      .whereNotNull('delivered_at')
      .orderBy('delivered_at', 'desc');

    if (since) q = q.andWhere('delivered_at', '>=', new Date(since));

    // Relevance filter:
    // - broadcast → always relevant
    // - purchasers → user has a ticket for that event
    // - user → matches this user
    // We express this by UNION of 3 subqueries for clarity; tune as needed.

    const broadcastQ = q.clone().andWhere('audience', 'broadcast');

    const purchasersQ = knex(this.table)
      .whereNotNull('delivered_at')
      .andWhere('audience', 'purchasers')
      .andWhereExists(function () {
        this.select(1)
          .from('tickets')
          .whereRaw('tickets.event_id = notifications.event_id')
          .andWhere('tickets.user_id', userId);
      });

    const userQ = knex(this.table)
      .whereNotNull('delivered_at')
      .andWhere('audience', 'user')
      .andWhere('user_id', userId);

    // UNION ALL then re-order + limit
    const rows = await knex
      .from(function () {
        this.select(
          'notification_id as notificationId',
          'message',
          'reminder_type as reminderType',
          'type',
          'event_id as eventId',
          'delivered_at as deliveredAt',
          'send_at as sendAt',
          'audience'
        )
          .from(broadcastQ.as('broadcast'))
          .unionAll(function () {
            this.select(
              'notification_id',
              'message',
              'reminder_type',
              'type',
              'event_id',
              'delivered_at',
              'send_at',
              'audience'
            ).from(purchasersQ.as('purchasers'));
          })
          .unionAll(function () {
            this.select(
              'notification_id',
              'message',
              'reminder_type',
              'type',
              'event_id',
              'delivered_at',
              'send_at',
              'audience'
            ).from(userQ.as('userOnly'));
          })
          .as('u');
      })
      .orderBy('deliveredAt', 'desc')
      .limit(limit);

    return rows;
  }

  /** Run a callback in a transaction */
  static async withTransaction(fn) {
    return knex.transaction(async (trx) => fn(trx));
  }
}

module.exports = { NotificationRepo };
