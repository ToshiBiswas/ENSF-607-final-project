/**
 * EventService
 * Implements organizer permissions, category and ticket setup,
 * increase-only ticket policy, and refunds on deletion.
 */
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors');
const { EventRepo } = require('../repositories/EventRepo');
const { CategoryRepo } = require('../repositories/CategoryRepo');
const { PaymentRepo } = require('../repositories/PaymentRepo');
const { NotificationService } = require('./NotificationService');

class EventService {
  /**
   * Create a new event and attach categories + initial ticket types.
   * @param {number} organizerId
   * @param {object} payload - { title, description, location, startTime, endTime, ticketType, categories[], ticketInfos[] }
   */
  static async createEvent(organizerId, { title, description, location, startTime, endTime, ticketType = 'general', categories = [], ticketInfos = [] }) {
    const evt = await EventRepo.insert({ organizerId, title, description, location, startTime, endTime, ticketType });
    // Normalize/attach categories
    const catIds = [];
    for (const v of categories) {
      const c = await CategoryRepo.findOrCreate(v);
      catIds.push(c.categoryId);
    }
    await EventRepo.attachCategories(evt.eventId, catIds);
    // Insert ticket types
    await EventRepo.upsertTicketInfos(evt.eventId, ticketInfos);
    return EventRepo.findById(evt.eventId);
  }

  /** Query by a category value, or return all events if no category provided */
  static async listByCategory(value) {
    if (value) {
      return EventRepo.findByCategoryValue(value);
    }
    // Return all events if no category filter
    return EventRepo.findAll();
  }

  /**
   * Update event attributes + increase-only ticket totals.
   * Throws if a negative delta is provided.
   */
  static async updateEvent(organizerId, eventId, { title, description, location, startTime, endTime, ticketInfosIncreaseOnly = [] }) {
    const evt = await EventRepo.findById(eventId);
    if (!evt) throw new AppError('Event not found', 404);
    if (evt.organizer.userId !== organizerId) throw new AppError('Forbidden', 403);

    await knex('events').where({ event_id: eventId }).update({
      title: title ?? evt.title,
      description: description ?? evt.description,
      location: location ?? evt.location,
      start_time: startTime ? new Date(startTime) : evt.startTime,
      end_time: endTime ? new Date(endTime) : evt.endTime,
      updated_at: knex.fn.now()
    });

    // Enforce increase-only
    for (const u of ticketInfosIncreaseOnly) {
      if (u.quantityDelta < 0) throw new AppError('Cannot decrease total tickets', 400);
    }
    await EventRepo.updateTicketsIncreaseOnly(eventId, ticketInfosIncreaseOnly);
    return EventRepo.findById(eventId);
  }

  /**
   * Delete event:
   *  - Refund all approved payments for the event using PaymentService
   *  - Notify all purchasers + organizer via NotificationService
   *  - Finally remove the event
   */
  static async deleteEvent(organizerId, eventId, paymentService) {
    const evt = await EventRepo.findById(eventId);
    if (!evt) throw new AppError('Event not found', 404);
    if (evt.organizer.userId !== organizerId) throw new AppError('Forbidden', 403);

    // Gather all successful payments to refund
    const approved = await PaymentRepo.listApprovedForEvent(eventId);
    for (const p of approved) {
      try {
        await paymentService.refund(p.paymentId, p.amountCents, `event-${eventId}-canceled`);
      } catch (e) {
        // Keep iterating but record failure (could enqueue retry logic)
        console.warn('Refund failed', p.paymentId, e.message);
      }
      await NotificationService.notify({
        userId: p.user.userId,
        type: 'refund_issued',
        message: `Event canceled. Your payment ${p.paymentId} was refunded.`,
        eventId,
        paymentId: p.paymentId
      });
    }

    // Organizer heads-up
    await NotificationService.notify({
      userId: organizerId, type: 'event_canceled',
      message: `Your event ${evt.title} was canceled`, eventId
    });

    await EventRepo.deleteEvent(eventId);
    return { deleted: true };
  }
}

module.exports = { EventService };
