// src/services/CartService.js
/**
 * DB-backed CartService.
 * Public API stays the same as your original: getCart(user) and clear(user).
 */
const { knex } = require('../config/db');
const { CartRepo } = require('../repositories/CartRepo');
const { AppError } = require('../utils/errors');
const { EventRepo } = require("../repositories/EventRepo")
const { DBCart } = require("../domain/Cart")

class CartService {
    static async addToCart(user, ticketInfoId, quantity) {
    if (ticketInfoId === undefined || ticketInfoId === null){
      throw new AppError('Missing ticket_info_id', 400, { code: 'BAD_INFO_ID' });

    }
    if(quantity === undefined || quantity === null){
      throw new AppError('Missing quantity', 400, { code: 'BAD_QUANTITY' });

    }
    const infoId = Number(ticketInfoId);
    const qty    = Number(quantity);
    if (!Number.isInteger(infoId) || infoId <= 0) {
      throw new AppError('Invalid ticket_info_id', 400, { code: 'MISSING_INFO_ID' });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError('Invalid quantity', 400, { code: 'MISSING_INFO_ID' });
    }

    return knex.transaction(async (trx) => {
      const cartRow = await CartRepo.getOrCreateCartForUser(user.userId, trx);

      // Ensure ticket exists and has stock
      const ti = await trx('ticketinfo').where({ info_id: infoId }).first();
      if (!ti) throw new AppError('Ticket type not found', 404, { code: 'TICKET_NOT_FOUND' });
      if (ti.tickets_left != null && qty > Number(ti.tickets_left)) {
        throw new AppError('Not enough tickets left', 409, {
          code: 'INSUFFICIENT_STOCK',
          left: Number(ti.tickets_left)
        });
      }

      // Add or increment the line
      await CartRepo.addOrIncrementItem(cartRow.cart_id, infoId, qty, trx);

      // Return updated cart
      const items = await CartRepo.getItems(cartRow.cart_id, trx);
      return new DBCart({ owner: user, cartRow, items });
    });
  }
    // ...existing getCart / addToCart / clear...

  /** Set quantity for a cart item. qty=0 removes the item. */
  static async setItemQuantity(user, ticketInfoId, quantity) {
    if (ticketInfoId === undefined || ticketInfoId === null){
      throw new AppError('Missing ticket_info_id', 400, { code: 'MISSING_INFO_ID' });
    }
    if(quantity === undefined || quantity === null){
      throw new AppError('Missing quantity', 400, { code: 'MISSING_INFO_ID' });
    }
    const infoId = Number(ticketInfoId);
    const qty    = Number(quantity);
    if (!Number.isInteger(infoId) || infoId <= 0) {
      throw new AppError('Invalid ticket_info_id', 400, { code: 'BAD_INFO_ID' });
    }
    if (!Number.isInteger(qty) || qty < 0) {
      throw new AppError('Invalid quantity', 400, { code: 'BAD_QUANTITY' });
    }

    return knex.transaction(async (trx) => {
      const cartRow = await CartRepo.getOrCreateCartForUser(user.userId, trx);

      const existing = await CartRepo.getCartItem(cartRow.cart_id, infoId, trx);
      if (!existing) {
        throw new AppError('Cart item not found', 404, { code: 'CART_ITEM_NOT_FOUND' });
      }

      if (qty === 0) {
        await CartRepo.removeItem(cartRow.cart_id, infoId, trx);
      } else {
        const ti = await trx('ticketinfo').where({ info_id: infoId }).first();
        if (!ti) throw new AppError('Ticket type not found', 404, { code: 'TICKET_NOT_FOUND' });
        if (ti.tickets_left != null && qty > Number(ti.tickets_left)) {
          throw new AppError('Not enough tickets left', 409, {
            code: 'INSUFFICIENT_STOCK',
            left: Number(ti.tickets_left)
          });
        }
        await CartRepo.setItemQuantity(cartRow.cart_id, infoId, qty, trx);
      }

      const items = await CartRepo.getItems(cartRow.cart_id, trx);
      return new DBCart({ owner: user, cartRow, items });
    });
  }
  static async getCart(user) {
    return knex.transaction(async (trx) => {
      const cartRow = await CartRepo.getOrCreateCartForUser(user.userId, trx);

      // Just in case: don't let cartRow be undefined/null
      if (!cartRow) {
        throw new AppError('Failed to load cart', 500, { code: 'CART_NOT_FOUND' });
      }

      const items = await CartRepo.getItems(cartRow.cart_id, trx);

      // Filter out items for events that are no longer purchasable
      const filteredItems = [];
      for (const item of items) {
        const event = await EventRepo.findById(item.event_id);
        if (event && typeof event.purchasable === 'function' && event.purchasable()) {
          filteredItems.push(item);
        } else {
          // remove from cart if event is not purchasable anymore
          await CartRepo.removeItem(cartRow.cart_id, item.info_id, trx);
        }
      }

      // You can re-query, or just use filteredItems; using filteredItems is fine:
      const cartItems = filteredItems;

      return new DBCart({
        owner: user,       // DBCart expects { owner, cartRow, items }
        cartRow,
        items: cartItems || [],
      });
    });
  }

  static async clear(user) {
    return knex.transaction(async (trx) => {
      const cartRow = await CartRepo.getOrCreateCartForUser(user.userId, trx);

      if (!cartRow) {
        // nothing to clear; just return an empty cart shape
        return new DBCart({ owner: user, cartRow: null, items: [] });
      }

      await CartRepo.clear(cartRow.cart_id, trx);
      return new DBCart({ owner: user, cartRow, items: [] });
    });
  }
}

module.exports = { CartService };
