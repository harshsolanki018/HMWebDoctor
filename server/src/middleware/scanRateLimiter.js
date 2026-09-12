const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const scanRateLimiter = rateLimit({
  windowMs: config.SCAN_RATE_LIMIT_WINDOW_MS,
  max: config.SCAN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      error: {
        code: 'SCAN_RATE_LIMITED',
        message: 'Scan rate limit exceeded. Please wait before initiating another scan.',
        details: null,
      },
    });
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip rate limiting during test runs
});

module.exports = scanRateLimiter;
