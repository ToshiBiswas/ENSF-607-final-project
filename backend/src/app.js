const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal error' });
});

module.exports = app;
