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
  static async findByUserId(userId) {
    //calculate refunded amount separately to avoid duplication from joins
    const refundSubquery = knex(REFUNDS)
      .select('payment_id')
      .sum('amount_cents as refunded_cents')
      .groupBy('payment_id')
      .as('refund_totals');

    //get distinct payments first, then join with refunds and other data
    const paymentRows = await knex(`${PAYMENTS} as pay`)
      .leftJoin(refundSubquery, 'pay.payment_id', 'refund_totals.payment_id')
      .leftJoin('paymentinfo as pi', 'pi.payment_info_id', 'pay.payment_info_id')
      .where(`pay.user_id`, userId)
      .select(
        `pay.payment_id`,
        `pay.user_id`,
        `pay.payment_info_id`,
        `pay.amount_cents`,
        `pay.currency`,
        `pay.created_at`,
        knex.raw('COALESCE(refund_totals.refunded_cents, 0) as refunded_cents'),
        'pi.last4',
        'pi.name as payment_info_name'
      )
      .orderBy(`pay.created_at`, 'desc');

    //for each payment, get the first event/ticket info (for display purposes)
    const rows = await Promise.all(paymentRows.map(async (payment) => {
      const firstPurchase = await knex(`${PURCHASES} as p`)
        .leftJoin('tickets as t', 't.ticket_id', 'p.ticket_id')
        .leftJoin('events as e', 'e.event_id', 't.event_id')
        .leftJoin('ticketinfo as ti', 'ti.info_id', 't.info_id')
        .where('p.payment_id', payment.payment_id)
        .select(
          'e.event_id',
          'e.title as event_title',
          'ti.info_id as ticket_info_id',
          'ti.ticket_type'
        )
        .first();

      return {
        ...payment,
        event: firstPurchase?.event_id ? {
          eventId: firstPurchase.event_id,
          title: firstPurchase.event_title,
        } : null,
        ticketInfo: firstPurchase?.ticket_info_id ? {
          infoId: firstPurchase.ticket_info_id,
          type: firstPurchase.ticket_type,
        } : null,
      };
    }));

    return rows.map((row) => ({
      paymentId: row.payment_id,
      userId: row.user_id,
      paymentInfoId: row.payment_info_id,
      amountCents: row.amount_cents,
      currency: row.currency,
      createdAt: row.created_at,
      refundedCents: Number(row.refunded_cents || 0),
      status: Number(row.refunded_cents || 0) >= row.amount_cents ? 'refunded' : 'approved',
      event: row.event,
      ticketInfo: row.ticketInfo,
      paymentInfo: row.payment_info_id ? {
        paymentInfoId: row.payment_info_id,
        last4: row.last4,
        name: row.payment_info_name,
      } : null,
    }));
  }

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

  /**
   * Get purchase data for a ticket refund.
   * Returns purchase row in format expected by PaymentService.refund.
   */
  static async getPurchaseForRefund(ticketId, trx = null) {
    const q = trx || knex;

    const row = await q(`${PURCHASES} as p`)
      .join('tickets as t', 't.ticket_id', 'p.ticket_id')
      .join(`${PAYMENTS} as pay`, 'pay.payment_id', 'p.payment_id')
      .leftJoin('paymentinfo as pi', 'pi.payment_info_id', 'pay.payment_info_id')
      .select(
        'p.purchase_id',
        'p.amount_cents as purchase_amount_cents',
        'p.ticket_id',
        't.event_id',
        't.info_id', //added to get ticket info_id for stock increment
        'pay.payment_id',
        'pay.user_id',
        'pay.amount_cents as payment_amount_cents',
        'pay.payment_info_id',
        'pi.account_id',
      )
      .where('t.ticket_id', ticketId)
      .first();

    return row;
  }

  static async refund(userId, paymentId, amountCents, trx = null) {
    const q = trx || knex;
    const [id] = await q(REFUNDS).insert({
      user_id: userId,
      payment_id: paymentId,
      amount_cents: amountCents,
      currency: 'CAD',
    });
    return q(REFUNDS).where({ refund_id: id }).first();
  }

  static async findRefundByPaymentId(paymentId, trx = null) {
    const q = trx || knex;
    return q(REFUNDS).where({ payment_id: paymentId }).first();
  }

  static async findRefundByPurchaseId(purchaseId, trx = null) {
    const q = trx || knex;
    //find refund for this purchase by joining with purchases table
    return q(REFUNDS)
      .join(PURCHASES, `${REFUNDS}.payment_id`, `${PURCHASES}.payment_id`)
      .where(`${PURCHASES}.purchase_id`, purchaseId)
      .first();
  }

  /** List all payments for a user */
  static async listForUser(userId) {
    const rows = await knex('payments').where({ user_id: userId }).orderBy('created_at', 'desc');
    return Promise.all(rows.map(r => this.findById(r.payment_id)));
  }
}

module.exports = { PaymentRepo };
