/**
 * Domain Model: Category
 * Represents a normalized category value (e.g., "Music", "Comedy").
 */
class Category {
  /**
   * @param {object} args
   * @param {number} args.categoryId
   * @param {string} args.value
   */
  constructor({ categoryId, value }) {
    this.categoryId = categoryId;
    this.value = value;
  }
}

module.exports = { Category };
