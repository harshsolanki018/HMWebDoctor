const htmlparser2 = require('htmlparser2');
const { fetchSafeUrl } = require('../services/safeFetcher');

/**
 * Crawlability & Indexability Analyzer
 * Inspects crawling directives (X-Robots-Tag, HTML sitemap link) and performs a strictly bounded
 * single fetch to <origin>/robots.txt using M3 fetchSafeUrl.
 *
 * @param {string} html Raw HTML body
 * @param {object} headers HTTP headers from primary page fetch
 * @param {string} finalUrl Scanned page URL
 * @param {Function} [fetchFn] Optional fetcher override for testing
 * @returns {Promise<object>} { summary: { pass, warn, fail, info }, findings: [...] }
 */
async function analyzeCrawlability(html = '', headers = {}, finalUrl = '', fetchFn = fetchSafeUrl) {
  const findings = [];

  // Lowercase headers for lookup
  const lowerHeaders = {};
  if (headers && typeof headers === 'object') {
    for (const key of Object.keys(headers)) {
      lowerHeaders[key.toLowerCase()] = headers[key];
    }
  }

  // 1. X-Robots-Tag Header Check
  const xRobotsTag = lowerHeaders['x-robots-tag'];
  if (!xRobotsTag) {
    findings.push({
      id: 'crawl-x-robots-tag',
      category: 'crawlability',
      status: 'info',
      severity: 'info',
      title: 'X-Robots-Tag Header',
      message: 'No X-Robots-Tag header returned.',
      value: null,
      recommendation: 'Use X-Robots-Tag headers if non-HTML assets require indexing directives.',
    });
  } else {
    const val = String(xRobotsTag);
    const lowerVal = val.toLowerCase();
    if (lowerVal.includes('noindex') || lowerVal.includes('nofollow')) {
      findings.push({
        id: 'crawl-x-robots-tag',
        category: 'crawlability',
        status: 'info',
        severity: 'info',
        title: 'X-Robots-Tag Directive',
        message: `X-Robots-Tag header restricts indexing (${val}).`,
        value: val,
        recommendation: 'Verify that X-Robots-Tag indexing restrictions are intentional.',
      });
    } else {
      findings.push({
        id: 'crawl-x-robots-tag',
        category: 'crawlability',
        status: 'pass',
        severity: 'info',
        title: 'X-Robots-Tag Header',
        message: `X-Robots-Tag header permits crawling (${val}).`,
        value: val,
        recommendation: 'Maintain appropriate search robot indexing headers.',
      });
    }
  }

  // 2. HTML Sitemap Link Tag Check
  let sitemapHref = null;
  if (typeof html === 'string') {
    const parser = new htmlparser2.Parser({
      onopentag(name, attribs) {
        if (name.toLowerCase() === 'link') {
          const rel = (attribs.rel || '').toLowerCase();
          if (rel === 'sitemap' && attribs.href) {
            sitemapHref = attribs.href.trim();
          }
        }
      },
    });
    parser.write(html);
    parser.end();
  }

  if (sitemapHref) {
    findings.push({
      id: 'crawl-html-sitemap',
      category: 'crawlability',
      status: 'pass',
      severity: 'info',
      title: 'HTML Sitemap Reference',
      message: `Sitemap link reference found in HTML head (${sitemapHref}).`,
      value: sitemapHref,
      recommendation: 'Ensure sitemap link points to a valid XML sitemap.',
    });
  } else {
    findings.push({
      id: 'crawl-html-sitemap',
      category: 'crawlability',
      status: 'info',
      severity: 'info',
      title: 'HTML Sitemap Reference',
      message: 'No sitemap link tag found in HTML head.',
      value: null,
      recommendation: 'Consider declaring <link rel="sitemap" type="application/xml" href="/sitemap.xml"> in your HTML head.',
    });
  }

  // 3. Strictly Bounded Robots.txt Inspection
  // Derive <origin>/robots.txt from finalUrl
  try {
    const parsedUrl = new URL(finalUrl);
    const robotsUrl = `${parsedUrl.origin}/robots.txt`;

    try {
      // Execute single safe fetch to <origin>/robots.txt
      const fetchResult = await fetchFn(robotsUrl);

      if (fetchResult && fetchResult.statusCode === 200 && typeof fetchResult.html === 'string') {
        const bodyText = fetchResult.html;
        const lines = bodyText.split('\n');
        let disallowCount = 0;
        let sitemapCount = 0;

        for (const line of lines) {
          const trimmed = line.trim().toLowerCase();
          if (trimmed.startsWith('disallow:')) {
            disallowCount++;
          }
          if (trimmed.startsWith('sitemap:')) {
            sitemapCount++;
          }
        }

        findings.push({
          id: 'crawl-robots-txt',
          category: 'crawlability',
          status: 'pass',
          severity: 'info',
          title: 'Robots.txt File',
          message: 'Robots.txt file is present and accessible at root origin.',
          value: {
            exists: true,
            statusCode: 200,
            hasDisallowRules: disallowCount > 0,
            hasSitemapDirective: sitemapCount > 0,
            disallowRuleCount: disallowCount,
            sitemapDirectiveCount: sitemapCount,
          },
          recommendation: 'Maintain valid robots.txt directives and ensure critical public routes are accessible.',
        });
      } else {
        findings.push({
          id: 'crawl-robots-txt',
          category: 'crawlability',
          status: 'info',
          severity: 'info',
          title: 'Robots.txt File',
          message: 'Robots.txt file was not found or returned a non-200 status code.',
          value: {
            exists: false,
            statusCode: fetchResult ? fetchResult.statusCode : null,
          },
          recommendation: 'Consider creating a robots.txt file at the root origin to guide search engine crawlers.',
        });
      }
    } catch (fetchErr) {
      // Bounded inspection failure must NEVER crash the primary scan
      findings.push({
        id: 'crawl-robots-txt',
        category: 'crawlability',
        status: 'info',
        severity: 'info',
        title: 'Robots.txt File',
        message: 'Robots.txt file could not be retrieved from origin.',
        value: {
          exists: false,
          statusCode: fetchErr.statusCode || null,
        },
        recommendation: 'Consider creating a robots.txt file at the root origin to guide search engine crawlers.',
      });
    }
  } catch {
    // If URL parsing fails for any reason
    findings.push({
      id: 'crawl-robots-txt',
      category: 'crawlability',
      status: 'info',
      severity: 'info',
      title: 'Robots.txt File',
      message: 'Unable to derive origin for robots.txt inspection.',
      value: { exists: false },
      recommendation: 'Ensure standard URL format for origin resolution.',
    });
  }

  const summary = {
    pass: findings.filter((f) => f.status === 'pass').length,
    warn: findings.filter((f) => f.status === 'warn').length,
    fail: findings.filter((f) => f.status === 'fail').length,
    info: findings.filter((f) => f.status === 'info').length,
  };

  return { summary, findings };
}

module.exports = {
  analyzeCrawlability,
};
