// services/CategoryService.js
const { knex } = require('../config/db');
const {CategoryRepo} = require('../repositories/CategoryRepo');
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
    return CategoryRepo.getAll();
  }

  /**
   * Check if a category exists by its value.
   * @param {string} value - The category value to look for.
   * @returns {Promise<boolean>} true if it exists, false otherwise.
   */
  static async existsByValue(value) {
    return CategoryRepo.existsByValue(value);
  }
}

module.exports = { CategoryService };