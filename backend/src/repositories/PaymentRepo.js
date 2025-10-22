/**
 * PaymentRepo
 * Persists and loads local Payment records that mirror provider transactions.
 */
const { knex } = require('../config/db');
const { Payment } = require('../domain/Payment');
const { UserRepo } = require('./UserRepo');
const { EventRepo } = require('./EventRepo');
const { TicketInfoRepo } = require('./TicketInfoRepo');
const { PaymentInfoRepo } = require('./PaymentInfoRepo');

class PaymentRepo {
  /** Insert a new payment row inside an existing transaction (trx) */
  static async insert(trx, { userId, eventId, ticketInfoId, paymentInfoId, amountCents, currency, providerPaymentId, idempotencyKey, status }) {
    const [payment_id] = await trx('payments').insert({
      user_id: userId,
      event_id: eventId || null,
      ticket_info_id: ticketInfoId || null,
      payment_info_id: paymentInfoId || null,
      amount_cents: amountCents,
      currency: currency || 'CAD',
      provider_payment_id: providerPaymentId || null,
      idempotency_key: idempotencyKey || null,
      status: status || 'approved'
    });
    return this.findById(payment_id);
  }

  /** Update a payment status (e.g., refunded) */
  static async updateStatus(trx, paymentId, status, extra = {}) {
    await trx('payments').where({ payment_id: paymentId }).update({ status, ...extra, updated_at: trx.fn.now() });
    return this.findById(paymentId);
  }

  /** Hydrate a Payment domain object with linked references */
  static async findById(paymentId) {
    const r = await knex('payments').where({ payment_id: paymentId }).first();
    if (!r) return null;
    const [user, evt, tinfo, pinfo] = await Promise.all([
      UserRepo.findById(r.user_id),
      r.event_id ? EventRepo.findById(r.event_id) : null,
      r.ticket_info_id ? TicketInfoRepo.findById(r.ticket_info_id) : null,
      r.payment_info_id ? PaymentInfoRepo.findById(r.payment_info_id) : null,
    ]);
    return new Payment({
      paymentId: r.payment_id,
      user, event: evt, ticketInfo: tinfo, paymentInfo: pinfo,
      amountCents: r.amount_cents, currency: r.currency,
      status: r.status, refundedCents: r.refunded_cents,
      providerPaymentId: r.provider_payment_id, idempotencyKey: r.idempotency_key
    });
  }

  /** All APPROVED payments for a given event (used to mass-refund on cancel) */
  static async listApprovedForEvent(eventId) {
    const rows = await knex('payments').where({ event_id: eventId, status: 'approved' });
    return Promise.all(rows.map(r => this.findById(r.payment_id)));
  }
}

module.exports = { PaymentRepo };
