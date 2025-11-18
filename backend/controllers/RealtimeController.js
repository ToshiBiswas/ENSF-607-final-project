
// controllers/RealtimeController.js
'use strict';
const express = require('express');
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const { realtimeHub } = require('../services/RealtimeHub');
const { requireAuthSSE } = require('../middleware/requireAuthSSE');
const router = express.Router();
router.get('/notifications/stream', requireAuthSSE, asyncHandler(async (req, res) => {
  res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive'});
  res.flushHeaders?.();
  const userId = req.user.userId;
  const send = (event, data) => { if (event) res.write(`event: ${event}\n`); res.write(`data: ${JSON.stringify(data)}\n\n`); };
  send('hello', { userId, ts: Date.now() });
  const unsubscribe = realtimeHub.subscribe(userId, (msg) => { send(msg.type || 'message', msg); });
  const heartbeat = setInterval(() => send('ping', { ts: Date.now() }), 15000);
  req.on('close', () => { clearInterval(heartbeat); unsubscribe(); res.end(); });
}));
module.exports = { realtimeRouter: router };
