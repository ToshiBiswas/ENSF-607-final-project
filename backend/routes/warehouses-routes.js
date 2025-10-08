import express from "express";
import * as warehousesController from "../controllers/warehouses-controllers.js";
import * as inventoriesController from "../controllers/inventories-controllers.js";

const router = express.Router();

// REMEMBER TO CHANGE THE "PLACEHOLDER" TO THE NAME OF YOUR FUNCTION
router
  .route("/")
  .get(warehousesController.allWarehouses) // GET List of All Warehouses
  .post(warehousesController.addWarehouse); // Create a new warehouse

router
  .route("/:id")
  .get(warehousesController.findWarehouse) // GET A single Warehouse
  .put(warehousesController.updateWarehouse) // Edit a warehouse
  .delete(warehousesController.deleteWarehouse);

router.route("/:id/inventories")
  .get(inventoriesController.warInv); // GET Inventories for a Given Warehouse

export default router;
