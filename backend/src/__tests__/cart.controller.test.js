
const setup = require('./controllers-test-setup');
const { SUT_BASE, CartService, TicketingService, makeReq, makeRes, beforeEachReset } = setup;
const { CartController } = require(`${SUT_BASE}/controllers/CartController`);

describe('● Controllers: CartController', () => {
  beforeEach(beforeEachReset);

  test('add → 201 and returns cart', async () => {
    TicketingService.addToCart.mockResolvedValueOnce({ items: [{ infoId: 77, quantity: 2 }] });
    const req = makeReq({ userId: 1, body: { ticket_info_id: 77, quantity: 2 } });
    const res = makeRes();
    await CartController.add(req, res, jest.fn());
    expect(TicketingService.addToCart).toHaveBeenCalledWith({ userId: 1 }, 77, 2);
    expect(res.statusCode).toBe(201);
    expect(res.body.cart.items[0].infoId).toBe(77);
  });

  test('view → returns cart and total_cents', async () => {
    const cartObj = { items: [], totalCents: () => 1234 };
    CartService.getCart.mockReturnValueOnce(cartObj);
    const req = makeReq({ userId: 9 });
    const res = makeRes();
    await CartController.view(req, res, jest.fn());
    expect(CartService.getCart).toHaveBeenCalledWith({ userId: 9 });
    expect(res.body.total_cents).toBe(1234);
  });

  test('clear → returns cleared cart', async () => {
    CartService.clear.mockReturnValueOnce({ items: [] });
    const req = makeReq({ userId: 9 });
    const res = makeRes();
    await CartController.clear(req, res, jest.fn());
    expect(CartService.clear).toHaveBeenCalledWith({ userId: 9 });
    expect(res.body.cart.items).toHaveLength(0);
  });

  test('checkout → delegates to TicketingService', async () => {
    TicketingService.checkout.mockResolvedValueOnce({ tickets: [{ ticketId: 1 }] });
    const req = makeReq({ userId: 9, body: { newCard: { number: '4111111111111111', name: 'T', ccv: 123, exp_month: 12, exp_year: 2030 } } });
    const res = makeRes();
    await CartController.checkout(req, res, jest.fn());
    expect(TicketingService.checkout).toHaveBeenCalledWith({ userId: 9 }, expect.objectContaining({ newCard: expect.any(Object) }));
    expect(res.body.tickets[0].ticketId).toBe(1);
  });
});
