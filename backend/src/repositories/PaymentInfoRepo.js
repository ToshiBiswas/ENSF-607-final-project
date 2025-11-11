/**
 * PaymentInfoRepo
 * Stores non-sensitive account snapshots returned by the Payments API.
 * Lookup by account_id prevents duplicate records for the same underlying card.
 */
// src/repositories/PaymentInfoRepo.js
'use strict';
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors');
// domain/PaymentInfo optional; you can keep returning plain objects if preferred

const TABLE = 'paymentinfo';

class PaymentInfoRepo {
  static async findByAccountId(accountId) {
    const r = await knex(TABLE).where({ account_id: accountId }).first();
    return r ? this.#shape(r) : null;
  }

  static async findById(id) {
    const r = await knex(TABLE).where({ payment_info_id: id }).first();
    return r ? this.#shape(r) : null;
  }

  static async insertCard({ account }) {
    // Ensure we don’t duplicate cards globally
    const existing = await knex(TABLE).where({ account_id: account.id }).first();
    if (existing) return this.#shape(existing);

    const [id] = await knex(TABLE).insert({
      account_id: account.id,
      name: account.name,
      last4: String(account.last4).slice(-4),
      exp_month: account.exp_month,
      exp_year: account.exp_year,
      currency: account.currency || 'CAD'
      // no primary_account, no user_id
    });
    return this.findById(id);
  }

  static #shape(r) {
    return {
      paymentInfoId: r.payment_info_id,
      accountId: r.account_id,
      name: r.name,
      last4: r.last4,
      expMonth: r.exp_month,
      expYear: r.exp_year,
      currency: r.currency
    };
  }
}

module.exports = { PaymentInfoRepo };
