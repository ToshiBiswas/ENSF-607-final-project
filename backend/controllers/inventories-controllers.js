import initKnex from "knex";
import configuration from "../knexfile.js";
const knex = initKnex(configuration);

const deleteItem = async (req, res) => {
  // Delete an inventory item
  const { id } = req.params;
  try {
    const item = await knex("inventories").where({ id }).first();

    if (!item) {
      return res.status(404).json({
        message: `Never seen an item with that ID ${id} in these parts`,
      });
    }

    const itemDeleted = await knex("inventories").where({ id }).delete();

    if (itemDeleted === 0) {
      return res.status(400).json({
        success: false,
        message: `Yikes, that item ${id} refuses to be defeated.`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Item ID ${id} successfully destroyed.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message:
        "An interal error occurred when attempting to thow out the item.",
    });
  }
};

const inventories = async (req, res) => {
  try {
    // Start the query builder joining the warehouses table.
    let query = knex("inventories")
      .join("warehouses", "inventories.warehouse_id", "warehouses.id")
      .select(
        "inventories.id",
        "warehouses.warehouse_name",
        "inventories.item_name",
        "inventories.description",
        "inventories.category",
        "inventories.status",
        "inventories.quantity"
      );

    // Get sorting parameters from the query string.
    const { sort_by, order_by } = req.query;

    // Define allowed columns for sorting.
    // Note: "warehouse_name" comes from the joined table.
    const allowedColumns = [
      "item_name",
      "description",
      "category",
      "status",
      "quantity",
      "warehouse_name"
    ];

    // If sort_by is provided and is allowed, apply ordering.
    if (sort_by && allowedColumns.includes(sort_by)) {
      const order = order_by && order_by.toLowerCase() === "desc" ? "desc" : "asc";
      query = query.orderBy(sort_by, order);
    }

    const inventoriesData = await query;
    res.status(200).json(inventoriesData);
  } catch (err) {
    res.status(400).send(`Error retrieving inventories data: ${err}`);
  }
};


const findInventory = async (req, res) => {
  // GET a single inventory item
  try {
    const inventoryFound = await knex("inventories").where({
      id: req.params.id,
    });

    if (inventoryFound.length === 0) {
      return res.status(404).json({
        message: `Inventory with ID ${req.params.id} not found`,
      });
    }

    const inventoryData = inventoryFound[0];
    res.json(inventoryData);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve inventory data with ID ${req.params.id}`,
    });
  }
};
const upInv = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const requiredFields = [
    "warehouse_id",
    "item_name",
    "description",
    "category",
    "status",
    "quantity",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      req.body[field] === undefined ||
      req.body[field] === null ||
      req.body[field] === ""
  );
  if (missingFields.length > 0) {
    // check if all the field requirements are present.
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }
  try {
    const item = await knex("inventories").where({ id }).first();

    if (!item) {
      //check if the inventory item exists. update upon successful completion.
      return res.status(404).json({
        message: `Never saw an item with that ID ${id}`,
      });
    }
    const rowsUpdated = await knex("inventories")
      .where({ id })
      .update(updateData);

    if (rowsUpdated === 0) {
      return res.status(404).json({
        message: `Inventory with ID ${id} not found.`,
      });
    }

    const updatedInventory = await knex("inventories").where({ id }).first();
    res.status(200).json(updatedInventory);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `Error updating inventory with ID ${id}.`,
      error: error.message,
    });
  }
};
const warInv = async (req, res) => {
  // GET Inventories for a Given Warehouse
  try {
    const warInv = await knex("inventories")
      .select("id", "item_name", "category", "status", "quantity")
      .where({ warehouse_id: req.params.id });

    if (warInv.length === 0) {
      return res.status(404).json({
        message: `Warehouse ID ${req.params.id} not found or doesn't have an inventory`,
      });
    }

    res.json(warInv);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve warehouse data for warehouse with ID ${req.params.id}`,
    });
  }
};

const addInventoryItem = async (req, res) => {
  // Create a new inventory item
  const requiredFields = [
    "warehouse_id",
    "item_name",
    "description",
    "category",
    "status",
    "quantity",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      req.body[field] === undefined ||
      req.body[field] === null ||
      req.body[field] === ""
  );
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    // find warehouse
    const foundWarehouse = await knex("warehouses")
      // and match based on name
      .where({ "warehouses.id": req.body.warehouse_id })
      .first();

    if (!foundWarehouse) {
      return res.status(400).json({
        message: "This warehouse does not exist!!",
      });
    }

    const result = await knex("inventories").insert(req.body);
    const newInventoryId = result[0];

    const createdInventory = await knex("inventories")
      .where({ "inventories.id": newInventoryId })
      .first();

    res.status(201).json(createdInventory);
  } catch (err) {
    res.status(400).json({ message: `Error adding inventory: ${err.message}` });
  }
};

export {
  // include the name of your function here
  addInventoryItem,
  inventories,
  findInventory,
  deleteItem,
  warInv,
  upInv,
};
