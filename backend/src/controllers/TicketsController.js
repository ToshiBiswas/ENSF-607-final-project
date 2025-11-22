// backend/src/controllers/tickets.controller.js
// backend/src/controllers/TicketsController.js
const TicketService = require('../services/TicketingService');
const asyncHandler = require('../utils/handler');
const { TicketingService } = require('../services/TicketingService');

class TicketsController {
  // GET /api/tickets?page=...  (authenticated user’s tickets)
  static async getMyTickets(req, res) {
    const result = await TicketingService.getMyTickets(req.user, req.query);
  // POST /api/tickets
  static createTicket = asyncHandler(async (req, res) => {
    const result = await TicketService.createTicket(req.user, req.body);
    res.status(201).json(result);
  });

  // GET /api/tickets  (authenticated user’s tickets)
  static getMyTickets = asyncHandler(async (req, res) => {
    const result = await TicketService.getMyTickets(req.user, req.query);
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
    console.log(req.query,'\n',req.body);
    const code = req.query.code ?? req.body?.code ?? '';
    console.log(code)
    const result = await TicketingService.validateTicket({
      currentUser: req.user,   // <-- ensure we pass the caller
    const result = await TicketService.validateTicket({
      currentUser: req.user,
      eventId,
      code
    });
    res.json(result);
  });
}

module.exports = {TicketsController};
