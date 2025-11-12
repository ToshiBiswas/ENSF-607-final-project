/**
 * UsersController
 * Profile, preferences, and listing stored payment methods.
 */
const asyncHandler = require('../utils/handler');
const { UserService } = require('../services/UserService');
const { PaymentInfoRepo } = require('../repositories/PaymentInfoRepo');

class UsersController {
  /** GET /api/me */
  static me = asyncHandler(async (req, res) => {
    const { UserRepo } = require('../repositories/UserRepo');
    const user = await UserRepo.findById(req.user.userId);
    res.json({ user });
  });

  /** PATCH /api/me  (update name/email) */
  static updateProfile = asyncHandler(async (req, res) => {
    const user = await UserService.updateProfile(req.user.userId, req.body);
    res.json({ user });
  });

  /** PUT /api/me/preferences  (location + preferred category) */
  static setPreferences = asyncHandler(async (req, res) => {
    const pref = await UserService.setPreferences(req.user.userId, req.body);
    res.json({ preferences: pref });
  });

  /** GET /api/me/payment-methods  (list stored cards) */
  static paymentMethods = asyncHandler(async (req, res) => {
    const list = await PaymentInfoRepo.listForUser(req.user.userId);
    res.json({ paymentMethods: list });
  });

  /** GET /api/me/tickets  (list user's tickets) */
  static tickets = asyncHandler(async (req, res) => {
    const { TicketMintRepo } = require('../repositories/TicketMintRepo');
    const { EventRepo } = require('../repositories/EventRepo');
    const tickets = await TicketMintRepo.listForUser(req.user.userId);
    // Enrich tickets with event details
    const enriched = await Promise.all(tickets.map(async (ticket) => {
      const event = ticket.event?.eventId ? await EventRepo.findById(ticket.event.eventId) : null;
      return { ...ticket, event };
    }));
    res.json({ tickets: enriched });
  });

  /** GET /api/me/payments  (list user's payment history) */
  static payments = asyncHandler(async (req, res) => {
    const { PaymentRepo } = require('../repositories/PaymentRepo');
    const payments = await PaymentRepo.listForUser(req.user.userId);
    res.json({ payments });
  });
}

module.exports = { UsersController };
