/**
 * EventRepo
 * Responsible for Event retrieval + related categories and ticket types.
 * Keeps the domain model composed of object references (User, Category, TicketInfo).
 */
const { knex } = require('../config/db');
const { Event } = require('../domain/Event');
const { UserRepo } = require('./UserRepo');
const { Category } = require('../domain/Category');
const { TicketInfo } = require('../domain/TicketInfo');

class EventRepo {
  /** Hydrate an Event domain object with organizer, categories, and ticket infos */
  static async toDomain(row) {
    const organizer = await UserRepo.findById(row.organizer_id);
    return new Event({
      eventId: row.event_id,
      organizer,
      title: row.title,
      description: row.description,
      location: row.location,
      startTime: row.start_time,
      endTime: row.end_time,
      ticketType: row.ticket_type,
      categories: await this.getCategories(row.event_id),
      tickets: await this.getTickets(row.event_id),
    });
  }

  /** Pull ticket type rows for an event */
  static async getTickets(eventId) {
    const rows = await knex('ticketinfo').where({ event_id: eventId });
    return rows.map((r) => new TicketInfo({
      infoId: r.info_id, event: null, type: r.ticket_type,
      price: r.ticket_price, quantity: r.tickets_quantity, left: r.tickets_left
    }));
  }

  /** Pull categories for an event */
  static async getCategories(eventId) {
    const rows = await knex('eventscategories as ec')
      .join('categoriesid as c', 'c.category_id', 'ec.category_id')
      .where('ec.event_id', eventId)
      .select('c.category_id', 'c.category_value');
    return rows.map(r => new Category({ categoryId: r.category_id, value: r.category_value }));
  }

  static async findById(eventId) {
    const row = await knex('events').where({ event_id: eventId }).first();
    return row ? this.toDomain(row) : null;
  }

  /** List events matching a category value */
  static async findByCategoryValue(value) {
    const rows = await knex('events as e')
      .join('eventscategories as ec', 'e.event_id', 'ec.event_id')
      .join('categoriesid as c', 'c.category_id', 'ec.category_id')
      .where('c.category_value', value)
      .select('e.*')
      .distinct();
    return Promise.all(rows.map(r => this.toDomain(r)));
  }

  /** List all events */
  static async findAll() {
    const rows = await knex('events').select('*').orderBy('start_time', 'asc');
    return Promise.all(rows.map(r => this.toDomain(r)));
  }

  /** Insert a new event shell; tickets/categories are attached separately */
  static async insert({ organizerId, title, description, location, startTime, endTime, ticketType }) {
    const [event_id] = await knex('events').insert({
      organizer_id: organizerId,
      title, description, location,
      start_time: new Date(startTime),
      end_time: new Date(endTime),
      ticket_type: ticketType || 'general'
    });
    return this.findById(event_id);
  }

  /** Attach category IDs for an event (idempotent via upsert/ignore) */
  static async attachCategories(eventId, categoryIds) {
    if (!categoryIds?.length) return;
    const rows = categoryIds.map((category_id) => ({ event_id: eventId, category_id }));
    await knex('eventscategories').insert(rows).onConflict(['event_id','category_id']).ignore();
  }

  /**
   * Insert or update ticketinfo rows per event.
   * Quantity changes are enforced by the service layer (increase-only).
   */
  static async upsertTicketInfos(eventId, ticketInfos) {
    for (const ti of ticketInfos) {
      const found = await knex('ticketinfo').where({ event_id: eventId, ticket_type: ti.type }).first();
      if (found) {
        await knex('ticketinfo').where({ info_id: found.info_id }).update({
          ticket_price: ti.price,
          updated_at: knex.fn.now()
        });
      } else {
        await knex('ticketinfo').insert({
          event_id: eventId, ticket_type: ti.type,
          ticket_price: ti.price, tickets_quantity: ti.quantity, tickets_left: ti.quantity
        });
      }
    }
  }

  /** Increase-only total tickets (applies same delta to quantity & left) */
  static async updateTicketsIncreaseOnly(eventId, updates) {
    for (const u of updates) {
      const row = await knex('ticketinfo').where({ event_id: eventId, ticket_type: u.type }).first();
      if (!row) continue;
      const newQty = row.tickets_quantity + u.quantityDelta;
      const newLeft = row.tickets_left + u.quantityDelta;
      await knex('ticketinfo').where({ info_id: row.info_id }).update({
        tickets_quantity: newQty,
        tickets_left: newLeft,
        updated_at: knex.fn.now()
      });
    }
  }

  /** Hard delete an event (cascade behaviour relies on FKs) */
  static async deleteEvent(eventId) {
    await knex('events').where({ event_id: eventId }).del();
  }
}

module.exports = { EventRepo };
