// backend/src/controllers/TicketsController.js
const asyncHandler = require('../utils/handler');
const { TicketingService } = require('../services/TicketingService');

class TicketsController {
  // POST /api/tickets
  static createTicket = asyncHandler(async (req, res) => {
    const result = await TicketingService.createTicket(req.user, req.body);
    res.status(201).json(result);
  });

  // GET /api/tickets  (authenticated user's tickets)
  static getMyTickets = asyncHandler(async (req, res) => {
    const result = await TicketingService.getMyTickets(req.user, req.query);
    res.json({ message: 'Get tickets: successful', ...result });
  });

  // GET /api/tickets/:id
  static getTicketById = asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = await TicketingService.getTicketById(req.user, id);
    res.json({ message: 'Get ticket: successful', data });
  });

  /** GET /api/events/:eventId/tickets/validate?code=... (auth required) */
  static validateForEvent = asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;
    const code = req.query.code ?? req.body?.code ?? '';
    const result = await TicketingService.validateTicket({
      currentUser: req.user,
      eventId,
      code,
    });
    res.json(result);
  });
}

module.exports = { TicketsController };
