// middleware/requireAuth.js
'use strict';

const jwt = require('jsonwebtoken');
const { knex } = require('../config/db'); // adjust if needed

/**
 * Verifies Authorization: Bearer <token>,
 * loads the user from DB, and attaches it to req.user.
 */
