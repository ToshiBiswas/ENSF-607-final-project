
const setup = require('./controllers-test-setup');
const { SUT_BASE, EventService, EventRepo, PaymentService, makeReq, makeRes, beforeEachReset } = setup;
const { EventsController } = require(`${SUT_BASE}/controllers/EventsController`);

describe('● Controllers: EventsController', () => {
  beforeEach(beforeEachReset);

  test('listByCategory → calls service and returns events', async () => {
    EventService.listByCategory.mockResolvedValueOnce([{ eventId: 1 }]);
    const req = makeReq({ query: { category: 'Music' } });
    const res = makeRes();
    await EventsController.listByCategory(req, res, jest.fn());
    expect(EventService.listByCategory).toHaveBeenCalledWith('Music');
    expect(res.body.events[0].eventId).toBe(1);
  });

  test('create → status 201 and body.event', async () => {
    EventService.createEvent.mockResolvedValueOnce({ eventId: 10 });
    const req = makeReq({ userId: 42, body: { title: 'Gig' } });
    const res = makeRes();
    await EventsController.create(req, res, jest.fn());
    expect(EventService.createEvent).toHaveBeenCalledWith(42, { title: 'Gig' });
    expect(res.statusCode).toBe(201);
    expect(res.body.event.eventId).toBe(10);
  });

  test('get → 200 when found', async () => {
    EventRepo.findById.mockResolvedValueOnce({ eventId: 3 });
    const req = makeReq({ params: { id: '3' } });
    const res = makeRes();
    await EventsController.get(req, res, jest.fn());
    expect(EventRepo.findById).toHaveBeenCalledWith(3);
    expect(res.body.event.eventId).toBe(3);
  });

  test('get → 404 when missing', async () => {
    EventRepo.findById.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: '999' } });
    const res = makeRes();
    await EventsController.get(req, res, jest.fn());
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Not found/);
  });

  test('update → calls service with organizerId and id', async () => {
    EventService.updateEvent.mockResolvedValueOnce({ eventId: 7, title: 'N' });
    const req = makeReq({ userId: 1, params: { id: '7' }, body: { title: 'N' } });
    const res = makeRes();
    await EventsController.update(req, res, jest.fn());
    expect(EventService.updateEvent).toHaveBeenCalledWith(1, 7, { title: 'N' });
    expect(res.body.event.eventId).toBe(7);
  });

  test('remove → passes PaymentService to deleteEvent', async () => {
    EventService.deleteEvent.mockResolvedValueOnce({ deleted: true });
    const req = makeReq({ userId: 42, params: { id: '555' } });
    const res = makeRes();
    await EventsController.remove(req, res, jest.fn());
    expect(EventService.deleteEvent).toHaveBeenCalledWith(42, 555, PaymentService);
    expect(res.body.deleted).toBe(true);
  });

  test('ticketTypes → 200 when event exists', async () => {
    EventRepo.findById.mockResolvedValueOnce({ eventId: 4, tickets: [{ infoId: 77 }] });
    const req = makeReq({ params: { id: '4' } });
    const res = makeRes();
    await EventsController.ticketTypes(req, res, jest.fn());
    expect(res.body.ticketTypes[0].infoId).toBe(77);
  });

  test('ticketTypes → 404 when event missing', async () => {
    EventRepo.findById.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: '404' } });
    const res = makeRes();
    await EventsController.ticketTypes(req, res, jest.fn());
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/Not found/);
  });
});
