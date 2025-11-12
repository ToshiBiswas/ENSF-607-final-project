const express = require('express');
const router = express.Router();
const { requestPayoutSummary } = require('../services/payout.service.cjs');

router.get('/events/:eventId/request-payout', async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    if (!eventId) {
      return res.status(400).json({ ok: false, error: 'Invalid eventId' });
    }

    const userId = req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized (missing user identity)' });
    }

    const out = await requestPayoutSummary({ eventId, userId });
    return res.json(out);
  } catch (err) {
    const status = err?.status || 500;
    return res.status(status).json({
      ok: false,
      error: err?.message || 'Internal server error',
      ...(err?.totals ? { totals: err.totals } : {}),
    });
  }
});

module.exports = router;
