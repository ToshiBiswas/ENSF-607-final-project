/**
 * Domain Model: Ticket (Minted)
 *
 * After successful payment, we mint one Ticket per unit purchased.
 * Each ticket has a 6-digit unique code. In databases supporting sequences,
 * this is persisted to `tickets`. If the table isn't present, a repository
 * fallback stores in-memory (useful early in development).
 */
class Ticket {
  constructor({ ticketId = null, code, owner, event, ticketInfo, payment }) {
    this.ticketId = ticketId;
    this.code = code;            // 6-digit unique
    this.owner = owner;          // User
    this.event = event;          // Event
    this.ticketInfo = ticketInfo;// TicketInfo
    this.payment = payment;      // Payment
  }
}

module.exports = { Ticket };
