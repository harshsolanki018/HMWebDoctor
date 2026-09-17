const { sanitizePublicUrl, buildPublicReportDto } = require('../src/services/scanService');

describe('Public Report DTO Security Boundary Suite', () => {
  describe('sanitizePublicUrl', () => {
    it('strips user credentials from URL 100%', () => {
      const sanitized = sanitizePublicUrl('https://admin:supersecret123@example.com/dashboard');
      expect(sanitized).toBe('https://example.com/dashboard');
    });

    it('strips entire query string from URL 100%', () => {
      const sanitized = sanitizePublicUrl('https://example.com/reset-password?token=XYZ123&user=admin&debug=true');
      expect(sanitized).toBe('https://example.com/reset-password');
    });

    it('strips entire fragment/hash from URL 100%', () => {
      const sanitized = sanitizePublicUrl('https://example.com/docs#section-auth');
      expect(sanitized).toBe('https://example.com/docs');
    });

    it('strips credentials, query parameters, and fragment simultaneously', () => {
      const sanitized = sanitizePublicUrl('https://user:pass@example.com:8080/path/to/page?key=val#hash');
      expect(sanitized).toBe('https://example.com:8080/path/to/page');
    });

    it('handles empty or non-string inputs safely', () => {
      expect(sanitizePublicUrl(null)).toBe('');
      expect(sanitizePublicUrl(undefined)).toBe('');
      expect(sanitizePublicUrl('')).toBe('');
    });
  });

  describe('buildPublicReportDto', () => {
    it('constructs complete public DTO while stripping internal/private fields', () => {
      const rawScanResult = {
        _id: 'mongo_internal_id_12345',
        __v: 0,
        scanId: 'scan_0123456789abcdef',
        targetUrl: 'https://admin:pass@example.com/login?session=abc#top',
        finalUrl: 'https://example.com/dashboard?token=xyz',
        statusCode: 200,
        destinationIp: '192.168.1.50',
        resolvedIps: ['192.168.1.50'],
        html: '<html><body><h1>Sensitive HTML</h1></body></html>',
        rawHeaders: { 'set-cookie': ['session=secret'] },
        timing: {
          durationMs: 450,
          fetchedAt: '2026-09-13T12:00:00.000Z',
        },
        document: {
          statusCode: 200,
          contentType: 'text/html',
          contentLengthBytes: 2048,
          baseline: {
            title: 'Dashboard',
            lang: 'en',
            charset: 'utf-8',
            description: 'Main dashboard',
            hasDoctype: true,
          },
        },
        summary: { pass: 15, warn: 3, fail: 1, info: 0 },
        categories: {
          seo: { status: 'completed', summary: { pass: 5, warn: 0, fail: 0, info: 0 }, findings: [] },
          securityHeaders: { status: 'completed', summary: { pass: 3, warn: 1, fail: 0, info: 0 }, findings: [] },
          crawlability: { status: 'completed', summary: { pass: 2, warn: 0, fail: 0, info: 0 }, findings: [] },
          technical: { status: 'completed', summary: { pass: 2, warn: 0, fail: 0, info: 0 }, findings: [] },
          performance: { status: 'completed', summary: { pass: 1, warn: 1, fail: 0, info: 0 }, findings: [] },
          accessibility: { status: 'completed', summary: { pass: 1, warn: 0, fail: 1, info: 0 }, findings: [] },
          mobile: { status: 'completed', summary: { pass: 1, warn: 1, fail: 0, info: 0 }, findings: [] },
          content: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
        },
        actionCenter: {
          status: 'completed',
          summary: { actionable: 1, high: 0, medium: 1, low: 0 },
          domainCounts: { security: 0, accessibility: 1, performance: 0, seo_crawlability: 0, markup_structure: 0 },
          items: [],
        },
        createdAt: '2026-09-13T12:00:00.000Z',
      };

      const dto = buildPublicReportDto(rawScanResult);

      expect(dto).toBeDefined();
      expect(dto.scanId).toBe('scan_0123456789abcdef');
      expect(dto.targetUrl).toBe('https://example.com/login');
      expect(dto.finalUrl).toBe('https://example.com/dashboard');

      // Omitted internal & private fields verification
      expect(dto._id).toBeUndefined();
      expect(dto.__v).toBeUndefined();
      expect(dto.destinationIp).toBeUndefined();
      expect(dto.resolvedIps).toBeUndefined();
      expect(dto.html).toBeUndefined();
      expect(dto.rawHeaders).toBeUndefined();

      // Included public schema verification
      expect(dto.timing.durationMs).toBe(450);
      expect(dto.document.baseline.title).toBe('Dashboard');
      expect(dto.summary.pass).toBe(15);
      expect(Object.keys(dto.categories)).toHaveLength(8);
      expect(dto.actionCenter.status).toBe('completed');
    });

    it('returns null for null or invalid inputs', () => {
      expect(buildPublicReportDto(null)).toBeNull();
      expect(buildPublicReportDto(undefined)).toBeNull();
      expect(buildPublicReportDto('invalid')).toBeNull();
    });
  });
});
