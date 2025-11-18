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
  static async getAll() {
    const rows = await knex('categoriesid')
      .select('category_id', 'category_value')
      .orderBy('category_value', 'asc');

    return rows.map(r => new Category({
      categoryId: r.category_id,
      value: r.category_value,
    }));
  }
    /**
   * Check if a category exists by its value.
   * @param {string} value - The category value to look for.
   * @returns {Promise<boolean>} true if it exists, false otherwise.
   */
  static async existsByValue(value) {
    const row = await knex('categoriesid')
      .where({ category_value: value })
      .first();

    return !!row; // convert to true/false
  }
}


module.exports = { CategoryRepo };
