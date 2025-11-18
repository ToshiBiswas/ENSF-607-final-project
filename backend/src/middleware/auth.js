/**
 * JWT helpers + guard middleware.
 *
 * - signJwt(payload): issues a signed token (7d default expiry)
 * - requireAuth: rejects requests without a valid Bearer token
 *
 * NOTE: In production, rotate JWT_SECRET and prefer short expirations.
 */
const jwt = require('jsonwebtoken');
const { UserRepo } = require('../repositories/UserRepo');

/**
 * @param {object} payload - arbitrary claims (e.g., { userId, email, role })
 * @param {object} [opts] - jwt.sign options (overrides default expiresIn)
 * @returns {string} JWT
 */
function signJwt(payload, opts = {}) {
  const secret = process.env.JWT_SECRET || 'changeme';
  if (!secret || secret === 'changeme') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d', ...opts });
}

/**
 * Express middleware that requires a valid Bearer token
 * and attaches the decoded payload to req.user.
 */
async function requireAuth(req, res, next) {
  try {
    
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } });
    }

    // Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'JWT configuration error' } });
    }
    const payload = jwt.verify(token, secret);

    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' } });
    }

    // Load user from DB (adjust column/table names to your schema)
    const user = await UserRepo.findById(userId);
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }

    req.user = user;                // User domain object
    req.auth = { token, payload };  // handy if you need claims later
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
    next(err);
  }
}

module.exports = { requireAuth, signJwt};
