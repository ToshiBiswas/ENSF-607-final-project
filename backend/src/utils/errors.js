/**
 * Error helpers.
 *
 * AppError is our user-facing error with an HTTP status code.
 * errorMiddleware formats errors consistently and avoids leaking internals.
 */

class AppError extends Error {
  /**
   * @param {string} message - user-visible message
   * @param {number} [status=400] - HTTP status code
   * @param {object} [extra={}] - additional JSON to include in response
   */
  constructor(message, status = 400, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

/**
 * 404 passthrough to central handler
 */
function notFound(_req, _res, next) {
  next(new AppError('Not Found', 404));
}

/**
 * Central error shape; never reveal stack traces in production.
 * You can extend this to emit structured logs.
 */
function errorMiddleware(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error' });
}

module.exports = { AppError, errorMiddleware, notFound };
