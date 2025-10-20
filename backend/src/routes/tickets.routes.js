// src/routes/tickets.js
const express = require('express');
const asyncH = require('../middleware/async');
const { requireAuth } = require('../middleware/auth');
const TicketsController = require('../controllers/tickets.controller');

const router = express.Router();

router.post('/', requireAuth, asyncH(TicketsController.createTicket));

 
router.get('/', requireAuth, asyncH(TicketsController.getMyTickets));


router.get('/:id', requireAuth, asyncH(TicketsController.getTicketById));

module.exports = router;