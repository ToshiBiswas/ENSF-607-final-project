'use strict';

/**
 * TicketMintRepo
 * Always writes directly to the database. No in-memory paths, no pre-checks.
 */
const { knex } = require('../config/db');
const { Ticket } = require('../domain/Ticket');

class TicketMintRepo {
  /**
   * Find a ticket by code for a specific event, including event + ticket type info.
   * Used by TicketingService.validateTicket.
   */
  static async findByCodeForEvent(eventId, code, trx = null) {
    const q = trx || knex;

    const cleanEventId = Number(eventId);
    const cleanCode = String(code).trim();

    // Guard against bad inputs
    if (!Number.isInteger(cleanEventId) || !cleanCode) {
      console.warn('[TicketRepo.findByCodeForEvent] bad inputs', {
        eventId,
        cleanEventId,
        code,
        cleanCode,
      });
      return null;
    }

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
        't.purchase_id',
        // event columns
        'e.title as event_title',
        'e.location as event_location',
        'e.start_time as event_start',
        'e.end_time as event_end',
        // ticket type columns
        'ti.ticket_type',
        'ti.ticket_price'
      )
      .where({
        't.event_id': cleanEventId,
        't.code': cleanCode,
      })
      .first();

    console.log('[TicketRepo.findByCodeForEvent] inputs', {
      eventId,
      cleanEventId,
      code,
      cleanCode,
    });
    console.log('[TicketRepo.findByCodeForEvent] row', row);

    // row will be `undefined` if query matched nothing → method returns null
    return row || null;
  }

  /**
   * Check if a ticket code is already taken (globally, across all tickets).
   * @param {string} code
   * @param {*} trx optional knex transaction
   * @returns {Promise<boolean>}
   */
  static async isCodeTaken(code, trx = null) {
    const q = trx || knex;
    const existing = await q('tickets')
      .where({ code: String(code) })
      .first('ticket_id'); // only need to know if one exists

    return !!existing;
  }

  /**
   * Insert a ticket row.
   * @param {{code:string, ownerId:number, eventId:number, infoId:number, purchaseId:number|null}} input
   * @param {*} trx optional knex transaction
   * @returns {Promise<Ticket>}
   */
  static async save({ code, ownerId, eventId, infoId, purchaseId }, trx = null) {
    const q = trx || knex;
    const [id] = await q('tickets').insert({
      code,
      user_id: ownerId,
      event_id: eventId,
      info_id: infoId,
      purchase_id: purchaseId,
    });

    return new Ticket({
      ticketId: id,
      code,
      owner: { userId: ownerId },
      event: { eventId },
      ticketInfo: { infoId },
      payment: { purchaseId },
    });
  }

  static async findById(ticketId, trx = null) {
    const q = trx || knex;
    return q('tickets').where({ ticket_id: ticketId }).first();
  }

  /**
   * List tickets associated with a purchase/payment id.
   * NOTE: your tickets table uses `purchase_id`.
   */
  static async listByPayment(purchaseId, trx = null) {
    const q = trx || knex;
    const rows = await q('tickets').where({ purchase_id: purchaseId });
    return rows.map(
      (r) =>
        new Ticket({
          ticketId: r.ticket_id,
          code: r.code,
          owner: { userId: r.user_id },
          event: { eventId: r.event_id },
          ticketInfo: { infoId: r.info_id },
          payment: { purchaseId: r.purchase_id },
        })
    );
  }

  /**
   * Paginated list of tickets for a given user, with event info.
   * Used by TicketingService.getMyTickets.
   * NO `status` or `updated_at` columns are assumed.
   * @param {{userId:number, page:number, pageSize:number, upcoming?:boolean}} opts
   */
  static async listForUser({ userId, page, pageSize, upcoming }) {
    const base = knex('tickets as t')
      .leftJoin('events as e', 'e.event_id', 't.event_id')
      .where('t.user_id', userId)
      .modify((qb) => {
        if (upcoming) {
          qb.andWhere('e.start_time', '>=', knex.fn.now());
        }
      });

    const [{ count }] = await base
      .clone()
      .clearSelect()
      .clearOrder()
      .count({ count: '*' });

    const rows = await base
      .select([
        't.ticket_id as ticketId',
        't.code',
        't.event_id as eventId',
        't.user_id as userId',
        't.info_id as infoId',
        't.purchase_id as purchaseId',
        't.created_at',                  // keep this if your table has it
        // no t.updated_at here
        'e.title as event_title',
        'e.location as event_location',
        'e.start_time as event_start',
        'e.end_time as event_end',
      ])
      .orderBy('t.created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { total: Number(count || 0), data: rows };
  }

  /**
   * One ticket by id for a given user, with event info.
   * Used by TicketingService.getTicketById.
   */
  static async findOwnedTicket({ userId, ticketId }) {
    const row = await knex('tickets as t')
      .leftJoin('events as e', 'e.event_id', 't.event_id')
      .select([
        't.ticket_id as ticketId',
        't.code',
        't.event_id as eventId',
        't.user_id as userId',
        't.info_id as infoId',
        't.purchase_id as purchaseId',
        't.created_at',                 // no t.updated_at
        'e.title as event_title',
        'e.location as event_location',
        'e.start_time as event_start',
        'e.end_time as event_end',
      ])
      .where('t.ticket_id', ticketId)
      .andWhere('t.user_id', userId)
      .first();

    return row || null;
  }

}

module.exports = { TicketMintRepo };
