/**
 * UserRepo
 * Encapsulates all SQL for Users.
 * Returns domain User objects instead of raw rows.
 */
const { knex } = require('../config/db');
const { User } = require('../domain/User');

class UserRepo {
  /** Find a user by primary key */
  static async findById(userId) {
    const row = await knex('users').where({ user_id: userId }).first();
    if (!row) return null;
    return new User({ userId: row.user_id, name: row.name, email: row.email, role: row.role });
  }

  /** Find a user by unique email */
  static async findByEmail(email) {
    const row = await knex('users').where({ email }).first();
    if (!row) return null;
    return new User({ userId: row.user_id, name: row.name, email: row.email, role: row.role });
  }

  /** Insert a new user (returns domain) */
  static async insert({ name, email, passwordHash }) {
    const [user_id] = await knex('users').insert({ name, email, password_hash: passwordHash });
    return this.findById(user_id);
  }

  /** Update profile-level fields */
  static async updateProfile(userId, { name, email }) {
    await knex('users').where({ user_id: userId }).update({ name, email });
    return this.findById(userId);
  }
}

module.exports = { UserRepo };
