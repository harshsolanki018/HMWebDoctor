const request = require('supertest');
const app = require('../src/app');
const safeFetcher = require('../src/services/safeFetcher');
const seoAnalyzer = require('../src/scanners/seoAnalyzer');

describe('POST /api/scans API Route M4 Full Pipeline & Isolation Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full M4 scan pipeline returning all 4 category objects and overall summary', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Test Domain Title that is 45 characters long!</title>
          <meta name="description" content="This is a test meta description containing optimal character length between fifty and one hundred sixty characters long for SEO testing.">
          <link rel="canonical" href="https://example.com/">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta property="og:title" content="Test Domain Title">
          <meta property="og:description" content="Test Description">
          <meta property="og:image" content="https://example.com/og.png">
        </head>
        <body>
          <h1>Main Page Title</h1>
          <h2>Section Heading</h2>
        </body>
      </html>
    `;

    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockImplementation(async (targetUrl) => {
      if (targetUrl.endsWith('/robots.txt')) {
        return {
          statusCode: 200,
          html: 'User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml',
        };
      }
      return {
        targetUrl: 'https://example.com',
        finalUrl: 'https://example.com/',
        statusCode: 200,
        statusText: 'OK',
        contentType: 'text/html; charset=UTF-8',
        contentLengthBytes: Buffer.byteLength(mockHtml),
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
          'content-security-policy': "default-src 'self'",
          'x-frame-options': 'DENY',
          'x-content-type-options': 'nosniff',
          'content-encoding': 'gzip',
          'cache-control': 'max-age=3600',
          'set-cookie': ['session_id=SECRET_TOKEN_999; Path=/; Secure; HttpOnly; SameSite=Strict'],
        },
        html: mockHtml,
        redirectCount: 0,
        redirectChain: [],
      };
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.status).toBe('completed');
    expect(data.summary).toBeDefined();

    expect(data.categories.seo).toBeDefined();
    expect(data.categories.securityHeaders).toBeDefined();
    expect(data.categories.crawlability).toBeDefined();
    expect(data.categories.technical).toBeDefined();

    // Verify Cookie privacy in API response payload
    const fullResJson = JSON.stringify(response.body);
    expect(fullResJson).not.toContain('SECRET_TOKEN');

    // Verify NO calculated score or grade present
    const jsonLower = fullResJson.toLowerCase();
    expect(jsonLower).not.toContain('"score"');
    expect(jsonLower).not.toContain('"grade"');
    expect(jsonLower).not.toContain('"rating"');
  });

  it('isolates category failure when an analyzer throws an error, leaving overall scan successful', async () => {
    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html',
      contentLengthBytes: 500,
      headers: { 'content-type': 'text/html' },
      html: '<html><head><title>Title</title></head><body><h1>H1</h1></body></html>',
      redirectCount: 0,
      redirectChain: [],
    });

    // Deliberately mock SEO analyzer to throw an unhandled exception
    vi.spyOn(seoAnalyzer, 'analyzeSeo').mockImplementation(() => {
      throw new Error('UNEXPECTED_SEO_SCANNER_CRASH_INTENTIONAL');
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.status).toBe('completed');

    // Failing category is isolated to error status
    expect(data.categories.seo.status).toBe('error');
    expect(data.categories.seo.summary).toEqual({ pass: 0, warn: 0, fail: 1, info: 0 });
    expect(data.categories.seo.findings).toEqual([
      {
        id: 'category-error',
        category: 'seo',
        status: 'fail',
        severity: 'medium',
        title: 'Analysis Error',
        message: 'An unexpected error occurred during category analysis.',
        value: null,
        recommendation: 'Re-run the scan. If the error persists, verify the target server response structure.',
      },
    ]);

    // Remaining analyzers execute successfully
    expect(data.categories.securityHeaders.status).toBe('completed');
    expect(data.categories.crawlability.status).toBe('completed');
    expect(data.categories.technical.status).toBe('completed');

    // Verify response body does NOT leak error stack trace or internal file paths
    const responseJsonStr = JSON.stringify(response.body);
    expect(responseJsonStr).not.toContain('UNEXPECTED_SEO_SCANNER_CRASH_INTENTIONAL');
    expect(responseJsonStr).not.toContain('seoAnalyzer.js');
    expect(responseJsonStr).not.toContain('stack');
  });
});
