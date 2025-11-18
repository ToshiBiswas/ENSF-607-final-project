/**
 * JWT helpers + guard middleware.
 *
 * - signJwt(payload): legacy helper (access token)
 * - signAccessToken(user): issues short-lived access token
 * - signRefreshToken(user): issues long-lived refresh token
 * - generateTokenPair(user): access + refresh + DB row
 * - requireAuth: rejects requests without a valid Bearer token
 *
 * NOTE: In production, rotate secrets and prefer short expirations.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { UserRepo } = require('../repositories/UserRepo');
const { RefreshTokenRepo } = require('../repositories/RefreshTokenRepo');

// Convert "15m", "30s", "1h", "7d" or plain "900" into seconds
function parseDurationToSeconds(raw, defaultSeconds) {
  if (!raw) return defaultSeconds;

  const trimmed = String(raw).trim();
  // matches: "30", "30s", "15m", "1h", "7d"
  const match = trimmed.match(/^(\d+)\s*([smhd])?$/i);
  if (!match) return defaultSeconds;

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();

  let multiplier = 1;
  if (unit === 'm') multiplier = 60;
  else if (unit === 'h') multiplier = 60 * 60;
  else if (unit === 'd') multiplier = 60 * 60 * 24;


  return value * multiplier;
}

// Access token valid for 15 minutes by default
const ACCESS_TOKEN_TTL_SECONDS = parseDurationToSeconds(
  process.env.ACCESS_TOKEN_EXPIRES_IN,
  15 * 60
);

// Refresh token valid for 30 days by default
const REFRESH_TOKEN_TTL_SECONDS = parseDurationToSeconds(
  process.env.REFRESH_TOKEN_EXPIRES_IN,
  30 * 24 * 60 * 60
);

// Cookie name for refresh token
const REFRESH_COOKIE_NAME = 'refresh_token';

function getUserId(user) {
  // support both DB rows and domain objects
  return user.userId || user.user_id || user.id;
}

function getAccessSecret() {
  return process.env.JWT_SECRET || 'changeme';
}

function getRefreshSecret() {
  // Separate secret for refresh tokens is better; fallback to access secret if missing
  return process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'changeme_refresh';
}

/**
 * Hash any token string to store safely in DB.
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Legacy helper kept for backwards compatibility.
 * Treats this as an access token.
 *
 * @param {object} payload - arbitrary claims (e.g., { userId, email, role })
 * @param {object} [opts] - jwt.sign options (overrides default expiresIn)
 * @returns {string} JWT
 */
function signJwt(payload, opts = {}) {
  const secret = getAccessSecret();
  return jwt.sign(payload, secret, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    ...opts,
  });
}

/**
 * Issue a short-lived access token for a user.
 * @param {object} user - user row/domain object
 */
function signAccessToken(user) {
  const secret = getAccessSecret();
  const userId = getUserId(user);

  const payload = {
    sub: userId,
    email: user.email,
    role: user.role || 'user',
  };

  return jwt.sign(payload, secret, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

/**
 * Issue a long-lived refresh token for a user.
 * We include `sub` and a random `jti` (token id) for tracking.
 */
function signRefreshToken(user, jti) {
  const secret = getRefreshSecret();
  const userId = getUserId(user);

  const payload = {
    sub: userId,
    jti,
  };

  return jwt.sign(payload, secret, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });
}

/**
 * Verify a refresh token and return its payload.
 */
function verifyRefreshToken(token) {
  const secret = getRefreshSecret();
  return jwt.verify(token, secret);
}

/**
 * Generate access + refresh token pair and persist refresh token in DB.
 * Returns { accessToken, refreshToken }.
 */
async function generateTokenPair(user) {
  const jti = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');

  const refreshToken = signRefreshToken(user, jti);
  const accessToken = signAccessToken(user);

  const token_hash = hashToken(refreshToken);
  const expires_at = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  const userId = getUserId(user);

  await RefreshTokenRepo.create({
    user_id: userId,
    token_hash,
    expires_at,
  });

  return { accessToken, refreshToken };
}

/**
 * Set refresh token cookie (HttpOnly).
 */
function setRefreshCookie(res, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  });
}

/**
 * Clear refresh token cookie.
 */
function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
}

/**
 * Express middleware that requires a valid Bearer access token
 * and attaches the decoded payload to req.user.
 */
async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const [scheme, token] = auth.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } });
    }

    // Verify token using the access secret (matches signJwt/signAccessToken)
    const secret = getAccessSecret();
    const payload = jwt.verify(token, secret);

    const userId = payload.sub || payload.userId || payload.id;
    if (!userId) {
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' } });
    }

    const user = await UserRepo.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }

    req.user = user;                // User domain object
    req.auth = { token, payload };  // handy if you need claims later
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ error: { code: 'TOKEN_EXPIRED', message: 'Token expired' } });
    }
    if (err.name === 'JsonWebTokenError') {
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    }
    next(err);
  }
}

module.exports = {
  requireAuth,
  signJwt,          // legacy
  signAccessToken,
  signRefreshToken,
  generateTokenPair,
  hashToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
};
