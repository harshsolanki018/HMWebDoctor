const express = require('express');
const { getDBStatus } = require('../config/db');

const router = express.Router();

/**
 * GET /api/health
 * Returns service health status for API and Database.
 */
router.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'degraded';

  return res.status(200).json({
    success: true,
    data: {
      status: overallStatus,
      services: {
        api: 'healthy',
        database: dbStatus,
      },
    },
    error: null,
  });
});

module.exports = router;
