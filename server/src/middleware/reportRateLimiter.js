const rateLimit = require('express-rate-limit');

const reportRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 60, // 60 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      data: null,
      error: {
        code: 'REPORT_RATE_LIMITED',
        message: 'Report request rate limit exceeded. Please wait before requesting another report.',
        details: null,
      },
    });
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip rate limiting in unit test environment
});

module.exports = reportRateLimiter;
