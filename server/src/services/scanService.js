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
const contentAnalyzer = require('../scanners/contentAnalyzer');
const actionCenterService = require('./actionCenterService');

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
 * executes modular analyzers (SEO, Security Headers, Crawlability, Technical, Performance, Accessibility, Mobile, Content),
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

  // 8. Content & Technical HTML Quality Analyzer (M7)
  let contentResult;
  try {
    const res = contentAnalyzer.analyzeContent(fetchResult.html, fetchResult);
    contentResult = {
      status: 'completed',
      summary: res.summary,
      findings: res.findings,
    };
  } catch {
    contentResult = createCategoryErrorResult('content');
  }

  const categoryList = [
    seoResult,
    securityHeadersResult,
    crawlabilityResult,
    technicalResult,
    performanceResult,
    accessibilityResult,
    mobileResult,
    contentResult,
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
      content: contentResult,
    },
  };

  try {
    scanResult.actionCenter = actionCenterService.buildActionCenter(scanResult.categories);
  } catch {
    scanResult.actionCenter = {
      status: 'error',
      summary: { actionable: 0, high: 0, medium: 0, low: 0 },
      domainCounts: { security: 0, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 },
      items: [],
    };
  }

  // M9: Build Public Report DTO (Canonical Security Boundary)
  const publicDto = buildPublicReportDto(scanResult);
  scanResult.isPersisted = false;

  // Check MongoDB readiness & 5MB Application Payload Boundary
  const mongoose = require('mongoose');
  const Scan = require('../models/Scan');
  const logger = require('../utils/logger');

  const payloadSizeBytes = Buffer.byteLength(JSON.stringify(publicDto), 'utf8');
  const MAX_REPORT_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MiB

  if (payloadSizeBytes <= MAX_REPORT_PAYLOAD_BYTES && mongoose.connection && mongoose.connection.readyState === 1) {
    try {
      const createPromise = Scan.create(publicDto).catch((err) => {
        logger.warn(`Scan persistence background error for ${scanId}: ${err.message}`);
        return null;
      });

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve('TIMEOUT'), 2000);
      });

      const raceResult = await Promise.race([createPromise, timeoutPromise]);

      if (raceResult && raceResult !== 'TIMEOUT') {
        scanResult.isPersisted = true;
      } else if (raceResult === 'TIMEOUT') {
        logger.warn(`Scan persistence write timed out (>2000ms) for ${scanId}`);
      }
    } catch (dbErr) {
      logger.warn(`Scan persistence write failed for ${scanId}: ${dbErr.message}`);
    }
  } else if (payloadSizeBytes > MAX_REPORT_PAYLOAD_BYTES) {
    logger.warn(`Scan report payload exceeds 5MB limit (${payloadSizeBytes} bytes) for ${scanId}. Skipping persistence.`);
  }

  return scanResult;
}

/**
 * Sanitizes a URL for public DTO and database persistence.
 * Strips credentials, ENTIRE query string, and ENTIRE fragment 100%.
 * Preserves scheme, host, and pathname.
 *
 * @param {string} rawUrl 
 * @returns {string} Sanitized URL string
 */
function sanitizePublicUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl);
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return rawUrl.split('?')[0].split('#')[0];
  }
}

/**
 * Constructs the canonical public report DTO from a scan result or database document.
 * Enforces explicit field allowlist and URL sanitization.
 *
 * @param {object} raw 
 * @returns {object} Public report DTO
 */
function buildPublicReportDto(raw) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    scanId: raw.scanId,
    targetUrl: sanitizePublicUrl(raw.targetUrl),
    finalUrl: sanitizePublicUrl(raw.finalUrl),
    statusCode: raw.document?.statusCode || raw.statusCode || 200,
    timing: {
      durationMs: raw.timing?.durationMs || 0,
      fetchedAt: raw.timing?.fetchedAt || (raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString()),
    },
    document: {
      statusCode: raw.document?.statusCode || raw.statusCode || 200,
      contentType: raw.document?.contentType || '',
      contentLengthBytes: raw.document?.contentLengthBytes || 0,
      baseline: {
        title: raw.document?.baseline?.title || '',
        lang: raw.document?.baseline?.lang || '',
        charset: raw.document?.baseline?.charset || '',
        description: raw.document?.baseline?.description || '',
        hasDoctype: Boolean(raw.document?.baseline?.hasDoctype),
      },
    },
    summary: {
      pass: raw.summary?.pass || 0,
      warn: raw.summary?.warn || 0,
      fail: raw.summary?.fail || 0,
      info: raw.summary?.info || 0,
    },
    categories: {
      seo: raw.categories?.seo || { status: 'completed', summary: {}, findings: [] },
      securityHeaders: raw.categories?.securityHeaders || { status: 'completed', summary: {}, findings: [] },
      crawlability: raw.categories?.crawlability || { status: 'completed', summary: {}, findings: [] },
      technical: raw.categories?.technical || { status: 'completed', summary: {}, findings: [] },
      performance: raw.categories?.performance || { status: 'completed', summary: {}, findings: [] },
      accessibility: raw.categories?.accessibility || { status: 'completed', summary: {}, findings: [] },
      mobile: raw.categories?.mobile || { status: 'completed', summary: {}, findings: [] },
      content: raw.categories?.content || { status: 'completed', summary: {}, findings: [] },
    },
    actionCenter: raw.actionCenter || {
      status: 'completed',
      summary: { actionable: 0, high: 0, medium: 0, low: 0 },
      domainCounts: { security: 0, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 },
      items: [],
    },
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Retrieves a persisted scan report by scanId.
 * Validates scanId format and returns a sanitized public report DTO.
 *
 * @param {string} scanId 
 * @returns {Promise<object>} Public report DTO
 */
async function getScanById(scanId) {
  if (!scanId || typeof scanId !== 'string' || !/^scan_[a-f0-9]{16}$/.test(scanId)) {
    const err = new Error('Invalid scan ID format. Expected scan_[16 hex characters].');
    err.code = 'INVALID_SCAN_ID';
    throw err;
  }

  const mongoose = require('mongoose');
  const Scan = require('../models/Scan');

  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    const err = new Error('Report storage is temporarily unavailable.');
    err.code = 'DATABASE_UNAVAILABLE';
    throw err;
  }

  const doc = await Scan.findOne({ scanId }).lean().exec();
  if (!doc) {
    const err = new Error('Scan report not found or expired.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  return buildPublicReportDto(doc);
}

module.exports = {
  executeScan,
  getScanById,
  sanitizePublicUrl,
  buildPublicReportDto,
  ScannerFetchError: safeFetcher.ScannerFetchError,
};
