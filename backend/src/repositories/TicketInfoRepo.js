/**
 * TicketInfoRepo
 * Handles concurrency-sensitive stock updates using SELECT ... FOR UPDATE.
 */
const { knex } = require('../config/db');
const { TicketInfo } = require('../domain/TicketInfo');

class TicketInfoRepo {
  static async findById(infoId) {
    const r = await knex('ticketinfo').where({ info_id: infoId }).first();
    if (!r) return null;
    return new TicketInfo({ infoId: r.info_id, event: null, type: r.ticket_type, price: r.ticket_price, quantity: r.tickets_quantity, left: r.tickets_left });
  }

  /** Lock a ticketinfo row for safe decrement within a transaction */
  static async lockAndLoad(trx, infoId) {
    const r = await trx('ticketinfo').where({ info_id: infoId }).forUpdate().first();
    if (!r) return null;
    return { row: r, domain: new TicketInfo({ infoId: r.info_id, event: null, type: r.ticket_type, price: r.ticket_price, quantity: r.tickets_quantity, left: r.tickets_left }) };
  }

  /** Atomically decrement tickets_left by qty */
  static async decrementLeft(trx, infoId, qty) {
    await trx('ticketinfo').where({ info_id: infoId }).decrement('tickets_left', qty).update({ updated_at: trx.fn.now() });
  }

  /** Atomically increment tickets_left by qty (e.g., on refund/rollback) */
  static async incrementLeft(trx, infoId, qty) {
    await trx('ticketinfo').where({ info_id: infoId }).increment('tickets_left', qty).update({ updated_at: trx.fn.now() });
  }
}

module.exports = { TicketInfoRepo };
