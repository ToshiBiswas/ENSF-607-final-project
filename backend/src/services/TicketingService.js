// src/services/TicketingService.js
const db = require('../db');
const TicketInfo = require('../models/ticketInfo.model');
const Tickets = require('../models/ticket.model'); // has infinite retry for ticket_version

/**
 * Buys exactly one ticket for a user.
 * Steps (transaction):
 *  1) Resolve ticket_info_id from (event_id, ticket_type) if missing
 *  2) Atomically decrement tickets_left where tickets_left > 0
 *  3) Insert ticket row (generates 6-char ticket_version; retries on collision)
 */
class TicketingService {
  static async purchase({ user_id, event_id, ticket_type, price, ticket_info_id = null }) {
    if (!user_id || !event_id) throw new Error('Missing user_id or event_id');

    return db.transaction(async (trx) => {
      let infoId = ticket_info_id;

      // Resolve info_id if not provided, using (event_id, ticket_type)
      if (!infoId) {
        if (!ticket_type) throw new Error('Missing ticket_type');
        const resolved = await TicketInfo.resolveInfoIdByEventAndType(trx, event_id, ticket_type);
        if (!resolved) throw new Error('No matching ticketinfo (event_id, ticket_type)');
        infoId = resolved.info_id;
        // Optional: default price to configured price if caller didn’t pass it
        if (price == null) price = resolved.ticket_price;
      }

      // Atomic decrement: if returns false → sold out
      const ok = await TicketInfo.decrementLeftIfAvailable(trx, infoId);
      if (!ok) throw new Error('No tickets left for this type');

      // Create ticket (includes infinite retry on ticket_version collisions)
      const ticket = await Tickets.create(trx, {
        event_id,
        user_id,
        ticket_type: ticket_type || 'general',
        price: Number(price),
        purchase_date: trx.fn.now(),
        ticket_info_id: infoId,
        // ticket_version auto-generated in model if missing
      });

      return ticket; // return domain object (Ticket)
    });
  }
  static async createTicket(user, body) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    const eventId = Number.parseInt(String(body?.eventId ?? ''), 10);
    const quantity = Number.isFinite(body?.quantity) ? Number(body.quantity) : 1;
    const ticketType = (body?.ticketType || 'general').trim();
    const ticketInfoId = body?.ticketInfoId ? Number(body.ticketInfoId) : null;
    const explicitPrice = body?.price; // optional override

    if (!Number.isInteger(eventId) || eventId <= 0) {
      const err = new Error('Invalid event id');
      err.status = 400;
      throw err;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      const err = new Error('Quantity must be a positive integer');
      err.status = 400;
      throw err;
    }

    const created = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = await TicketingService.purchase({
        user_id: user.id,
        event_id: eventId,
        ticket_type: ticketType,
        price: explicitPrice,        // if null, purchase() falls back to TicketInfo price
        ticket_info_id: ticketInfoId // if null, purchase() resolves by (event_id, type)
      });
      created.push(ticket);
    }

    const unitPrice = (explicitPrice != null)
      ? Number(explicitPrice)
      : Number(created[0]?.price ?? 0);
    const totalPaid = (unitPrice * quantity).toFixed(2);

    // If you have currency on TicketInfo or ticket row, return it; else default
    const currency = created[0]?.currency || 'USD';

    return { data: created, quantity, totalPaid, currency };
  }
   static async getMyTickets(user, query) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const page = Math.max(parseInt(query?.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(query?.pageSize || '10', 10), 1), 100);
    const status = query?.status;
    const upcoming = String(query?.upcoming) === 'true';

    const base = db('tickets as t')
      .leftJoin('events as e', 'e.id', 't.event_id')
      .where('t.user_id', user.id)
      .modify((qb) => {
        if (status) qb.andWhere('t.status', status);
        if (upcoming) qb.andWhere('e.start_at', '>=', db.fn.now());
      });

    const [{ count }] = await base.clone().clearSelect().clearOrder().count({ count: '*' });
    const rows = await base
      .select([
        't.id', 't.event_id', 't.user_id', 't.quantity',
        't.price_paid', 't.currency', 't.status',
        't.created_at', 't.updated_at',
        'e.title as event_title', 'e.venue as event_venue',
        'e.start_at as event_start', 'e.end_at as event_end',
      ])
      .orderBy('t.created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { page, pageSize, total: Number(count), data: rows };
  },

  /**
   * One ticket by id (must belong to current user), with event info.
   */
  static async getTicketById(user, id) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const ticketId = Number.parseInt(String(id ?? ''), 10);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      const err = new Error('Invalid ticket id');
      err.status = 400;
      throw err;
    }

    const row = await db('tickets as t')
      .leftJoin('events as e', 'e.id', 't.event_id')
      .select([
        't.id', 't.event_id', 't.user_id', 't.quantity',
        't.price_paid', 't.currency', 't.status',
        't.created_at', 't.updated_at',
        'e.title as event_title', 'e.venue as event_venue',
        'e.start_at as event_start', 'e.end_at as event_end',
      ])
      .where('t.id', ticketId)
      .andWhere('t.user_id', user.id)
      .first();

    if (!row) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }
    return { data: row };
  },

static async updateTicket(user, id, patch) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const ticketId = Number.parseInt(String(id ?? ''), 10);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      const err = new Error('Invalid ticket id');
      err.status = 400;
      throw err;
    }

    // Restrict what can be updated
    const allowed = {};
    if (typeof patch?.status === 'string') {
      allowed.status = patch.status.trim();
    }

    if (Object.keys(allowed).length === 0) {
      const err = new Error('No updatable fields provided');
      err.status = 400;
      throw err;
    }

    // Ensure ticket belongs to user
    const exists = await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .first();

    if (!exists) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }

    await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .update({ ...allowed, updated_at: db.fn.now() });

    // Return updated record (with event info for parity with other getters)
    const updated = await db('tickets as t')
      .leftJoin('events as e', 'e.id', 't.event_id')
      .select([
        't.id', 't.event_id', 't.user_id', 't.quantity',
        't.price_paid', 't.currency', 't.status',
        't.created_at', 't.updated_at',
        'e.title as event_title', 'e.venue as event_venue',
        'e.start_at as event_start', 'e.end_at as event_end',
      ])
      .where('t.id', ticketId)
      .andWhere('t.user_id', user.id)
      .first();

    return { data: updated };
  }

  /**
   * Delete a ticket that belongs to the current user.
   */
  static async deleteTicket(user, id) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const ticketId = Number.parseInt(String(id ?? ''), 10);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      const err = new Error('Invalid ticket id');
      err.status = 400;
      throw err;
    }

    // Verify ownership
    const exists = await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .first();

    if (!exists) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }

    await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .del();

    return { id: ticketId, deleted: true };
  }
}
module.exports = TicketingService;
