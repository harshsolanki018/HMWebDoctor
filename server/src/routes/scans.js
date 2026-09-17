const express = require('express');
const { validateScanRequest } = require('../validators/scanValidator');
const scanRateLimiter = require('../middleware/scanRateLimiter');
const reportRateLimiter = require('../middleware/reportRateLimiter');
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

router.get('/:scanId', reportRateLimiter, async (req, res, next) => {
  try {
    const { scanId } = req.params;
    if (!scanId || !/^scan_[a-f0-9]{16}$/.test(scanId)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'INVALID_SCAN_ID',
          message: 'Invalid scan ID format. Expected scan_[16 hex characters].',
          details: null,
        },
      });
    }

    const reportDto = await scanService.getScanById(scanId);

    return res.status(200).json({
      success: true,
      data: reportDto,
      error: null,
    });
  } catch (err) {
    if (err.code === 'INVALID_SCAN_ID') {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: err.code,
          message: err.message,
          details: null,
        },
      });
    }
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({
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
