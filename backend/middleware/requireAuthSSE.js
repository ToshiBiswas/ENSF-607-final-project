
// middleware/requireAuthSSE.js
'use strict';
const jwt = require('jsonwebtoken');
async function requireAuthSSE(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    let token = (auth.startsWith('Bearer ') && auth.split(' ')[1]) || null;
    token = token || req.query.access_token || req.cookies?.access_token;
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload.sub ?? payload.userId ?? payload.id;
    if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' } });
    req.user = { userId, email: payload.email || null, name: null };
    req.auth = { token, payload };
    next();
  } catch (e) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid/expired token' } });
  }
}
module.exports = { requireAuthSSE };
