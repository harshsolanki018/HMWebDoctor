const { buildActionCenter, DOMAIN_MAP } = require('../src/services/actionCenterService');

describe('Action Center Service Suite (M8)', () => {
  it('includes only fail and warn findings as actionable, excluding info, pass, and category-error findings', () => {
    const mockCategories = {
      seo: {
        status: 'completed',
        summary: { pass: 1, warn: 1, fail: 1, info: 1 },
        findings: [
          { id: 'seo-title', category: 'seo', status: 'pass', severity: 'info', title: 'Title Pass' },
          { id: 'seo-meta-description', category: 'seo', status: 'warn', severity: 'medium', title: 'Description Warn' },
          { id: 'seo-heading-h1', category: 'seo', status: 'fail', severity: 'high', title: 'H1 Fail' },
          { id: 'seo-canonical', category: 'seo', status: 'info', severity: 'info', title: 'Canonical Info' },
          { id: 'category-error', category: 'seo', status: 'fail', severity: 'medium', title: 'Error' },
        ],
      },
    };

    const res = buildActionCenter(mockCategories);
    expect(res.status).toBe('completed');
    expect(res.summary.actionable).toBe(2); // Only warn and fail
    expect(res.items.map((i) => i.findingId).sort()).toEqual(['seo-heading-h1', 'seo-meta-description']);
    // Verify item exposes required fields including message
    expect(res.items[0]).toHaveProperty('message');
    expect(res.items[0]).toHaveProperty('recommendation');
    expect(res.items[0]).toHaveProperty('remediation');
  });

  it('maps all 55 exact finding IDs to exactly one of the 5 technical domains', () => {
    const domainKeys = new Set(['security', 'accessibility', 'performance', 'seo_crawlability', 'markup_structure']);
    const mappedIds = Object.keys(DOMAIN_MAP);

    expect(mappedIds.length).toBe(55);
    mappedIds.forEach((id) => {
      const domain = DOMAIN_MAP[id];
      expect(domainKeys.has(domain)).toBe(true);
    });
  });

  it('sorts action items deterministically using the 5-tier sorting algorithm with ties at each layer', () => {
    const mockCategories = {
      // Tier 1: Severity tie (high vs high) -> Tier 2: Domain (security > accessibility)
      accessibility: {
        status: 'completed',
        summary: { pass: 0, warn: 1, fail: 0, info: 0 },
        findings: [
          { id: 'a11y-image-alt', category: 'accessibility', status: 'warn', severity: 'high', title: 'High A11y' },
        ],
      },
      securityHeaders: {
        status: 'completed',
        summary: { pass: 0, warn: 1, fail: 0, info: 0 },
        findings: [
          { id: 'sec-csp', category: 'securityHeaders', status: 'fail', severity: 'high', title: 'High Sec' },
        ],
      },
      // Tier 2 & Tier 3: Same Domain (accessibility), Category tie (accessibility vs mobile)
      mobile: {
        status: 'completed',
        summary: { pass: 0, warn: 1, fail: 0, info: 0 },
        findings: [
          { id: 'mobile-viewport-zoom', category: 'mobile', status: 'warn', severity: 'medium', title: 'Medium Mobile' },
        ],
      },
      // Tier 4: Category tie (content vs content), Finding ID Alphabetical (content-duplicate-ids vs content-empty-page)
      content: {
        status: 'completed',
        summary: { pass: 0, warn: 2, fail: 0, info: 0 },
        findings: [
          { id: 'content-empty-page', category: 'content', status: 'warn', severity: 'low', title: 'Low Empty' },
          { id: 'content-duplicate-ids', category: 'content', status: 'warn', severity: 'low', title: 'Low Duplicate' },
        ],
      },
    };

    const res = buildActionCenter(mockCategories);

    // 1st: sec-csp (high severity, security domain)
    expect(res.items[0].findingId).toBe('sec-csp');
    // 2nd: a11y-image-alt (high severity, accessibility domain)
    expect(res.items[1].findingId).toBe('a11y-image-alt');
    // 3rd: mobile-viewport-zoom (medium severity, accessibility domain, mobile category)
    expect(res.items[2].findingId).toBe('mobile-viewport-zoom');
    // 4th: content-duplicate-ids (low severity, markup_structure domain, content category, ID 'content-duplicate-ids' < 'content-empty-page')
    expect(res.items[3].findingId).toBe('content-duplicate-ids');
    // 5th: content-empty-page
    expect(res.items[4].findingId).toBe('content-empty-page');
  });

  it('does NOT mutate the original category findings in-place', () => {
    const originalFindings = [
      { id: 'sec-hsts', category: 'securityHeaders', status: 'warn', severity: 'medium', title: 'HSTS' },
    ];
    const originalCopy = JSON.parse(JSON.stringify(originalFindings));
    const mockCategories = {
      securityHeaders: { status: 'completed', summary: { pass: 0, warn: 1, fail: 0, info: 0 }, findings: originalFindings },
    };

    buildActionCenter(mockCategories);
    expect(originalFindings).toEqual(originalCopy);
    expect(originalFindings[0].remediation).toBeUndefined();
  });

  it('handles empty/missing categories or unknown finding IDs safely without crashing', () => {
    const mockCategories = {
      customCategory: {
        status: 'completed',
        summary: { pass: 0, warn: 1, fail: 0, info: 0 },
        findings: [
          { id: 'unknown-finding-xyz', category: 'customCategory', status: 'warn', severity: 'medium', title: 'Unknown' },
        ],
      },
    };

    const res = buildActionCenter(mockCategories);
    expect(res.status).toBe('completed');
    expect(res.summary.actionable).toBe(1);
    expect(res.items[0].domain).toBe('markup_structure'); // Defaults safely
    expect(res.items[0].remediation).toBeNull();
  });

  it('isolates unexpected exceptions and returns safe error payload', () => {
    const res = buildActionCenter(null);
    expect(res.status).toBe('completed');
    expect(res.summary.actionable).toBe(0);

    const brokenCategories = {
      get seo() {
        throw new Error('SIMULATED_ACTION_CENTER_CRASH');
      },
    };

    const errRes = buildActionCenter(brokenCategories);
    expect(errRes.status).toBe('error');
    expect(errRes.summary).toEqual({ actionable: 0, high: 0, medium: 0, low: 0 });
    expect(errRes.domainCounts).toEqual({ security: 0, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 });
    expect(errRes.items).toEqual([]);
  });
});
