
// middleware/EmitAuthenticatedRequest.js
'use strict';
class EmitAuthenticatedRequest {
  constructor(emitter) { this.emitter = emitter; this.handle = this.handle.bind(this); }
  async handle(req, _res, next) {
    if (req.user) this.emitter.emit('auth.request', req.user, {}, req).catch(() => {});
    next();
  }
}
module.exports = { EmitAuthenticatedRequest };
