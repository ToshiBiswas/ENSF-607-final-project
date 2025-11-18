// backend/src/controllers/tickets.controller.js
const asyncHandler = require('../utils/handler');
const { TicketingService } = require('../services/TicketingService');

class TicketsController {
  // GET /api/tickets  (authenticated user’s tickets)
  static async getMyTickets(req, res) {
    const result = await TicketingService.getMyTickets(req.user, req.query);
    res.json({ message: 'Get tickets: successful', ...result });
  }

  //  GET /api/tickets/:id 
  static async getTicketById(req, res) {
    const id = Number(req.params.id);
    const data = await TicketingService.getTicketById(req.user, id);
    res.json({ message: 'Get ticket: successful', data });
  }

  /** GET /api/events/:eventId/tickets/validate?code=... (auth required) */
  static validateForEvent = asyncHandler(async (req, res) => {
    const eventId = req.params.eventId;
    const code = req.query.code ?? req.body?.code ?? '';
    const result = await TicketingService.validateTicket({
      currentUser: req.user,   // <-- ensure we pass the caller
      eventId,
      code
    });
    res.json(result); // always 200 with {response, ticket}
  });
}

module.exports = {TicketsController};
