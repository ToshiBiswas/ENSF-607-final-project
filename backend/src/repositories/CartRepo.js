// src/repos/CartRepo.js
const { knex } = require('../config/db');

class CartRepo {
  static async getOrCreateCartForUser(userId, trx = knex) {
    let cart = await trx('carts').where({ user_id: userId }).first();
    if (!cart) {
      await trx('carts').insert({ user_id: userId });
      cart = await trx('carts').where({ user_id: userId }).first();
    }
    return cart;
  }

  static async addOrIncrementItem(cartId, infoId, qty, trx = knex) {
    const existing = await trx('cart_items').where({ cart_id: cartId, info_id: infoId }).first();
    if (existing) {
      await trx('cart_items')
        .where({ cart_item_id: existing.cart_item_id })
        .update({ quantity: existing.quantity + qty });
      return existing.cart_item_id;
    }
    const [id] = await trx('cart_items').insert({ cart_id: cartId, info_id: infoId, quantity: qty });
    return id;
  }

  // NEW: fetch a specific line
  static async getCartItem(cartId, infoId, trx = knex) {
    return trx('cart_items').where({ cart_id: cartId, info_id: infoId }).first();
  }

  // NEW: set quantity (not increment)
  static async setItemQuantity(cartId, infoId, qty, trx = knex) {
    return trx('cart_items').where({ cart_id: cartId, info_id: infoId }).update({ quantity: qty });
  }

  // NEW: remove a line
  static async removeItem(cartId, infoId, trx = knex) {
    return trx('cart_items').where({ cart_id: cartId, info_id: infoId }).del();
  }

  static async getItems(cartId, trx = knex) {
    return trx('cart_items as ci')
      .join('ticketinfo as ti', 'ti.info_id', 'ci.info_id')
      .select(
        'ci.cart_item_id',
        'ci.info_id',
        'ci.quantity',
        trx.raw('ROUND(ti.ticket_price * 100) AS unit_price_cents'),
        'ti.ticket_type AS ticket_name',
        'ti.event_id'
      )
      .where('ci.cart_id', cartId)
      .orderBy('ci.cart_item_id', 'asc');
  }

  static async clear(cartId, trx = knex) {
    await trx('cart_items').where({ cart_id: cartId }).del();
  }
}

module.exports = { CartRepo };


