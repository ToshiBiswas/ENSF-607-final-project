// backend/src/controllers/tickets.controller.js
const TicketService = require('../services/TicketService');

class TicketsController {
  // GET /api/tickets  (authenticated user’s tickets)
  static async getMyTickets(req, res) {
    const result = await TicketService.getMyTickets(req.user, req.query);
    // `result` can contain { page, pageSize, total, data } or just an array
    res.json({ message: 'Get tickets: successful', ...result });
  }

  //  GET /api/tickets/:id 
  static async getTicketById(req, res) {
    const id = Number(req.params.id);
    const data = await TicketService.getTicketById(req.user, id);
    res.json({ message: 'Get ticket: successful', data });
  }

  //  POST /api/tickets  
  static async createTicket(req, res) {
    const data = await TicketService.createTicket(req.user, req.body);
    res.status(201).json({ message: 'Ticket created', data });
  }

  // PUT /api/tickets/:id  
  static async updateTicket(req, res) {
    const id = Number(req.params.id);
    await TicketService.updateTicket(req.user, id, req.body);
    res.json({ message: 'Ticket updated' });
  }

  //  DELETE /api/tickets/:id  
  static async deleteTicket(req, res) {
    const id = Number(req.params.id);
    const result = await TicketService.deleteTicket(req.user, id);
    res.json({ message: 'Ticket deleted', ...result });
  }
}

module.exports = TicketsController;
