// src/services/MockPaymentProcessor.js
'use strict';

const { AppError } = require('../utils/errors');
const { PaymentAccountRepo } = require('../repositories/PaymentAccountRepo');

const normCur = (c) => String(c || 'CAD').toUpperCase();

function requireFields(obj, fields) {
  for (const f of fields) {
    if (obj[f] == null || String(obj[f]).trim() === '') {
      throw new AppError(`Missing field: ${f}`, 400, { code: 'MISSING_FIELDS', field: f });
    }
  }
}

class MockPaymentProcessor {
  /**
   * VERIFY
   * Input: { number, name, ccv, exp_month, exp_year }
   * If the card exists in payment_accounts, return { verified:true, account:{...} } with an account_id
   * Else { verified:false }
   */
  static async verifyCard(card) {
    requireFields(card, ['number', 'name', 'ccv', 'exp_month', 'exp_year']);

    const acc = await PaymentAccountRepo.findByFullCard(card);
    if (!acc) return { verified: false, account: null };

    return { verified: true, account: PaymentAccountRepo.toPublic(acc) };
  }

  /**
   * PURCHASE
   * Input: { account_id, ccv, amount_cents, [currency] }
   * - Looks up account by account_id
   * - CCV must match
   * - Currency must match (if provided)
   * - Balance must be sufficient
   * Returns { status:'approved'|'declined', ... }
   */
  static async purchase(input) {
    console.log(input);
    requireFields(input, ['accountId', 'ccv', 'amountCents']);
    const amount = Number(input.amountCents);
    console.log(amount)
    if (amount <= 0) {
      throw new AppError('Invalid Ammount', 400, { code: 'BAD_AMOUNT' });
    }

    const acc = await PaymentAccountRepo.findById(input.account_id);
    if (!acc) return { status: 'declined', reason: 'ACCOUNT_NOT_FOUND' };

    if (String(acc.ccv) !== String(input.ccv)) {
      return { status: 'declined', reason: 'BAD_CCV' };
    }

    const accCur = normCur(acc.currency || 'CAD');
    const reqCur = normCur(input.currency || accCur);
    if (accCur !== reqCur) {
      return { status: 'declined', reason: 'CURRENCY_MISMATCH' };
    }

    const bal = Number(acc.balance_cents);
    if (bal < amount) {
      return { status: 'declined', reason: 'INSUFFICIENT_FUNDS' };
    }

    const updated = await PaymentAccountRepo.adjustBalanceCents(acc.id, -amount);
    return {
      status: 'approved',
      payment_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      currency: accCur,
      purchase: Number(amount),
    };
  }

  /**
   * REFUND
   * Input: { account_id, amount_cents, [currency] }
   * - Looks up account by account_id
   * - No CCV required
   * - Currency must match (if provided)
   * - Adds funds back
   * Returns { refunded:true|false, ... }
   */
  static async refund(input) {
    requireFields(input, ['account_id', 'amount_cents']);

    const amount = Number(input.amount_cents);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError('Invalid amount_cents', 400, { code: 'BAD_AMOUNT' });
    }

    const acc = await PaymentAccountRepo.findById(input.account_id);
    if (!acc) return { refunded: false, reason: 'ACCOUNT_NOT_FOUND' };

    const accCur = normCur(acc.currency || 'CAD');
    const reqCur = normCur(input.currency || accCur);
    if (accCur !== reqCur) {
      return { refunded: false, reason: 'CURRENCY_MISMATCH' };
    }

    const updated = await PaymentAccountRepo.adjustBalanceCents(acc.id, amount);
    return {
      refunded: true,
      refund_id: `rf_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      currency: accCur,
      balance_cents: Number(updated.balance_cents),
      account: PaymentAccountRepo.toPublic(updated)
    };
  }
}

module.exports = { MockPaymentProcessor };
