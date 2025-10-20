/**
 * Model: ticketinfo
 * -------------------------
 * This model encapsulates all reads/writes for the event inventory options.
 * We purposefully keep transaction-aware versions (`*Trx`) so services can compose
 * multiple writes atomically (event + ticket options, or batch updates).
 *
 * Invariant enforcement:
 * - "No reductions" business rule is validated in the Service (update path).
 * - DB trigger (if present) guards tickets_left from going negative on sales.
 */
const db = require('../db');
const { TicketInfo } = require('../domain/TicketInfo');

const TABLE = 'ticketinfo';

module.exports = {
  /** Non-transactional read; OK for GET endpoints. */
  async findByEventId(event_id) {
    const rows = await db(TABLE)
      .select('info_id','event_id','ticket_type','ticket_price','tickets_quantity','tickets_left')
      .where({ event_id })
      .orderBy('ticket_type');
    return rows.map(TicketInfo.fromRow);
  },

  /** Transaction-aware variant used when called inside trx blocks. */
  async findByEventIdTrx(trx, event_id) {
    const rows = await (trx ?? db)(TABLE)
      .select('info_id','event_id','ticket_type','ticket_price','tickets_quantity','tickets_left')
      .where({ event_id })
      .orderBy('ticket_type');
    return rows.map(TicketInfo.fromRow);
  },

  /** Fetch one option, bound to event for safety (prevents cross-event updates). */
  async findByIdTrx(trx, info_id, event_id) {
    const row = await (trx ?? db)(TABLE).where({ info_id, event_id }).first();
    return TicketInfo.fromRow(row);
  },  
    // Resolve info_id when only (event_id, ticket_type) is provided.

  async resolveInfoIdByEventAndType(trx, event_id, ticket_type) {
    const q = trx ?? db;
    const row = await q('ticketinfo')
      .select('info_id', 'tickets_left', 'ticket_price')
      .where({ event_id, ticket_type })
      .first();
    return row || null;
  },
  /**
   * Atomically decrement tickets_left if > 0.
   * Returns true if one row was updated, false if sold-out.
   */
  async decrementLeftIfAvailable(trx, info_id) {
    const q = trx ?? db;
    const updated = await q('ticketinfo')
      .where('info_id', info_id)
      .andWhere('tickets_left', '>', 0)
      .update({ tickets_left: q.raw('tickets_left - 1') });
    return updated === 1;
  },
  /**
   * Insert new option and re-read the row to return a hydrated domain object.
   * Returning the freshly created row ensures callers see DB defaults (if any).
   */
  async create(trx, row) {
    const q = trx ?? db;
    const [id] = await q(TABLE).insert(row);
    const created = await q(TABLE).where({ info_id: id }).first();
    return TicketInfo.fromRow(created);
  },

  /** Update + re-fetch to provide callers the latest persisted state. */
  async update(trx, info_id, patch) {
    const q = trx ?? db;
    await q(TABLE).where({ info_id }).update(patch);
    const row = await q(TABLE).where({ info_id }).first();
    return TicketInfo.fromRow(row);
  },

  // DTO conveniences
  toDTO(ti) { return ti?.toDTO?.(); },
  toDTOs(list) { return TicketInfo.toDTOs(list); },
};
