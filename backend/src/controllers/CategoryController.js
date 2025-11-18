
const { CategoryRepo } = require("../repositories/CategoryRepo");
const { CategoryService } = require("../services/CategoryServices");
const asyncHandler = require('../utils/handler');

class CategoryController {

  /**
   * GET /api/categories
   * List every available category.
   */
  static categories = asyncHandler(async (req, res) => {
    const evt = await CategoryService.getAll();
    if (!evt) return res.status(404).json({ error: 'Not found' });
    res.json({ ...evt});
  });



}

module.exports = { CategoryController };
