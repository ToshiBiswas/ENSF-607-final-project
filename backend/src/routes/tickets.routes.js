// src/routes/tickets.routes.js
const express = require('express');
const asyncH = require('../utils/handler');
const { requireAuth } = require('../middleware/auth');
const TicketsController = require('../controllers/TicketsController');

const router = express.Router();

router.post('/', requireAuth, asyncH(TicketsController.createTicket));
router.get('/', requireAuth, asyncH(TicketsController.getMyTickets));
router.get('/:id', requireAuth, asyncH(TicketsController.getTicketById));

module.exports = router;
