import express from "express";
import { checkCredentials } from "./auth.js";

const app = express();
app.use(express.json());

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await checkCredentials(username, password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  res.json({ message: "Login successful!", user: { id: user.id, username: user.username } });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
