jest.mock('../../services/TicketingService', () => {
  const mock = {
    createTicket: jest.fn(),
    getMyTickets: jest.fn(),
    getTicketById: jest.fn(),
    validateTicket: jest.fn(),
  };
  return {
    TicketingService: mock,
    __esModule: true,
    default: mock,
  };
});

const { TicketsController } = require('../../controllers/TicketsController');
const { TicketingService: mockTicketingService } = require('../../services/TicketingService');

describe('TicketsController', () => {
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

  it('createTicket returns 201', async () => {
    mockTicketingService.createTicket.mockResolvedValue({ ok: true });
    const response = res();
    await TicketsController.createTicket({ user: { userId: 1 }, body: {} }, response);
    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual({ ok: true });
  });

  it('getMyTickets returns data', async () => {
    mockTicketingService.getMyTickets.mockResolvedValue({ data: [1] });
    const response = res();
    await TicketsController.getMyTickets({ user: { userId: 1 }, query: {} }, response);
    expect(response.body.data).toEqual([1]);
  });

  it('getTicketById returns ticket', async () => {
    mockTicketingService.getTicketById.mockResolvedValue({ data: { id: 2 } });
    const response = res();
    await TicketsController.getTicketById({ user: { userId: 1 }, params: { id: 2 } }, response);
    expect(mockTicketingService.getTicketById).toHaveBeenCalledWith({ userId: 1 }, 2);
    expect(response.body).toEqual({ message: 'Get ticket: successful', data: { data: { id: 2 } } });
  });

  it('validateForEvent returns result', async () => {
    mockTicketingService.validateTicket.mockResolvedValue({ response: 'valid' });
    const response = res();
    await TicketsController.validateForEvent({ user: { userId: 1 }, params: { eventId: 3 }, query: { code: 'abc' }, body: {} }, response);
    expect(mockTicketingService.validateTicket).toHaveBeenCalledWith({
      currentUser: { userId: 1 },
      eventId: 3,
      code: 'abc',
    });
    expect(response.body).toEqual({ response: 'valid' });
  });
});
