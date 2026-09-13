const request = require('supertest');
const app = require('../src/app');
const safeFetcher = require('../src/services/safeFetcher');
const performanceAnalyzer = require('../src/scanners/performanceAnalyzer');

describe('POST /api/scans API Route M5 Performance Pipeline & Isolation Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full scan pipeline returning all 5 category objects including performance', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>M5 Test Domain Page Title (45 Chars Long!)</title>
          <meta name="description" content="This is an optimal meta description containing between fifty and one hundred sixty characters long for performance testing.">
          <link rel="canonical" href="https://example.com/">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <script src="/head-sync.js"></script>
          <script src="/head-defer.js" defer></script>
        </head>
        <body>
          <h1>Main Page</h1>
          <img src="/hero.jpg" loading="lazy" alt="hero">
        </body>
      </html>
    `;

    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html; charset=UTF-8',
      contentLengthBytes: Buffer.byteLength(mockHtml),
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      },
      html: mockHtml,
      redirectCount: 0,
      redirectChain: [],
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.status).toBe('completed');

    expect(data.categories.seo).toBeDefined();
    expect(data.categories.securityHeaders).toBeDefined();
    expect(data.categories.crawlability).toBeDefined();
    expect(data.categories.technical).toBeDefined();
    expect(data.categories.performance).toBeDefined();

    const perfData = data.categories.performance;
    expect(perfData.status).toBe('completed');
    expect(perfData.summary).toBeDefined();
    expect(perfData.findings.some((f) => f.id === 'perf-blocking-scripts')).toBe(true);
    expect(perfData.findings.some((f) => f.id === 'perf-resource-hints')).toBe(true);
    expect(perfData.findings.some((f) => f.id === 'perf-dom-footprint')).toBe(true);

    // Verify NO scoring or grades present in payload
    const jsonStr = JSON.stringify(data).toLowerCase();
    expect(jsonStr).not.toContain('"score"');
    expect(jsonStr).not.toContain('"grade"');
    expect(jsonStr).not.toContain('"rating"');
  });

  it('isolates performance category failure when performanceAnalyzer throws, keeping primary scan HTTP 200', async () => {
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

    // Deliberately mock performanceAnalyzer to throw an unhandled exception
    vi.spyOn(performanceAnalyzer, 'analyzePerformance').mockImplementation(() => {
      throw new Error('UNEXPECTED_PERFORMANCE_SCANNER_CRASH');
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.status).toBe('completed');

    // Failing category is isolated to error status
    expect(data.categories.performance.status).toBe('error');
    expect(data.categories.performance.summary).toEqual({ pass: 0, warn: 0, fail: 1, info: 0 });
    expect(data.categories.performance.findings).toEqual([
      {
        id: 'category-error',
        category: 'performance',
        status: 'fail',
        severity: 'medium',
        title: 'Analysis Error',
        message: 'An unexpected error occurred during category analysis.',
        value: null,
        recommendation: 'Re-run the scan. If the error persists, verify the target server response structure.',
      },
    ]);

    // Remaining analyzers execute successfully
    expect(data.categories.seo.status).toBe('completed');
    expect(data.categories.securityHeaders.status).toBe('completed');
    expect(data.categories.crawlability.status).toBe('completed');
    expect(data.categories.technical.status).toBe('completed');

    // Verify response body does NOT leak error stack trace or internal file paths
    const responseJsonStr = JSON.stringify(response.body);
    expect(responseJsonStr).not.toContain('UNEXPECTED_PERFORMANCE_SCANNER_CRASH');
    expect(responseJsonStr).not.toContain('performanceAnalyzer.js');
  });
});
