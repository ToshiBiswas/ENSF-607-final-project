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
    let events = await EventService.listByCategory(category);
    for (let i = 0; i < events.length;i++){
      events[i].organizer = events[i].organizer.name;
    }
    res.json({ events });
  });

  /**
   * POST /api/events  (auth: organizer)
   * Create a new event with categories and ticket types.
   */
  static create = asyncHandler(async (req, res) => {
    const organizerId = req.user.userId;
    const payload = req.body; // {title, description, location, startTime, endTime, ticketType, categories[], ticketInfos[]}
    let evt = await EventService.createEvent(organizerId, payload);
    evt.organizer = evt.organizer.name
    res.status(201).json({ event: evt });
  });
  /**
   * GET /api/user/events
   * Returns all events created by the authenticated organizer (no query).
   */
  static listMine = asyncHandler(async (req, res) => {
    const organizerId = req.user.userId;
    if (!organizerId || !Number.isInteger(Number(organizerId))) {
      return res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'Invalid user ID' } });
    }
    
    //query already filters by organizer_id, but double-check in response
    const events = await EventService.listMine(organizerId);
    
    //verify all events belong to this organizer by comparing userId
    const filteredEvents = events.filter(evt => {
      if (!evt.organizer) {
        console.warn(`Event ${evt.eventId} has no organizer, excluding from results`);
        return false;
      }
      const evtOrganizerId = evt.organizer.userId || evt.organizer.user_id;
      const matches = Number(evtOrganizerId) === Number(organizerId);
      if (!matches) {
        console.warn(`Event ${evt.eventId} organizer ID ${evtOrganizerId} does not match user ID ${organizerId}, excluding from results`);
      }
      return matches;
    });
    
    console.log(`User ${organizerId} requested their events. Found ${events.length} events, ${filteredEvents.length} after filtering.`);
    
    for (let i = 0; i < filteredEvents.length; i++){
      if (filteredEvents[i].organizer) {
        filteredEvents[i].organizer = filteredEvents[i].organizer.name;
      }
    }
    res.json({ events: filteredEvents });
  });

  /**
   * GET /api/events/:id
   * Return a single event by id.
   */
  static get = asyncHandler(async (req, res) => {
    let evt = await EventRepo.findById(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: 'Not found' });
    evt.organizer = evt.organizer.name
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
   * GET /api/events?category=Music&page=1&pageSize=10
   * - If category is provided → events in that category (paginated)
   * - If category is empty/missing → all events (paginated)
   */
  static listByCategoryPaginized = asyncHandler(async (req, res) => {
    const { category } = req.query;

    // Service now returns { page, pageSize, total, events }
    const result = await EventService.listByCategoryPaginized(category, req.query);
    const { page, pageSize, total, events } = result;

    // Shape organizer like before (just the name string)
    for (let i = 0; i < events.length; i++) {
      if (events[i].organizer && events[i].organizer.name) {
        events[i].organizer = events[i].organizer.name;
      }
    }

    res.json({ page, pageSize, total, events });
  });

  /**
   * GET /api/events/:id/tickets
   * List ticket types (price/quantity/left) for an event.
   */
  static ticketTypes = asyncHandler(async (req, res) => {
    const eventId = Number(req.params.id);
    const event = await EventRepo.findById(Number(req.params.id));
    if (!event) return res.status(404).json({ error: 'Not found' });
    // Normalize keys to expose ticketInfoId (expected by tests/clients)
    const ticketTypes = (event.tickets || []).map((t) => ({
      ticketInfoId: t.infoId,
      ticketType: t.type,
      ticketPrice: t.price,
      ticketsQuantity: t.quantity,
      ticketsLeft: t.left,
    }));
    res.json({ ticketTypes });
  });
}

module.exports = { EventsController };
