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
