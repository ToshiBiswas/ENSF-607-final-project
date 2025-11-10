/**
 * AuthService
 * - Handles registration + login
 * - Uses bcrypt for password hashing
 * - Emits JWT for session-less auth
 */
const bcrypt = require('bcryptjs');
const { AppError } = require('../utils/errors');
const { UserRepo } = require('../repositories/UserRepo');
const { signJwt } = require('../middleware/auth');

class AuthService {
  /**
   * Register a new user.
   * Validates email uniqueness, hashes the password, inserts the row, returns JWT.
   */
  static async register({ name, email, password }) {
    const exists = await UserRepo.findByEmail(email);
    if (exists) throw new AppError('Email already in use', 409);
    const hash = await bcrypt.hash(password, 10);
    const user = await UserRepo.insert({ name, email, passwordHash: hash });
    const token = signJwt({ userId: user.userId, email: user.email, role: user.role });
    return { user, token };
  }

  /**
   * Login an existing user.
   * Uses bcrypt.compare against stored hash.
   */
  static async login({ email, password }) {
    const row = await UserRepo.findByEmail(email);
    if (!row) throw new AppError('Invalid credentials', 401);
    // Fetch hash directly (domain doesn't include it)
    const r = await require('../config/db').knex('users').where({ email }).first();
    const ok = await bcrypt.compare(password, r.password_hash);
    if (!ok) throw new AppError('Invalid credentials', 401);
    const token = signJwt({ userId: r.user_id, email: r.email, role: r.role });
    return { user: await UserRepo.findById(r.user_id), token };
  }
}

module.exports = { AuthService };
