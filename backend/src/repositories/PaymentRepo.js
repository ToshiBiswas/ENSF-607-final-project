/**
 * PaymentRepo
 * Persists and loads local Payment records that mirror provider transactions.
 */
// src/repositories/PaymentRepo.js
const { knex } = require('../config/db');
const PAYMENTS = 'payments';
const REFUNDS = 'refunds'
const PURCHASES = 'purchases' 
class PaymentRepo {
  static async insertPayment(payload) {
    const [id] = await knex(PAYMENTS).insert({
      user_id: payload.userId,
      payment_info_id: payload.paymentInfoId,
      amount_cents: payload.amountCents
    });
    return this.findById(id);
  }
  static async findById(paymentId) {
    return knex(PAYMENTS).where({ payment_id: paymentId }).first();

  }
  static async getTicketPurchases(event_id){
    const purchase = knex(PURCHASE).where({event_id}).first()
    return this.findById(purchase.payment_info_id);

  }
  static async findByPurchaseId(purchase_id) {
    return knex(PURCHASES).where({ purchase_id }).first();

  }
  static async insertPurchase(payment_id, ticket_id, amount_cents) {
    const [id] = await knex(PURCHASES).insert({
      payment_id,
      ticket_id,
      amount_cents
    });
    return this.findByPurchaseId(id);
  }
  static async listApprovedForEvent(eventId) {
     const p = await knex(PURCHASES)
      .where({ event_id: eventId, status: 'approved' })
      .orderBy('purchase_id', 'asc');
    p[payment] = this.findById(paymentId);
  }

  static async refund(userId, paymentId, amountCents) {
    const [id] = await knex(REFUNDS).insert({
      user_id: userId,
      payment_id: paymentId,
      amount_cents: amountCents,
    });
  }
}

module.exports = { PaymentRepo };

