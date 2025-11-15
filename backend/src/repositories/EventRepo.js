/**
 * EventRepo
 * Responsible for Event retrieval + related categories and ticket types.
 * Keeps the domain model composed of object references (User, Category, TicketInfo).
 */
'use strict';

const { knex } = require('../config/db');
const { Event } = require('../domain/Event');
const { UserRepo } = require('./UserRepo');
const { Category } = require('../domain/Category');
const { TicketInfo } = require('../domain/TicketInfo');
function normTicketRow(ti) {
  const type =
    String(ti?.type ?? ti?.ticketType ?? '').trim();
  const priceRaw =
    ti?.price ?? ti?.ticketPrice ?? ti?.ticket_price;
  const qtyRaw =
    ti?.quantity ?? ti?.ticketsQuantity ?? ti?.tickets_quantity ?? ti?.total ?? ti?.total_tickets;

  const price = Number(priceRaw);
  const qty   = Number(qtyRaw);

  if (!type) {
    throw new AppError('ticket type is required', 400, { code: 'BAD_TICKET_TYPE' });
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new AppError('ticket price is required', 400, { code: 'BAD_TICKET_PRICE' });
  }
  if (!Number.isInteger(qty) || qty < 0) {
    throw new AppError('ticket quantity is required', 400, { code: 'BAD_TICKET_QTY' });
  }

  return { type, price, qty };
}
class EventRepo {
  /** Hydrate an Event domain object with organizer, categories, and ticket infos */
  static async upsertTicketInfos(eventId, ticketInfos) {
    if (!Array.isArray(ticketInfos) || ticketInfos.length === 0) return;

    for (const raw of ticketInfos) {
      const { type, price, qty } = normTicketRow(raw);

      const existing = await knex('ticketinfo')
        .where({ event_id: eventId, ticket_type: type })
        .first();

      if (!existing) {
        await knex('ticketinfo').insert({
          event_id: eventId,
          ticket_type: type,
          ticket_price: price,            // explicit numeric
          tickets_quantity: qty,          // explicit integer
          tickets_left: qty               // start with full stock
        });
      } else {
        // Update price; increase-only for totals
        const nextTotal = Math.max(Number(existing.tickets_quantity || 0), qty);
        const delta     = nextTotal - Number(existing.tickets_quantity || 0);
        const upd = {
          ticket_price: price,
          updated_at: knex.fn.now(),
        };
        // Only grow totals; bump left by the delta when we grow
        if (delta > 0) {
          upd.tickets_quantity = nextTotal;
          upd.tickets_left     = Number(existing.tickets_left || 0) + delta;
        }
        await knex('ticketinfo').where({ info_id: existing.info_id }).update(upd);
      }
    }
  }
  static async toDomain(row) {
    const organizer = await UserRepo.findById(row.organizer_id);

    return new Event({
      eventId: row.event_id,
      organizer,
      title: row.title,
      description: row.description,
      location: row.location,
      startTime: row.start_time ? new Date(row.start_time) : null,
      endTime: row.end_time ? new Date(row.end_time) : null,
      ticketType: row.ticket_type,
      categories: await this.getCategories(row.event_id),
      tickets: await this.getTickets(row.event_id),
    });
  }
  

  /** Pull ticket type rows for an event */
  static async getTickets(eventId) {
    const rows = await knex('ticketinfo').where({ event_id: eventId });
    return rows.map((r) =>
      new TicketInfo({
        infoId: r.info_id,
        event: null,
        type: r.ticket_type,
        price: r.ticket_price,
        quantity: r.tickets_quantity,
        left: r.tickets_left,
      })
    );
  }
  static async listByOrganizer(organizerId) {
    const rows = await knex('events')
      .where({ organizer_id: organizerId })
      .orderBy('event_id', 'desc'); // safe ordering if created_at not present
    return Promise.all(rows.map(r => this.toDomain(r)));
  }

  /** Pull categories for an event */
  static async getCategories(eventId) {
    const rows = await knex('eventscategories as ec')
      .join('categoriesid as c', 'c.category_id', 'ec.category_id')
      .where('ec.event_id', eventId)
      .select('c.category_id', 'c.category_value');
    return rows.map(
      (r) => new Category({ categoryId: r.category_id, value: r.category_value })
    );
  }

  static async findById(eventId) {
    const row = await knex('events').where({ event_id: eventId }).first();
    return row ? this.toDomain(row) : null;
  }

  static async findDetailedById(eventId) {
    const row = await knex('events').where({ event_id: eventId }).first();
    return row ? this.toDomain(row) : null;
  }

  /** List events matching a category value */
  static async findByCategoryValue(value) {
    const rows = await knex('events as e')
      .join('eventscategories as ec', 'e.event_id', 'ec.event_id')
      .join('categoriesid as c', 'c.category_id', 'ec.category_id')
      .where('c.category_value', value)
      .select('e.*');
    return Promise.all(rows.map((r) => this.toDomain(r)));
  }

  /** Insert a new event shell; tickets/categories are attached separately */
  static async insert({
    organizerId,
    title,
    description,
    location,
    startTime,
    endTime,
  }) {
    const [event_id] = await knex('events').insert({
      organizer_id: organizerId,
      title,
      description,
      location,
      start_time: new Date(startTime),
      end_time: new Date(endTime)
    });
    return this.findById(event_id);
  }

  /** Attach category IDs for an event (idempotent via upsert/ignore) */
  static async attachCategories(eventId, categoryIds) {
    if (!categoryIds?.length) return;
    const rows = categoryIds.map((category_id) => ({ event_id: eventId, category_id }));
    // MySQL 8+/MariaDB: onConflict().ignore() is supported via Knex
    await knex('eventscategories').insert(rows).onConflict(['event_id', 'category_id']).ignore();
  }

  /**
   * Replace all categories for an event atomically with the given IDs.
   * Never creates categories; caller must pass valid category_ids.
   */
  static async replaceCategories(eventId, categoryIds) {
    await knex.transaction(async (trx) => {
      await trx('eventscategories').where({ event_id: eventId }).del();
      if (Array.isArray(categoryIds) && categoryIds.length) {
        const rows = categoryIds.map((category_id) => ({ event_id: eventId, category_id }));
        await trx('eventscategories').insert(rows);
      }
    });
  }
  /** Increase-only total tickets (applies same delta to quantity & left) */
  static async updateTicketsIncreaseOnly(eventId, updates) {
    for (const u of updates) {
      const type = String(u.type ?? u.ticketType ?? 'general').trim();
      const row = await knex('ticketinfo')
        .where({ event_id: eventId, ticket_type: type })
        .first();
      if (!row) continue;
      const inc = Number(u.quantityDelta || 0);
      if (inc > 0) {
        const newQty = Number(row.tickets_quantity || 0) + inc;
        const newLeft = Number(row.tickets_left || 0) + inc;
        await knex('ticketinfo')
          .where({ info_id: row.info_id })
          .update({
            tickets_quantity: newQty,
            tickets_left: newLeft,
            updated_at: knex.fn.now(),
          });
      }
    }
  }

  /** Hard delete an event (cascade behaviour relies on FKs) */
  static async deleteEvent(eventId) {
    await knex.transaction(async (trx) => {
      // Delete minted tickets for this event if the 'tickets' table exists
      let hasTicketsTable = false;
      try {
        hasTicketsTable = await trx.schema.hasTable('tickets');
      } catch (_) {
        /* ignore */
      }

      if (hasTicketsTable) {
        await trx('tickets').where({ event_id: eventId }).del();
      }

      // Delete ticket types for this event
      await trx('ticketinfo').where({ event_id: eventId }).del();

      // Finally delete the event row
      await trx('events').where({ event_id: eventId }).del();
    });
  }

  // ------------------------
  // Added helpers for service
  // ------------------------

  /** Case-insensitive title existence */
  static async existsTitleCI(title) {
    const r = await knex('events')
      .whereRaw('LOWER(title) = ?', [String(title).toLowerCase()])
      .first();
    return !!r;
  }

  /** Case-insensitive title existence excluding a specific event */
  static async existsTitleCIExcept(title, excludeEventId) {
    const r = await knex('events')
      .whereRaw('LOWER(title) = ?', [String(title).toLowerCase()])
      .andWhere('event_id', '<>', excludeEventId)
      .first();
    return !!r;
  }

  /** Read existing categories by value (no creation) */
  static async getCategoriesByValues(values) {
    if (!Array.isArray(values) || values.length === 0) return [];
    const cleaned = [...new Set(values.map((v) => String(v ?? '').trim()).filter(Boolean))];
    if (cleaned.length === 0) return [];
    return knex('categoriesid')
      .select('category_id', 'category_value')
      .whereIn('category_value', cleaned);
  }

  /** Update base fields of an event (dates normalized) */
  static async updateBase(eventId, { title, description, location, startTime, endTime }) {
    const patch = {
      title,
      description,
      location,
      start_time: startTime ? new Date(startTime) : null,
      end_time: endTime ? new Date(endTime) : null,
      updated_at: knex.fn.now(),
    };

    // remove nulls so we don't overwrite with null accidentally
    Object.keys(patch).forEach((k) => patch[k] == null && delete patch[k]);

    return knex('events').where({ event_id: eventId }).update(patch);
  }
}

module.exports = { EventRepo };
