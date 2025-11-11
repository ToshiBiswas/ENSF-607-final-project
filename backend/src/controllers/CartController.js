// src/controllers/CartController.js
/**
 * CartController
 * Add/view/clear items and perform checkout.
 */
const asyncHandler = require('../utils/handler');
const { CartService } = require('../services/CartService');
const { TicketingService } = require('../services/TicketingService');
const { AppError } = require('../utils/errors');

class CartController {
  /** POST /api/cart/items  body: { ticket_info_id, quantity } */
  static add = asyncHandler(async (req, res) => {
    const infoId = Number(req.body.ticket_info_id);
    const qty    = Number(req.body.quantity);

    if (!Number.isInteger(infoId) || infoId <= 0) {
      console.log(infoId)
      throw new AppError('Invalid ticket_info_id', 400, { code: 'BAD_INFO_ID' });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError('Invalid quantity', 400, { code: 'BAD_QUANTITY' });
    }

    const cart = await TicketingService.addToCart(
      { userId: req.user.userId },
      infoId,
      qty
    );
    res.status(201).json({ cart });
  });
  /** PATCH /api/cart/items/:ticketInfoId   body: { quantity } */
  static patchItem = asyncHandler(async (req, res) => {
    const infoId = Number(req.params.ticketInfoId);
    const qty    = Number(req.body.quantity);

    if (!Number.isInteger(infoId) || infoId <= 0) {
      throw new AppError('Invalid ticket_info_id', 400, { code: 'BAD_INFO_ID' });
    }
    if (!Number.isInteger(qty) || qty < 0) {
      throw new AppError('Invalid quantity', 400, { code: 'BAD_QUANTITY' });
    }

    const cart = await CartService.setItemQuantity(
      { userId: req.user.userId },
      infoId,
      qty
    );

    res.status(200).json({ cart, total_cents: cart.totalCents ? cart.totalCents() : undefined });
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
