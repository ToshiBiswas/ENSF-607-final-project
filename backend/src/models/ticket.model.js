/**
 * Model: tickets
 * -------------------------
 * Concrete purchases. Insertions usually happen together with payment creation;
 * your DB trigger should decrement ticketinfo.tickets_left upon successful sale.
 * On create, we ensure a 6-char ticket_version exists.
 * - Because the column is UNIQUE, we retry a few times on rare collisions.

 * For deletions/cancellations:
 * - We rely on EventService.deleteEventWithRefunds() to orchestrate refunds and
 *   notifications, then cascade-delete tickets when the event is deleted.
 */
const db = require('../db');
const { Ticket } = require('../domain/Ticket');
const { genTicketVersion } = require('../utils/ticketVersion');

const TABLE = 'tickets';

module.exports = {
  async findByEventId(event_id) {
    const rows = await db(TABLE)
      .select(
        'ticket_id','event_id','user_id',
        'ticket_type','ticket_version',      // NEW
        'price','purchase_date','ticket_info_id'
      )
      .where({ event_id })
      .orderBy('ticket_id');
    return rows.map(Ticket.fromRow);
  },

  async findById(ticket_id) {
    const row = await db(TABLE)
      .select(
        'ticket_id','event_id','user_id',
        'ticket_type','ticket_version',      // NEW
        'price','purchase_date','ticket_info_id'
      )
      .where({ ticket_id }).first();
    return Ticket.fromRow(row);
  },

  /**
   * Create with generated ticket_version when not supplied.
   * Retries on EUNIQUE race (very unlikely).
   */
 async create(trx, row) {
    const q = trx ?? db;

    if (!row.ticket_version) row.ticket_version = genTicketVersion();

    /* eslint-disable no-constant-condition */
    while (true) {
      try {
        const [id] = await q(TABLE).insert(row);
        const created = await q(TABLE)
          .select(
            'ticket_id', 'event_id', 'user_id',
            'ticket_type', 'ticket_version',
            'price', 'purchase_date', 'ticket_info_id'
          )
          .where({ ticket_id: id })
          .first();
        return Ticket.fromRow(created);
      } catch (err) {
        // MySQL duplicate key (unique index violation) -> generate a new code and try again
        if (err && err.code === 'ER_DUP_ENTRY') {
          row.ticket_version = genTicketVersion();
          await tick(); // yield to event loop before retrying
          continue;
        }
        // Any other DB error is real; bubble up
        throw err;
      }
    }
    /* eslint-enable no-constant-condition */
  },

  async getTicketsWithPaymentsAndUsers(event_id) {
    // include ticket_version so refunds/notifications can reference it
    return db('tickets as t')
      .leftJoin('payments as p', 't.ticket_id', 'p.ticket_id')
      .leftJoin('users as u', 't.user_id', 'u.user_id')
      .select(
        't.ticket_id','t.user_id','t.event_id',
        't.ticket_type','t.ticket_version',        // NEW
        'u.name as user_name','u.email as user_email',
        'p.payment_id','p.amount','p.status'
      )
      .where('t.event_id', event_id);
  },

  toDTO(t) { return t?.toDTO?.(); },
  toDTOs(list) { return Ticket.toDTOs(list); },
};