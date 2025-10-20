const express = require('express');
const db = require('../db/knex');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

/**
 * GET /api/tickets
 * Query: page, pageSize, status, upcoming (true/false), order (asc/desc)
 */
router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id; // set by auth middleware
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 100);
    const status = req.query.status;
    const upcoming = req.query.upcoming === 'true';
    const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const base = db('tickets as t')
      .leftJoin('events as e', 'e.id', 't.event_id')
      .where('t.user_id', userId)
      .modify((qb) => {
        if (status) qb.andWhere('t.status', status);
        if (upcoming) qb.andWhere('e.start_at', '>=', db.fn.now());
      });

    const [{ count }] = await base.clone().clearSelect().clearOrder()
      .count({ count: '*' });

    const rows = await base
      .select([
        't.id', 't.event_id', 't.user_id', 't.quantity',
        't.price_paid', 't.currency', 't.status',
        't.created_at', 't.updated_at',
        'e.title as event_title', 'e.venue as event_venue',
        'e.start_at as event_start', 'e.end_at as event_end',
      ])
      .orderBy('t.created_at', order)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    res.json({ page, pageSize, total: Number(count), data: rows });
  } catch (err) {
    console.error('[GET /tickets] error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
