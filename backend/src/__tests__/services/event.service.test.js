const { AppError } = require('../../utils/errors');

jest.mock('../../config/db', () => {
  const knex = () => ({});
  knex.fn = { now: () => new Date() };
  return { knex };
});

jest.mock('../../repositories/EventRepo', () => ({
  EventRepo: {
    insert: jest.fn(),
    attachCategories: jest.fn(),
    upsertTicketInfos: jest.fn(),
    findById: jest.fn(),
    findByCategoryValue: jest.fn(),
    updateTicketsIncreaseOnly: jest.fn(),
    deleteEvent: jest.fn(),
  }
}));

jest.mock('../../repositories/CategoryRepo', () => ({
  CategoryRepo: { findOrCreate: jest.fn() }
}));

jest.mock('../../repositories/PaymentRepo', () => ({
  PaymentRepo: { listApprovedForEvent: jest.fn() }
}));

jest.mock('../../services/NotificationService', () => ({
  NotificationService: { notify: jest.fn() }
}));

const { EventRepo } = require('../../repositories/EventRepo');
const { CategoryRepo } = require('../../repositories/CategoryRepo');
const { PaymentRepo } = require('../../repositories/PaymentRepo');
const { NotificationService } = require('../../services/NotificationService');
const { EventService } = require('../../services/EventService');

describe('createEvent', () => {
  test('creates event, attaches categories, inserts ticket infos', async () => {
    EventRepo.insert.mockResolvedValue({ eventId: 1 });
    CategoryRepo.findOrCreate.mockResolvedValueOnce({ categoryId: 10 }).mockResolvedValueOnce({ categoryId: 11 });
    EventRepo.findById.mockResolvedValue({ eventId: 1, title:'T' });

    const out = await EventService.createEvent(99, {
      title:'T', description:'D', location:'L', startTime:new Date(), endTime:new Date(),
      categories: ['music', 'live'], ticketInfos: [{ name:'GA', price:10, total:100 }]
    });

    expect(EventRepo.attachCategories).toHaveBeenCalledWith(1, [10, 11]);
    expect(EventRepo.upsertTicketInfos).toHaveBeenCalled();
    expect(out.eventId).toBe(1);
  });
});

test('listByCategory delegates', async () => {
  EventRepo.findByCategoryValue.mockResolvedValue(['a']);
  const out = await EventService.listByCategory('music');
  expect(out).toEqual(['a']);
});

describe('updateEvent', () => {
  test('404 when event missing', async () => {
    EventRepo.findById.mockResolvedValue(null);
    await expect(EventService.updateEvent(1, 2, {})).rejects.toMatchObject({ status: 404 });
  });

  test('403 when organizer mismatch', async () => {
    EventRepo.findById.mockResolvedValue({ organizer: { userId: 2 } });
    await expect(EventService.updateEvent(1, 2, {})).rejects.toMatchObject({ status: 403 });
  });

  test('rejects negative quantity deltas (increase-only)', async () => {
    EventRepo.findById.mockResolvedValue({ organizer: { userId: 1 }, title:'t', description:'d', location:'l', startTime:new Date(), endTime:new Date() });
    await expect(EventService.updateEvent(1, 2, { ticketInfosIncreaseOnly: [{ infoId: 9, quantityDelta: -1 }] }))
      .rejects.toMatchObject({ status: 400 });
  });

  test('applies updates and increase-only deltas', async () => {
    EventRepo.findById.mockResolvedValue({ organizer: { userId: 1 }, title:'t', description:'d', location:'l', startTime:new Date(), endTime:new Date() });
    EventRepo.findById.mockResolvedValueOnce({ organizer: { userId: 1 }, title:'t', description:'d', location:'l', startTime:new Date(), endTime:new Date() })
                  .mockResolvedValueOnce({ eventId: 2, title:'t2' });

    const out = await EventService.updateEvent(1, 2, { title:'t2', ticketInfosIncreaseOnly: [{ infoId: 9, quantityDelta: 5 }] });
    expect(EventRepo.updateTicketsIncreaseOnly).toHaveBeenCalledWith(2, [{ infoId: 9, quantityDelta: 5 }]);
    expect(out.title).toBe('t2');
  });
});

describe('deleteEvent', () => {
  test('403/404 guards', async () => {
    EventRepo.findById.mockResolvedValue(null);
    await expect(EventService.deleteEvent(1, 1, { refund: jest.fn() })).rejects.toMatchObject({ status: 404 });

    EventRepo.findById.mockResolvedValue({ organizer: { userId: 2 } });
    await expect(EventService.deleteEvent(1, 1, { refund: jest.fn() })).rejects.toMatchObject({ status: 403 });
  });

  test('refunds all approved payments, notifies purchasers & organizer, then deletes', async () => {
    EventRepo.findById.mockResolvedValue({ eventId: 7, title:'My Event', organizer: { userId: 1 } });
    PaymentRepo.listApprovedForEvent.mockResolvedValue([
      { paymentId: 100, amountCents: 500, user: { userId: 9 } },
      { paymentId: 101, amountCents: 600, user: { userId: 10 } },
    ]);

    const paymentSvc = { refund: jest.fn().mockResolvedValue(true) };

    const out = await EventService.deleteEvent(1, 7, paymentSvc);
    expect(paymentSvc.refund).toHaveBeenCalledTimes(2);
    expect(NotificationService.notify).toHaveBeenCalledTimes(3); // 2 buyers + organizer
    expect(EventRepo.deleteEvent).toHaveBeenCalledWith(7);
    expect(out).toEqual({ deleted: true });
  });

  test('continues on refund failure (logs and notifies)', async () => {
    EventRepo.findById.mockResolvedValue({ eventId: 7, title:'T', organizer: { userId: 1 } });
    PaymentRepo.listApprovedForEvent.mockResolvedValue([{ paymentId: 100, amountCents: 500, user: { userId: 9 } }]);
    const paymentSvc = { refund: jest.fn().mockRejectedValue(new Error('boom')) };

    await EventService.deleteEvent(1, 7, paymentSvc);
    expect(NotificationService.notify).toHaveBeenCalled(); // still notify
  });
});
