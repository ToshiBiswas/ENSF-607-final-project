
const setup = require('./test-setup');
const { SUT_BASE, mockKnex, qb, expectAppError, beforeEachReset } = setup;

const { EventService } = require(`${SUT_BASE}/services/EventService`);
const { PaymentService } = require(`${SUT_BASE}/services/PaymentService`);

describe('● Events: create, update, delete', () => {
  beforeEach(beforeEachReset);

  const organizerId = 42;

  test('createEvent → category attach + ticketInfos upsert', async () => {
    const evt = await EventService.createEvent(organizerId, {
      title: 'Gig', description: 'Desc', location: 'Hall',
      startTime: new Date(Date.now() - 3600e3).toISOString(),
      endTime: new Date(Date.now() + 3600e3).toISOString(),
      categories: ['music', 'vip'],
      ticketInfos: [{ name: 'GA', price: 50, total: 100 }]
    });
    expect(evt).toEqual(expect.objectContaining({ eventId: 555 }));
  });

  test('updateEvent → forbidden when organizer mismatches', async () => {
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => ({ eventId: 555, organizer: { userId: 999 }, title: 't', description: 'd', location: 'l', startTime: new Date(), endTime: new Date() }));
    await expectAppError(EventService.updateEvent(organizerId, 555, { title: 'New' }), 403, /Forbidden/);
  });

  test('updateEvent → 404 when event not found', async () => {
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => null);
    await expectAppError(EventService.updateEvent(organizerId, 999, { title: 'New' }), 404, /Event not found/);
  });

  test('updateEvent → increase-only ticket policy enforced', async () => {
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => ({ eventId: 555, organizer: { userId: organizerId }, title: 't', description: 'd', location: 'l', startTime: new Date(), endTime: new Date() }));
    await expectAppError(EventService.updateEvent(organizerId, 555, { ticketInfosIncreaseOnly: [{ infoId: 77, quantityDelta: -1 }] }), 400, /Cannot decrease total tickets/);
  });

  test('updateEvent → success updates fields', async () => {
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => ({ eventId: 555, organizer: { userId: organizerId }, title: 't', description: 'd', location: 'l', startTime: new Date(), endTime: new Date() }));
    mockKnex._tables.set('events', qb()); // allow update()
    const out = await EventService.updateEvent(organizerId, 555, { title: 'New Title', ticketInfosIncreaseOnly: [{ infoId: 77, quantityDelta: 10 }] });
    expect(out).toEqual(expect.objectContaining({ eventId: 555 }));
  });

  test('deleteEvent → refunds approved payments and notifies', async () => {
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => ({ eventId: 555, title: 'Gig', organizer: { userId: organizerId } }));
    const refundSpy = jest.spyOn(PaymentService, 'refund').mockResolvedValue(true);

    const out = await EventService.deleteEvent(organizerId, 555, PaymentService);
    expect(refundSpy).toHaveBeenCalledTimes(2);
    expect(out).toEqual({ deleted: true });
  });

  test('deleteEvent → 404 when missing', async () => {
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => null);
    await expectAppError(EventService.deleteEvent(organizerId, 999, PaymentService), 404, /Event not found/);
  });

  test('deleteEvent → 403 when organizer mismatches', async () => {
    const { EventRepo } = require(`${SUT_BASE}/repositories/EventRepo`);
    EventRepo.findById = jest.fn(async () => ({ eventId: 555, organizer: { userId: 999 } }));
    await expectAppError(EventService.deleteEvent(organizerId, 555, PaymentService), 403, /Forbidden/);
  });
});
