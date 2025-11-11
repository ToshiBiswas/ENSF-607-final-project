// src/services/EventService.js
'use strict';

const { AppError } = require('../utils/errors');
const { EventRepo } = require('../repositories/EventRepo');

/** Normalize/validate title once */
function normalizeTitle(title) {
  const t = String(title ?? '').trim();
  if (!t) throw new AppError('Title is required', 400, { code: 'TITLE_REQUIRED' });
  return t;
}

/** Normalize a string[] of category values (unique, trimmed) */
function normalizeCategoryValues(values) {
  if (!Array.isArray(values)) return [];
  const uniq = new Set();
  for (const v of values) {
    const s = String(v ?? '').trim();
    if (s) uniq.add(s);
  }
  return [...uniq];
}

/** Strictly resolve category IDs; throw if any are missing */
async function resolveCategoryIdsStrict(categoryValues) {
  const wanted = normalizeCategoryValues(categoryValues);
  if (wanted.length === 0) return [];

  const rows = await EventRepo.getCategoriesByValues(wanted); // [{category_id, category_value}]
  const byVal = new Map(rows.map(r => [r.category_value, r.category_id]));

  const missing = wanted.filter(v => !byVal.has(v));
  if (missing.length) {
    throw new AppError(
      `Category not found: ${missing.join(', ')}`,
      400,
      { code: 'CATEGORY_NOT_FOUND', missing }
    );
  }
  return wanted.map(v => byVal.get(v)); // preserve incoming order
}

class EventService {
  /**
   * Create event:
   * - Never auto-creates categories
   * - Verifies requested categories exist
   * - Enforces unique title (case-insensitive)
   * - Attaches categories and upserts ticket infos
   */
  static async listMine(organizerId) {
    const id = Number(organizerId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('Invalid organizer id', 400, { code: 'BAD_ORGANIZER_ID' });
    }
    return EventRepo.listByOrganizer(id);
  }
  static async createEvent(
    organizerId,
    { title, description, location, startTime, endTime, ticketType = 'general', categories = [], ticketInfos = [] }
  ) {
    const normTitle = normalizeTitle(title);

    // Unique (CI)
    if (await EventRepo.existsTitleCI(normTitle)) {
      throw new AppError('An event with this title already exists', 409, { code: 'DUPLICATE_TITLE' });
    }

    // Strict category IDs
    const categoryIds = await resolveCategoryIdsStrict(categories);

    // Insert + attach + ticket infos
    const evt = await EventRepo.insert({
      organizerId,
      title: normTitle,
      description,
      location,
      startTime,
      endTime
    });

    if (categoryIds.length) {
      await EventRepo.attachCategories(evt.eventId, categoryIds);
    }

    if (Array.isArray(ticketInfos) && ticketInfos.length) {
      await EventRepo.upsertTicketInfos(evt.eventId, ticketInfos);
    }
    
    return EventRepo.findById(evt.eventId);
  }
    /**
   * List events for a given category value (must exist in categories table).
   * @param {string} categoryValue
   * @returns {Promise<Event[]>}
   */
    static async listByCategory(categoryValue) {
    const value = String(categoryValue ?? '').trim();
    if (!value) {
      throw new AppError('category is required', 400, { code: 'CATEGORY_REQUIRED' });
    }

    // Ensure the category exists (no auto-create)
    const rows = await EventRepo.getCategoriesByValues([value]);
    if (!rows.length) {
      throw new AppError(`Category not found: ${value}`, 404, {
        code: 'CATEGORY_NOT_FOUND',
        value
      });
    }

    // Return hydrated Event domain objects for that category
    return EventRepo.findByCategoryValue(value);
  }


  /**
   * Update event:
   * - If title provided, ensure uniqueness (CI)
   * - If categories provided, replace links strictly with existing categories
   * - Leaves other behavior unchanged (increase-only logic stays delegated)
   */
  static async updateEvent(
    organizerId,
    eventId,
    { title, description, location, startTime, endTime, categories = undefined, ticketInfosIncreaseOnly = [] }
  ) {
    const evt = await EventRepo.findById(eventId);
    if (!evt) throw new AppError('Event not found', 404, { code: 'EVENT_NOT_FOUND' });
    if (evt.organizer.userId !== organizerId) throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });

    // Unique (CI) if changed
    let nextTitle = evt.title;
    if (title != null) {
      const normTitle = normalizeTitle(title);
      const changed = normTitle.toLowerCase() !== String(evt.title).trim().toLowerCase();
      if (changed && await EventRepo.existsTitleCIExcept(normTitle, eventId)) {
        throw new AppError('An event with this title already exists', 409, { code: 'DUPLICATE_TITLE' });
      }
      nextTitle = normTitle;
    }

    // Base patch (Repo converts dates appropriately)
    await EventRepo.updateBase(eventId, {
      title: nextTitle,
      description: description ?? evt.description,
      location: location ?? evt.location,
      startTime: startTime ?? evt.startTime,
      endTime: endTime ?? evt.endTime,
    });

    // Replace categories only if caller provided them
    if (categories !== undefined) {
      const categoryIds = await resolveCategoryIdsStrict(categories);
      await EventRepo.replaceCategories(eventId, categoryIds);
    }

    // Increase-only tickets logic remains as-is (delegated)
    if (Array.isArray(ticketInfosIncreaseOnly) && ticketInfosIncreaseOnly.length) {
      await EventRepo.updateTicketsIncreaseOnly(eventId, ticketInfosIncreaseOnly);
    }

    return EventRepo.findById(eventId);
  }
  /** 
   * Delete event:
   *  - Refund all approved payments for the event using PaymentService
   *  - Notify all purchasers + organizer via NotificationService
   *  - Finally remove the event
   */
  static async deleteEvent(organizerId, eventId, paymentServiceArg) {
    const id = Number(eventId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('Invalid event id', 400, { code: 'BAD_EVENT_ID' });
    }

    const evt = await EventRepo.findById(id);
    if (!evt) throw new AppError('Event not found', 404, { code: 'EVENT_NOT_FOUND' });
    if (evt.organizer.userId !== organizerId) throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });

    const paymentService = paymentServiceArg || require('./PaymentService').PaymentService;

    // Gather all successful payments to refund
    const approved = await PaymentRepo.listApprovedForEvent(id);

    for (const p of approved) {
      try {
        await paymentService.refund(p.paymentId, p.amountCents, `event-${id}-canceled`);
        // notify purchaser about refund
        if (typeof NotificationService?.create === 'function') {
          await NotificationService.create({
            userId: p.user.userId,
            title: 'refund_issued',
            message: `Event canceled. Your payment ${p.paymentId} was refunded.`,
            eventId: id
          });
        } else if (typeof NotificationService?.notify === 'function') {
          await NotificationService.notify({
            userId: p.user.userId,
            type: 'refund_issued',
            message: `Event canceled. Your payment ${p.paymentId} was refunded.`,
            eventId: id,
            paymentId: p.paymentId
          });
        }
      } catch (e) {
        console.warn('Refund failed', p.paymentId, e?.message || e);
        // optional failure notice
        if (typeof NotificationService?.create === 'function') {
          await NotificationService.create({
            userId: p.user.userId,
            title: 'refund_failed',
            message: `We could not refund payment ${p.paymentId}. Support has been notified.`,
            eventId: id
          });
        } else if (typeof NotificationService?.notify === 'function') {
          await NotificationService.notify({
            userId: p.user.userId,
            type: 'refund_failed',
            message: `We could not refund payment ${p.paymentId}.`,
            eventId: id,
            paymentId: p.paymentId
          });
        }
      }
    }

    // Best-effort: purge notifications/reminders tied to the event
    if (typeof NotificationRepo?.deleteRemindersForEvent === 'function') {
      try { await NotificationRepo.deleteRemindersForEvent(id); } catch (_) {}
    }

    // Organizer heads-up
    if (typeof NotificationService?.create === 'function') {
      await NotificationService.create({
        userId: organizerId,
        title: 'event_canceled',
        message: `Your event ${evt.title} was canceled`,
        eventId: id
      });
    } else if (typeof NotificationService?.notify === 'function') {
      await NotificationService.notify({
        userId: organizerId,
        type: 'event_canceled',
        message: `Your event ${evt.title} was canceled`,
        eventId: id
      });
    }

    await EventRepo.deleteEvent(id);
    return { deleted: true };
  }

}

module.exports = { EventService };
