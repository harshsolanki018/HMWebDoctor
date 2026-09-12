const crypto = require('crypto');
const { fetchSafeUrl, ScannerFetchError } = require('./safeFetcher');
const { analyzeBaseline } = require('../scanners/baselineAnalyzer');

/**
 * Executes a website scan.
 * Retrieves target HTML via secure safeFetcher, parses baseline document metadata,
 * and constructs an ephemeral scan result.
 *
 * @param {string} targetUrl Target URL to scan
 * @returns {Promise<object>} Standardized scan result object
 */
async function executeScan(targetUrl) {
  const startTime = Date.now();

  const fetchResult = await fetchSafeUrl(targetUrl);
  const durationMs = Date.now() - startTime;

  const baseline = analyzeBaseline(fetchResult.html);

  const scanId = `scan_${crypto.randomBytes(8).toString('hex')}`;

  const scanResult = {
    scanId,
    targetUrl: fetchResult.targetUrl,
    finalUrl: fetchResult.finalUrl,
    redirectCount: fetchResult.redirectCount,
    redirectChain: fetchResult.redirectChain,
    status: 'completed',
    timing: {
      durationMs,
      fetchedAt: new Date().toISOString(),
    },
    document: {
      statusCode: fetchResult.statusCode,
      contentType: fetchResult.contentType,
      contentLengthBytes: fetchResult.contentLengthBytes,
      baseline,
    },
  };

  return scanResult;
}

module.exports = {
  executeScan,
  ScannerFetchError,
};
