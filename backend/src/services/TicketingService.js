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
}

module.exports = TicketingService;
