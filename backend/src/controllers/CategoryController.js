
const { CategoryRepo } = require("../repositories/CategoryRepo");
const { CategoryService } = require("../services/CategoryServices");
const asyncHandler = require('../utils/handler');

class CategoryController {

  /**
   * GET /api/categories
   * List every available category.
   */
  static categories = asyncHandler(async (req, res) => {
    const categories = await CategoryService.getAll();
    if (!categories || categories.length === 0) {
      return res.json({ categories: [] });
    }
    res.json({ categories });
  });



}

module.exports = { CategoryController };
