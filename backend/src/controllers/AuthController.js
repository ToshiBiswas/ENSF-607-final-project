// src/controllers/AuthController.js
const bcrypt = require('bcrypt'); // or 'bcryptjs' if that’s what you use elsewhere
const asyncHandler = require('../utils/handler');
const { UserRepo } = require('../repositories/UserRepo');
const { RefreshTokenRepo } = require('../repositories/RefreshTokenRepo');
const {
  generateTokenPair,
  hashToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  REFRESH_COOKIE_NAME,
} = require('../utils/jwt');

/**
 * Helper: get a numeric userId from any user shape.
 */
function getUserId(user) {
  return user.userId || user.user_id || user.id;
}

class AuthController {
  /**
   * POST /api/auth/register
   * Body: { name, email, password }
   */
  static register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // 1) check if email exists
    const existing = await UserRepo.findByEmail(email);
    if (existing) {
      return res.status(400).json({
        error: { code: 'EMAIL_TAKEN', message: 'Email already in use' },
      });
    }

    // 2) hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3) create user (UserRepo expects passwordHash in camelCase)
    const user = await UserRepo.insert({
      name,
      email,
      passwordHash,
    });

    // 4) issue tokens & set refresh cookie
    const { accessToken, refreshToken } = await generateTokenPair(user);
    setRefreshCookie(res, refreshToken);

    // 5) respond with access token + user (no refresh token in JSON)
    res.status(201).json({
      accessToken,
      user,
    });
  });

  /**
   * POST /api/auth/login
   * Body: { email, password }
   */
  static login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const row = await UserRepo.findAuthByEmail(email);
    if (!row) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    // load domain user (no password) for responses
    const user = await UserRepo.findById(row.user_id);

    const { accessToken, refreshToken } = await generateTokenPair(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user,
    });
  });

  /**
   * POST /api/auth/refresh
   * Uses HttpOnly cookie by default, but falls back to JSON body { refreshToken }
   * (handy for Postman / manual testing).
   */
  static refresh = asyncHandler(async (req, res) => {
    const cookieToken = req.cookies && req.cookies[REFRESH_COOKIE_NAME];
    const bodyToken = req.body && req.body.refreshToken;
    const refreshToken = cookieToken || bodyToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Missing refresh token' },
      });
    }

    // Verify JWT signature
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' },
      });
    }

    const token_hash = hashToken(refreshToken);
    const tokenRow = await RefreshTokenRepo.findValidByHash(token_hash);
    if (!tokenRow) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Refresh token revoked or expired' },
      });
    }

    const user = await UserRepo.findById(tokenRow.user_id);
    if (!user) {
      await RefreshTokenRepo.revokeByHash(token_hash);
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'User no longer exists' },
      });
    }

    // Rotate refresh token
    await RefreshTokenRepo.revokeByHash(token_hash);
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair(user);

    setRefreshCookie(res, newRefreshToken);

    res.json({
      accessToken,
      user,
    });
  });

  /**
   * POST /api/auth/logout
   * Revokes the current refresh token (if we can get it) and clears cookie.
   */
  static logout = asyncHandler(async (req, res) => {
    const cookieToken = req.cookies && req.cookies[REFRESH_COOKIE_NAME];
    const bodyToken = req.body && req.body.refreshToken;
    const refreshToken = cookieToken || bodyToken;

    if (refreshToken) {
      try {
        const token_hash = hashToken(refreshToken);
        await RefreshTokenRepo.revokeByHash(token_hash);
      } catch (err) {
        // best-effort; don't block logout on errors
        console.error('Error revoking refresh token on logout:', err);
      }
    }

    clearRefreshCookie(res);
    res.json({ success: true });
  });

  /**
   * POST /api/auth/logout-all
   * Protected with requireAuth — revokes all refresh tokens for this user.
   */
  static logoutAll = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Missing user context' },
      });
    }

    const userId = getUserId(req.user);
    await RefreshTokenRepo.revokeAllForUser(userId);

    clearRefreshCookie(res);

    res.json({ success: true });
  });
}

module.exports = { AuthController };
