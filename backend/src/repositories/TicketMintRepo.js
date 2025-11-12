

/**
 * TicketMintRepo
 * Always writes directly to the database. No in-memory paths, no pre-checks.
 */
const { knex } = require('../config/db');
const { Ticket } = require('../domain/Ticket');

class TicketMintRepo {
  /**
   * Insert a ticket row.
   * @param {{code:string, ownerId:number, eventId:number, infoId:number, paymentId:number|null}} input
   * @param {*} trx optional knex transaction
   * @returns {Promise<Ticket>}
   */
    static async findByCodeForEvent(eventId, code, trx = null) {
    const q = trx || knex;
    const row = await q('tickets as t')
      .leftJoin('ticketinfo as ti', 'ti.info_id', 't.info_id')
      .leftJoin('events as e', 'e.event_id', 't.event_id')
      .select(
        // ticket columns
        't.ticket_id as id',
        't.code',
        't.user_id',
        't.event_id',
        't.info_id',
        't.payment_id',
        // event columns
        'e.title as event_title',
        'e.location as event_location',
        'e.start_time as event_start',
        'e.end_time as event_end',
        // ticket type columns
        'ti.ticket_type',
        'ti.ticket_price'
      )
      .where('t.event_id', Number(eventId))
      .andWhere('t.code', String(code))
      .first();

    return row || null;
  }
  static async save({ code, ownerId, eventId, infoId, paymentId }, trx = null) {
    const q = trx || knex;
    const [id] = await q('tickets').insert({
      code,
      user_id: ownerId,
      event_id: eventId,
      info_id: infoId,
      payment_id: paymentId
    });
    return new Ticket({
      ticketId: id,
      code,
      owner: { userId: ownerId },
      event: { eventId },
      ticketInfo: { infoId },
      payment: { paymentId }
    });
  }

  /**
   * List tickets associated with a payment id.
   */
  static async listByPayment(paymentId, trx = null) {
    const q = trx || knex;
    const rows = await q('tickets').where({ payment_id: paymentId });
    return rows.map(r => new Ticket({
      ticketId: r.ticket_id,
      code: r.code,
      owner: { userId: r.user_id },
      event: { eventId: r.event_id },
      ticketInfo: { infoId: r.info_id },
      payment: { paymentId: r.payment_id }
    }));
  }
}
module.exports = { TicketMintRepo };
