/**
 * asyncHandler: turns an async controller into a safe Express handler.
 * Eliminates repetitive try/catch and ensures errors hit our middleware.
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    try {
      // Support both sync and async handlers
      return Promise.resolve(fn(req, res, next)).catch(next);
    } catch (err) {
      return next(err);
    }
  };
};
