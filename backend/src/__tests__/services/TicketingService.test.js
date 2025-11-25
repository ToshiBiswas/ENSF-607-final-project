const { AppError } = require('../../utils/errors');

jest.mock('../../config/db', () => ({
  knex: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn(),
    update: jest.fn(),
    del: jest.fn(),
    join: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    raw: jest.fn(),
    transaction: jest.fn((cb) => cb({})),
    fn: { now: jest.fn() },
  })),
}));

jest.mock('../../repositories/TicketInfoRepo', () => {
  const mock = {
    findById: jest.fn(),
    lockAndLoad: jest.fn(),
    decrementLeft: jest.fn(),
  };
  return { TicketInfoRepo: mock };
});

jest.mock('../../repositories/EventRepo', () => {
  const mock = { findById: jest.fn() };
  return { EventRepo: mock };
});

jest.mock('../../repositories/TicketMintRepo', () => {
  const mock = {
    isCodeTaken: jest.fn(),
    findByCodeForEvent: jest.fn(),
    findOwnedTicket: jest.fn(),
    listForUser: jest.fn(),
  };
  return { TicketMintRepo: mock };
});

jest.mock('../../repositories/PaymentRepo', () => {
  const mock = { insertPurchase: jest.fn() };
  return { PaymentRepo: mock };
});

jest.mock('../../services/CartService', () => {
  const mock = { addToCart: jest.fn(), getCart: jest.fn(), clear: jest.fn() };
  return { CartService: mock };
});

jest.mock('../../services/NotificationService', () => {
  const mock = { queue: jest.fn() };
  return { NotificationService: mock };
});

jest.mock('../../services/MockPaymentProcessor', () => ({
  MockPaymentProcessor: { purchase: jest.fn() },
}));

jest.mock('../../services/PaymentService', () => ({
  PaymentService: {
    chargeAndRecord: jest.fn(),
    verifyAndStore: jest.fn(),
  },
}));

const { TicketingService } = require('../../services/TicketingService');
const { TicketInfoRepo: mockTicketInfoRepo } = require('../../repositories/TicketInfoRepo');
const { EventRepo: mockEventRepo } = require('../../repositories/EventRepo');
const { TicketMintRepo: mockTicketMintRepo } = require('../../repositories/TicketMintRepo');
const { CartService: mockCartService } = require('../../services/CartService');
const { knex } = require('../../config/db');

describe('TicketingService', () => {
  let mockKnex;
  beforeEach(() => {
    jest.clearAllMocks();
    mockKnex = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn(),
      update: jest.fn(),
      del: jest.fn(),
      join: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      raw: jest.fn(),
      transaction: jest.fn((cb) => cb({})),
      fn: { now: jest.fn() },
    };
    knex.mockReturnValue(mockKnex);
  });

  describe('validateTicket', () => {
    it('returns invalid for bad inputs', async () => {
      const res = await TicketingService.validateTicket({ currentUser: { userId: 1 }, eventId: 'abc', code: '123' });
      expect(res.response).toBe('invalid');
    });

    it('throws when user is not organizer', async () => {
      mockEventRepo.findById.mockResolvedValue({ organizer: { userId: 2 } });
      await expect(
        TicketingService.validateTicket({ currentUser: { userId: 1 }, eventId: 10, code: '123456789012345' })
      ).rejects.toMatchObject({ status: 403 });
    });

    it('returns valid when organizer owns event and ticket exists', async () => {
      const ticket = { id: 1 };
      mockEventRepo.findById.mockResolvedValue({ organizer: { userId: 1 } });
      mockTicketMintRepo.findByCodeForEvent.mockResolvedValue(ticket);
      const res = await TicketingService.validateTicket({
        currentUser: { userId: 1 },
        eventId: 5,
        code: '123456789012345',
      });
      expect(res).toEqual({ response: 'valid', ticket });
    });
  });

  describe('addToCart', () => {
    it('rejects bad ids', async () => {
      await expect(TicketingService.addToCart({}, 'x', 1)).rejects.toMatchObject({ status: 400 });
      await expect(TicketingService.addToCart({}, 1, 'y')).rejects.toMatchObject({ status: 400 });
    });

    it('rejects when ticket info missing', async () => {
      mockTicketInfoRepo.findById.mockResolvedValue(null);
      await expect(TicketingService.addToCart({ userId: 1 }, 2, 1)).rejects.toThrow('Ticket type not found');
    });

    it('rejects when event not purchasable', async () => {
      mockTicketInfoRepo.findById.mockResolvedValue({ info_id: 2 });
      mockKnex.where.mockReturnThis();
      mockKnex.first.mockResolvedValue({ event_id: 3, tickets_left: 10 });
      mockEventRepo.findById.mockResolvedValue({ purchasable: () => false });
      await expect(TicketingService.addToCart({ userId: 1 }, 2, 1)).rejects.toThrow('Event not available');
    });

    it('rejects when stock insufficient', async () => {
      mockTicketInfoRepo.findById.mockResolvedValue({ info_id: 2 });
      mockKnex.where.mockReturnThis();
      mockKnex.first.mockResolvedValue({ event_id: 3, tickets_left: 0 });
      mockEventRepo.findById.mockResolvedValue({ purchasable: () => true });
      await expect(TicketingService.addToCart({ userId: 1 }, 2, 2)).rejects.toThrow('Not enough tickets left');
    });

    it('adds to cart when valid', async () => {
      mockTicketInfoRepo.findById.mockResolvedValue({ info_id: 2 });
      mockKnex.where.mockReturnThis();
      mockKnex.first.mockResolvedValue({ event_id: 3, tickets_left: 5 });
      mockEventRepo.findById.mockResolvedValue({ purchasable: () => true });
      mockCartService.addToCart.mockResolvedValue('ok');
      const res = await TicketingService.addToCart({ userId: 1 }, 2, 1);
      expect(res).toBe('ok');
      expect(mockCartService.addToCart).toHaveBeenCalled();
    });
  });
});
