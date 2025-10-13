const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

// health
app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1+1 AS result');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// list users
app.get('/users', async (_req, res) => {
  const users = await db('users').select('*').orderBy('User_ID', 'asc');
  res.json({ message: 'Get user list : successful', data: users });
});

// create user
app.post('/users', async (req, res) => {
  const { Username, Email_Address, Postal_Address, Mobile_Number, Role = 'user' } = req.body || {};
  if (!Username || !Email_Address) {
    return res.status(400).json({ message: 'Need: Username、Email_Address' });
  }
  const [User_ID] = await db('users').insert({
    Username, Email_Address, Postal_Address: Postal_Address ?? null,
    Mobile_Number: Mobile_Number ?? null, Role
  });
  const created = await db('users').where({ User_ID }).first();
  res.status(201).json({ message: 'User created', data: created });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
