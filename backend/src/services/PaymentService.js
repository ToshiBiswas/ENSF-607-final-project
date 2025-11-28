// src/services/PaymentService.js
'use strict';

const { AppError } = require('../utils/errors');
const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');
const { UserCardRepo } = require('../repositories/UserCardRepo');
const { PaymentRepo } = require('../repositories/PaymentRepo');
const { MockPaymentProcessor } = require('./MockPaymentProcessor');
const { knex } = require('../config/db');
/**
 * PaymentService
 *
 * - verifyAndStore: verifies card via MockPaymentProcessor and stores PaymentInfo + user_cards link
 * - chargeAndRecord: writes a payments row (external charge is done elsewhere)
 * - refund: issues a refund via MockPaymentProcessor + writes a refunds row
 */
class PaymentService {
  /**
   * Verify a card against the mock processor and store it for the user.
   * Returns a normalized paymentInfo object.
   */
  static async verifyAndStore(
    userId,
    { number, name, ccv, exp_month, exp_year }
  ) {
    const result = await MockPaymentProcessor.verifyCard({
      number,
      name,
      ccv,
      exp_month,
      exp_year,
    });

    if (!result?.verified) {
      throw new AppError('Invalid card', 400, {
        code: 'INVALID_CARD',
        card: result?.account,
      });
    }

    const account = result.account;

    // 2) Ensure the card exists once globally in paymentinfo
  let cardRow =
    (await PaymentInfoRepo.findByAccountId(account.account_id)) ||
    (await PaymentInfoRepo.insertCard(account));

    // 3) Link user → card; if already linked, throw 409
    const alreadyLinked = await UserCardRepo.isLinked(
      userId,
      cardRow.paymentInfoId
    );
    if (alreadyLinked) {
      return {
        paymentInfoId: cardRow.paymentInfoId,
        accountId: cardRow.accountId,
        name: cardRow.name,
        last4: cardRow.last4,
        expMonth: cardRow.expMonth,
        expYear: cardRow.expYear,
        currency: cardRow.currency,
      };
    }

    await UserCardRepo.link(userId, cardRow.paymentInfoId);

    // 4) Return the stored payment method (same shape as the rest of your codebase)
    return {
      paymentInfoId: cardRow.paymentInfoId,
      accountId: cardRow.accountId,
      name: cardRow.name,
      last4: cardRow.last4,
      expMonth: cardRow.expMonth,
      expYear: cardRow.expYear,
      currency: cardRow.currency,
    };
  }
  /**
   * Attach a single payment method to an event.
   *
   * - Event can only have ONE payment method, so this simply overwrites
   *   the `payment_info_id` on the event.
   * - The payment method must be a card already linked to the organizer.
   *
   * @param {number} organizerId  current user id
   * @param {number} eventId      event to update
   * @param {number} paymentInfoId saved card id from paymentinfo/user_cards
   * @returns {Promise<{ eventId:number, paymentInfoId:number, card:any }>}
   */
  static async setEventPaymentMethod(organizerId, eventId, paymentInfoId) {
    const eid = Number(eventId);
    const pid = Number(paymentInfoId);

    if (!Number.isInteger(eid) || eid <= 0) {
      throw new AppError('Invalid event id', 400, { code: 'BAD_EVENT_ID' });
    }
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new AppError('Invalid paymentInfoId', 400, {
        code: 'BAD_PAYMENT_INFO_ID',
      });
    }

    // 1) Make sure the event exists and belongs to this organizer
    const evt = await EventRepo.findById(eid);
    if (!evt) {
      throw new AppError('Event not found', 404, { code: 'EVENT_NOT_FOUND' });
    }
    if (!evt.organizer || evt.organizer.userId !== organizerId) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }

    // 2) Ensure this payment method is actually linked to this organizer
    const linked = await UserCardRepo.isLinked(organizerId, pid);
    if (!linked) {
      throw new AppError('Payment method not found', 404, {
        code: 'PAYMENT_METHOD_NOT_FOUND',
        userId: organizerId,
        paymentInfoId: pid,
      });
    }

    // 3) Update the event's single payment method slot
    //    (requires EventRepo.updateBase to accept paymentInfoId)
    await EventRepo.updateBase(eid, { paymentInfoId: pid });

    // 4) Optionally return the “linked card” details for UI
    const card = await UserCardRepo.findLinkedCard(organizerId, pid);

    return {
      eventId: eid,
      paymentInfoId: pid,
      card, // { userCardId, userId, paymentInfoId, name, last4, expMonth, expYear }
    };
  }

  /**
   * Record a payment row.
   * External charge (MockPaymentProcessor.purchase) is done by TicketingService.
   *
   * You *can* pass a trx if you ever want to wrap this in a transaction, but in
   * your current flow you call this **before** the ticketing transaction so it
   * runs on the base knex connection.
   */
  static async chargeAndRecord({ userId, paymentInfo, amountCents, trx = null }) {
    if (!paymentInfo) {
      throw new AppError('paymentInfo is required', 400, {
        code: 'PAYMENT_INFO_REQUIRED',
      });
    }

    // Support both shaped objects and raw rows just in case
    const paymentInfoId =
      paymentInfo.paymentInfoId ??
      paymentInfo.payment_info_id ??
      paymentInfo.id;

    if (!paymentInfoId) {
      throw new AppError('paymentInfoId missing', 500, {
        code: 'PAYMENT_INFO_ID_MISSING',
      });
    }

    const rec = await PaymentRepo.insertPayment(
      {
        userId,
        paymentInfoId,
        amountCents,
      },
      trx
    );

    const paymentId = rec?.paymentId ?? rec?.payment_id ?? rec?.id;
    if (!paymentId) {
      throw new AppError('Failed to record payment', 500, {
        code: 'PAYMENT_INSERT_FAILED',
      });
    }

    return { ...rec, paymentId };
  }
    /**
   * returns all the payments made by a userId
   *
   * @param {Number} userId user for payments
   * @returns {Promise<{ paymentId: Number, userId: Number, paymentInfoId: Number, amountCents: Number, currency: string, createdAt: string;}[]>}
   * 
   */
  
  static async listPaymentsForUser(userId) {
    return PaymentRepo.findByUserId(userId);
  }
  /**
   * Refund a single purchase row returned from PaymentRepo.listApprovedForEvent.
   *
   * EventService already checks organizer & refund window. Here we just:
   *  - issue provider refund
   *  - add a refunds row
   */
  static async refund(purchaseRow, trx = null) {
    if (!purchaseRow) {
      throw new AppError('purchase is required', 400, {
        code: 'PURCHASE_REQUIRED',
      });
    }

    const userId = purchaseRow.user_id ?? purchaseRow.userId;
    const paymentId = purchaseRow.payment_id ?? purchaseRow.paymentId;
    const accountId = purchaseRow.account_id ?? purchaseRow.accountId;
    const amountCents = Number(
      purchaseRow.purchase_amount_cents ?? purchaseRow.amount_cents ?? 0
    );

    if (!userId || !paymentId || !accountId || !amountCents) {
      throw new AppError('Incomplete purchase data for refund', 500, {
        code: 'REFUND_DATA_INCOMPLETE',
      });
    }

    // Talk to the mock provider
    await MockPaymentProcessor.refund({
      account_id: accountId,
      amount_cents: amountCents,
    });

    // Record the refund locally (pass transaction if provided)
    await PaymentRepo.refund(userId, paymentId, amountCents, trx);

    return true;
  }
    /**
   * Delete a stored payment method for this user.
   *
   * - Always removes the row from user_cards (the link).
   * - Optionally deletes the underlying paymentinfo row if:
   *     - No other users are linked to it, AND
   *     - It is not referenced by any payments.
   */
  static async deletePaymentMethod(userId, paymentInfoId) {
    const pid = Number(paymentInfoId);
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new AppError('Invalid paymentInfoId', 400, {
        code: 'BAD_PAYMENT_INFO_ID',
      });
    }

    await knex.transaction(async (trx) => {
      // 1) Make sure this user actually has this card linked
      if (!UserCardRepo.isLinked(userId,paymentInfoId)) {
        throw new AppError('Payment method not found', 404, {
          code: 'PAYMENT_METHOD_NOT_FOUND',
          userId,
          paymentInfoId: pid,
        });
      }

      // 2) Drop the link for this user
      UserCardRepo.unlink(userId,paymentInfoId)

      // 3) If no other users are linked, and no payments reference this card,
      //    we can safely delete the paymentinfo row too.
      const otherLink = await trx('user_cards')
        .where({ payment_info_id: pid })
        .first();

      if (!otherLink) {
        const usedInPayments = await trx('payments')
          .where({ payment_info_id: pid })
          .first();
        const usedInEvents = await trx('events')
          .where({payment_info_id: pid})
          .first()
        if (!(usedInPayments || usedInEvents)) {
          await trx('paymentinfo')
            .where({ payment_info_id: pid })
            .del();
        }
      }
    });

    return { deleted: true };
  }

}

module.exports = { PaymentService };
 