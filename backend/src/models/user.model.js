/**
 * Model: users
 * -------------------------
 * Orchestrates DB access for Users and maps rows into the `User` domain object.
 * This file is the single source of truth for:
 * - table name / selected columns
 * - row <-> domain mapping
 * - CRUD operations used by services/controllers
 *
 * Rationale:
 * - Services must not know column names; they use domain objects exclusively.
 * - Centralized mapping keeps migrations/refactors low-risk.
 */
const db = require('../db');
const { User } = require('../domain/User');

const TABLE = 'users';

module.exports = {
  /** Read-only list for admin screens / tests. */
  async findAll() {
    const rows = await db(TABLE)
      .select('user_id', 'name', 'email', 'role', 'created_at', 'password_hash')
      .orderBy('user_id');
    return rows.map(User.fromRow);
  },

  /** Primary lookup by PK. */
  async findById(user_id) {
    const row = await db(TABLE).where({ user_id }).first();
    return User.fromRow(row);
  },

  /** Uniqueness check at auth/registration time. */
  async findByEmail(email) {
    const row = await db(TABLE).where({ email }).first();
    return User.fromRow(row);
  },

  async findByName(name) {
    const row = await db(TABLE).where({ name }).first();
    return User.fromRow(row);
  },

  /** Flexible lookup (email OR username) used by login. */
  async findByEmailOrName(emailOrName) {
    const row = await db(TABLE)
      .where('email', emailOrName)
      .orWhere('name', emailOrName)
      .first();
    return User.fromRow(row);
  },

  /**
   * Create and immediately re-read using PK so callers receive a fully
   * hydrated domain instance (includes defaults like created_at).
   */
  async create({ name, email, password_hash, role = 'user' }) {
    const [user_id] = await db(TABLE).insert({ name, email, password_hash, role });
    return this.findById(user_id);
  },

  /** Partial updates allowed; service layer validates invariants. */
  async update(user_id, patch) {
    await db(TABLE).where({ user_id }).update(patch);
    return this.findById(user_id);
  },

  /** Hard delete – ensure service checks authorization. */
  async remove(user_id) {
    return db(TABLE).where({ user_id }).del();
  },

  // Convenience mappers for controllers that want DTOs directly.
  toDTO(user) { return user?.toDTO?.(); },
  toDTOs(list) { return User.toDTOs(list); },
};
