const { AppError } = require('../../utils/errors');

// Define mocks inside factories to avoid hoisting issues
jest.mock('../../repositories/EventRepo', () => {
  const mock = {
    getCategoriesByValues: jest.fn(),
    existsTitleCI: jest.fn(),
    existsTitleCIExcept: jest.fn(),
    insert: jest.fn(),
    findById: jest.fn(),
    attachCategories: jest.fn(),
    upsertTicketInfos: jest.fn(),
    listByCategoryValuePaginated: jest.fn(),
    listAllPaginated: jest.fn(),
    toDomain: jest.fn(),
    deleteEvent: jest.fn(),
    getExpiredEvents: jest.fn(),
    listByOrganizer: jest.fn(),
    updateBase: jest.fn(),
    replaceCategories: jest.fn(),
    updateTicketsIncreaseOnly: jest.fn(),
    findByCategoryValue: jest.fn(),
  };
  return { EventRepo: mock };
});

jest.mock('../../repositories/PaymentRepo', () => {
  const mock = {
    listApprovedForEvent: jest.fn(),
    insertPayment: jest.fn(),
  };
  return { PaymentRepo: mock };
});

jest.mock('../../repositories/UserCardRepo', () => {
  const mock = { isLinked: jest.fn() };
  return { UserCardRepo: mock };
});

jest.mock('../../services/NotificationService', () => {
  const mock = { queue: jest.fn(), create: jest.fn(), notify: jest.fn() };
  return { NotificationService: mock };
});

jest.mock('../../services/PaymentService', () => {
  const mock = { verifyAndStore: jest.fn(), refund: jest.fn() };
  return { PaymentService: mock };
});

const { EventService } = require('../../services/EventService');
const { EventRepo: mockEventRepo } = require('../../repositories/EventRepo');
const { PaymentRepo: mockPaymentRepo } = require('../../repositories/PaymentRepo');
const { UserCardRepo: mockUserCardRepo } = require('../../repositories/UserCardRepo');
const { PaymentService: mockPaymentService } = require('../../services/PaymentService');

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listByCategory', () => {
    it('throws when category missing', async () => {
      await expect(EventService.listByCategory('')).rejects.toBeInstanceOf(AppError);
      expect(mockEventRepo.getCategoriesByValues).not.toHaveBeenCalled();
    });

    it('throws when category not found', async () => {
      mockEventRepo.getCategoriesByValues.mockResolvedValue([]);
      await expect(EventService.listByCategory('Music')).rejects.toMatchObject({
        status: 404,
      });
    });

    it('returns events when category exists', async () => {
      const events = [{ id: 1 }];
      mockEventRepo.getCategoriesByValues.mockResolvedValue([{ category_id: 1, category_value: 'Music' }]);
      mockEventRepo.findByCategoryValue.mockReturnValue(events);
      const result = await EventService.listByCategory('Music');
      expect(result).toBe(events);
      expect(mockEventRepo.findByCategoryValue).toHaveBeenCalledWith('Music');
    });
  });

  describe('createEvent', () => {
    const basePayload = {
      title: 'New Show',
      description: 'desc',
      location: 'Calgary',
      startTime: '2024-01-01',
      endTime: '2024-01-02',
      categories: [],
      ticketInfos: [],
    };

    it('rejects duplicate titles', async () => {
      mockEventRepo.existsTitleCI.mockResolvedValue(true);
      await expect(EventService.createEvent(1, { ...basePayload, payment: { existingCard: 2 } }))
        .rejects.toMatchObject({ status: 409 });
    });

    it('requires a payment method', async () => {
      mockEventRepo.existsTitleCI.mockResolvedValue(false);
      await expect(EventService.createEvent(1, basePayload)).rejects.toThrow('payment method is required');
    });

    it('accepts existing card when linked', async () => {
      mockEventRepo.existsTitleCI.mockResolvedValue(false);
      mockUserCardRepo.isLinked.mockResolvedValue(true);
      mockEventRepo.insert.mockResolvedValue({ eventId: 10 });
      mockEventRepo.findById.mockResolvedValue({ eventId: 10, organizer: { name: 'Org' } });

      const evt = await EventService.createEvent(7, { ...basePayload, payment: { existingCard: 22 } });

      expect(mockUserCardRepo.isLinked).toHaveBeenCalledWith(7, 22);
      expect(mockEventRepo.insert).toHaveBeenCalled();
      expect(evt).toMatchObject({ eventId: 10 });
    });

    it('creates new card when provided', async () => {
      mockEventRepo.existsTitleCI.mockResolvedValue(false);
      mockUserCardRepo.isLinked.mockResolvedValue(false);
      mockPaymentService.verifyAndStore.mockResolvedValue({ paymentInfoId: 5 });
      mockEventRepo.insert.mockResolvedValue({ eventId: 11 });
      mockEventRepo.findById.mockResolvedValue({ eventId: 11, organizer: { name: 'Org' } });

      await EventService.createEvent(3, { ...basePayload, payment: { newCard: { number: '1' } } });
      expect(mockPaymentService.verifyAndStore).toHaveBeenCalledWith(3, { number: '1' });
    });
  });

  describe('updateEvent', () => {
    const existingEvent = {
      eventId: 9,
      organizer: { userId: 2 },
      title: 'Old',
      description: 'd',
      location: 'l',
      startTime: 's',
      endTime: 'e',
    };

    it('throws when event missing', async () => {
      mockEventRepo.findById.mockResolvedValue(null);
      await expect(EventService.updateEvent(2, 9, {})).rejects.toMatchObject({ status: 404 });
    });

    it('throws when forbidden', async () => {
      mockEventRepo.findById.mockResolvedValue(existingEvent);
      await expect(EventService.updateEvent(1, 9, {})).rejects.toMatchObject({ status: 403 });
    });

    it('rejects duplicate title', async () => {
      mockEventRepo.findById.mockResolvedValue(existingEvent);
      mockEventRepo.existsTitleCIExcept.mockResolvedValue(true);
      await expect(EventService.updateEvent(2, 9, { title: 'New' })).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('deleteEvent', () => {
    it('rejects bad id', async () => {
      await expect(EventService.deleteEvent(1, 'abc')).rejects.toBeInstanceOf(AppError);
    });

    it('rejects when event not purchasable', async () => {
      mockEventRepo.findById.mockResolvedValue({
        eventId: 1,
        organizer: { userId: 5 },
        purchasable: () => false,
      });
      await expect(EventService.deleteEvent(5, 1)).rejects.toThrow('Event Refund Date Passed');
    });
  });

  describe('settleAndDeleteExpiredEvents', () => {
    it('returns empty when no expired', async () => {
      mockEventRepo.getExpiredEvents.mockReturnValue([]);
      const res = await EventService.settleAndDeleteExpiredEvents();
      expect(res).toEqual({ count: 0, payouts: [] });
    });

    it('settles one event and records payout', async () => {
      mockEventRepo.getExpiredEvents.mockReturnValue([
        { eventId: 7, organizerId: 9, pinfoId: 4, title: 'Done' },
      ]);
      mockPaymentRepo.listApprovedForEvent.mockResolvedValue([
        { purchase_amount_cents: 2000, user_id: 9, payment_id: 2, purchase_id: 3, account_id: 10 },
      ]);
      mockPaymentRepo.insertPayment.mockResolvedValue({ paymentId: 99 });
      mockEventRepo.deleteEvent.mockResolvedValue();

      const res = await EventService.settleAndDeleteExpiredEvents();
      expect(res.count).toBe(1);
      expect(mockEventRepo.deleteEvent).toHaveBeenCalledWith(7);
    });
  });
});
