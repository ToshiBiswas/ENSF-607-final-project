/**
 * Domain Model: Cart + CartItem
 * Keeps a list of TicketInfo x quantity to be purchased.
 * NOTE: The default implementation uses in-memory carts per user.
 *       See services/CartService.js for persistence alternatives.
 */
class DBCart {
  constructor({ owner, cartRow, items = [] }) {
    this.owner = owner;        // { userId }
    this._cart = cartRow;      // { cart_id, user_id, created_at }

    const safeItems = Array.isArray(items) ? items : [];

    this.items = safeItems.map((i) => ({
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

module.exports = { DBCart };
