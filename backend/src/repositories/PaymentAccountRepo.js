// src/repositories/PaymentAccountRepo.js
'use strict';

const { knex } = require('../config/db');

class PaymentAccountRepo {
  static TABLE = 'payment_accounts';

  /** Find account by PK id (string). */
  static async findById(accountId, trx = knex) {
    return trx(this.TABLE).where({ id: String(accountId) }).first();
  }

  /** Strict match by full card tuple. */
  static async findByFullCard({ number, name, ccv, exp_month, exp_year }, trx = knex) {
    return trx(this.TABLE).where({
      number: String(number),
      name: String(name).trim(),
      ccv: String(ccv),
      exp_month: Number(exp_month),
      exp_year: Number(exp_year),
    }).first();
  }

  /** Adjust balance atomically by a delta (±cents). Returns updated row. */
  static async adjustBalanceCents(accountId, deltaCents, trx = knex) {
    await trx(this.TABLE)
      .where({ id: String(accountId) })
      .increment({ balance_cents: Number(deltaCents) });
    return this.findById(accountId, trx);
  }

  /** Convenience: return a minimal “safe” projection for API responses. */
  static toPublic(acc) {
    if (!acc) return null;
    const last4 = String(acc.number).replace(/\s|-/g, '').slice(-4);
    return {
      account_id: acc.id,
      name: acc.name,
      last4,
      exp_month: acc.exp_month,
      exp_year: acc.exp_year,
      currency: acc.currency,
      balance_cents: Number(acc.balance_cents),
    };
  }
}

module.exports = { PaymentAccountRepo };
