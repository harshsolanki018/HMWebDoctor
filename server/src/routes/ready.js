const express = require('express');
const { getDBStatus } = require('../config/db');

const router = express.Router();

/**
 * GET /api/ready
 * Readiness endpoint indicating whether report storage is ready for persistence operations.
 */
router.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const isReady = dbStatus === 'healthy';

  if (isReady) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'READY',
        ready: true,
      },
      error: null,
    });
  }

  return res.status(503).json({
    success: false,
    data: {
      status: 'NOT_READY',
      ready: false,
    },
    error: {
      code: 'SERVICE_NOT_READY',
      message: 'Report storage service is not ready to perform persistence operations.',
    },
  });
});

module.exports = router;
