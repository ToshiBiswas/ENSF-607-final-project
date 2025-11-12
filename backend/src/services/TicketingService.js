const crypto = require('crypto');
/**
 * TicketingService
 * Orchestrates cart operations and checkout:
 *  - Add to cart only if event is currently active
 *  - Validate stock at add AND at checkout time
 *  - Lock rows at checkout and decrement stock
 *  - Charge via PaymentService and mint N tickets per quantity
 *  - Emit notifications on success
 */
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors');
const { TicketInfoRepo } = require('../repositories/TicketInfoRepo');
const { EventRepo } = require('../repositories/EventRepo');
const { TicketMintRepo } = require('../repositories/TicketMintRepo');
const { NotificationService } = require('./NotificationService');
const { CartService } = require("./CartService")
/** Generate a 6-digit code. Probability of collision is low; DB unique index prevents duplicates when table exists. */
function generateTicketCode() {
  // 15-digit numeric code using crypto.randomInt to reduce collisions
  const digits = [];
  for (let i = 0; i < 15; i++) {
    digits.push(crypto.randomInt(0, 10));
  }
  return digits.join('');
}


// Retry-mint helper to avoid duplicate ticket codes (MySQL ER_DUP_ENTRY 1062)
async function mintTicketsWithRetry(trx, { userId, eventId, infoId, paymentId, qty, maxAttempts = 5 }) {
  const minted = [];
  for (let i = 0; i < qty; i++) {
    let attempts = 0;
    while (true) {
      attempts += 1;
      const code = generateTicketCode();
      try {
        const t = await TicketMintRepo.save({ code, ownerId: userId, eventId, infoId, paymentId }, trx);
        minted.push(t);
        break;
      } catch (e) {
        const isDup = (e && (e.code === 'ER_DUP_ENTRY' || e.errno === 1062));
        if (isDup && attempts < maxAttempts) continue;
        throw e;
      }
    }
  }
  return minted;
}



class TicketingService {
  // inside class TicketingService

/**
 * Validate a 15-digit ticket code for an event.
 * Only the organizer of the event can validate.
 * Always returns { response: 'valid'|'invalid', ticket: object|null } — no throws.
 */
static async validateTicket({ currentUser, eventId, code }) {
  const eid = Number(eventId);
  const clean = String(code || '').trim();

  // basic shape checks
  if (!Number.isInteger(eid) || eid <= 0) {
    return { response: 'invalid', ticket: null };
  }
  if (!/^\d{15}$/.test(clean)) {
    return { response: 'invalid', ticket: null };
  }

  // load event and check organizer ownership
  const { EventRepo } = require('../repositories/EventRepo');
  const evt = await EventRepo.findById(eid);
  if (!evt) return { response: 'invalid', ticket: null };

  // must be authenticated and be the organizer
  if (!currentUser || evt.organizer?.userId !== currentUser.userId) {
    return { response: 'invalid', ticket: null };
  }

  // look up ticket
  const { TicketMintRepo } = require('../repositories/TicketMintRepo');
  const ticket = await TicketMintRepo.findByCodeForEvent(eid, clean);
  if (!ticket) return { response: 'invalid', ticket: null };

  return { response: 'valid', ticket };
}

  /**
   * Add a ticket type to the user cart.
   * Only allows adds if the event is currently within its active window.
   */
  static async addToCart(user, ticketInfoId, quantity) {
    const infoId = Number(ticketInfoId);
    const qty    = Number(quantity);

    if (!Number.isInteger(infoId) || infoId <= 0) {
      throw new AppError('Invalid ticket_info_id', 400, { code: 'BAD_INFO_ID' });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError('Invalid quantity', 400, { code: 'BAD_QUANTITY' });
    }

    // Load ticket info & owning event
    const tinfo = await TicketInfoRepo.findById(infoId);
    if (!tinfo) throw new AppError('Ticket type not found', 404, { code: 'TICKET_NOT_FOUND' });

    const row = await knex('ticketinfo').where({ info_id: infoId }).first();
    const evt = await EventRepo.findById(row.event_id);

    // Enforce purchasable window (uses your domain method)
    if (!evt?.purchasable?.()) {
      throw new AppError('Event not available', 400, { code: 'EVENT_NOT_PURCHASABLE' });
    }

    // Guard stock before adding
    if (row.tickets_left != null && qty > Number(row.tickets_left)) {
      throw new AppError('Not enough tickets left', 409, {
        code: 'INSUFFICIENT_STOCK',
        left: Number(row.tickets_left)
      });
    }

    // DB-backed add
    return await CartService.addToCart(user, infoId, qty);
  }


  /**
   * Checkout the cart:
   *  - Determine payment method (saved or new)
   *  - Within a transaction: LOCK stock rows, charge, decrement, mint tickets
   *  - Clear cart after success
   */
  static async checkout(user, { usePaymentInfoId = null, newCard = null }) {
    const { CartService } = require('./CartService');
    const cart = await CartService.getCart(user);
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) throw new AppError('Cart is empty', 400);

    const paymentService = require('./PaymentService').PaymentService;

    // Pick payment method: saved card or verify+store new card
    let pinfo = null;
    if (usePaymentInfoId) {
      const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');
      pinfo = await PaymentInfoRepo.findById(usePaymentInfoId);
      if (!pinfo || pinfo.owner.userId !== user.userId) throw new AppError('Payment method not found', 404);
    } else if (newCard) {
      pinfo = await paymentService.verifyAndStore(user.userId, newCard);
    } else {
      throw new AppError('No payment method provided', 400);
    }

    const minted = [];
    // Single encompassing transaction: ensures stock decrement + payment record stay consistent
    await knex.transaction(async (trx) => {
      for (const item of cart.items) {
        // LOCK the stock row to prevent race conditions
        const locked = await TicketInfoRepo.lockAndLoad(trx, item.info_id);
        if (!locked) throw new AppError('Ticket type not found', 404);
        if (locked.row.tickets_left < item.quantity) throw new AppError('Insufficient stock at checkout', 400);

        // Ensure event is still active at the moment of purchase
        const evts = await EventRepo.findById(locked.row.event_id);
        if (!(evts.purchasable())) {
          throw new AppError('Event not available', 400);
        }

        // Compute total for this cart line
        const amountCents = Math.round(Number(locked.row.ticket_price) * 100) * item.quantity;

        // Provider charge + local Payment row
        const payment = await require('./PaymentService').PaymentService.chargeAndRecord({
          userId: user.userId,
          eventId: locked.row.event_id,
          ticketInfoId: locked.row.info_id,
          paymentInfo: pinfo,
          amountCents,
          currency: 'CAD',
          idempotencyKey: `user${user.userId}-info${locked.row.info_id}-ts${Date.now()}`
        });

        // Decrement stock atomically
        await TicketInfoRepo.decrementLeft(trx, locked.row.info_id, item.quantity);
        const mintedBatch = await mintTicketsWithRetry(trx, {
          userId: user.userId,
          eventId: locked.row.event_id,
          infoId:  locked.row.info_id,
          paymentId: payment.paymentId,   // use id returned by PaymentService
          qty: item.quantity
        });
        minted.push(...mintedBatch);

      // Notify purchaser (webhook + DB)
      await NotificationService.queue({
        userId: user.userId,
        title: 'payment_approved',
        message: `Payment approved and ${item.quantity} ticket(s) minted`,
        eventId: locked.row.event_id,
        paymentId: payment.paymentId
      });
      }
    });

    // Clear cart OUTSIDE the transaction
    CartService.clear();
    return { tickets: minted.map(t => t.code) };
  }
  static async createTicket(user, body) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    const eventId = Number.parseInt(String(body?.eventId ?? ''), 10);
    const quantity = Number.isFinite(body?.quantity) ? Number(body.quantity) : 1;
    const ticketType = (body?.ticketType || 'general').trim();
    const ticketInfoId = body?.ticketInfoId ? Number(body.ticketInfoId) : null;
    const explicitPrice = body?.price; // optional override

    if (!Number.isInteger(eventId) || eventId <= 0) {
      const err = new Error('Invalid event id');
      err.status = 400;
      throw err;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      const err = new Error('Quantity must be a positive integer');
      err.status = 400;
      throw err;
    }

    const created = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = await mintTicketsWithRetry({
        user_id: user.id,
        event_id: eventId,
        ticket_type: ticketType,
        price: explicitPrice,        // if null, purchase() falls back to TicketInfo price
        ticket_info_id: ticketInfoId // if null, purchase() resolves by (event_id, type)
      });
      created.push(ticket);
    }

    const unitPrice = (explicitPrice != null)
      ? Number(explicitPrice)
      : Number(created[0]?.price ?? 0);
    const totalPaid = (unitPrice * quantity).toFixed(2);

    // If you have currency on TicketInfo or ticket row, return it; else default
    const currency = created[0]?.currency || 'USD';

    return { data: created, quantity, totalPaid, currency };
  }
   static async getMyTickets(user, query) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const page = Math.max(parseInt(query?.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(query?.pageSize || '10', 10), 1), 100);
    const status = query?.status;
    const upcoming = String(query?.upcoming) === 'true';

    const base = db('tickets as t')
      .leftJoin('events as e', 'e.id', 't.event_id')
      .where('t.user_id', user.id)
      .modify((qb) => {
        if (status) qb.andWhere('t.status', status);
        if (upcoming) qb.andWhere('e.start_at', '>=', db.fn.now());
      });

    const [{ count }] = await base.clone().clearSelect().clearOrder().count({ count: '*' });
    const rows = await base
      .select([
        't.id', 't.event_id', 't.user_id', 't.quantity',
        't.price_paid', 't.currency', 't.status',
        't.created_at', 't.updated_at',
        'e.title as event_title', 'e.venue as event_venue',
        'e.start_at as event_start', 'e.end_at as event_end',
      ])
      .orderBy('t.created_at', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { page, pageSize, total: Number(count), data: rows };
  }

  /**
   * One ticket by id (must belong to current user), with event info.
   */
  static async getTicketById(user, id) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const ticketId = Number.parseInt(String(id ?? ''), 10);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      const err = new Error('Invalid ticket id');
      err.status = 400;
      throw err;
    }

    const row = await db('tickets as t')
      .leftJoin('events as e', 'e.id', 't.event_id')
      .select([
        't.id', 't.event_id', 't.user_id', 't.quantity',
        't.price_paid', 't.currency', 't.status',
        't.created_at', 't.updated_at',
        'e.title as event_title', 'e.venue as event_venue',
        'e.start_at as event_start', 'e.end_at as event_end',
      ])
      .where('t.id', ticketId)
      .andWhere('t.user_id', user.id)
      .first();

    if (!row) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }
    return { data: row };
  }

static async updateTicket(user, id, patch) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const ticketId = Number.parseInt(String(id ?? ''), 10);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      const err = new Error('Invalid ticket id');
      err.status = 400;
      throw err;
    }

    // Restrict what can be updated
    const allowed = {};
    if (typeof patch?.status === 'string') {
      allowed.status = patch.status.trim();
    }

    if (Object.keys(allowed).length === 0) {
      const err = new Error('No updatable fields provided');
      err.status = 400;
      throw err;
    }

    // Ensure ticket belongs to user
    const exists = await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .first();

    if (!exists) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }

    await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .update({ ...allowed, updated_at: db.fn.now() });

    // Return updated record (with event info for parity with other getters)
    const updated = await db('tickets as t')
      .leftJoin('events as e', 'e.id', 't.event_id')
      .select([
        't.id', 't.event_id', 't.user_id', 't.quantity',
        't.price_paid', 't.currency', 't.status',
        't.created_at', 't.updated_at',
        'e.title as event_title', 'e.venue as event_venue',
        'e.start_at as event_start', 'e.end_at as event_end',
      ])
      .where('t.id', ticketId)
      .andWhere('t.user_id', user.id)
      .first();

    return { data: updated };
  }

  /**
   * Delete a ticket that belongs to the current user.
   */
  static async deleteTicket(user, id) {
    if (!user?.id) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    const ticketId = Number.parseInt(String(id ?? ''), 10);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      const err = new Error('Invalid ticket id');
      err.status = 400;
      throw err;
    }

    // Verify ownership
    const exists = await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .first();

    if (!exists) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }

    await db('tickets')
      .where({ id: ticketId, user_id: user.id })
      .del();

    return { id: ticketId, deleted: true };
  }
}
module.exports = { TicketingService };
