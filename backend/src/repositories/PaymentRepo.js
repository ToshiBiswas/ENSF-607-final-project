// src/repositories/PaymentRepo.js
/**
 * PaymentRepo
 * Persists and loads local Payment records that mirror provider transactions.
 */
'use strict';

const { knex } = require('../config/db');
const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');

const PAYMENTS = 'payments';
const REFUNDS  = 'refunds';
const PURCHASES = 'purchases';

class PaymentRepo {
  static async insertPayment(payload, trx = null) {
    const q = trx || knex;
    const [id] = await q(PAYMENTS).insert({
      user_id: payload.userId,
      payment_info_id: payload.paymentInfoId,
      amount_cents: payload.amountCents,
    });
    return this.findById(id, q);
  }

  static async findById(paymentId, trx = null) {
    const q = trx || knex;
    return q(PAYMENTS).where({ payment_id: paymentId }).first();
  }

  static async findByPurchaseId(purchaseId, trx = null) {
    const q = trx || knex;
    return q(PURCHASES).where({ purchase_id: purchaseId }).first();
  }

  /**
   * Insert a purchase row. IMPORTANT: pass the same trx used for tickets
   * so you don't hit cross-connection locks.
   */
  static async insertPurchase(paymentId, ticketId, amountCents, trx = null) {
    const q = trx || knex;
    const [id] = await q(PURCHASES).insert({
      payment_id: paymentId,
      ticket_id: ticketId,
      amount_cents: amountCents,
    });
    return this.findByPurchaseId(id, q);
  }

  /**
   * Get purchase + payment + paymentInfo for a given ticket.
   */
  static async getTicketPurchases(ticketId, trx = null) {
    const q = trx || knex;
    const purchase = await q(PURCHASES)
      .where({ ticket_id: ticketId })
      .first();
    if (!purchase) return null;

    const payment = await this.findById(purchase.payment_id, q);
    if (!payment) return null;

    const paymentInfo = await PaymentInfoRepo.findById(payment.payment_info_id);

    return { purchase, payment, paymentInfo };
  }

  /**
   * All purchases for an event, joined out so PaymentService.refund can work.
   * (We treat all purchases as "approved" for now since there's no status column.)
   */
  static async listApprovedForEvent(eventId, trx = null) {
    const q = trx || knex;

    return q(`${PURCHASES} as p`)
      .join('tickets as t', 't.ticket_id', 'p.ticket_id')
      .join(`${PAYMENTS} as pay`, 'pay.payment_id', 'p.payment_id')
      .join('paymentinfo as pi', 'pi.payment_info_id', 'pay.payment_info_id')
      .select(
        'p.purchase_id',
        'p.amount_cents as purchase_amount_cents',
        'p.ticket_id',
        't.event_id',
        'pay.payment_id',
        'pay.user_id',
        'pay.amount_cents as payment_amount_cents',
        'pay.payment_info_id',
        'pi.account_id',
      )
      .where('t.event_id', eventId);
  }

  static async refund(userId, paymentId, amountCents, trx = null) {
    const q = trx || knex;
    const [id] = await q(REFUNDS).insert({
      user_id: userId,
      payment_id: paymentId,
      amount_cents: amountCents,
    });
    return q(REFUNDS).where({ refund_id: id }).first();
  }

  /** List all payments for a user */
  static async listForUser(userId) {
    const rows = await knex('payments').where({ user_id: userId }).orderBy('created_at', 'desc');
    return Promise.all(rows.map(r => this.findById(r.payment_id)));
  }
}

module.exports = { PaymentRepo };
