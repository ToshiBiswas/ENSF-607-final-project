const express = require('express');
const ctrl = require('../controllers/users.controller');
const asyncH = require('../middleware/async');
const auth = require('../middleware/auth');
const { selfOrAdmin } = require('../middleware/allow');

const router = express.Router();

// GET /api/users
router.get('/', asyncH(ctrl.listUsers));

// GET /api/users/:id
router.get('/:id', asyncH(ctrl.getUser));

// PUT /api/users/:id  (JWT: self or admin)
router.put('/:id', auth, selfOrAdmin, asyncH(ctrl.updateUser));

// DELETE /api/users/:id (JWT: self or admin)
router.delete('/:id', auth, selfOrAdmin, asyncH(ctrl.deleteUser));

module.exports = router;
