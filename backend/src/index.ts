import express from "express";
import type { Request, Response } from "express";

import { assertDB } from "./lib/db.js";

// Create a new express application instance
const app = express();

// Set the network port
const port = Number(process.env.PORT ?? 3000);

// Define the root path with a greeting message
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Express + TypeScript Server!" });
});

// Start the Express server
app.listen(port, async () => {
  try {
    await assertDB();
  } catch (error) {
    console.error("Failed to connect to the database", error);
  }
  console.log(`The server is running at http://localhost:${port}`);
});
