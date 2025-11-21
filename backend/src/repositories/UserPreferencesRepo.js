const { knex } = require('../config/db');

class UserPreferencesRepo {
  static async findByUser(userId) {
    return knex('userpreferences')
      .where({ user_id: userId })
      .first();
  }

  static async upsert(userId, { location, categoryId }) {
    const existing = await this.findByUser(userId);
    if (existing) {
      await knex('userpreferences')
        .where({ user_id: userId })
        .update({ location, category_id: categoryId, updated_at: knex.fn.now() });
    } else {
      await knex('userpreferences').insert({ user_id: userId, location, category_id: categoryId });
    }
    return this.findByUser(userId);
  }
}

module.exports = { UserPreferencesRepo };
