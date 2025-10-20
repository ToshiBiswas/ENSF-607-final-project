const db = require('../db');
const axios = require('axios');
const Events = require('../models/event.model');
const TicketInfo = require('../models/ticketInfo.model');
const Tickets = require('../models/ticket.model');
const Notifications = require('../models/notification.model');

const isAdmin = (u) => u?.role === 'admin';
const isOwner = (u, event) => u?.user_id === event?.organizer_id;

/**
 * Business logic / transactions / permissions.
 */
class EventService {
  static async getEventInfo(eventId) {
    if (!Number.isInteger(eventId)) throw new Error('Invalid event id');
    const event = await Events.findById(eventId);
    if (!event) throw new Error('Event not found');
    const tickets = await TicketInfo.findByEventId(eventId);
    return { ...event, tickets };
  }

  static async createEvent(actor, payload) {
    if (!actor) throw new Error('Unauthorized');

    const {
      title, description, location, start_time, end_time, tickets = []
    } = payload || {};

    if (!title || !location || !start_time || !end_time) {
      throw new Error('Missing required fields');
    }

    return db.transaction(async (trx) => {
      const event_id = await Events.create(trx, {
        title, description, location, organizer_id: actor.user_id, start_time, end_time
      });

      for (const t of Array.isArray(tickets) ? tickets : []) {
        if (!t.ticket_type || t.ticket_price == null || t.tickets_quantity == null) continue;
        await TicketInfo.create(trx, {
          event_id,
          ticket_type: t.ticket_type,
          ticket_price: t.ticket_price,
          tickets_quantity: t.tickets_quantity,
          tickets_left: t.tickets_quantity
        });
      }

      const all = await TicketInfo.findByEventIdTrx(trx, event_id);
      return { event_id, title, description, location, organizer_id: actor.user_id, start_time, end_time, tickets: all };
    });
  }

  static async updateEvent(actor, eventId, payload) {
    if (!actor) throw new Error('Unauthorized');
    const event = await Events.findById(eventId);
    if (!event) throw new Error('Event not found');
    if (!isAdmin(actor) && !isOwner(actor, event)) throw new Error('Forbidden');

    const { title, description, location, start_time, end_time, tickets = [] } = payload || {};

    return db.transaction(async (trx) => {
      const patch = {};
      if (title        !== undefined) patch.title = title;
      if (description  !== undefined) patch.description = description;
      if (location     !== undefined) patch.location = location;
      if (start_time   !== undefined) patch.start_time = start_time;
      if (end_time     !== undefined) patch.end_time = end_time;

      if (Object.keys(patch).length) await Events.update(trx, eventId, patch);

      for (const t of Array.isArray(tickets) ? tickets : []) {
        if (t.info_id) {
          const row = await TicketInfo.findByIdTrx(trx, t.info_id, eventId);
          if (!row) throw new Error(`ticketinfo not found: ${t.info_id}`);

          const newQty = t.tickets_quantity !== undefined ? Number(t.tickets_quantity) : row.tickets_quantity;
          if (newQty < row.tickets_quantity) throw new Error('Cannot reduce ticket quantity');

          const delta = newQty - row.tickets_quantity;
          const newLeft = Math.max(0, Math.min(row.tickets_left + delta, newQty));

          await TicketInfo.update(trx, t.info_id, {
            ticket_price: t.ticket_price ?? row.ticket_price,
            tickets_quantity: newQty,
            tickets_left: newLeft
          });
        } else if (t.ticket_type && t.ticket_price != null && t.tickets_quantity != null) {
          await TicketInfo.create(trx, {
            event_id: eventId,
            ticket_type: t.ticket_type,
            ticket_price: t.ticket_price,
            tickets_quantity: t.tickets_quantity,
            tickets_left: t.tickets_quantity
          });
        }
      }
    });
  }

  static async deleteEventWithRefunds(actor, eventId) {
    if (!actor) throw new Error('Unauthorized');
    const event = await Events.findById(eventId);
    if (!event) throw new Error('Event not found');
    if (!isAdmin(actor) && !isOwner(actor, event)) throw new Error('Forbidden');

    // all user tickets + payment ids
    const rows = await Tickets.getTicketsWithPaymentsAndUsers(eventId);

    let refundCount = 0;
    await db.transaction(async (trx) => {
      for (const r of rows) {
        if (r.payment_id) {
          try {
            await axios.post(process.env.REFUNDS_API_URL || 'http://localhost:3001/v1/refunds', {
              paymentId: r.payment_id,
              reason: `Event "${event.title}" canceled`
            });
            refundCount++;
          } catch (e) {
            console.warn(`Refund failed for payment ${r.payment_id}: ${e.message}`);
          }
        }
        if (r.user_id) {
          // notification that refund was issued
          await Notifications.create(trx, {
            user_id: r.user_id,
            event_id: eventId,
            message: `Your ticket for "${event.title}" has been refunded.`,
            sent_at: trx.raw('NOW()')
          });
        }
      }
      await Events.remove(trx, eventId); // CASCADE will delete children
    });

    return { refunded: refundCount, notified: rows.filter(r => r.user_id).length };
  }
}

module.exports = EventService;
