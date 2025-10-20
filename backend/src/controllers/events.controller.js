const EventService = require('../services/EventService');

class EventsController {
  static async getEventInfo(req, res) {
    const id = Number(req.params.id);
    const data = await EventService.getEventInfo(id);
    res.json({ message: 'Get event info: successful', data });
  }

  static async createEvent(req, res) {
    const data = await EventService.createEvent(req.user, req.body);
    res.status(201).json({ message: 'Event created', data });
  }

  static async updateEvent(req, res) {
    const id = Number(req.params.id);
    await EventService.updateEvent(req.user, id, req.body);
    res.json({ message: 'Event updated' });
  }

  static async deleteEvent(req, res) {
    const id = Number(req.params.id);
    const result = await EventService.deleteEventWithRefunds(req.user, id);
    res.json({ message: 'Event deleted, refunds attempted', ...result });
  }
}

module.exports = EventsController;
