/**
 * asyncHandler: turns an async controller into a safe Express handler.
 * Eliminates repetitive try/catch and ensures errors hit our middleware.
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
