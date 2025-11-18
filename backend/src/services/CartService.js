// src/services/CartService.js
/**
 * DB-backed CartService.
 * Public API stays the same as your original: getCart(user) and clear(user).
 */
const { knex } = require('../config/db');
const { CartRepo } = require('../repositories/CartRepo');
const { AppError } = require('../utils/errors');
const { EventRepo } = require("../repositories/EventRepo")
class DBCart {
  constructor({ owner, cartRow, items }) {
    this.owner = owner;        // { userId }
    this._cart = cartRow;      // { cart_id, user_id, created_at }
    this.items = items.map((i) => ({
      cart_item_id: i.cart_item_id,
      info_id: i.info_id,
      quantity: i.quantity,
      unit_price_cents: Number(i.unit_price_cents || 0),
      ticket_name: i.ticket_name,
      event_id: i.event_id,
    }));
  }

  totalCents() {
    return this.items.reduce(
      (acc, it) => acc + Number(it.unit_price_cents || 0) * Number(it.quantity || 0),
      0
    );
  }

  toJSON() {
    // keep serialized shape stable
    return { owner: this.owner, items: this.items };
  }
}

class CartService {
    static async addToCart(user, ticketInfoId, quantity) {
    const infoId = Number(ticketInfoId);
    const qty    = Number(quantity);
    if (!Number.isInteger(infoId) || infoId <= 0) {
      throw new AppError('Invalid ticket_info_id', 400, { code: 'BAD_INFO_ID' });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError('Invalid quantity', 400, { code: 'BAD_QUANTITY' });
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
      const items   = await CartRepo.getItems(cartRow.cart_id, trx);
      let itemsNew = [];
      for(i in items){
        const event = EventRepo.findById(i.event_id)
        if(event.purchasable()){
          itemsNew.push(i)
        }else{
          CartRepo.removeItem(cartRow.cart_id, i.info_id,trx)
        }
      }
      return new DBCart({ owner: user, cartRow, items });
    });
  }

  static async clear(user) {
    return knex.transaction(async (trx) => {
      const cartRow = await CartRepo.getOrCreateCartForUser(user.userId, trx);
      await CartRepo.clear(cartRow.cart_id, trx);
      return new DBCart({ owner: user, cartRow, items: [] });
    });
  }
}

module.exports = { CartService };
