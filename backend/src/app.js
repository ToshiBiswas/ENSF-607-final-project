/**
 * ##########################################
 * # Event Planner Backend (Express + Knex)  #
 * ##########################################
 *
 * Purpose:
 *   This application exposes a REST API for an event planner marketplace:
 *   - Users can register/login (JWT)
 *   - Organizers can create/update/delete events with ticket types
 *   - Attendees can browse events, add tickets to a cart, and checkout
 *   - Checkout verifies/charges cards via an external (mock) Payments API
 *   - Successful purchases mint unique 6‑digit ticket codes
 *   - Notifications are stored + emitted as outbound webhooks
 *
 * Architecture:
 *   - MVC layering with explicit OOP domain models
 *   - Repositories encapsulate all DB (Knex) calls
 *   - Services implement business rules and transactions
 *   - Controllers convert HTTP <-> service calls
 *   - Domain models hold OBJECT REFERENCES (not raw IDs)
 *
 * Conventions:
 *   - CommonJS modules for simple drop‑in
 *   - Node 18+ for native fetch (or polyfill if needed)
 *   - Heavily commented to show intent and extension points
 */

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { EventRepo } = require('./repositories/EventRepo');

// Central route registry
const routes = require('./routes');

// Error helpers
const { errorMiddleware, notFound } = require('./utils/errors');

const app = express();

// JSON body parsing
app.use(express.json());

// Dev request logging; swap for pino in prod if you prefer
app.use(morgan('dev'));

// Quick healthcheck to aid container orchestration and uptime monitors
app.get('/health', (_req, res) => res.json({ ok: true }));

// All API routes mounted under /api
app.use('/api', routes);

// 404 handler for unrecognized routes
app.use(notFound);

// Centralized error formatting (never leaks stack in production)
app.use(errorMiddleware);

// Allow "node src/app.js" to boot a server; otherwise export for tests
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`API listening on :${port}`);
    if (process.env.NODE_ENV !== 'test') {
      startExpiredEventCleanupScheduler();
    }
  });
}
function startExpiredEventCleanupScheduler() {
  const INTERVAL_MS = 60 * 1000; // 1 minute

  setInterval(async () => {
    try {
      const deleted = await EventRepo.deleteExpiredEvents();
      if (deleted > 0) {
        console.log(`[scheduler] Deleted ${deleted} expired event(s).`);
      }
    } catch (err) {
      console.error('[scheduler] Error deleting expired events:', err);
    }
  }, INTERVAL_MS);
}

module.exports = app;
