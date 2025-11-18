/**
 * Domain Model: Event
 *
 * - organizer: User instance (owner of the event)
 * - categories: Category[]
 * - tickets: TicketInfo[] (distinct ticket types for this event)
 * - isActive(): true if current time is between start and end
 */
class Event {
  constructor({ eventId, organizer, title, description, location, startTime, endTime, ticketType = 'general', categories = [], tickets = [] }) {
    this.eventId = eventId;
    this.organizer = organizer;
    this.title = title;
    this.description = description;
    this.location = location;
    this.startTime = new Date(startTime);
    this.endTime = new Date(endTime);
    this.ticketType = ticketType;
    this.categories = categories;
    this.tickets = tickets;
  }

  /**
   * Is this event active at a given time?
   * @param {Date} [at=new Date()]
   */
  isActive(at = new Date()) {
    return at >= this.startTime && at <= this.endTime;
  }
  /**
   * Is this event active at a given time?
   * @param {Date} [at=new Date()]
   */
  purchasable(at = new Date()) {
    return at <= this.startTime;
  }
}

module.exports = { Event };
