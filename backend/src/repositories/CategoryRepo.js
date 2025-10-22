/**
 * CategoryRepo
 * Resolves by value (e.g., "Music"); creates when necessary.
 */
const { knex } = require('../config/db');
const { Category } = require('../domain/Category');

class CategoryRepo {
  /** Find or create a normalized category value */
  static async findOrCreate(value) {
    const found = await knex('categoriesid').where({ category_value: value }).first();
    if (found) return new Category({ categoryId: found.category_id, value: found.category_value });
    const [id] = await knex('categoriesid').insert({ category_value: value });
    return new Category({ categoryId: id, value });
  }

  static async getByValue(value) {
    const row = await knex('categoriesid').where({ category_value: value }).first();
    return row ? new Category({ categoryId: row.category_id, value: row.category_value }) : null;
  }
}

module.exports = { CategoryRepo };
