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

/** Generate a 6-digit code. Probability of collision is low; DB unique index prevents duplicates when table exists. */
function generateTicketCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

class TicketingService {
  /**
   * Add a ticket type to the user cart.
   * Only allows adds if the event is currently within its active window.
   */
  static async addToCart(user, ticketInfoId, qty) {
    const tinfo = await TicketInfoRepo.findById(ticketInfoId);
    if (!tinfo) throw new AppError('Ticket type not found', 404);
    // Find owning event ID quickly (without circular domain hydration)
    const row = await require('../config/db').knex('ticketinfo').where({ info_id: ticketInfoId }).first();
    const evt = await EventRepo.findById(row.event_id);
    if (!evt.isActive()) throw new AppError('Event not available', 400);
    if (tinfo.left < qty) throw new AppError('Not enough tickets in stock', 400);

    // In-memory cart only; actual stock is decremented during checkout under txn
    const { CartService } = require('./CartService');
    const cart = CartService.getCart(user);
    cart.add(tinfo, qty);
    return cart;
  }

  /**
   * Checkout the cart:
   *  - Determine payment method (saved or new)
   *  - Within a transaction: LOCK stock rows, charge, decrement, mint tickets
   *  - Clear cart after success
   */
  static async checkout(user, { usePaymentInfoId = null, newCard = null }) {
    const { CartService } = require('./CartService');
    const cart = CartService.getCart(user);
    if (!cart.items.length) throw new AppError('Cart is empty', 400);

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
        const locked = await TicketInfoRepo.lockAndLoad(trx, item.ticketInfo.infoId);
        if (!locked) throw new AppError('Ticket type not found', 404);
        if (locked.row.tickets_left < item.quantity) throw new AppError('Insufficient stock at checkout', 400);

        // Ensure event is still active at the moment of purchase
        const evtRow = await trx('events').where({ event_id: locked.row.event_id }).first();
        const now = new Date();
        if (!(now >= new Date(evtRow.start_time) && now <= new Date(evtRow.end_time))) {
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

        // Mint N tickets with 6-digit unique codes
        for (let i = 0; i < item.quantity; i++) {
          const code = generateTicketCode();
          const t = await TicketMintRepo.save({
            code,
            ownerId: user.userId,
            eventId: locked.row.event_id,
            infoId: locked.row.info_id,
            paymentId: payment.paymentId
          });
          minted.push(t);
        }

        // Notify purchaser (webhook + DB)
        await NotificationService.notify({
          userId: user.userId,
          type: 'payment_approved',
          message: `Payment approved and ${item.quantity} ticket(s) minted`,
          eventId: locked.row.event_id,
          paymentId: payment.paymentId
        });
      }
    });

    // Clear cart OUTSIDE the transaction
    cart.clear();
    return { tickets: minted.map(t => t.code) };
  }
}

module.exports = { TicketingService };
