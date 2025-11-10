// src/services/CartService.js
/**
 * DB-backed CartService.
 * Public API stays the same as your original: getCart(user) and clear(user).
 */
const db = require('../config/db'); // adjust if needed
const { CartRepo } = require('../repositories/CartRepo');

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
  /** Get or initialize a cart for the current user (now async due to DB) */
  static async getCart(user) {
    return db.transaction(async (trx) => {
      const cartRow = await CartRepo.getOrCreateCartForUser(user.userId, trx);
      const items = await CartRepo.getItems(cartRow.cart_id, trx);
      return new DBCart({ owner: user, cartRow, items });
    });
  }

  /** Clear and return the emptied cart (async) */
  static async clear(user) {
    return db.transaction(async (trx) => {
      const cartRow = await CartRepo.getOrCreateCartForUser(user.userId, trx);
      await CartRepo.clear(cartRow.cart_id, trx);
      return new DBCart({ owner: user, cartRow, items: [] });
    });
  }
}

module.exports = { CartService };
