const crypto = require('crypto');
const safeFetcher = require('./safeFetcher');
const baselineAnalyzer = require('../scanners/baselineAnalyzer');
const seoAnalyzer = require('../scanners/seoAnalyzer');
const securityHeadersAnalyzer = require('../scanners/securityHeadersAnalyzer');
const crawlabilityAnalyzer = require('../scanners/crawlabilityAnalyzer');
const technicalAnalyzer = require('../scanners/technicalAnalyzer');
const performanceAnalyzer = require('../scanners/performanceAnalyzer');
const accessibilityAnalyzer = require('../scanners/accessibilityAnalyzer');
const mobileAnalyzer = require('../scanners/mobileAnalyzer');

/**
 * Creates a standard category error finding object for isolated analyzer failures.
 * @param {string} categoryName 
 * @returns {object}
 */
function createCategoryErrorResult(categoryName) {
  return {
    status: 'error',
    summary: { pass: 0, warn: 0, fail: 1, info: 0 },
    findings: [
      {
        id: 'category-error',
        category: categoryName,
        status: 'fail',
        severity: 'medium',
        title: 'Analysis Error',
        message: 'An unexpected error occurred during category analysis.',
        value: null,
        recommendation: 'Re-run the scan. If the error persists, verify the target server response structure.',
      },
    ],
  };
}

/**
 * Executes a comprehensive passive website scan.
 * Retrieves target HTML via secure safeFetcher, parses baseline document metadata,
 * executes modular analyzers (SEO, Security Headers, Crawlability, Technical, Performance, Accessibility, Mobile),
 * isolates category failures, and constructs a normalized result.
 *
 * @param {string} targetUrl Target URL to scan
 * @returns {Promise<object>} Standardized scan result object
 */
async function executeScan(targetUrl) {
  const startTime = Date.now();

  const fetchResult = await safeFetcher.fetchSafeUrl(targetUrl);
  const durationMs = Date.now() - startTime;

  const baseline = baselineAnalyzer.analyzeBaseline(fetchResult.html);

  // 1. SEO Analyzer
  let seoResult;
  try {
    const res = seoAnalyzer.analyzeSeo(fetchResult.html, fetchResult.finalUrl);
    seoResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    seoResult = createCategoryErrorResult('seo');
  }

  // 2. Security Headers Analyzer
  let securityHeadersResult;
  try {
    const res = securityHeadersAnalyzer.analyzeSecurityHeaders(fetchResult.headers, fetchResult.finalUrl);
    securityHeadersResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    securityHeadersResult = createCategoryErrorResult('securityHeaders');
  }

  // 3. Crawlability Analyzer
  let crawlabilityResult;
  try {
    const res = await crawlabilityAnalyzer.analyzeCrawlability(fetchResult.html, fetchResult.headers, fetchResult.finalUrl);
    crawlabilityResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    crawlabilityResult = createCategoryErrorResult('crawlability');
  }

  // 4. Technical Analyzer
  let technicalResult;
  try {
    const res = technicalAnalyzer.analyzeTechnical(fetchResult, baseline);
    technicalResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    technicalResult = createCategoryErrorResult('technical');
  }

  // 5. Performance Analyzer (M5)
  let performanceResult;
  try {
    const res = performanceAnalyzer.analyzePerformance(fetchResult.html, fetchResult.headers);
    performanceResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    performanceResult = createCategoryErrorResult('performance');
  }

  // 6. Accessibility Analyzer (M6)
  let accessibilityResult;
  try {
    const res = accessibilityAnalyzer.analyzeAccessibility(fetchResult.html, baseline);
    accessibilityResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    accessibilityResult = createCategoryErrorResult('accessibility');
  }

  // 7. Mobile Responsiveness Analyzer (M6)
  let mobileResult;
  try {
    const res = mobileAnalyzer.analyzeMobile(fetchResult.html, baseline, seoResult);
    mobileResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    mobileResult = createCategoryErrorResult('mobile');
  }

  const categoryList = [
    seoResult,
    securityHeadersResult,
    crawlabilityResult,
    technicalResult,
    performanceResult,
    accessibilityResult,
    mobileResult,
  ];
  const overallSummary = {
    pass: categoryList.reduce((acc, cat) => acc + (cat.summary?.pass || 0), 0),
    warn: categoryList.reduce((acc, cat) => acc + (cat.summary?.warn || 0), 0),
    fail: categoryList.reduce((acc, cat) => acc + (cat.summary?.fail || 0), 0),
    info: categoryList.reduce((acc, cat) => acc + (cat.summary?.info || 0), 0),
  };

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
    summary: overallSummary,
    document: {
      statusCode: fetchResult.statusCode,
      contentType: fetchResult.contentType,
      contentLengthBytes: fetchResult.contentLengthBytes,
      baseline,
    },
    categories: {
      seo: seoResult,
      securityHeaders: securityHeadersResult,
      crawlability: crawlabilityResult,
      technical: technicalResult,
      performance: performanceResult,
      accessibility: accessibilityResult,
      mobile: mobileResult,
    },
  };

  return scanResult;
}

module.exports = {
  executeScan,
  ScannerFetchError: safeFetcher.ScannerFetchError,
};
