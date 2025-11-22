// src/controllers/NotificationController.js
const asyncHandler = require('../utils/handler');
const { NotificationService } = require('../services/NotificationService');
const { EventRepo } = require('../repositories/EventRepo');

class NotificationController {
  /**
   * GET /api/notifications/due
   * Sends all reminder notifications whose scheduled time is due (<= now),
   * then returns the list that was sent.
   */
  static getDue = asyncHandler(async (req, res) => {
    const sent = await NotificationService.listForUser(req.user.userId);
    res.json({ sent_count: sent.length, sent });
  });

  /**
   * POST /api/notifications
   * body: { event_id, send_at?, reminder_type?, message? }
   * Creates a reminder notification for the current user; requires an event.
   * If send_at is omitted, defaults to the event start time.
   */
  static create = asyncHandler(async (req, res) => {
    const { event_id, send_at, reminder_type, message } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required' });
    }

    const evt = await EventRepo.findById(Number(event_id));
    if (!evt) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const scheduledAt = send_at ? new Date(send_at) : new Date(evt.startTime);
    const note = await NotificationService.queue({
      userId: req.user.userId,
      eventId: evt.eventId,
      title: reminder_type || 'event_start',
      message: message || `Reminder: ${evt.title} at ${new Date(evt.startTime).toLocaleString()}`,
      sendAt: scheduledAt
    });

    res.status(201).json({ notification: note });
  });
  
}

module.exports = { NotificationController };
