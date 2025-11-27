/**
 * PaymentsController
 * Helper endpoints: verify a new card, delete an existing card, .
 */
const asyncHandler = require('../utils/handler');
const { PaymentService } = require('../services/PaymentService');
const { PaymentRepo } = require('../repositories/PaymentRepo');
const { AppError } = require('../utils/errors');

class PaymentsController {
  /** POST /api/payments/verify-card  body: { number, name, ccv, exp_month, exp_year } */
  static verifyCard = asyncHandler(async (req, res) => {
    const { number, name, ccv, exp_month, exp_year } = req.body;
    const pinfo = await PaymentService.verifyAndStore(req.user.userId, { number, name, ccv, exp_month, exp_year });
    res.status(201).json({ paymentMethod: pinfo });
  });
  // in your controller
  static deletePaymentMethod = asyncHandler(async (req, res) => {
    const { paymentInfoId } = req.params;
    await PaymentService.deletePaymentMethod(req.user.userId, paymentInfoId);
    res.status(204).send();
  });
  static listMyPayments = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.user_id || req.user.id;
    const payments = await PaymentService.listPaymentsForUser(userId);

    res.json({ payments });
  });
  /** POST /api/payments/refund  body: { ticketId } */
  static refund = asyncHandler(async (req, res) => {
    const { ticketId } = req.body;
    const userId = req.user.userId;

    if (!ticketId) {
      throw new AppError('ticketId is required', 400, { code: 'TICKET_ID_REQUIRED' });
    }

    //first verify the ticket exists and belongs to user (if ticket doesn't exist, it's already been refunded)
    const { knex } = require('../config/db');
    const ticketToCheck = await knex('tickets')
      .where({ ticket_id: ticketId, user_id: userId })
      .first();
    
    if (!ticketToCheck) {
      throw new AppError('Ticket not found or has already been refunded', 404, { code: 'TICKET_NOT_FOUND' });
    }

    //get purchase data for this ticket
    const purchaseRow = await PaymentRepo.getPurchaseForRefund(ticketId);
    if (!purchaseRow) {
      throw new AppError('Ticket purchase not found. This ticket may not have been purchased through the checkout system.', 404, { code: 'PURCHASE_NOT_FOUND' });
    }

    //verify ticket belongs to user (double check)
    if (purchaseRow.user_id !== userId) {
      throw new AppError('Forbidden', 403, { code: 'FORBIDDEN' });
    }

    //validate required fields before processing
    if (!purchaseRow.account_id) {
      //try to get account_id from paymentinfo if payment_info_id exists
      if (purchaseRow.payment_info_id) {
        const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');
        const paymentInfo = await PaymentInfoRepo.findById(purchaseRow.payment_info_id);
        if (paymentInfo && paymentInfo.accountId) {
          purchaseRow.account_id = paymentInfo.accountId;
        }
      }
      
      //if still no account_id, we can't process refund
      if (!purchaseRow.account_id) {
        throw new AppError('Payment account information (account_id) not found. This payment may have been made with a payment method that is no longer available. Cannot process refund.', 400, { code: 'MISSING_ACCOUNT_ID' });
      }
    }
    if (!purchaseRow.purchase_amount_cents || purchaseRow.purchase_amount_cents <= 0) {
      throw new AppError('Invalid purchase amount. Cannot process refund.', 400, { code: 'INVALID_AMOUNT' });
    }

    //process refund and restore stock in a transaction
    const { TicketInfoRepo } = require('../repositories/TicketInfoRepo');
    
    await knex.transaction(async (trx) => {
      //process refund - refund only this specific ticket's purchase amount
      await PaymentService.refund({
        ...purchaseRow,
        purchase_amount_cents: purchaseRow.purchase_amount_cents, //use the specific purchase amount, not the full payment
      }, trx);

      //increment ticket stock back (restore availability)
      if (purchaseRow.info_id) {
        await TicketInfoRepo.incrementLeft(trx, purchaseRow.info_id, 1);
      }

      //delete only this specific ticket (we already verified it exists above)
      const deletedCount = await trx('tickets')
        .where({ ticket_id: ticketId, user_id: userId })
        .del();
      
      if (deletedCount === 0) {
        throw new AppError('Failed to delete ticket', 500, { code: 'DELETE_FAILED' });
      }
    });

    res.json({ success: true, message: 'Refund processed successfully' });
  });
}

module.exports = { PaymentsController };
