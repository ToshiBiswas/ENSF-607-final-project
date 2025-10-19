
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const cookieParser = require('cookie-parser');
const userRoutes = require('./routes/users.routes');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.get('/health', (_req, res) => res.json({ ok: true }));
module.exports = app;
// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal error' });
});
module.exports = app;
