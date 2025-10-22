/**
 * CartService
 * In-memory cart map: userId -> Cart instance
 * Swap to a CartRepo (DB-backed) if you need persistence across restarts.
 */
const { Cart } = require('../domain/Cart');

const carts = new Map(); // Map<number, Cart>

class CartService {
  /** Get or initialize a cart for the current user */
  static getCart(user) {
    let cart = carts.get(user.userId);
    if (!cart) {
      cart = new Cart({ owner: user, items: [] });
      carts.set(user.userId, cart);
    }
    return cart;
  }

  /** Clear and return the emptied cart */
  static clear(user) {
    const c = this.getCart(user);
    c.clear();
    return c;
  }
}

module.exports = { CartService };
