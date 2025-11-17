// The DB-backed CartService in this repo uses ../db and ../repos/CartRepo
jest.mock('../../db', () => {
  const trx = {};
  return {
    transaction: async (fn) => fn(trx)
  };
});
jest.mock('../../repos/CartRepo', () => ({
  CartRepo: {
    getOrCreateCartForUser: jest.fn(),
    getItems: jest.fn(),
    clear: jest.fn(),
  }
}));

const { CartRepo } = require('../../repos/CartRepo');
const { CartService } = require('../../services/CartService');

describe('CartService (DB)', () => {
  test('getCart maps items and computes totalCents', async () => {
    CartRepo.getOrCreateCartForUser.mockResolvedValue({ cart_id: 9, user_id: 5 });
    CartRepo.getItems.mockResolvedValue([
      { cart_item_id: 1, info_id: 11, quantity: 2, unit_price_cents: 1500, ticket_name: 'GA', event_id: 7 },
      { cart_item_id: 2, info_id: 12, quantity: 1, unit_price_cents: 2500, ticket_name: 'VIP', event_id: 7 }
    ]);

    const cart = await CartService.getCart({ userId: 5 });
    expect(cart.owner.userId).toBe(5);
    expect(cart.items).toHaveLength(2);
    expect(cart.totalCents()).toBe(1500*2 + 2500);
    expect(cart.toJSON()).toEqual({ owner: { userId: 5 }, items: cart.items });
  });

  test('clear empties items', async () => {
    CartRepo.getOrCreateCartForUser.mockResolvedValue({ cart_id: 9, user_id: 5 });
    const cart = await CartService.clear({ userId: 5 });
    expect(CartRepo.clear).toHaveBeenCalledWith(9, expect.any(Object));
    expect(cart.items).toEqual([]);
  });
});
