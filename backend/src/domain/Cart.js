/**
 * Domain Model: Cart + CartItem
 * Keeps a list of TicketInfo x quantity to be purchased.
 * NOTE: The default implementation uses in-memory carts per user.
 *       See services/CartService.js for persistence alternatives.
 */
class CartItem {
  constructor({ ticketInfo, quantity }) {
    this.ticketInfo = ticketInfo; // TicketInfo instance
    this.quantity = quantity;
  }
}

class Cart {
  constructor({ owner, items = [] }) {
    this.owner = owner; // User
    this.items = items; // CartItem[]
  }

  /** Add or increase a cart line for a given TicketInfo */
  add(ticketInfo, qty) {
    const existing = this.items.find(i => i.ticketInfo.infoId === ticketInfo.infoId);
    if (existing) existing.quantity += qty;
    else this.items.push(new CartItem({ ticketInfo, quantity: qty }));
  }

  /** Remove all items */
  clear() {
    this.items = [];
  }

  /** Total price in cents (integer) */
  totalCents() {
    return this.items.reduce((sum, it) => sum + Math.round(Number(it.ticketInfo.price) * 100) * it.quantity, 0);
  }
}

module.exports = { Cart, CartItem };
