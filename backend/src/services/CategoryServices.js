// services/CategoryService.js
const { knex } = require('../config/db');

/**
 * CategoryService
 * Reads categories from the DB and returns normalized objects.
 */
class CategoryService {
  /**
   * Get all categories, sorted alphabetically by value.
   * @returns {Promise<Array<{categoryId:number, value:string}>>}
   */
  static async getAll() {
    const rows = await knex('categoriesid')
      .select('category_id', 'category_value')
      .orderBy('category_value', 'asc');

    return rows.map(r => ({
      categoryId: r.category_id,
      value: r.category_value,
    }));
  }
}

module.exports = { CategoryService };
