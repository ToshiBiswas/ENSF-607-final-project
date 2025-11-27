// src/services/EventService.js
'use strict';

const { AppError } = require('../utils/errors');
const { EventRepo } = require('../repositories/EventRepo');
const { PaymentService } = require('./PaymentService')
const { PaymentRepo } = require('../repositories/PaymentRepo')
const {NotificationService} = require("./NotificationService")
const {CategoryRepo} = require('../repositories/CategoryRepo')
const { UserCardRepo } = require('../repositories/UserCardRepo');
const { NotificationRepo} = require('../repositories/NotificationRepo')
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
    {
      title,
      description,
      location,
      startTime,
      endTime,
      categories = [],
      ticketInfos = [],
      payment,       // { existingCard?: number, newCard?: { number, name, ccv, exp_month, exp_year } }
    } = {}
  ) {
    const normTitle = normalizeTitle(title);

    // Basic required fields present?
    if (!normTitle || !location || !startTime || !endTime) {
      throw new AppError('Missing required fields', 400, {
        code: 'BAD_EVENT_FIELDS',
      });
    }

    // ------------------------------
    // Time window validation
    // ------------------------------
    const now = new Date();

    // Allow either Date objects or ISO strings
    const start = startTime instanceof Date ? startTime : new Date(startTime);
    const end   = endTime   instanceof Date ? endTime   : new Date(endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new AppError('Invalid start or end time', 400, {
        code: 'BAD_EVENT_TIME',
      });
    }

    if (start <= now) {
      throw new AppError('Event must start in the future', 400, {
        code: 'START_TIME_IN_PAST',
        now: now.toISOString(),
        startTime: start.toISOString(),
      });
    }

    const maxEnd = new Date(start.getTime() + 60 * 60 * 1000); // start + 1 hour

    // must end after it starts, and strictly before start + 1 hour
    if (end <= start || end >= maxEnd) {
      throw new AppError(
        'Event duration must be greater than 0 and less than 1 hour',
        400,
        {
          code: 'BAD_EVENT_DURATION',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          maxEndTime: maxEnd.toISOString(),
        }
      );
    }

    // Use the normalized Date objects from here on so DB gets consistent values
    startTime = start;
    endTime = end;

    // ------------------------------
    // Unique (CI) title
    // ------------------------------
    if (await EventRepo.existsTitleCI(normTitle)) {
      throw new AppError('An event with this title already exists', 409, {
        code: 'DUPLICATE_TITLE',
      });
    }

    // ------------------------------
    // Resolve / require payment method
    // ------------------------------
    const { existingCard, newCard } = payment || {};
    let resolvedPaymentInfoId;

    if (existingCard != null) {
      const pid = Number(existingCard);
      if (!Number.isInteger(pid) || pid <= 0) {
        throw new AppError('Invalid paymentInfoId', 400, {
          code: 'BAD_PAYMENT_INFO_ID',
        });
      }

      const linked = await UserCardRepo.isLinked(organizerId, pid);
      if (!linked) {
        throw new AppError('Payment method not found', 404, {
          code: 'PAYMENT_METHOD_NOT_FOUND',
          userId: organizerId,
          paymentInfoId: pid,
        });
      }

      resolvedPaymentInfoId = pid;
    } else if (newCard) {
      const { PaymentService } = require('./PaymentService');
      const stored = await PaymentService.verifyAndStore(organizerId, newCard);
      resolvedPaymentInfoId = stored.paymentInfoId;
    } else {
      throw new AppError('payment method is required', 400, {
        code: 'PAYMENT_INFO_REQUIRED',
      });
    }

    // ------------------------------
    // Categories & tickets
    // ------------------------------
    const categoryIds = await resolveCategoryIdsStrict(categories);

    const evt = await EventRepo.insert({
      organizerId,
      title: normTitle,
      description,
      location,
      startTime,
      endTime,
      paymentInfoId: resolvedPaymentInfoId,
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
   * List events for a given category value, with pagination.
   * - If `categoryValue` is empty/blank/undefined → list ALL events (paginated).
   * - Otherwise: ensure the category exists, then list events in that category.
   *
   * @param {string} categoryValue
   * @param {object} query  { page?, pageSize? }
   * @returns {Promise<{page:number, pageSize:number, total:number, events: Event[]}>}
   */
  static async listByCategoryPaginized(categoryValue, query = {}) {
    // Same paging pattern as TicketingService.getMyTickets
    const page = Math.max(parseInt(query?.page || '1', 10), 1);
    const pageSize = Math.min(
      Math.max(parseInt(query?.pageSize || '10', 10), 1),
      100
    );

    const value = String(categoryValue ?? '').trim();

    let rows;
    let total;

    if (!value) {
      // No category provided → return ALL events, paginated
      ({ total, rows } = await EventRepo.listAllPaginated({ page, pageSize }));
    } else {
      // Ensure the category exists (no auto-create)
      const cats = await EventRepo.getCategoriesByValues([value]);
      if (!cats.length) {
        throw new AppError(`Category not found: ${value}`, 404, {
          code: 'CATEGORY_NOT_FOUND',
          value,
        });
      }

      ({ total, rows } = await EventRepo.listByCategoryValuePaginated(value, {
        page,
        pageSize,
      }));
    }

    // Hydrate into Event domain objects (with organizer, categories, tickets)
    const events = await Promise.all(rows.map((r) => EventRepo.toDomain(r)));

    return { page, pageSize, total, events };
  }

  /** 
   * Delete event:
   *  - Refund all approved payments for the event using PaymentService
   *  - Notify all purchasers + organizer via NotificationService
   *  - Finally remove the event
   */
  static async deleteEvent(organizerId, eventId) {
    const id = Number(eventId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError('Invalid event id', 400, { code: 'BAD_EVENT_ID' });
    }

    const evt = await EventRepo.findById(id);
    if (!evt) throw new AppError('Event not found', 404, { code: 'EVENT_NOT_FOUND' });
    if (evt.organizer.userId !== organizerId) throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    if(!evt.purchasable()){
      throw new AppError('Event Refund Date Passed', 400, { code: 'PAST_DELETE_PERIOD' });
    }

    // Gather all successful payments to refund
// Gather all successful payments to refund
    const approved = await PaymentRepo.listApprovedForEvent(id);

    for (const p of approved) {
      // Using the row shape from listApprovedForEvent
      const purchaserUserId = p.user_id;
      const paymentId = p.payment_id;
      const purchaseId = p.purchase_id;

      try {
        await PaymentService.refund(p);

        await NotificationService.queue({
          userId: purchaserUserId,
          title: 'refund_issued',
          message: `Event canceled. Your payment ${paymentId} (purchase ${purchaseId}) was refunded.`,
          eventId: id,
        });
      } catch (e) {
        console.warn('Refund failed', purchaseId, e?.message || e);

        await NotificationService.queue({
          userId: purchaserUserId,
          title: 'refund_failed',
          message: `The refund for payment ${paymentId} could not be processed.`,
          eventId: id,
        });
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
    /**
   * Settle all expired events:
   *  - Find events whose end_time <= now
   *  - For each event:
   *      * Sum ticket revenue from purchases
   *      * Pay the organizer 50% via PaymentRepo (using event.payment_info_id)
   *      * Delete the event + its tickets via EventRepo.deleteEvent
   *
   * Returns a summary of what it did.
   */
  static async settleAndDeleteExpiredEvents() {
    // 1) Find expired events


    const expired = EventRepo.getExpiredEvents()
    const results = [];
    if (!expired.length) {
      return { count: 0, payouts: [] };
    }
    for (const evt of expired) {
      const eventId = evt.eventId;
      const organizerId = evt.organizerId;
      const paymentInfoId = evt.pinfoId; // organizer's payout method
      const title = evt.title;

      // 2) Get all ticket purchases for this event
      let purchases = [];
      try {
        if (typeof PaymentRepo.listApprovedForEvent === 'function') {
          purchases = await PaymentRepo.listApprovedForEvent(eventId);
        }
      } catch (e) {
        // If something goes wrong fetching purchases, record error and skip payout,
        // but still delete the event to keep the system clean.
        purchases = [];
      }

      // Sum total revenue from purchases
      const totalCents = Array.isArray(purchases)
        ? purchases.reduce(
            (sum, p) =>
              sum +
              Number(
                p.purchase_amount_cents ??
                p.amount_cents ??
                0
              ),
            0
          )
        : 0;

      // Organizer gets 50% of total revenue
      const payoutCents = Math.floor(totalCents * 0.5);
      let payoutRecord = null;

      // 3) Record payout if we have a payment method and a non-zero share
      if (payoutCents > 0 && paymentInfoId) {
        try {
          payoutRecord = await PaymentRepo.insertPayment({
            userId: organizerId,
            paymentInfoId,
            amountCents: payoutCents,
          });

          // Optional: notify organizer that they got paid
          if (NotificationService && typeof NotificationService.create === 'function') {
            await NotificationService.create({
              userId: organizerId,
              title: 'event_payout',
              message: `Your event "${title}" was settled. You earned ${(payoutCents / 100).toFixed(2)} from ticket sales.`,
              eventId,
            });
          }
        } catch (e) {
          // If payout recording fails, we still delete the event but capture the error in the summary
          payoutRecord = { error: String(e.message || e) };
        }
      }

      // 4) Delete the event and its related rows (tickets, ticketinfo, etc.)
      await EventRepo.deleteEvent(eventId);

      results.push({
        eventId,
        organizerId,
        title,
        totalCents,
        payoutCents,
        paymentInfoId,
        payoutRecord,
      });
    }

    return {
      count: expired.length,
      payouts: results,
    };
  }

}

module.exports = { EventService };
