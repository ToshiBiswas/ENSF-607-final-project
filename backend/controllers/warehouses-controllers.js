  import initKnex from "knex";
  import configuration from "../knexfile.js";

  const knex = initKnex(configuration);

  const deleteWarehouse = async (req, res) => {
    const { id } = req.params;
    try {
      const warehouse = await knex("warehouses").where({ id }).first();

      if (!warehouse) {
        return res.status(404).json({
          message: `It's a full moon. The werehouse with ID ${id} not found.`,
        });
      }

      const rowsDeleted = await knex("warehouses").where({ id }).delete();

      if (rowsDeleted === 0) {
        return res.status(400).json({
          success: false,
          message: `Despite our best attempts, the warehouse stands strong ${id}`,
        });
      }

      res.status(200).json({
        success: true,
        message: `Warehouse ID ${id} successfully eliminated.`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message:
          "An error occurred when trying to make this warehouse a was-house.",
      });
    }
  };
  const updateWarehouse = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const requiredFields = [
      "warehouse_name",
      "address",
      "city",
      "country",
      "contact_name",
      "contact_position",
      "contact_phone",
      "contact_email",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }
    try {
      //attempt to see if there is a warehouse variable
      const warehouse = await knex("warehouses").where({ id }).first();

      if (!warehouse) {
        return res.status(404).json({
          //return a 404 error upon failiure to find warehouse
          message: `The werehouse with ID: ${id} was not found.`,
        });
      }
      if(updateData.id != id){
        return res.status(400).json({ 
          message: `a change was attempted on id. changes on id is forbiffen`,
        });
      }
      // Attempt to update the warehouse with the new data
      const rowsUpdated = await knex("warehouses")
        .where({ id })
        .update(updateData);
      // if update is not possible. return with a 404 error.
      if (rowsUpdated === 0) {
        return res
          .status(404)
          .json({ message: `Warehouse with ID ${id} not found.` });
      }

      // Retrieve the updated warehouse information
      const updatedWarehouse = await knex("warehouses").where({ id }).first();
      //return with a successful error update.
      res.status(200).json(updatedWarehouse);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: `Error updating warehouse with ID ${id}`,
        error: error.message,
      });
    }
  };

  const allWarehouses = async (req, res) => {
    try {
      // Start a query builder for the "warehouses" table
      let query = knex("warehouses");

      // Retrieve query parameters
      const { sort_by, order_by } = req.query;

      // Optional: Define which columns are allowed for sorting
      const allowedColumns = [
        "warehouse_name",
        "address",
        "city",
        "country",
        "contact_name",
        "contact_position",
        "contact_phone",
        "contact_email"
      ];

      // If a valid sort_by column is provided, apply sorting.
      if (sort_by && allowedColumns.includes(sort_by)) {
        const order = order_by && order_by.toLowerCase() === "desc" ? "desc" : "asc";
        query = query.orderBy(sort_by, order);
      }

      const warehousesData = await query;
      res.status(200).json(warehousesData);
    } catch (err) {
      res.status(400).send(`Error retrieving Warehouses: ${err}`);
    }
  };

  const findWarehouse = async (req, res) => {
    // GET A single Warehouse
    try {
      const warehouseFound = await knex("warehouses").where({
        id: req.params.id,
      });

      if (warehouseFound.length === 0) {
        return res.status(404).json({
          message: `Warehouse with ID ${req.params.id} not found`,
        });
      }

      const warehouseData = warehouseFound[0];
      res.json(warehouseData);
    } catch (error) {
      res.status(500).json({
        message: `Unable to retrieve warehouse data with ID ${req.params.id}`,
      });
    }
  };

    const addWarehouse = async (req, res) => { // Create a new warehouse
      const requiredFields = [
        "warehouse_name",
        "address",
        "city",
        "country",
        "contact_name",
        "contact_position",
        "contact_phone",
        "contact_email",
      ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    try {
      const result = await knex("warehouses").insert(req.body);

      const newWarehouseId = result[0]; // new ID number
      const createdWarehouse = await knex("warehouses")
        .where({
          id: newWarehouseId,
        })
        .first(); // get the object rather than []

      res.status(201).json(createdWarehouse);
    } catch (err) {
      res.status(400).send("Error adding warehouse:", err);
    }
  };

  export {
    // include the name of your function here
    // index
    addWarehouse,
    allWarehouses,
    findWarehouse,
    deleteWarehouse,
    updateWarehouse,
  };
