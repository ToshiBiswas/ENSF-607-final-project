/**
 * UsersController
 * Profile, preferences, and listing stored payment methods.
 */
const asyncHandler = require('../utils/handler');
const { UserService } = require('../services/UserService');
const { UserRepo } = require('../repositories/UserRepo');
const { UserCardRepo } = require('../repositories/UserCardRepo');

class UsersController {
  /** GET /api/me */
  static me = asyncHandler(async (req, res) => {
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
    const list = await UserCardRepo.listForUser(req.user.userId);
    res.json({ paymentMethods: list });
  });
}

module.exports = { UsersController };
