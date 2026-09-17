const { getRemediationForFinding } = require('../remediation/remediationEngine');

// Domain Ranks (5 = highest)
const DOMAIN_RANKS = {
  security: 5,
  accessibility: 4,
  performance: 3,
  seo_crawlability: 2,
  markup_structure: 1,
};

// Category Ranks (8 = highest)
const CATEGORY_RANKS = {
  securityHeaders: 8,
  accessibility: 7,
  mobile: 6,
  performance: 5,
  seo: 4,
  crawlability: 3,
  technical: 2,
  content: 1,
};

// Severity Ranks (3 = highest)
const SEVERITY_RANKS = {
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

// Domain Map for all 55 exact finding IDs
const DOMAIN_MAP = {
  // Security
  'sec-https': 'security',
  'sec-hsts': 'security',
  'sec-csp': 'security',
  'sec-x-frame-options': 'security',
  'sec-x-content-type-options': 'security',
  'sec-referrer-policy': 'security',
  'sec-permissions-policy': 'security',
  'sec-cookie-flags': 'security',

  // Accessibility
  'a11y-image-alt': 'accessibility',
  'a11y-iframe-title': 'accessibility',
  'a11y-form-labels': 'accessibility',
  'a11y-button-name': 'accessibility',
  'a11y-link-name': 'accessibility',
  'a11y-aria-attributes': 'accessibility',
  'a11y-landmarks': 'accessibility',
  'a11y-table-markup': 'accessibility',
  'a11y-tabindex-positive': 'accessibility',
  'a11y-html-lang': 'accessibility',
  'mobile-viewport-zoom': 'accessibility',
  'mobile-input-types': 'accessibility',
  'mobile-inputmode': 'accessibility',
  'mobile-autocomplete': 'accessibility',

  // Performance
  'perf-blocking-scripts': 'performance',
  'perf-stylesheets-css': 'performance',
  'perf-inline-css': 'performance',
  'perf-resource-hints': 'performance',
  'perf-dom-footprint': 'performance',
  'perf-image-lazyloading': 'performance',
  'tech-compression': 'performance',
  'tech-caching': 'performance',

  // SEO & Crawlability
  'seo-title': 'seo_crawlability',
  'seo-meta-description': 'seo_crawlability',
  'seo-canonical': 'seo_crawlability',
  'seo-meta-robots': 'seo_crawlability',
  'seo-viewport': 'seo_crawlability',
  'seo-heading-h1': 'seo_crawlability',
  'seo-heading-hierarchy': 'seo_crawlability',
  'seo-opengraph': 'seo_crawlability',
  'crawl-x-robots-tag': 'seo_crawlability',
  'crawl-html-sitemap': 'seo_crawlability',
  'crawl-robots-txt': 'seo_crawlability',

  // Markup & Structure
  'content-empty-page': 'markup_structure',
  'content-low-volume': 'markup_structure',
  'content-word-count': 'markup_structure',
  'content-duplicate-paragraphs': 'markup_structure',
  'content-document-structure': 'markup_structure',
  'content-duplicate-ids': 'markup_structure',
  'content-link-classification': 'markup_structure',
  'content-href-markup': 'markup_structure',
  'content-src-markup': 'markup_structure',
  'content-image-dimensions': 'markup_structure',
  'tech-status-code': 'markup_structure',
  'tech-charset': 'markup_structure',
  'tech-doctype-size': 'markup_structure',
  'mobile-meta-tags': 'markup_structure',
};

/**
 * Derives technical domain key for a given finding ID.
 * Defaults to 'markup_structure' for unmapped/unknown finding IDs.
 * @param {string} findingId 
 * @returns {string}
 */
function getDomainForFindingId(findingId) {
  return DOMAIN_MAP[findingId] || 'markup_structure';
}

/**
 * Builds the Action Center payload from scan categories.
 * Enforces actionability rules, 5-tier deterministic sorting, domain mapping, and error boundaries.
 *
 * @param {object} categories Category scan results dictionary
 * @returns {object} Action Center payload object
 */
function buildActionCenter(categories = {}) {
  try {
    if (!categories || typeof categories !== 'object') {
      categories = {};
    }

    const rawActionItems = [];
    let globalDiscoveryIndex = 0;

    // Collect all findings across categories
    for (const [catName, catResult] of Object.entries(categories)) {
      if (!catResult || catResult.status === 'error' || !Array.isArray(catResult.findings)) {
        continue;
      }

      for (const finding of catResult.findings) {
        globalDiscoveryIndex++;
        if (!finding || typeof finding !== 'object' || !finding.id || finding.id === 'category-error') {
          continue;
        }

        // Actionability Inclusion Rule: ONLY fail or warn findings are actionable
        if (finding.status !== 'fail' && finding.status !== 'warn') {
          continue;
        }

        const domain = getDomainForFindingId(finding.id);
        const remediation = getRemediationForFinding(finding);

        rawActionItems.push({
          findingId: finding.id,
          category: catName,
          status: finding.status,
          severity: finding.severity || 'medium',
          domain,
          title: finding.title || 'Diagnostic Finding',
          message: finding.message || '',
          recommendation: finding.recommendation || '',
          remediation,
          _discoveryIndex: globalDiscoveryIndex,
        });
      }
    }

    // 5-Tier Deterministic Sorting Algorithm
    rawActionItems.sort((a, b) => {
      // 1. Severity Rank (descending)
      const sevA = SEVERITY_RANKS[a.severity] ?? 1;
      const sevB = SEVERITY_RANKS[b.severity] ?? 1;
      if (sevA !== sevB) return sevB - sevA;

      // 2. Domain Rank (descending)
      const domA = DOMAIN_RANKS[a.domain] ?? 1;
      const domB = DOMAIN_RANKS[b.domain] ?? 1;
      if (domA !== domB) return domB - domA;

      // 3. Category Rank (descending)
      const catA = CATEGORY_RANKS[a.category] ?? 1;
      const catB = CATEGORY_RANKS[b.category] ?? 1;
      if (catA !== catB) return catB - catA;

      // 4. Finding ID Alphabetical Order (ascending)
      const idCompare = a.findingId.localeCompare(b.findingId);
      if (idCompare !== 0) return idCompare;

      // 5. Original Array Index (stable tie-breaker)
      return a._discoveryIndex - b._discoveryIndex;
    });

    // Remove internal _discoveryIndex property from finalized items
    const items = rawActionItems.map(({ _discoveryIndex, ...item }) => item);

    // Calculate Summary Statistics
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    const domainCounts = {
      security: 0,
      accessibility: 0,
      performance: 0,
      seo_crawlability: 0,
      markup_structure: 0,
    };

    for (const item of items) {
      if (item.severity === 'high') highCount++;
      else if (item.severity === 'medium') mediumCount++;
      else if (item.severity === 'low') lowCount++;

      if (domainCounts[item.domain] !== undefined) {
        domainCounts[item.domain]++;
      }
    }

    return {
      status: 'completed',
      summary: {
        actionable: items.length,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
      },
      domainCounts,
      items,
    };
  } catch {
    // Isolated Action Center Failure Error Contract
    return {
      status: 'error',
      summary: {
        actionable: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      domainCounts: {
        security: 0,
        accessibility: 0,
        performance: 0,
        seo_crawlability: 0,
        markup_structure: 0,
      },
      items: [],
    };
  }
}

module.exports = {
  buildActionCenter,
  getDomainForFindingId,
  DOMAIN_MAP,
};
