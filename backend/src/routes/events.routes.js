const express = require('express');
const asyncH = require('../middleware/async');
const { requireAuth } = require('../middleware/auth'); // you already have this
const EventsController = require('../controllers/events.controller');

const router = express.Router();

// Public
router.get('/:id', asyncH(EventsController.getEventInfo));

// Authenticated + Owner/Admin only
router.post('/',       requireAuth, asyncH(EventsController.createEvent));
router.put('/:id',     requireAuth, asyncH(EventsController.updateEvent));
router.delete('/:id',  requireAuth, asyncH(EventsController.deleteEvent));

module.exports = router;
