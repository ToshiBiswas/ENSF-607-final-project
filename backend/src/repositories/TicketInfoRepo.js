/**
 * TicketInfoRepo
 * Handles concurrency-sensitive stock updates using SELECT ... FOR UPDATE.
 */
// src/repositories/TicketInfoRepo.js
const { knex } = require('../config/db');
const { TicketInfo } = require('../domain/TicketInfo');

class TicketInfoRepo {
  static rowToDomain(r) {
    console.log(r);
    return new TicketInfo({
      
      infoId: r.info_id,
      
      event: r.event_id,
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
   * Lock the ticketinfo row for update inside a transaction.
   * The row stays locked until the trx commits/rolls back.
   */
  static async lockAndLoad(trx, infoId) {
    if (!trx) {
      throw new Error('TicketInfoRepo.lockAndLoad requires a transaction');
    }

    const r = await trx('ticketinfo')
      .where({ info_id: infoId })
      .forUpdate()     // <-- row-level lock
      .first();

    if (!r) return null;
    return { row: r, domain: this.rowToDomain(r) };
  }

  static async decrementLeft(trx, infoId, qty) {
    if (!trx) {
      throw new Error('TicketInfoRepo.decrementLeft requires a transaction');
    }

    await trx('ticketinfo')
      .where({ info_id: infoId })
      .decrement('tickets_left', qty)
      .update({ updated_at: trx.fn.now() });
  }

  static async incrementLeft(trx, infoId, qty) {
    if (!trx) {
      throw new Error('TicketInfoRepo.incrementLeft requires a transaction');
    }

    await trx('ticketinfo')
      .where({ info_id: infoId })
      .increment('tickets_left', qty)
      .update({ updated_at: trx.fn.now() });
  }
}

module.exports = { TicketInfoRepo };
