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
const { MockPaymentProcessor } = require('./MockPaymentProcessor');
const {TicketMintRepo} = require('../repositories/TicketMintRepo')

// env override else default
const ACCOUNTS_JSON_PATH = process.env.MOCK_ACCOUNTS_PATH ||
  path.resolve(__dirname, '../mock/accounts.json');

// load & verify helpers (kept same semantics

class PaymentService {
  
  /** POST /api/payments/verify-card (unchanged body) */
  static async verifyAndStore(userId, { number, name, ccv, exp_month, exp_year }) {
    // 1) Verify against approved list
    const account = await MockPaymentProcessor.verifyCard({
      number,
      name,
      ccv: ccv,
      exp_month,
      exp_year
    })
//   console.log(account)
    if(!account.verified){
        throw new AppError('Invalid card', 400, {
          code: 'INVALID_CARD',
          card: account.account
      });

    }
    // 2) Ensure the card exists once globally
    const cardRow = (await PaymentInfoRepo.findByAccountId(account.account.account_id))
      ?? (await PaymentInfoRepo.insertCard(account.account));

    // 3) Link user → card; if already linked, throw 409
//    console.log(cardRow)
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
    paymentInfo,              // can be null if you charge by raw card; see your flow\
    amountCents,
  }) {
///    console.log(paymentInfo)
 //   console.log(ccv)
//    console.log(amountCent)
    

    // ⬇️ No transactions. Just insert.
    const rec = await PaymentRepo.insertPayment({
      userId,
      paymentInfoId: paymentInfo.payment_info_id,
      amountCents,
    });

    // Normalize/guarantee paymentId (idempotent fallback by key)
    let paymentId = rec?.paymentId ?? rec?.payment_id ?? rec?.id;
    if (!paymentId) {
      throw new AppError('Failed to record payment', 500, { code: 'PAYMENT_INSERT_FAILED' });
    }
    return { ...rec, paymentId };
  }

  static async refund(purchase) {
    const ticket =TicketMintRepo.findById(ticket_id);
    if (!ticket) throw new AppError('ticket not found', 404);
    if (ticket.user_id != organizer_id) throw new AppError('FORBIDDEN', 400)
    const p = await PaymentRepo.getTicketPurchases(ticket.ticket_id);
    MockPaymentProcessor.refund({
      account_id: p.accountId,
      amountCents :amountCents
    });

    // No transactions; just mark refunded
    await PaymentRepo.refund(ticket.user_id,ticket.payment_id, amountCents);
    return true;
  }
}

module.exports = { PaymentService };
