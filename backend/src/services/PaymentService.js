/**
 * PaymentService
 * Uses in-process MockPaymentsProvider:
 *  - Verify cards against accounts file (no HTTP)
 *  - Charge and record Payment rows (with idempotency)
 *  - Refund and update status
 */
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors'); // <-- use your error.js
const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');
const { PaymentRepo } = require('../repositories/PaymentRepo');
const { MockPaymentsProvider } = require('../mock/MockPaymentsProvider');

// Load accounts once; enforce full card details on purchase
const provider = new MockPaymentsProvider({
  accountsPath: process.env.MOCK_ACCOUNTS_PATH, // optional; defaults to src/mock/accounts.json
  requireFullCardOnPurchase: true
});

function assertCard(card) {
  if (
    !card ||
    !card.number ||
    !card.name ||
    !card.ccv ||
    card.exp_month == null ||
    card.exp_year == null
  ) {
    throw new AppError(
      'Card details required: number, name, ccv, exp_month, exp_year',
      400,
      { code: 'MISSING_CARD' }
    );
  }
}

class PaymentService {
  /**
   * Verify a card against accounts file and store a non-sensitive snapshot.
   * Returns a PaymentInfo domain object (reused if already present).
   */
  static async verifyAndStore(userId, { number, name, ccv, exp_month, exp_year }) {
    // NO fetch here — in-process class call
    const { account } = provider.verify({ number, name, ccv, exp_month, exp_year });
    return PaymentInfoRepo.insert({ userId, account });
  }

  /**
   * Charge and record a local Payment row.
   * Requires full card details (validated against accounts file).
   */
  static async chargeAndRecord({
    userId,
    eventId,
    ticketInfoId,
    paymentInfo,              // kept for your schema; not used by provider
    amountCents,
    currency = 'CAD',
    idempotencyKey,
    card                      // { number, name, ccv, exp_month, exp_year }
  }) {
    assertCard(card);

    // 1) Provider purchase (validates against accounts file; idempotent)
    const pay = provider.purchase({
      number: card.number,
      name: card.name,
      ccv: card.ccv,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      amount_cents: amountCents,
      currency,
      idempotency_key: idempotencyKey
    });
    const providerId = pay.payment_id || pay.id || null;

    // 2) Record local Payment within a transaction (unchanged behavior)
    return await knex.transaction(async (trx) => {
      const p = await PaymentRepo.insert(trx, {
        userId,
        eventId,
        ticketInfoId,
        paymentInfoId: paymentInfo?.paymentInfoId || null,
        amountCents,
        currency,
        providerPaymentId: providerId,
        idempotencyKey,
        status: 'approved'
      });
      return p;
    });
  }

  /**
   * Request a refund at the provider and mark local Payment as refunded.
   */
  static async refund(paymentId, amountCents, idempotencyKey) {
    const p = await PaymentRepo.findById(paymentId);
    if (!p) throw new AppError('Payment not found', 404);

    // Declines if the purchase never existed in provider memory
    provider.refund({
      payment_id: p.providerPaymentId || `pay_${paymentId}`,
      amount_cents: amountCents,
      idempotency_key: idempotencyKey
      // or pass { last4 } instead if you want refund-by-last4
    });

    await knex.transaction(async (trx) => {
      await PaymentRepo.updateStatus(trx, paymentId, 'refunded', { refunded_cents: amountCents });
    });
    return true;
  }
}

module.exports = { PaymentService };
