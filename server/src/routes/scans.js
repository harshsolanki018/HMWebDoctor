const express = require('express');
const { validateScanRequest } = require('../validators/scanValidator');
const scanRateLimiter = require('../middleware/scanRateLimiter');
const scanService = require('../services/scanService');

const router = express.Router();

router.post('/', scanRateLimiter, validateScanRequest, async (req, res, next) => {
  try {
    const { url } = req.validatedBody;
    const scanData = await scanService.executeScan(url);

    return res.status(200).json({
      success: true,
      data: scanData,
      error: null,
    });
  } catch (err) {
    if (err instanceof scanService.ScannerFetchError || err.name === 'ScannerFetchError') {
      let statusCode = 500;
      switch (err.code) {
        case 'INVALID_URL':
        case 'UNSUPPORTED_PROTOCOL':
        case 'UNSAFE_DESTINATION':
        case 'REDIRECT_LIMIT_EXCEEDED':
          statusCode = 400;
          break;
        case 'UNSUPPORTED_CONTENT_TYPE':
          statusCode = 415;
          break;
        case 'RESPONSE_TOO_LARGE':
          statusCode = 413;
          break;
        case 'REQUEST_TIMEOUT':
          statusCode = 504;
          break;
        case 'UPSTREAM_ERROR':
          statusCode = 502;
          break;
        default:
          statusCode = 500;
      }

      return res.status(statusCode).json({
        success: false,
        data: null,
        error: {
          code: err.code,
          message: err.message,
          details: null,
        },
      });
    }

    next(err);
  }
});

module.exports = router;
