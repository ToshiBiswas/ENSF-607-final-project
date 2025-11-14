/**
 * EventsController
 * Organizer and public endpoints for Events.
 */
const asyncHandler = require('../utils/handler');
const { EventService } = require('../services/EventService');
const { EventRepo } = require('../repositories/EventRepo');

class EventsController {
  /**
   * GET /api/events?category=Music
   * Return a list of events with the given category value.
   */
  static listByCategory = asyncHandler(async (req, res) => {
    const { category } = req.query;
    const events = await EventService.listByCategory(category);
    res.json({ events });
  });

  /**
   * POST /api/events  (auth: organizer)
   * Create a new event with categories and ticket types.
   */
  static create = asyncHandler(async (req, res) => {
    const organizerId = req.user.userId;
    const payload = req.body; // {title, description, location, startTime, endTime, ticketType, categories[], ticketInfos[]}
    const evt = await EventService.createEvent(organizerId, payload);
    res.status(201).json({ event: evt });
  });
  /**
   * GET /api/user/events
   * Returns all events created by the authenticated organizer (no query).
   */
  static listMine = asyncHandler(async (req, res) => {
    const organizerId = req.user.userId;
    console.log(organizerId)
    const events = await EventService.listMine(organizerId);
    res.json({ events });
  });

  /**
   * GET /api/events/:id
   * Return a single event by id.
   */
  static get = asyncHandler(async (req, res) => {
    const evt = await EventRepo.findById(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: 'Not found' });
    res.json({ event: evt });
  });

  /**
   * PATCH /api/events/:id  (auth: organizer)
   * Allows updating basic fields and increasing ticket totals (no decreases).
   */
  static update = asyncHandler(async (req, res) => {
    const organizerId = req.user.userId;
    const evt = await EventService.updateEvent(organizerId, Number(req.params.id), req.body);
    res.json({ event: evt });
  });

  /**
   * DELETE /api/events/:id  (auth: organizer)
   * Refunds all purchasers, emits notifications, then removes event.
   */
  static remove = asyncHandler(async (req, res) => {
    const organizerId = req.user.userId;
    const { PaymentService } = require('../services/PaymentService');
    const result = await EventService.deleteEvent(organizerId, Number(req.params.id));
    res.json(result);
  });

  /**
   * GET /api/events/:id/tickets
   * List ticket types (price/quantity/left) for an event.
   */
  static ticketTypes = asyncHandler(async (req, res) => {
    const evt = await EventRepo.findById(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: 'Not found' });
    res.json({ ticketTypes: evt.tickets });
  });
}

module.exports = { EventsController };
