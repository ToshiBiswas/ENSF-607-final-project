/**
 * PaymentService
 * Integrates with an external (mock) Payments API to:
 *  - Verify cards (and store a non-sensitive snapshot)
 *  - Charge and record Payment rows (with idempotency)
 *  - Issue refunds and update status
 */
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors');
const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');
const { PaymentRepo } = require('../repositories/PaymentRepo');

/** Resolve the base URL of the payment provider from environment */
const BASE = () => process.env.PAYMENTS_BASE_URL || 'http://localhost:8080';

class PaymentService {
  /**
   * Verify a card via GET /v1/accounts/verify and store the account snapshot.
   * Returns a PaymentInfo domain object (reused if already present).
   */
  static async verifyAndStore(userId, { number, name, ccv, exp_month, exp_year }) {
    const url = new URL('/v1/accounts/verify', BASE());
    url.searchParams.set('number', number);
    url.searchParams.set('name', name);
    url.searchParams.set('ccv', String(ccv));
    url.searchParams.set('exp_month', String(exp_month));
    url.searchParams.set('exp_year', String(exp_year));
    const res = await fetch(url);
    if (!res.ok) throw new AppError('Card verification failed', 402);
    const data = await res.json();
    const account = data.account;
    // Deduplicate per provider account
    const existing = await PaymentInfoRepo.findByAccountId(account.id);
    if (existing) return existing;
    return PaymentInfoRepo.insert({ userId, account });
  }

  /**
   * Charge and record a local Payment row.
   * - Expects a PaymentInfo domain (stored card) for account_id
   * - Uses idempotency_key to prevent duplicate provider charges
   */
  static async chargeAndRecord({ userId, eventId, ticketInfoId, paymentInfo, amountCents, currency = 'CAD', idempotencyKey }) {
    // 1) Call provider
    const res = await fetch(`${BASE()}/v1/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account_id: paymentInfo.accountId,
        ccv: '***',             // NOTE: mock; if your provider requires actual CCV, include it
        amount_cents: amountCents,
        currency,
        idempotency_key: idempotencyKey
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new AppError(err.error || 'Payment declined', 402, { code: err.code || 'DECLINED' });
    }
    const pay = await res.json();
    const providerId = pay.payment_id || pay.id || null;

    // 2) Record local Payment within a transaction (guarantees atomicity if extended)
    return await knex.transaction(async (trx) => {
      const p = await PaymentRepo.insert(trx, {
        userId, eventId, ticketInfoId, paymentInfoId: paymentInfo.paymentInfoId,
        amountCents, currency, providerPaymentId: providerId, idempotencyKey, status: 'approved'
      });
      return p;
    });
  }

  /**
   * Request a refund at the provider and mark local Payment as refunded (full or partial).
   */
  static async refund(paymentId, amountCents, idempotencyKey) {
    const p = await PaymentRepo.findById(paymentId);
    if (!p) throw new AppError('Payment not found', 404);
    const res = await fetch(`${BASE()}/v1/refunds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: p.providerPaymentId || `pay_${paymentId}`, amount_cents: amountCents, idempotency_key: idempotencyKey })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new AppError(`Refund failed: ${t}`, 400);
    }
    await knex.transaction(async (trx) => {
      await PaymentRepo.updateStatus(trx, paymentId, 'refunded', { refunded_cents: amountCents });
    });
    return true;
  }
}

module.exports = { PaymentService };
