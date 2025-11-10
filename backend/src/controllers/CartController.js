// src/controllers/CartController.js
/**
 * CartController
 * Add/view/clear items and perform checkout.
 */
const asyncHandler = require('../utils/handler');
const { CartService } = require('../services/CartService');
const { TicketingService } = require('../services/TicketingService');

class CartController {
  /** POST /api/cart/items  body: { ticket_info_id, quantity } */
  static add = asyncHandler(async (req, res) => {
    const { ticket_info_id, quantity } = req.body;
    const cart = await TicketingService.addToCart(
      { userId: req.user.userId },
      Number(ticket_info_id),
      Number(quantity)
    );
    res.status(201).json({ cart });
  });

  /** GET /api/cart */
  static view = asyncHandler(async (req, res) => {
    const cart = await CartService.getCart({ userId: req.user.userId });
    res.json({ cart, total_cents: cart.totalCents() });
  });

  /** DELETE /api/cart  (clear) */
  static clear = asyncHandler(async (req, res) => {
    const cart = await CartService.clear({ userId: req.user.userId });
    res.json({ cart });
  });

  /**
   * POST /api/cart/checkout
   * body: { usePaymentInfoId?: number, newCard?: {number,name,ccv,exp_month,exp_year} }
   */
  static checkout = asyncHandler(async (req, res) => {
    const result = await TicketingService.checkout({ userId: req.user.userId }, req.body);
    res.json(result);
  });
}

module.exports = { CartController };
