// src/repos/CartRepo.js
const db = require('../config/db'); // adjust if needed

class CartRepo {
  static async getOrCreateCartForUser(userId, trx = db) {
    let cart = await trx('carts').where({ user_id: userId }).first();
    if (!cart) {
      await trx('carts').insert({ user_id: userId });
      cart = await trx('carts').where({ user_id: userId }).first();
    }
    return cart; // { cart_id, user_id, created_at }
  }

  static async getItems(cartId, trx = db) {
    // Joins ticketinfo for unit price; falls back to `price` if `price_cents` not present
    return trx('cart_items as ci')
      .join('ticketinfo as ti', 'ti.info_id', 'ci.info_id')
      .select(
        'ci.cart_item_id',
        'ci.info_id',
        'ci.quantity',
        trx.raw('COALESCE(ti.price_cents, ti.price, 0) as unit_price_cents'),
        'ti.name as ticket_name',
        'ti.event_id'
      )
      .where('ci.cart_id', cartId)
      .orderBy('ci.cart_item_id', 'asc');
  }

  static async clear(cartId, trx = db) {
    await trx('cart_items').where({ cart_id: cartId }).del();
  }
}

module.exports = { CartRepo };
