const request = require('supertest');
const app = require('../src/app');
const safeFetcher = require('../src/services/safeFetcher');
const contentAnalyzer = require('../src/scanners/contentAnalyzer');
const seoAnalyzer = require('../src/scanners/seoAnalyzer');

describe('POST /api/scans API Route M7 Content Pipeline, Isolation & Security Verification Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full scan pipeline returning all 8 category objects including content with consistent summary', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>M7 Full Pipeline Test Page</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <h1>Main Section Header</h1>
          <p>This is a paragraph containing sufficient visible text volume to surpass fifty total words and ensure that the content analyzer generates positive pass status findings during comprehensive scan execution.</p>
          <p>Another paragraph providing additional body text content and testing image dimensional attributes and link markup classification.</p>
          <img src="/hero.jpg" alt="Hero banner image" width="800" height="600">
          <a href="/about">About Us</a>
          <a href="https://external.org">External Link</a>
        </body>
      </html>
    `;

    const fetchSpy = vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html; charset=UTF-8',
      contentLengthBytes: Buffer.byteLength(mockHtml),
      headers: {
        'content-type': 'text/html; charset=UTF-8',
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

    // Verify exactly 8 active categories exist in response
    const categoryKeys = Object.keys(data.categories);
    expect(categoryKeys.sort()).toEqual([
      'accessibility',
      'content',
      'crawlability',
      'mobile',
      'performance',
      'securityHeaders',
      'seo',
      'technical',
    ]);

    const contentData = data.categories.content;
    expect(contentData.status).toBe('completed');
    expect(contentData.findings.some(f => f.id === 'content-word-count')).toBe(true);
    expect(contentData.findings.some(f => f.id === 'content-document-structure')).toBe(true);
    expect(contentData.findings.some(f => f.id === 'content-link-classification')).toBe(true);

    // Verify summary consistency across all 8 categories
    const catList = Object.values(data.categories);
    const expectedPass = catList.reduce((acc, c) => acc + (c.summary?.pass || 0), 0);
    const expectedWarn = catList.reduce((acc, c) => acc + (c.summary?.warn || 0), 0);
    const expectedFail = catList.reduce((acc, c) => acc + (c.summary?.fail || 0), 0);
    const expectedInfo = catList.reduce((acc, c) => acc + (c.summary?.info || 0), 0);

    expect(data.summary.pass).toBe(expectedPass);
    expect(data.summary.warn).toBe(expectedWarn);
    expect(data.summary.fail).toBe(expectedFail);
    expect(data.summary.info).toBe(expectedInfo);

    // Verify exactly 1 target URL fetch was performed
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com');

    // Verify NO synthetic scores or grades exist in payload
    const jsonStr = JSON.stringify(data).toLowerCase();
    expect(jsonStr).not.toContain('"score"');
    expect(jsonStr).not.toContain('"grade"');
    expect(jsonStr).not.toContain('"rating"');
  });

  it('isolates category failure when contentAnalyzer throws an unexpected error', async () => {
    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      html: '<html><body>Text</body></html>',
      redirectCount: 0,
      redirectChain: [],
    });

    const secretInternalErrorText = 'INTERNAL_CRASH_SECRET_STACK_TRACE_LINE_123';
    vi.spyOn(contentAnalyzer, 'analyzeContent').mockImplementation(() => {
      throw new Error(secretInternalErrorText);
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    const contentCat = data.categories.content;
    expect(contentCat.status).toBe('error');
    expect(contentCat.summary).toEqual({ pass: 0, warn: 0, fail: 1, info: 0 });
    expect(contentCat.findings.length).toBe(1);
    expect(contentCat.findings[0]).toEqual({
      id: 'category-error',
      category: 'content',
      status: 'fail',
      severity: 'medium',
      title: 'Analysis Error',
      message: 'An unexpected error occurred during category analysis.',
      value: null,
      recommendation: 'Re-run the scan. If the error persists, verify the target server response structure.',
    });

    // Assert NO internal stack traces, file paths, or exception details leaked in API response
    const jsonString = JSON.stringify(response.body);
    expect(jsonString).not.toContain(secretInternalErrorText);
    expect(jsonString).not.toContain('stack');
    expect(jsonString).not.toContain('scanners/contentAnalyzer.js');

    // Other categories remain completed
    expect(data.categories.seo.status).toBe('completed');
    expect(data.categories.accessibility.status).toBe('completed');

    // Overall summary matches sum of category summaries
    const catList = Object.values(data.categories);
    const expectedPass = catList.reduce((acc, c) => acc + (c.summary?.pass || 0), 0);
    const expectedWarn = catList.reduce((acc, c) => acc + (c.summary?.warn || 0), 0);
    const expectedFail = catList.reduce((acc, c) => acc + (c.summary?.fail || 0), 0);
    const expectedInfo = catList.reduce((acc, c) => acc + (c.summary?.info || 0), 0);

    expect(data.summary.pass).toBe(expectedPass);
    expect(data.summary.warn).toBe(expectedWarn);
    expect(data.summary.fail).toBe(expectedFail);
    expect(data.summary.info).toBe(expectedInfo);
  });

  it('ensures errors in another category do not prevent content category from executing normally', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Title</title></head>
        <body>
          <p>Paragraph containing fifty words to ensure content analyzer passes visible text count check during bi-directional category error isolation verification suite execution cleanly and reliably without any issue or truncation in text parsing logic or finding creation flow for total word counting validation test.</p>
        </body>
      </html>
    `;

    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      html: mockHtml,
      redirectCount: 0,
      redirectChain: [],
    });

    vi.spyOn(seoAnalyzer, 'analyzeSeo').mockImplementation(() => {
      throw new Error('SIMULATED_SEO_ANALYZER_CRASH');
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.categories.seo.status).toBe('error');
    expect(data.categories.content.status).toBe('completed');
    expect(data.categories.content.findings.length).toBeGreaterThan(0);
    expect(data.categories.content.findings.some(f => f.id.startsWith('content-'))).toBe(true);
  });

  it('uses finalUrl origin (Origin B) rather than targetUrl origin (Origin A) for link classification following redirects', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Redirect Target</title></head>
        <body>
          <a href="/relative-path">Relative Link</a>
          <a href="https://example.org/another-page">Absolute Origin B Link</a>
          <a href="https://example.com/old-page">Link Back To Origin A</a>
        </body>
      </html>
    `;

    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.org/final-location',
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      html: mockHtml,
      redirectCount: 1,
      redirectChain: ['https://example.com'],
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    const data = response.body.data;
    const contentFinding = data.categories.content.findings.find(f => f.id === 'content-link-classification');

    expect(contentFinding).toBeDefined();
    // Origin B (example.org) is the base origin!
    // /relative-path -> internalLink (1)
    // https://example.org/another-page -> internalLink (2)
    // https://example.com/old-page -> externalLink (1)
    expect(contentFinding.value.internalLinks).toBe(2);
    expect(contentFinding.value.externalLinks).toBe(1);
  });

  it('does NOT leak sensitive raw URL query tokens from test HTML into API findings response', async () => {
    const sensitiveToken = 'API_KEY_SENSITIVE_SECRET_TOKEN_987654321';
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <a href="https://example.com/oauth?client_secret=${sensitiveToken}">Sensitive Link</a>
          <img src="https://example.com/img.jpg?access_token=${sensitiveToken}" width="100" height="100">
        </body>
      </html>
    `;

    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      html: mockHtml,
      redirectCount: 0,
      redirectChain: [],
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    const responseText = JSON.stringify(response.body);

    // The sensitive token string must NOT exist anywhere in the JSON response
    expect(responseText).not.toContain(sensitiveToken);
  });
});
