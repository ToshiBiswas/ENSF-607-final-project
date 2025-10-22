/**
 * JWT helpers + guard middleware.
 *
 * - signJwt(payload): issues a signed token (7d default expiry)
 * - requireAuth: rejects requests without a valid Bearer token
 *
 * NOTE: In production, rotate JWT_SECRET and prefer short expirations.
 */
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');

/**
 * @param {object} payload - arbitrary claims (e.g., { userId, email, role })
 * @param {object} [opts] - jwt.sign options (overrides default expiresIn)
 * @returns {string} JWT
 */
function signJwt(payload, opts = {}) {
  const secret = process.env.JWT_SECRET || 'changeme';
  return jwt.sign(payload, secret, { expiresIn: '7d', ...opts });
}

/**
 * Express middleware that requires a valid Bearer token
 * and attaches the decoded payload to req.user.
 */
function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError('Unauthorized', 401));
  try {
    const secret = process.env.JWT_SECRET || 'changeme';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (e) {
    next(new AppError('Unauthorized', 401));
  }
}

module.exports = { signJwt, requireAuth };
