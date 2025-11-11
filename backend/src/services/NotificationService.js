// services/NotificationService.js
'use strict';

/**
 * NotificationService
 * DB-only, polling model:
 *  - queue(): persist a notification
 *  - deliverToUser(): no-op (kept for compatibility)
 *  - deliverDue(): no-op (polling replaces push delivery)
 *  - listForUser(): read due notifications (frontend polls)
 */

const { NotificationRepo } = require('../repositories/NotificationRepo');

class NotificationService {
  /**
   * Persist a notification.
   * @param {{userId:number, eventId?:number|null, title:string, message:string, sendAt?:Date}} input
   * @returns {Promise<object>}
   */
  static async queue(input) {
    return NotificationRepo.insert(input);
  }

  /**
   * Kept for compatibility; no server-side push in the polling model.
   * @returns {Promise<void>}
   */
  static async deliverToUser(/* user, notification, trxExternal = null */) {
    // No-op: delivery is handled by client polling GET /api/notifications
  }

  /**
   * Kept for compatibility; no batch “deliver” step in the polling model.
   * @returns {Promise<{delivered:number, mode:string}>}\
   */
  static async deliverDue(/* { now = new Date(), limit = 100 } = {} */) {
    // No-op: nothing to mark as sent; frontend polls to fetch due notifications.
    return { delivered: 0, mode: 'polling' };
  }

  /**
   * List notifications for a user that are due (send_at <= now).
   * Mirrors NotificationRepo.listForUser.
   * @param {number} userId
   * @param {{limit?:number, since?:Date|string}} [opts]
   */
  static async listForUser(userId, { limit = 50, since = null } = {}) {
    return NotificationRepo.listForUser(userId, { limit, since });
  }
}

module.exports = { NotificationService };
