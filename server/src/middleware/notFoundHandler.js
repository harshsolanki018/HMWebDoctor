/**
 * 404 Not Found Middleware
 */
const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
};

module.exports = notFoundHandler;
