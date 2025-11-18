// src/repositories/RefreshTokenRepo.js
const { knex } = require('../config/db');

const TABLE = 'refresh_tokens';

class RefreshTokenRepo {
  /**
   * Insert new refresh token row.
   * @param {{ user_id: number, token_hash: string, expires_at: Date }} data
   */
  static async create(data) {
    const [id] = await knex(TABLE).insert(data);
    return this.findById(id);
  }

  static async findById(id) {
    return knex(TABLE).where({ id }).first();
  }

  /**
   * Find a valid (not revoked, not expired) refresh token by hash.
   */
  static async findValidByHash(token_hash) {
    return knex(TABLE)
      .where({ token_hash, revoked: false })
      .andWhere('expires_at', '>', knex.fn.now())
      .first();
  }

  /**
   * Soft-revoke a token.
   */
  static async revokeByHash(token_hash) {
    return knex(TABLE)
      .where({ token_hash })
      .update({ revoked: true, revoked_at: knex.fn.now() });
  }

  /**
   * Revoke all tokens for a user (e.g., global logout).
   */
  static async revokeAllForUser(user_id) {
    return knex(TABLE)
      .where({ user_id, revoked: false })
      .update({ revoked: true, revoked_at: knex.fn.now() });
  }
}

module.exports = { RefreshTokenRepo };
