// services/NotificationService.js
'use strict';

/**
 * NotificationService
 * Schedules, queries, and dispatches notifications.
 *
 * REFACTOR: No real-time push and no webhooks.
 * Delivery now means:
 *   1) Persist state in DB (atomic)
 *   2) Nothing else (frontend polls to read delivered notifications)
 *
 * Why this design?
 * - Simpler operationally: no long-lived connections or external fan-out.
 * - Frontend polls on an interval (e.g., every 30–60s) using GET /api/notifications?since=...
 */

const { NotificationRepo } = require('../repositories/NotificationRepo');

class NotificationService {
  /**
   * Queue a notification for later delivery (e.g., reminders).
   * @param {object} input
   *  - eventId: string|number
   *  - type: 'reminder' | 'announcement' | ...
   *  - reminderType: e.g., '24h_before'
   *  - message: string
   *  - sendAt: Date | ISO string
   *  - audience: 'user' | 'purchasers' | 'broadcast'
   * @returns {Promise<object>} persisted notification domain
   */
  static async queue(input) {
    return NotificationRepo.insert(input);
  }

  /**
   * Mark a single notification delivered-to-user in DB context.
   * NOTE: With no real-time + no per-user delivery table, we mark the notification
   *       as delivered globally *after* all recipients are processed. If you need
   *       per-user read/unread later, introduce a user_notifications table.
   */
  static async deliverToUser(/* user, notification, trxExternal = null */) {
    // No-op per user — delivery is resolved in the batch step below.
    // Keeping the signature so existing call sites don’t break.
  }

  /**
   * Deliver all due notifications (e.g., cron or admin-trigger).
   * Strategy:
   *  - Query due notifications + resolve recipients
   *  - Mark the notification as delivered (single update per notification)
   * Frontend will discover delivered notifications via polling APIs.
   */
  static async deliverDue({ now = new Date(), limit = 100 } = {}) {
    const jobs = await NotificationRepo.findDueWithRecipients(now, limit);
    if (!jobs.length) return { delivered: 0 };

    // Group by notification to avoid redundant updates
    const byNotificationId = new Map();
    for (const { notification } of jobs) {
      byNotificationId.set(notification.notificationId, notification);
    }

    // Single transaction to mark all due notifications as delivered
    await NotificationRepo.withTransaction(async (trx) => {
      const deliveredAt = new Date();
      for (const n of byNotificationId.values()) {
        await NotificationRepo.markSent(n.notificationId, { deliveredAt }, trx);
      }
    });

    return { delivered: byNotificationId.size };
  }

  /**
   * List notifications a user should see (polling-friendly).
   * - Filters by audience:
   *   - broadcast → everyone
   *   - purchasers → users who have tickets for that event
   *   - user → targeted single user (if your schema stores user_id on notifications)
   * - Only returns notifications with deliveredAt not null.
   * - Optional "since" to support incremental polling.
   */
  static async listForUser(userId, { limit = 50, since = null } = {}) {
    return NotificationRepo.listDeliveredRelevantToUser(userId, { limit, since });
  }
}

module.exports = { NotificationService };
