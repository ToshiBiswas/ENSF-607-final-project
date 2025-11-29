
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

  /**
   * GET /api/categories/:name/events
   * Return events in the given category value (case-insensitive).
   */
  static eventsByCategory = asyncHandler(async (req, res) => {
    const { name } = req.params;
    const events = await CategoryService.getEventsByCategoryValue(name);
    res.json({ events });
  });


}

module.exports = { CategoryController };
