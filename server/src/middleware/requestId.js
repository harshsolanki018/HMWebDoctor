const crypto = require('crypto');

/**
 * Validates whether a request ID string is safe and bounded.
 * Must be 8-64 alphanumeric characters, hyphens, or underscores.
 * @param {string} id 
 * @returns {boolean}
 */
const isValidRequestId = (id) => {
  return typeof id === 'string' && /^[a-zA-Z0-9\-_]{8,64}$/.test(id);
};

/**
 * Middleware that attaches a request ID to req and res headers.
 * Accepts safe incoming X-Request-Id header or generates a new UUID.
 */
const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'] || req.headers['X-Request-Id'];

  const reqId = isValidRequestId(incomingId)
    ? incomingId
    : `req_${crypto.randomUUID().replace(/-/g, '')}`;

  req.id = reqId;
  req.requestId = reqId;

  res.setHeader('X-Request-Id', reqId);
  next();
};

module.exports = {
  requestIdMiddleware,
  isValidRequestId,
};
