
const setup = require('./test-setup');
const { SUT_BASE, CartService, mockKnex, qb, expectAppError, beforeEachReset } = setup;

const { TicketingService } = require(`${SUT_BASE}/services/TicketingService`);

describe('● Cart + Ticketing: addToCart & checkout', () => {
  beforeEach(beforeEachReset);

  const user = { userId: 1, email: 'u@test' };

  test('addToCart → ok when event active and stock sufficient', async () => {
    const { TicketInfoRepo } = require(`${SUT_BASE}/repositories/TicketInfoRepo`);
    TicketInfoRepo.findById = jest.fn(async () => ({ infoId: 77, left: 10, price: 50 }));
    mockKnex._tables.set('ticketinfo', (() => {
      const k = qb({ firstRow: { event_id: 555 } });
      k.where = () => k;
      return k;
    })());
    const cart = await TicketingService.addToCart(user, 77, 2);
    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(2);
  });

  test('addToCart → 404 when ticket type absent', async () => {
    const { TicketInfoRepo } = require(`${SUT_BASE}/repositories/TicketInfoRepo`);
    TicketInfoRepo.findById = jest.fn(async () => null);
    await expectAppError(TicketingService.addToCart(user, 999, 1), 404, /Ticket type not found/);
  });

  test('addToCart → 400 when event not active', async () => {
    const { TicketInfoRepo } = require(`${SUT_BASE}/repositories/TicketInfoRepo`);
    TicketInfoRepo.findById = jest.fn(async () => ({ infoId: 77, left: 10, price: 50 }));
    mockKnex._tables.set('ticketinfo', (() => {
      const k = qb({ firstRow: { event_id: 555 } });
      k.where = () => k;
      return k;
    })());
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => ({ isActive: () => false }));
    await expectAppError(TicketingService.addToCart(user, 77, 1), 400, /Event not available/);
  });

  test('addToCart → 400 when insufficient stock', async () => {
    const { TicketInfoRepo } = require(`${SUT_BASE}/repositories/TicketInfoRepo`);
    TicketInfoRepo.findById = jest.fn(async () => ({ infoId: 77, left: 1, price: 50 }));
    mockKnex._tables.set('ticketinfo', (() => {
      const k = qb({ firstRow: { event_id: 555 } });
      k.where = () => k;
      return k;
    })());
    await expectAppError(TicketingService.addToCart(user, 77, 2), 400, /Not enough tickets/);
  });

  test('checkout → 400 when cart empty', async () => {
    CartService.getCart.mockReturnValueOnce({ items: [], clear: jest.fn() });
    await expectAppError(TicketingService.checkout(user, { newCard: { number: '4111111111111111', name: 'Toshi', ccv: 123, exp_month: 12, exp_year: 2030 } }), 400, /Cart is empty/);
  });

  test('checkout → verified new card → mints tickets & clears cart', async () => {
    const c = CartService.getCart(user);
    c.add({ infoId: 77 }, 2);
    mockKnex._tables.set('events', (() => {
      const k = qb({ firstRow: { event_id: 555, start_time: new Date(Date.now() - 1000).toISOString(), end_time: new Date(Date.now() + 1000).toISOString() } });
      k.where = () => k;
      return k;
    })());
    const out = await TicketingService.checkout(user, { newCard: { number: '4111111111111111', name: 'Toshi', ccv: 123, exp_month: 12, exp_year: 2030 } });
    expect(out.tickets).toHaveLength(2);
    expect(CartService.getCart(user).items).toHaveLength(0);
  });

  test('checkout → 400 no payment method provided', async () => {
    const c = CartService.getCart(user);
    c.add({ infoId: 77 }, 1);
    await expectAppError(TicketingService.checkout(user, {}), 400, /No payment method provided/);
  });

  test('checkout → 400 at lock stage when insufficient stock', async () => {
    const c = CartService.getCart(user);
    c.add({ infoId: 77 }, 5);
    const { TicketInfoRepo } = require(`${SUT_BASE}/repositories/TicketInfoRepo`);
    TicketInfoRepo.lockAndLoad = jest.fn(async () => ({ row: { info_id: 77, tickets_left: 3, event_id: 555, ticket_price: 50 } }));
    mockKnex._tables.set('events', (() => {
      const k = qb({ firstRow: { event_id: 555, start_time: new Date(Date.now() - 1000).toISOString(), end_time: new Date(Date.now() + 1000).toISOString() } });
      k.where = () => k;
      return k;
    })());
    await expectAppError(TicketingService.checkout(user, { newCard: { number: '4111111111111111', name: 'Toshi', ccv: 123, exp_month: 12, exp_year: 2030 } }), 400, /Insufficient stock at checkout/);
  });

  test('checkout → boundary: purchase exactly at event start and end → ok', async () => {
    const c = CartService.getCart(user);
    c.add({ infoId: 77 }, 1);
    const now = new Date();
    mockKnex._tables.set('events', (() => {
      const k = qb({ firstRow: { event_id: 555, start_time: now.toISOString(), end_time: now.toISOString() } });
      k.where = () => k;
      return k;
    })());
    const out = await TicketingService.checkout(user, { newCard: { number: '4111111111111111', name: 'Toshi', ccv: 123, exp_month: 12, exp_year: 2030 } });
    expect(out.tickets).toHaveLength(1);
  });
});
