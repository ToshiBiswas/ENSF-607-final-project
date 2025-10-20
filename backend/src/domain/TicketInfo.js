/**
 * Domain: TicketInfo
 * -------------------------
 * Represents the **inventory configuration** for an event (type/price/quantities).
 * The business rule "no reductions on update" is enforced in the Service layer,
 * but this object provides a clear, typed snapshot of a single option.
 */
class TicketInfo {
  constructor({ infoId, eventId, ticketType, ticketPrice, ticketsQuantity, ticketsLeft }) {
    // Normalize numeric inputs to numbers to avoid string math surprises downstream.
    this.infoId = infoId;
    this.eventId = eventId;
    this.ticketType = ticketType;
    this.ticketPrice = Number(ticketPrice);
    this.ticketsQuantity = Number(ticketsQuantity);
    this.ticketsLeft = Number(ticketsLeft);
  }

  /** Keep API output in snake_case to match existing clients and seeds. */
  toDTO() {
    return {
      info_id: this.infoId,
      event_id: this.eventId,
      ticket_type: this.ticketType,
      ticket_price: this.ticketPrice,
      tickets_quantity: this.ticketsQuantity,
      tickets_left: this.ticketsLeft,
    };
  }

  /** DB row → Domain */
  static fromRow(row) {
    if (!row) return null;
    return new TicketInfo({
      infoId: row.info_id,
      eventId: row.event_id,
      ticketType: row.ticket_type,
      ticketPrice: row.ticket_price,
      ticketsQuantity: row.tickets_quantity,
      ticketsLeft: row.tickets_left,
    });
  }

  static toDTOs(list) { return (list || []).map((t) => t.toDTO()); }
}

module.exports = { TicketInfo };
