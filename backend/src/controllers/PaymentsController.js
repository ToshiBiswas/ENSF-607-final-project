/**
 * PaymentsController
 * Helper endpoints: verify a new card, issue a refund (admin/organizer flows).
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

  /** POST /api/payments/refund  body: { payment_id, amount_cents } */
  static refund = asyncHandler(async (req, res) => {
    const { payment_id, amount_cents } = req.body;
    const ok = await PaymentService.refund(Number(payment_id), Number(amount_cents), `refund-${payment_id}-${Date.now()}`);
    res.json({ refunded: ok });
  });
}

module.exports = { PaymentsController };
