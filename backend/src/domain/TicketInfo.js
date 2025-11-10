/**
 * Domain Model: TicketInfo
 * One row per ticket TYPE for a given event (e.g., GA, VIP).
 * The stock counters live here: tickets_quantity (total) and tickets_left.
 */
class TicketInfo {
  constructor({ infoId, event, type, price, quantity, left }) {
    this.infoId = infoId;
    this.event = event; // Event instance (optional; often omitted to avoid cycles)
    this.type = type;
    this.price = Number(price);
    this.quantity = quantity;
    this.left = left;
  }
}

module.exports = { TicketInfo };
