/**
 * Central route registry.
 * Groups endpoints by controller and applies auth where required.
 */
const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');

const { AuthController } = require('../controllers/AuthController');
const { EventsController } = require('../controllers/EventsController');
const { UsersController } = require('../controllers/UsersController');
const { CartController } = require('../controllers/CartController');
const { PaymentsController } = require('../controllers/PaymentsController');

const r = Router();

/* ---------- AUTH ---------- */
r.post('/auth/register', AuthController.register);
r.post('/auth/login',    AuthController.login);

/* ---------- EVENTS ---------- */
r.get('/events', EventsController.listByCategory); // ?category=Music
r.get('/events/:id', EventsController.get);
r.post('/events', requireAuth, EventsController.create);
r.patch('/events/:id', requireAuth, EventsController.update);
r.delete('/events/:id', requireAuth, EventsController.remove);
r.get('/events/:id/tickets', EventsController.ticketTypes);

/* ---------- USER ---------- */
r.get('/me', requireAuth, UsersController.me);
r.patch('/me', requireAuth, UsersController.updateProfile);
r.get('/me/payment-methods', requireAuth, UsersController.paymentMethods);
r.put('/me/preferences', requireAuth, UsersController.setPreferences);
r.get('/me/tickets', requireAuth, UsersController.tickets);
r.get('/me/payments', requireAuth, UsersController.payments);

/* ---------- CART ---------- */
r.post('/cart/items', requireAuth, CartController.add);
r.get('/cart', requireAuth, CartController.view);
r.delete('/cart', requireAuth, CartController.clear);
r.post('/cart/checkout', requireAuth, CartController.checkout);

/* ---------- PAYMENTS ---------- */
r.post('/payments/verify-card', requireAuth, PaymentsController.verifyCard);
r.post('/payments/refund', requireAuth, PaymentsController.refund);

module.exports = r;
