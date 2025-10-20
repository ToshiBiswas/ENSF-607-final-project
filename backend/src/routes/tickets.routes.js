const express = require('express');
const asyncH = require('../middleware/async');
const { requireAuth } = require('../middleware/auth');
const TicketsController = require('../controllers/tickets.controller');

const router = express.Router();
 
router.get('/', requireAuth, asyncH(TicketsController.getMyTickets));


router.get('/:id', requireAuth, asyncH(TicketsController.getTicketById));

module.exports = router;