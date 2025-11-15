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

  static async listForUser(userId, query = {}) {
    const page = Math.max(parseInt(query?.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(query?.pageSize || '10', 10), 1), 100);
    const status = query?.status;

    const base = knex(TABLE)
      .leftJoin('events as e', 'e.event_id', `${TABLE}.event_id`)
      .leftJoin('paymentinfo as pi', 'pi.payment_info_id', `${TABLE}.payment_info_id`)
      .where(`${TABLE}.user_id`, userId)
      .modify((qb) => {
        if (status) qb.andWhere(`${TABLE}.status`, status);
      });

    const [{ count }] = await base.clone().clearSelect().clearOrder().count({ count: '*' });
    
    const rows = await base
      .select([
        `${TABLE}.payment_id as paymentId`,
        `${TABLE}.user_id as userId`,
        `${TABLE}.event_id as eventId`,
        `${TABLE}.ticket_info_id as ticketInfoId`,
        `${TABLE}.payment_info_id as paymentInfoId`,
        `${TABLE}.amount_cents as amountCents`,
        `${TABLE}.currency`,
        `${TABLE}.status`,
        `${TABLE}.refunded_cents as refundedCents`,
        `${TABLE}.provider_payment_id as providerPaymentId`,
        `${TABLE}.created_at as createdAt`,
        `${TABLE}.updated_at as updatedAt`,
        'e.title as eventTitle',
        'e.venue as eventVenue',
        'pi.last4 as cardLast4',
        'pi.name as cardName',
      ])
      .orderBy(`${TABLE}.created_at`, 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { page, pageSize, total: Number(count), data: rows };
  }

}

module.exports = { PaymentRepo };

