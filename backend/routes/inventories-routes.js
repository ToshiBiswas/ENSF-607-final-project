import express from "express";
import * as inventoriesController from "../controllers/inventories-controllers.js";

const router = express.Router();

// REMEMBER TO CHANGE THE "PLACEHOLDER" TO THE NAME OF YOUR FUNCTION
router
  .route("/")
  .get(inventoriesController.inventories) // GET all inventory items
  .post(inventoriesController.addInventoryItem); // Create a new inventory item

router
  .route("/:id")
  .get(inventoriesController.findInventory) // GET a single inventory item
  .put(inventoriesController.upInv) // Edit an inventory item
  .delete(inventoriesController.deleteItem); // Delete an inventory item

export default router;
