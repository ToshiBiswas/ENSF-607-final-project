require('dotenv').config();

console.log("GEMINI_API_KEY is set:", !!process.env.GEMINI_API_KEY);

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

//Central route registry
const routes = require('./routes');
const adviceRoutes = require('./routes/advice.routes.cjs');
const payoutRoutes = require('./routes/payout.routes.cjs');

//Error helpers
const { errorMiddleware, notFound } = require('./utils/errors');

const app = express();

// CORS - Allow frontend to connect
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

//JSON body parsing
app.use(express.json());

app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ ok: true }));

//All API routes mounted under api
app.use('/api', routes);

app.use('/api', adviceRoutes);

app.use('/api', payoutRoutes);

//404 handler for unrecognized routes
app.use(notFound);

app.use(errorMiddleware);

//Allow node src/app.js to boot a server; otherwise export for tests
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`API listening on :${port}`));
}

module.exports = app;
