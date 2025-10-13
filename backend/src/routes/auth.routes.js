const express = require('express');
const ctrl = require('../controllers/auth.controller');
const asyncH = require('../middleware/async');

const router = express.Router();

router.post('/register', asyncH(ctrl.register));
router.post('/login', asyncH(ctrl.login));

module.exports = router;
