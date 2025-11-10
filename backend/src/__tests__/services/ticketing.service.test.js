const { AppError } = require('../utils/errors');

// Mock DB/knex, expose a setter for rows "ticketinfo" and "events"
jest.mock('../config/db', () => {
  const state = { rows: {}, trx: {} };
  const knex = (table) => ({
    where: () => ({ first: async () => state.rows[table] || null })
  });
  knex.transaction = async (fn) => fn(state.trx);
  knex.fn = { now: () => new Date() };
  return { knex, __setRow: (t, r) => (state.rows[t] = r) };
});

jest.mock('../repositories/TicketInfoRepo', () => ({
  TicketInfoRepo: {
    findById: jest.fn(),
    lockAndLoad: jest.fn(),
    decrementLeft: jest.fn(),
  }
}));

jest.mock('../repositories/EventRepo', () => ({
  EventRepo: {
    findById: jest.fn(),
  }
}));

jest.mock('../repositories/TicketMintRepo', () => ({
  TicketMintRepo: { save: jest.fn() }
}));

// CartService used here is the in-memory shape expected by TicketingService
jest.mock('../services/CartService', () => {
  const cart = {
    items: [],
    add: jest.fn((ti, q) => cart.items.push({ ticketInfo: ti, quantity: q })),
    clear: jest.fn(() => { cart.items = []; })
  };
  return { CartService: { getCart: () => cart } };
});

// External services
jest.mock('../services/PaymentService', () => ({
  PaymentService: {
    verifyAndStore: jest.fn(),
    chargeAndRecord: jest.fn(),
  }
}));
jest.mock('../services/NotificationService', () => ({
  NotificationService: { notify: jest.fn() }
}));

const { __setRow } = require('../config/db');
const { TicketInfoRepo } = require('../repositories/TicketInfoRepo');
const { EventRepo } = require('../repositories/EventRepo');
const { TicketMintRepo } = require('../repositories/TicketMintRepo');
const { PaymentService } = require('../services/PaymentService');
const { NotificationService } = require('../services/NotificationService');
const { TicketingService } = require('../services/TicketingService');

const user = { userId: 5 };

beforeEach(() => {
  // reset the mocked in-memory cart
  const cartMod = require('../services/CartService');
  cartMod.CartService.getCart().items = [];
  cartMod.CartService.getCart().add.mockClear();
  cartMod.CartService.getCart().clear.mockClear();

  jest.clearAllMocks();
});

describe('addToCart', () => {
  test('404 when ticket type not found', async () => {
    TicketInfoRepo.findById.mockResolvedValue(null);
    await expect(TicketingService.addToCart(user, 1, 1)).rejects.toMatchObject({ status: 404 });
  });

  test('rejects when event is inactive', async () => {
    TicketInfoRepo.findById.mockResolvedValue({ infoId: 1, left: 10 });
    __setRow('ticketinfo', { event_id: 7 });
    EventRepo.findById.mockResolvedValue({ isActive: () => false });

    await expect(TicketingService.addToCart(user, 1, 1)).rejects.toMatchObject({ status: 400 });
  });

  test('rejects when not enough stock', async () => {
    TicketInfoRepo.findById.mockResolvedValue({ infoId: 1, left: 1 });
    __setRow('ticketinfo', { event_id: 7 });
    EventRepo.findById.mockResolvedValue({ isActive: () => true });

    await expect(TicketingService.addToCart(user, 1, 2)).rejects.toMatchObject({ status: 400 });
  });

  test('adds to cart when ok', async () => {
    TicketInfoRepo.findById.mockResolvedValue({ infoId: 1, left: 5, ticket_price: 12.5 });
    __setRow('ticketinfo', { event_id: 7 });
    EventRepo.findById.mockResolvedValue({ isActive: () => true });

    const cart = await TicketingService.addToCart(user, 1, 2);
    expect(cart.items.length).toBe(1);
  });
});

describe('checkout', () => {
  const line = { ticketInfo: { infoId: 11 }, quantity: 2 };

  test('rejects when cart is empty', async () => {
    const cart = require('../services/CartService').CartService.getCart(user);
    cart.items = [];
    await expect(TicketingService.checkout(user, { newCard: { number:'4', name:'n', ccv:1, exp_month:1, exp_year:2030 } }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('rejects when no payment method provided', async () => {
    const cart = require('../services/CartService').CartService.getCart(user);
    cart.items = [line];
    await expect(TicketingService.checkout(user, {})).rejects.toMatchObject({ status: 400 });
  });

  test('uses saved payment info owned by user', async () => {
    const cart = require('../services/CartService').CartService.getCart(user);
    cart.items = [line];
    jest.spyOn(require('../repositories/PaymentInfoRepo'), 'PaymentInfoRepo', 'get')
      .mockReturnValue({ findById: jest.fn().mockResolvedValue({ paymentInfoId: 22, owner: { userId: 5 } }) });

    TicketInfoRepo.lockAndLoad.mockResolvedValue({ row: { info_id: 11, tickets_left: 5, ticket_price: 10, event_id: 1 } });
    __setRow('events', { event_id: 1, start_time: new Date(Date.now() - 1000), end_time: new Date(Date.now() + 10000) });
    PaymentService.chargeAndRecord.mockResolvedValue({ paymentId: 55 });
    TicketMintRepo.save.mockResolvedValue({ code: '123456' });

    const out = await TicketingService.checkout(user, { usePaymentInfoId: 22 });
    expect(out.tickets).toHaveLength(2);
    expect(NotificationService.notify).toHaveBeenCalled();
    expect(require('../services/CartService').CartService.getCart().clear).toHaveBeenCalled();
  });

  test('verifies and stores new card when provided', async () => {
    const cart = require('../services/CartService').CartService.getCart(user);
    cart.items = [line];

    // PaymentInfo via new card
    PaymentService.verifyAndStore.mockResolvedValue({ paymentInfoId: 90 });

    TicketInfoRepo.lockAndLoad.mockResolvedValue({ row: { info_id: 11, tickets_left: 2, ticket_price: 1.5, event_id: 9 } });
    __setRow('events', { event_id: 9, start_time: new Date(Date.now() - 10), end_time: new Date(Date.now() + 10) });
    PaymentService.chargeAndRecord.mockResolvedValue({ paymentId: 10 });
    TicketMintRepo.save.mockResolvedValue({ code: '888888' });

    const out = await TicketingService.checkout(user, { newCard: { number:'4', name:'n', ccv:1, exp_month:1, exp_year:2030 } });
    expect(PaymentService.verifyAndStore).toHaveBeenCalled();
    expect(out.tickets).toHaveLength(2);
  });

  test('fails when locked stock insufficient at checkout', async () => {
    const cart = require('../services/CartService').CartService.getCart(user);
    cart.items = [line];

    PaymentService.verifyAndStore.mockResolvedValue({ paymentInfoId: 1 });
    TicketInfoRepo.lockAndLoad.mockResolvedValue({ row: { info_id: 11, tickets_left: 1, ticket_price: 10, event_id: 1 } });
    __setRow('events', { event_id: 1, start_time: new Date(Date.now() - 10), end_time: new Date(Date.now() + 10) });

    await expect(TicketingService.checkout(user, { newCard: { number:'4', name:'n', ccv:1, exp_month:1, exp_year:2030 } }))
      .rejects.toMatchObject({ status: 400 });
    expect(PaymentService.chargeAndRecord).not.toHaveBeenCalled();
  });

  test('fails when event window is no longer active at purchase time', async () => {
    const cart = require('../services/CartService').CartService.getCart(user);
    cart.items = [line];

    PaymentService.verifyAndStore.mockResolvedValue({ paymentInfoId: 1 });
    TicketInfoRepo.lockAndLoad.mockResolvedValue({ row: { info_id: 11, tickets_left: 5, ticket_price: 10, event_id: 1 } });
    // Event in the past
    __setRow('events', { event_id: 1, start_time: new Date(Date.now() - 10000), end_time: new Date(Date.now() - 5000) });

    await expect(TicketingService.checkout(user, { newCard: { number:'4', name:'n', ccv:1, exp_month:1, exp_year:2030 } }))
      .rejects.toMatchObject({ status: 400 });
  });
});
