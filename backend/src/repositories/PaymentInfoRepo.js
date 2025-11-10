/**
 * PaymentInfoRepo
 * Stores non-sensitive account snapshots returned by the Payments API.
 * Lookup by account_id prevents duplicate records for the same underlying card.
 */
const { knex } = require('../config/db');
const { PaymentInfo } = require('../domain/PaymentInfo');
const { UserRepo } = require('./UserRepo');

class PaymentInfoRepo {
  static async insert({ userId, account }) {
    const [id] = await knex('paymentinfo').insert({
      user_id: userId,
      account_id: account.id,
      name: account.name,
      last4: account.last4,
      exp_month: account.exp_month,
      exp_year: account.exp_year,
      currency: account.currency || 'CAD',
      primary_account: false
    });
    return this.findById(id);
  }

  static async findById(id) {
    const r = await knex('paymentinfo').where({ payment_info_id: id }).first();
    if (!r) return null;
    const owner = await UserRepo.findById(r.user_id);
    return new PaymentInfo({
      paymentInfoId: r.payment_info_id,
      owner,
      accountId: r.account_id,
      name: r.name,
      last4: r.last4,
      expMonth: r.exp_month,
      expYear: r.exp_year,
      currency: r.currency,
      primary: !!r.primary_account
    });
  }

  static async listForUser(userId) {
    const rows = await knex('paymentinfo').where({ user_id: userId }).orderBy('created_at', 'desc');
    return rows.map(r => new PaymentInfo({
      paymentInfoId: r.payment_info_id, owner: { userId }, accountId: r.account_id,
      name: r.name, last4: r.last4, expMonth: r.exp_month, expYear: r.exp_year, currency: r.currency, primary: !!r.primary_account
    }));
  }

  static async findByAccountId(accountId) {
    const r = await knex('paymentinfo').where({ account_id: accountId }).first();
    if (!r) return null;
    return this.findById(r.payment_info_id);
  }
}

module.exports = { PaymentInfoRepo };
