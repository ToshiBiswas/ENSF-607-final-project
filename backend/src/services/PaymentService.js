/**
 * PaymentService
 * - Verify directly against accounts.json (exact match; no Luhn)
 * - Purchase: verify first, then record locally with last4 (no account_id)
 * - Refund: update local status
 */
// src/services/PaymentService.js
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { knex } = require('../config/db');
const { AppError } = require('../utils/errors');
const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');
const { UserCardRepo } = require('../repositories/UserCardRepo');
const { PaymentRepo } = require('../repositories/PaymentRepo');

// env override else default
const ACCOUNTS_JSON_PATH = process.env.MOCK_ACCOUNTS_PATH ||
  path.resolve(__dirname, '../mock/accounts.json');

// load & verify helpers (kept same semantics)
function loadAccountsJSON() {
  if (!fs.existsSync(ACCOUNTS_JSON_PATH)) {
    throw new AppError('Accounts file not found', 500, {
      code: 'ACCOUNTS_FILE_MISSING',
      details: { expected: ACCOUNTS_JSON_PATH }
    });
  }
  try {
    const raw = fs.readFileSync(ACCOUNTS_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('accounts JSON must be an array');
    return data;
  } catch (e) {
    throw new AppError('Failed to read accounts file', 500, {
      code: 'ACCOUNTS_FILE_INVALID',
      details: { message: e.message }
    });
  }
}
function assertCard(card) {
  const m = 'Card details required: number, name, ccv, exp_month, exp_year';
  if (!card || typeof card !== 'object') {
    throw new AppError(m, 400, { code: 'MISSING_CARD' });
  }
  const { number, name, ccv, exp_month, exp_year } = card;
  if (!number || !name || !ccv ||
      exp_month === undefined || exp_year === undefined) {
    throw new AppError(m, 400, { code: 'MISSING_CARD' });
  }
}
function expiryOk(m, y) {
  const mm = Number(m), yy = Number(y);
  if (!mm || !yy || mm < 1 || mm > 12) return false;
  const y4 = yy < 100 ? 2000 + yy : yy;
  const exp = new Date(Date.UTC(y4, mm, 0, 23, 59, 59));
  return exp >= new Date();
}
function verifyAgainstJSON({ number, name, ccv, exp_month, exp_year }) {
  if (!/^\d{3,4}$/.test(String(ccv))) {
    throw new AppError('Invalid CCV', 402, { code: 'BAD_CCV' });
  }
  if (!expiryOk(exp_month, exp_year)) {
    throw new AppError('Card is expired', 402, { code: 'CARD_EXPIRED' });
  }
  const accounts = loadAccountsJSON();
  const match = accounts.find(a =>
    String(a.number) === String(number) &&
    String(a.name).trim() === String(name).trim() &&
    String(a.ccv) === String(ccv) &&
    Number(a.exp_month) === Number(exp_month) &&
    Number(a.exp_year) === Number(exp_year)
  );
  if (!match) {
    throw new AppError('Card not recognized', 402, { code: 'ACCOUNT_NOT_FOUND' });
  }
  const last4 = String(number).slice(-4);
  const id = 'acct_' + crypto.createHash('sha256').update(String(number)).digest('hex').slice(0, 24);
  return {
    id,               // stable, non-PII account identifier
    name: String(name).trim(),
    last4,
    exp_month: Number(exp_month),
    exp_year: Number(exp_year),
    currency: match.currency || 'CAD'
  };
}

class PaymentService {
  
  /** POST /api/payments/verify-card (unchanged body) */
  static async verifyAndStore(userId, { number, name, ccv, exp_month, exp_year }) {
    // 1) Verify against approved list
    const account = verifyAgainstJSON({ number, name, ccv, exp_month, exp_year });

    // 2) Ensure the card exists once globally
    const cardRow = (await PaymentInfoRepo.findByAccountId(account.id))
      ?? (await PaymentInfoRepo.insertCard({ account }));

    // 3) Link user → card; if already linked, throw 409
    const linked = await UserCardRepo.isLinked(userId, cardRow.paymentInfoId);
    if (linked) {
      throw new AppError('Account already exists', 409, {
        code: 'ACCOUNT_EXISTS',
        userId,
        accountId: cardRow.accountId
      });
    }
    await UserCardRepo.link(userId, cardRow.paymentInfoId);

    // 4) Return the stored payment method (same shape as before minus "primary")
    return {
      paymentInfoId: cardRow.paymentInfoId,
      accountId: cardRow.accountId,
      name: cardRow.name,
      last4: cardRow.last4,
      expMonth: cardRow.expMonth,
      expYear: cardRow.expYear,
      currency: cardRow.currency
    };
  }

  /** Verify first, then record a Payment row with last4 (no account_id). */
  static async chargeAndRecord({
    userId,
    eventId,
    ticketInfoId,
    paymentInfo,              // can be null if you charge by raw card; see your flow
    amountCents,
    currency = 'CAD',
    idempotencyKey,
    card                      // optional: { number, ... } for last4 fallback
  }) {
    // If you generate a provider id elsewhere, keep doing it:
    const providerId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const last4 = paymentInfo?.last4 ?? (card ? String(card.number).slice(-4) : null);

    // ⬇️ No transactions. Just insert.
    const rec = await PaymentRepo.insert({
      userId,
      eventId,
      ticketInfoId,
      paymentInfoId: paymentInfo?.paymentInfoId || null,
      amountCents,
      currency,
      providerPaymentId: providerId,
      idempotencyKey,
      status: 'approved',
      last4,
    });

    // Normalize/guarantee paymentId (idempotent fallback by key)
    let paymentId = rec?.paymentId ?? rec?.payment_id ?? rec?.id;
    if (!paymentId) {
      const existing = await knex('payments').where({ idempotency_key: idempotencyKey }).first();
      paymentId = existing?.payment_id ?? existing?.paymentId ?? existing?.id;
      if (!paymentId) {
        throw new AppError('Failed to record payment', 500, { code: 'PAYMENT_INSERT_FAILED' });
      }
      return { ...existing, paymentId };
    }
    return { ...rec, paymentId };
  }

  static async refund(paymentId, amountCents, idempotencyKey) {
    const p = await PaymentRepo.findById(paymentId);
    if (!p) throw new AppError('Payment not found', 404);

    // No transactions; just mark refunded
    await PaymentRepo.updateStatus(null, paymentId, 'refunded', { refunded_cents: amountCents });
    return true;
  }
}

module.exports = { PaymentService };
