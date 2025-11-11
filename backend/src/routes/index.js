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
const { NotificationController } = require('../controllers/NotificationController'); // <-- NEW
const { CategoryController } = require('../controllers/CategoryController');

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
/* ---------- CATEGORIES---------- */
r.get('/categories',CategoryController.categories)

/* ---------- USER ---------- */
r.get('/me', requireAuth, UsersController.me);
r.get('/auth/me', requireAuth, UsersController.me); 
r.patch('/me', requireAuth, UsersController.updateProfile);
r.get('/me/payment-methods', requireAuth, UsersController.paymentMethods);
r.put('/me/preferences', requireAuth, UsersController.setPreferences);
/* ---------- CART ---------- */
r.post('/cart/items', requireAuth, CartController.add);
r.get('/cart', requireAuth, CartController.view);
r.patch('/cart/items/:ticketInfoId',requireAuth,CartController.patchItem)
r.delete('/cart', requireAuth, CartController.clear);
r.post('/cart/checkout', requireAuth, CartController.checkout);

/* ---------- PAYMENTS ---------- */
r.post('/payments/verify-card', requireAuth, PaymentsController.verifyCard);
r.post('/payments/refund', requireAuth, PaymentsController.refund);

/* ---------- NOTIFICATIONS ---------- */
// Processes and sends all pending notifications due as of "now"
r.get('/notifications/due', requireAuth, NotificationController.getDue);

// Create/schedule a new notification for an event (requires body.eventId)
r.post('/notifications', requireAuth, NotificationController.create);

module.exports = r;
