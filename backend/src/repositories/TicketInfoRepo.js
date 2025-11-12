/**
 * TicketInfoRepo
 * Handles concurrency-sensitive stock updates using SELECT ... FOR UPDATE.
 */
// src/repositories/TicketInfoRepo.js
const { knex } = require('../config/db');
const { TicketInfo } = require('../domain/TicketInfo');

class TicketInfoRepo {
  static rowToDomain(r) {
    return new TicketInfo({
      infoId: r.info_id,
      event: null,
      type: r.ticket_type,
      price: r.ticket_price,
      quantity: r.tickets_quantity,
      left: r.tickets_left,
    });
  }

  static async findById(infoId) {
    const r = await knex('ticketinfo').where({ info_id: infoId }).first();
    return r ? this.rowToDomain(r) : null;
  }

  /**
   * Previously locked the row with FOR UPDATE. Now it just reads it.
   * Callers can still pass a trx; we simply use it if provided.
   */
  static async lockAndLoad(trx, infoId) {
    const q = trx || knex;
    const r = await q('ticketinfo').where({ info_id: infoId }).first(); // <-- no .forUpdate()
    if (!r) return null;
    return { row: r, domain: this.rowToDomain(r) };
  }

  /** Decrement tickets_left by qty (no explicit locks) */
  static async decrementLeft(trx, infoId, qty) {
    const q = trx || knex;
    await q('ticketinfo')
      .where({ info_id: infoId })
      .decrement('tickets_left', qty)
      .update({ updated_at: q.fn.now() });
  }

  /** Increment tickets_left by qty (no explicit locks) */
  static async incrementLeft(trx, infoId, qty) {
    const q = trx || knex;
    await q('ticketinfo')
      .where({ info_id: infoId })
      .increment('tickets_left', qty)
      .update({ updated_at: q.fn.now() });
  }
}

module.exports = { TicketInfoRepo };
