jest.mock('../../services/EventService', () => {
  const mock = {
    listByCategory: jest.fn(),
    createEvent: jest.fn(),
    listMine: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    listByCategoryPaginized: jest.fn(),
  };
  return { EventService: mock };
});

jest.mock('../../repositories/EventRepo', () => {
  const mock = { findById: jest.fn() };
  return { EventRepo: mock };
});

const { EventsController } = require('../../controllers/EventsController');
const { EventService: mockEventService } = require('../../services/EventService');
const { EventRepo: mockEventRepo } = require('../../repositories/EventRepo');

describe('EventsController', () => {
  const res = () => {
    const obj = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    return obj;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listByCategory returns events', async () => {
    mockEventService.listByCategory.mockResolvedValue([{ organizer: { name: 'Org' } }]);
    const response = res();
    await EventsController.listByCategory({ query: { category: 'Music' } }, response);
    expect(response.body.events[0].organizer).toBe('Org');
  });

  it('get returns 404 when missing', async () => {
    mockEventRepo.findById.mockResolvedValue(null);
    const response = res();
    await EventsController.get({ params: { id: 1 } }, response);
    expect(response.statusCode).toBe(404);
  });

  it('create returns 201', async () => {
    mockEventService.createEvent.mockResolvedValue({ organizer: { name: 'Org' } });
    const response = res();
    await EventsController.create({ user: { userId: 5 }, body: {} }, response);
    expect(response.statusCode).toBe(201);
    expect(response.body.event.organizer).toBe('Org');
  });

  it('listMine uses user id', async () => {
    mockEventService.listMine.mockResolvedValue([{ organizer: { name: 'Org' } }]);
    const response = res();
    await EventsController.listMine({ user: { userId: 8 } }, response);
    expect(mockEventService.listMine).toHaveBeenCalledWith(8);
    expect(response.body.events[0].organizer).toBe('Org');
  });

  it('update returns event', async () => {
    mockEventService.updateEvent.mockResolvedValue({ id: 1 });
    const response = res();
    await EventsController.update({ user: { userId: 1 }, params: { id: 2 }, body: {} }, response);
    expect(response.body.event).toEqual({ id: 1 });
  });

  it('remove calls deleteEvent', async () => {
    mockEventService.deleteEvent.mockResolvedValue({ deleted: true });
    const response = res();
    await EventsController.remove({ user: { userId: 1 }, params: { id: 2 } }, response);
    expect(response.body).toEqual({ deleted: true });
  });

  it('listByCategoryPaginized shapes organizer name', async () => {
    mockEventService.listByCategoryPaginized.mockResolvedValue({
      page: 1,
      pageSize: 10,
      total: 1,
      events: [{ organizer: { name: 'Org' } }],
    });
    const response = res();
    await EventsController.listByCategoryPaginized({ query: { category: 'Music' } }, response);
    expect(response.body.events[0].organizer).toBe('Org');
    expect(response.body.total).toBe(1);
  });

  it('ticketTypes returns ticket infos', async () => {
    mockEventRepo.findById.mockResolvedValue({ tickets: [{ id: 1 }] });
    const response = res();
    await EventsController.ticketTypes({ params: { id: 9 } }, response);
    expect(response.body).toEqual({ ticketTypes: [{ id: 1 }] });
  });
});
