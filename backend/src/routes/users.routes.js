const express = require('express');
const ctrl = require('../controllers/users.controller');
const asyncH = require('../middleware/async');
const auth = require('../middleware/auth');
const { selfOrAdmin } = require('../middleware/allow');

const router = express.Router();

// Validate/normalize :id once for all handlers
router.param('id', (req, res, next, id) => {
  const n = Number.parseInt(String(id).trim(), 10);
  if (!Number.isInteger(n) || n <= 0) {
    return res.status(400).json({ message: 'Invalid user id' });
  }
  req.params.id = n;
  next();
});


// GET /api/users
router.get('/', asyncH(ctrl.listUsers));

// GET /api/users/:id
router.get('/:id', asyncH(ctrl.getUser));

// PUT /api/users/:id  (JWT: self or admin)
router.put('/:id', auth, selfOrAdmin, asyncH(ctrl.updateUser));

// DELETE /api/users/:id (JWT: self or admin)
router.delete('/:id', auth, selfOrAdmin, asyncH(ctrl.deleteUser));

module.exports = router;
