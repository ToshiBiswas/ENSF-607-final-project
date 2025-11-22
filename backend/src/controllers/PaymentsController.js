/**
 * PaymentsController
 * Helper endpoints: verify a new card, delete an existing card, .
 */
const asyncHandler = require('../utils/handler');
const { PaymentService } = require('../services/PaymentService');

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
}

module.exports = { PaymentsController };
