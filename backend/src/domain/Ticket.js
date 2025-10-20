/**
 * Domain: Ticket
 * -------------------------
 * Represents a concrete purchase (one unit) by a user for an event.
 * The inventory decrement happens in DB (trigger) or in the Service,
 * but this entity models the record we persist and later use for refunds/notifications.
 */
class Ticket {
  constructor({
    ticketId, eventId, userId, ticketType, ticketVersion,
    price, purchaseDate, ticketInfoId = null,
  }) {
    this.ticketId = ticketId;
    this.eventId = eventId;
    this.userId = userId;
    this.ticketType = ticketType;
    this.ticketVersion = ticketVersion; // NEW
    this.price = Number(price);
    this.purchaseDate = purchaseDate ?? null;
    this.ticketInfoId = ticketInfoId;
  }

  toDTO() {
    return {
      ticket_id: this.ticketId,
      event_id: this.eventId,
      user_id: this.userId,
      ticket_type: this.ticketType,
      ticket_version: this.ticketVersion, // NEW
      price: this.price,
      purchase_date: this.purchaseDate,
      ticket_info_id: this.ticketInfoId,
    };
  }

  static fromRow(row) {
    if (!row) return null;
    return new Ticket({
      ticketId: row.ticket_id,
      eventId: row.event_id,
      userId: row.user_id,
      ticketType: row.ticket_type,
      ticketVersion: row.ticket_version,      // NEW
      price: row.price,
      purchaseDate: row.purchase_date,
      ticketInfoId: row.ticket_info_id ?? null,
    });
  }

  static toDTOs(list) { return (list || []).map((t) => t.toDTO()); }
}

module.exports = { Ticket };
