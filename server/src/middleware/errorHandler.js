const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Central Error Handler Middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  // Log sanitized error internally
  logger.error('request_error', err.message || 'An unexpected error occurred', {
    code: errorCode,
    statusCode,
    path: req.originalUrl,
    method: req.method,
  });

  // Client response format - sanitize error details
  const message =
    statusCode === 500 && config.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'An error occurred';

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: errorCode,
      message,
    },
  });
};

module.exports = errorHandler;
