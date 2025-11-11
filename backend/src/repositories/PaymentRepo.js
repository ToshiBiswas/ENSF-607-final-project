/**
 * PaymentRepo
 * Persists and loads local Payment records that mirror provider transactions.
 */
// src/repositories/PaymentRepo.js
const { knex } = require('../config/db');
const TABLE = 'payments';

class PaymentRepo {
  static async insert(payload) {
    const [id] = await knex(TABLE).insert({
      user_id: payload.userId,
      event_id: payload.eventId,
      ticket_info_id: payload.ticketInfoId,
      payment_info_id: payload.paymentInfoId,
      amount_cents: payload.amountCents,
      currency: payload.currency,
      provider_payment_id: payload.providerPaymentId,
      idempotency_key: payload.idempotencyKey,
      status: payload.status,
    });
    return this.findById(id);
  }

  static async findById(paymentId) {
    return knex(TABLE).where({ payment_id: paymentId }).first();
  }

  static async listApprovedForEvent(eventId) {
    return knex(TABLE)
      .where({ event_id: eventId, status: 'approved' })
      .orderBy('payment_id', 'asc');
  }

  static async updateStatus(_unused, paymentId, status, extras = {}) {
    // _unused keeps call sites compatible; we ignore any trx argument now
    await knex(TABLE).where({ payment_id: paymentId }).update({ status, ...extras });
  }
}

module.exports = { PaymentRepo };

