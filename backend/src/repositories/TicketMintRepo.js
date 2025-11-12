/**
 * TicketMintRepo
 * Stores minted tickets either in the database (preferred) or in memory
 * when the 'tickets' table isn't present yet (early dev).
 */
const { knex } = require('../config/db');
const { Ticket } = require('../domain/Ticket');

// Simple ephemeral store keyed by paymentId
const _mem = new Map(); // Map<number, Ticket[]>

/** Check lazily whether tickets table exists (cache if you like) */
async function tableExists() {
  try {
    const exists = await knex.schema.hasTable('tickets');
    return !!exists;
  } catch {
    return false;
  }
}

class TicketMintRepo {
  /** Persist a single minted ticket and return the domain instance */
  static async save({ code, ownerId, eventId, infoId, paymentId }) {
    if (await tableExists()) {
      // If your migration adds a real `tickets` table, we use it transparently.
      const [id] = await knex('tickets').insert({
        code, user_id: ownerId, event_id: eventId, info_id: infoId, payment_id: paymentId
      });
      return new Ticket({ ticketId: id, code, owner: { userId: ownerId }, event: { eventId }, ticketInfo: { infoId }, payment: { paymentId } });
    }
    // In-memory fallback
    const t = new Ticket({ code, owner: { userId: ownerId }, event: { eventId }, ticketInfo: { infoId }, payment: { paymentId } });
    const arr = _mem.get(paymentId) || [];
    arr.push(t);
    _mem.set(paymentId, arr);
    return t;
  }

  /** List tickets associated with a given payment */
  static async listByPayment(paymentId) {
    if (await tableExists()) {
      const rows = await knex('tickets').where({ payment_id: paymentId });
      return rows.map(r => new Ticket({ ticketId: r.ticket_id, code: r.code, owner: { userId: r.user_id }, event: { eventId: r.event_id }, ticketInfo: { infoId: r.info_id }, payment: { paymentId: r.payment_id } }));
    }
    return _mem.get(paymentId) || [];
  }

  /** List all tickets for a user */
  static async listForUser(userId) {
    if (await tableExists()) {
      const rows = await knex('tickets').where({ user_id: userId }).orderBy('created_at', 'desc');
      return rows.map(r => new Ticket({ ticketId: r.ticket_id, code: r.code, owner: { userId: r.user_id }, event: { eventId: r.event_id }, ticketInfo: { infoId: r.info_id }, payment: { paymentId: r.payment_id } }));
    }
    // In-memory fallback: collect all tickets for user
    const allTickets = [];
    for (const tickets of _mem.values()) {
      for (const ticket of tickets) {
        if (ticket.owner.userId === userId) {
          allTickets.push(ticket);
        }
      }
    }
    return allTickets;
  }
}

module.exports = { TicketMintRepo };
