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
const { TicketsController } = require('../controllers/TicketsController');
const { CategoryController } = require('../controllers/CategoryController');
const r = Router();

/* ---------- AUTH ---------- */
r.post('/auth/register', AuthController.register);
r.post('/auth/login', AuthController.login);
r.post('/auth/refresh', AuthController.refresh);
r.post('/auth/logout', AuthController.logout);
r.post('/auth/logout-all', requireAuth, AuthController.logoutAll);

/* ---------- EVENTS ---------- */
r.get('/events', EventsController.listByCategory); // ?category=Music
r.get('/events/:id', EventsController.get);
r.post('/events', requireAuth, EventsController.create);
r.patch('/events/:id', requireAuth, EventsController.update);
r.delete('/events/:id', requireAuth, EventsController.remove);
r.get('/events/:id/tickets', EventsController.ticketTypes);
r.get('/user/events', requireAuth, EventsController.listMine);
/* ---------- CATEGORIES---------- */
r.get('/categories',CategoryController.categories)

/* ---------- USER ---------- */
r.get('/me', requireAuth, UsersController.me);
r.patch('/me', requireAuth, UsersController.updateProfile);
r.get('/me/payment-methods', requireAuth, UsersController.paymentMethods);
/* ---------- CART ---------- */
r.post('/cart/items', requireAuth, CartController.add);
r.get('/cart', requireAuth, CartController.view);
r.patch('/cart/items/:ticketInfoId',requireAuth,CartController.patchItem)
r.delete('/cart', requireAuth, CartController.clear);
r.post('/cart/checkout', requireAuth, CartController.checkout);

/* ---------- PAYMENTS ---------- */
r.post('/payments/verify-card', requireAuth, PaymentsController.verifyCard);
r.delete('/me/payment-methods/:paymentInfoId', requireAuth, PaymentsController.deletePaymentMethod);

/* ---------- NOTIFICATIONS ---------- */
// Processes and sends all pending notifications due as of "now"
r.get('/notifications/due', requireAuth, NotificationController.getDue);

// Create/schedule a new notification for an event (requires body.eventId)
r.post('/notifications', requireAuth, NotificationController.create);
/* ---------- TICKETS ---------- */
r.get('/me/tickets', requireAuth, TicketsController.getMyTickets);
r.get('/tickets/:id',requireAuth, TicketsController.getTicketById)
r.get('/events/:eventId/tickets/validate',requireAuth,TicketsController.validateForEvent)
module.exports = r;
