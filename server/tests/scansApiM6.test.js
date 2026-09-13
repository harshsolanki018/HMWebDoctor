const request = require('supertest');
const http = require('http');
const https = require('https');
const app = require('../src/app');
const safeFetcher = require('../src/services/safeFetcher');
const accessibilityAnalyzer = require('../src/scanners/accessibilityAnalyzer');
const mobileAnalyzer = require('../src/scanners/mobileAnalyzer');

describe('POST /api/scans API Route M6 Accessibility & Mobile Pipeline & Isolation Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full scan pipeline returning all 7 category objects including accessibility and mobile', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>M6 Test Domain Page Title (45 Chars Long!)</title>
          <meta name="description" content="Optimal meta description containing between fifty and one hundred sixty characters long for accessibility and mobile testing.">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="theme-color" content="#0f172a">
          <link rel="canonical" href="https://example.com/">
        </head>
        <body>
          <main>
            <h1>Main Page Title</h1>
            <img src="/hero.jpg" alt="Hero banner image">
            <form>
              <label for="email">Email</label>
              <input type="email" id="email" name="email" autocomplete="email">
              <button type="submit">Submit</button>
            </form>
          </main>
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
    expect(data.categories.accessibility).toBeDefined();
    expect(data.categories.mobile).toBeDefined();

    const a11yData = data.categories.accessibility;
    expect(a11yData.status).toBe('completed');
    expect(a11yData.findings.some((f) => f.id === 'a11y-image-alt')).toBe(true);
    expect(a11yData.findings.some((f) => f.id === 'a11y-form-labels')).toBe(true);

    const mobileData = data.categories.mobile;
    expect(mobileData.status).toBe('completed');
    expect(mobileData.findings.some((f) => f.id === 'mobile-viewport-zoom')).toBe(true);
    expect(mobileData.findings.some((f) => f.id === 'mobile-input-types')).toBe(true);

    // Verify summary consistency across all 7 categories
    const categories = data.categories;
    const catList = Object.values(categories);
    const expectedPass = catList.reduce((acc, c) => acc + (c.summary?.pass || 0), 0);
    const expectedWarn = catList.reduce((acc, c) => acc + (c.summary?.warn || 0), 0);
    const expectedFail = catList.reduce((acc, c) => acc + (c.summary?.fail || 0), 0);
    const expectedInfo = catList.reduce((acc, c) => acc + (c.summary?.info || 0), 0);

    expect(data.summary.pass).toBe(expectedPass);
    expect(data.summary.warn).toBe(expectedWarn);
    expect(data.summary.fail).toBe(expectedFail);
    expect(data.summary.info).toBe(expectedInfo);
  });

  it('isolates accessibility category failure when accessibilityAnalyzer throws', async () => {
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

    vi.spyOn(accessibilityAnalyzer, 'analyzeAccessibility').mockImplementation(() => {
      throw new Error('ACCESSIBILITY_ANALYZER_CRASH');
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.categories.accessibility.status).toBe('error');
    expect(data.categories.accessibility.summary).toEqual({ pass: 0, warn: 0, fail: 1, info: 0 });

    expect(data.categories.mobile.status).toBe('completed');
    expect(data.categories.seo.status).toBe('completed');

    const responseJsonStr = JSON.stringify(response.body);
    expect(responseJsonStr).not.toContain('ACCESSIBILITY_ANALYZER_CRASH');
  });

  it('isolates mobile category failure when mobileAnalyzer throws', async () => {
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

    vi.spyOn(mobileAnalyzer, 'analyzeMobile').mockImplementation(() => {
      throw new Error('MOBILE_ANALYZER_CRASH');
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.categories.mobile.status).toBe('error');
    expect(data.categories.mobile.summary).toEqual({ pass: 0, warn: 0, fail: 1, info: 0 });

    expect(data.categories.accessibility.status).toBe('completed');
    expect(data.categories.seo.status).toBe('completed');

    const responseJsonStr = JSON.stringify(response.body);
    expect(responseJsonStr).not.toContain('MOBILE_ANALYZER_CRASH');
  });

  it('verifies M6 analyzers perform zero secondary outbound network calls during analysis', async () => {
    const httpSpy = vi.spyOn(http, 'request');
    const httpsSpy = vi.spyOn(https, 'request');

    const mockHtml = '<html><body><main><img src="https://external.com/img.jpg" alt="test"></main></body></html>';
    accessibilityAnalyzer.analyzeAccessibility(mockHtml, { lang: 'en' });
    mobileAnalyzer.analyzeMobile(mockHtml, {}, {});

    expect(httpSpy).not.toHaveBeenCalled();
    expect(httpsSpy).not.toHaveBeenCalled();
  });
});
