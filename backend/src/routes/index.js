const express = require('express');
const tickets = require('./tickets');

const router = express.Router();
router.use(tickets);            // mounts /tickets
module.exports = router;