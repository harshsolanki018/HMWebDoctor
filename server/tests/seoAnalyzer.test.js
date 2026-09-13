const { analyzeSeo, normalizeUrlForComparison } = require('../src/scanners/seoAnalyzer');

describe('SEO Analyzer Scope & Boundaries Suite', () => {
  describe('normalizeUrlForComparison', () => {
    it('normalizes relative canonical URLs against base URL', () => {
      const res = normalizeUrlForComparison('/about', 'https://example.com:443/page');
      expect(res).toBe('https://example.com/about');
    });

    it('strips default ports 80 and 443', () => {
      const res1 = normalizeUrlForComparison('http://example.com:80/path/', 'http://example.com');
      expect(res1).toBe('http://example.com/path');

      const res2 = normalizeUrlForComparison('https://example.com:443/path', 'https://example.com');
      expect(res2).toBe('https://example.com/path');
    });

    it('returns null for malformed URLs', () => {
      expect(normalizeUrlForComparison('http://[invalid-host]', 'https://example.com')).toBeNull();
    });
  });

  describe('analyzeSeo Scope Verification', () => {
    it('throws TypeError if html is not a string', () => {
      expect(() => analyzeSeo(null, 'https://example.com')).toThrow(TypeError);
    });

    it('returns pass status for optimal title length (30-60 chars)', () => {
      const titleText = 'A'.repeat(45); // 45 chars
      const html = `<html><head><title>${titleText}</title></head><body></body></html>`;
      const res = analyzeSeo(html, 'https://example.com');

      const titleFinding = res.findings.find((f) => f.id === 'seo-title');
      expect(titleFinding.status).toBe('pass');
      expect(titleFinding.value).toBe(titleText);
    });

    it('returns warn status when title tag is missing', () => {
      const html = '<html><head></head><body></body></html>';
      const res = analyzeSeo(html, 'https://example.com');

      const titleFinding = res.findings.find((f) => f.id === 'seo-title');
      expect(titleFinding.status).toBe('warn');
    });

    it('returns info status when title length is outside 30-60 range', () => {
      const html = '<html><head><title>Short Title</title></head><body></body></html>';
      const res = analyzeSeo(html, 'https://example.com');

      const titleFinding = res.findings.find((f) => f.id === 'seo-title');
      expect(titleFinding.status).toBe('info');
    });

    it('handles meta description validation accurately (50-160 chars)', () => {
      const descText = 'D'.repeat(100);
      const htmlPass = `<html><head><meta name="description" content="${descText}"></head><body></body></html>`;
      const resPass = analyzeSeo(htmlPass, 'https://example.com');
      expect(resPass.findings.find((f) => f.id === 'seo-meta-description').status).toBe('pass');

      const htmlWarn = '<html><head></head><body></body></html>';
      const resWarn = analyzeSeo(htmlWarn, 'https://example.com');
      expect(resWarn.findings.find((f) => f.id === 'seo-meta-description').status).toBe('warn');
    });

    it('validates canonical URL match/mismatch purely via string normalization (never network fetches)', () => {
      const htmlMatch = '<html><head><link rel="canonical" href="https://example.com/page"></head><body></body></html>';
      const resMatch = analyzeSeo(htmlMatch, 'https://example.com/page/');
      expect(resMatch.findings.find((f) => f.id === 'seo-canonical').status).toBe('pass');

      const htmlMismatch = '<html><head><link rel="canonical" href="https://example.com/other"></head><body></body></html>';
      const resMismatch = analyzeSeo(htmlMismatch, 'https://example.com/page');
      expect(resMismatch.findings.find((f) => f.id === 'seo-canonical').status).toBe('warn');
    });

    it('evaluates meta robots, viewport, H1 counts, heading hierarchy jumps, and Open Graph tags', () => {
      const html = `
        <html>
          <head>
            <meta name="robots" content="index, follow">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta property="og:title" content="Social Title">
            <meta property="og:description" content="Social Description">
            <meta property="og:image" content="https://example.com/image.png">
          </head>
          <body>
            <h1>Main Title</h1>
            <h2>Section 1</h2>
            <h3>Subsection 1.1</h3>
          </body>
        </html>
      `;

      const res = analyzeSeo(html, 'https://example.com');

      expect(res.findings.find((f) => f.id === 'seo-meta-robots').status).toBe('pass');
      expect(res.findings.find((f) => f.id === 'seo-viewport').status).toBe('pass');
      expect(res.findings.find((f) => f.id === 'seo-heading-h1').status).toBe('pass');
      expect(res.findings.find((f) => f.id === 'seo-heading-hierarchy').status).toBe('pass');
      expect(res.findings.find((f) => f.id === 'seo-opengraph').status).toBe('pass');
    });

    it('verifies summary consistency: summary counts equal count of findings matching status', () => {
      const html = '<html><head><title>Test Page</title></head><body></body></html>';
      const res = analyzeSeo(html, 'https://example.com');

      expect(res.summary.pass).toBe(res.findings.filter((f) => f.status === 'pass').length);
      expect(res.summary.warn).toBe(res.findings.filter((f) => f.status === 'warn').length);
      expect(res.summary.fail).toBe(res.findings.filter((f) => f.status === 'fail').length);
      expect(res.summary.info).toBe(res.findings.filter((f) => f.status === 'info').length);
    });
  });
});
