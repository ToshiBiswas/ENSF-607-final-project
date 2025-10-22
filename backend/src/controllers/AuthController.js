/**
 * AuthController
 * Bridges HTTP <-> AuthService
 */
const { AuthService } = require('../services/AuthService');
const asyncHandler = require('../utils/handler');

class AuthController {
  /**
   * POST /api/auth/register
   * body: { name, email, password }
   * returns: { user, token }
   */
  static register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const result = await AuthService.register({ name, email, password });
    res.status(201).json(result);
  });

  /**
   * POST /api/auth/login
   * body: { email, password }
   * returns: { user, token }
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.login({ email, password });
    res.json(result);
  });
}

module.exports = { AuthController };
