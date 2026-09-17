const request = require('supertest');
const http = require('http');
const https = require('https');
const dns = require('dns');
const app = require('../src/app');
const safeFetcher = require('../src/services/safeFetcher');
const actionCenterService = require('../src/services/actionCenterService');

describe('POST /api/scans API Route M8 Action Center Pipeline, Isolation & Security Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes full scan pipeline returning actionCenter payload alongside all 8 categories', async () => {
    const httpReqSpy = vi.spyOn(http, 'request');
    const httpGetSpy = vi.spyOn(http, 'get');
    const httpsReqSpy = vi.spyOn(https, 'request');
    const httpsGetSpy = vi.spyOn(https, 'get');
    const dnsLookupSpy = vi.spyOn(dns, 'lookup');
    const dnsResolveSpy = vi.spyOn(dns, 'resolve');

    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>M8 Integration Page Title</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <h1>Main Page</h1>
          <p>This is a paragraph with sufficient words to ensure content analyzer passes visible text count check during comprehensive scan execution.</p>
          <img src="/hero.jpg" width="800"> <!-- missing height -->
          <a href="">Empty Link</a>
          <a href="#">Placeholder Link</a>
          <a href="javascript:;">JS Link</a>
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
    expect(data.scanId).toMatch(/^scan_[a-f0-9]{16}$/);

    // Verify all 8 categories exist and remain intact
    expect(Object.keys(data.categories).sort()).toEqual([
      'accessibility',
      'content',
      'crawlability',
      'mobile',
      'performance',
      'securityHeaders',
      'seo',
      'technical',
    ]);

    // Verify Action Center payload presence and structure
    expect(data.actionCenter).toBeDefined();
    expect(data.actionCenter.status).toBe('completed');
    expect(data.actionCenter.summary).toBeDefined();
    expect(typeof data.actionCenter.summary.actionable).toBe('number');
    expect(Array.isArray(data.actionCenter.items)).toBe(true);
    expect(data.actionCenter.items.length).toBe(data.actionCenter.summary.actionable);

    // Verify action item safe data structure (including required message property)
    if (data.actionCenter.items.length > 0) {
      const item = data.actionCenter.items[0];
      expect(item.findingId).toBeDefined();
      expect(item.category).toBeDefined();
      expect(item.status).toBeDefined();
      expect(item.severity).toBeDefined();
      expect(item.domain).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.message).toBeDefined();
      expect(item.recommendation).toBeDefined();
      expect(item.remediation).toBeDefined();
    }

    // Verify exactly 1 target URL fetch was performed
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Verify zero outbound secondary network calls occurred during Action Center generation
    expect(fetchSpy).toHaveBeenCalledTimes(1); // 1 fetch for target URL HTML
    expect(httpsReqSpy).toHaveBeenCalledTimes(1); // 1 fetch by M4 crawlability analyzer for /robots.txt
    expect(httpReqSpy).toHaveBeenCalledTimes(1); // 1 call by Supertest test runner to Express app
    expect(httpGetSpy).not.toHaveBeenCalled();
    expect(httpsGetSpy).not.toHaveBeenCalled();
    expect(dnsLookupSpy).not.toHaveBeenCalled();
    expect(dnsResolveSpy).not.toHaveBeenCalled();

    // Verify NO synthetic scores or grades exist in payload
    const jsonStr = JSON.stringify(data).toLowerCase();
    expect(jsonStr).not.toContain('"score"');
    expect(jsonStr).not.toContain('"grade"');
    expect(jsonStr).not.toContain('"rating"');
  });

  it('isolates Action Center failure keeping primary HTTP 200 response and 8 categories completed', async () => {
    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      headers: { 'content-type': 'text/html' },
      html: '<html><body>Text</body></html>',
      redirectCount: 0,
      redirectChain: [],
    });

    const secretErrorMsg = 'ACTION_CENTER_INTERNAL_EXCEPTION_TOKEN_777';
    vi.spyOn(actionCenterService, 'buildActionCenter').mockImplementation(() => {
      throw new Error(secretErrorMsg);
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const data = response.body.data;
    expect(data.categories.seo.status).toBe('completed');
    expect(data.categories.content.status).toBe('completed');

    expect(data.actionCenter).toEqual({
      status: 'error',
      summary: { actionable: 0, high: 0, medium: 0, low: 0 },
      domainCounts: { security: 0, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 },
      items: [],
    });

    const jsonString = JSON.stringify(response.body);
    expect(jsonString).not.toContain(secretErrorMsg);
  });

  it('does NOT leak synthetic sensitive values (URL, query, href, src, cookie name/val, token, IP, raw HTML) into actionCenter', async () => {
    const sensitiveFullUrl = 'https://secret-domain.internal/path?key=SECRET_URL';
    const sensitiveQuery = 'access_token=SECRET_TOKEN_999';
    const sensitiveHref = 'https://secret.internal/auth_link';
    const sensitiveSrc = 'https://secret.internal/secret_image.png';
    const sensitiveCookieName = 'SESSION_TOKEN_COOKIE';
    const sensitiveCookieVal = 'SENSITIVE_COOKIE_VALUE_ABC123';
    const sensitiveAuthToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const sensitivePrivateIp = '10.0.4.15';
    const sensitiveRawHtml = '<script>window.SECRET_DATA="PRIVATE_VAL";</script>';

    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <a href="${sensitiveHref}?${sensitiveQuery}">Sensitive Link</a>
          <img src="${sensitiveSrc}" width="100">
          ${sensitiveRawHtml}
        </body>
      </html>
    `;

    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: sensitiveFullUrl,
      finalUrl: sensitiveFullUrl,
      resolvedIp: sensitivePrivateIp,
      statusCode: 200,
      headers: {
        'content-type': 'text/html',
        'set-cookie': [`${sensitiveCookieName}=${sensitiveCookieVal}; Path=/; Secure; HttpOnly`],
        authorization: sensitiveAuthToken,
      },
      html: mockHtml,
      redirectCount: 0,
      redirectChain: [],
    });

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    const actionCenterStr = JSON.stringify(response.body.data.actionCenter);

    // Verify none of the synthetic sensitive values appear in Action Center payload
    expect(actionCenterStr).not.toContain(sensitiveFullUrl);
    expect(actionCenterStr).not.toContain(sensitiveQuery);
    expect(actionCenterStr).not.toContain(sensitiveHref);
    expect(actionCenterStr).not.toContain(sensitiveSrc);
    expect(actionCenterStr).not.toContain(sensitiveCookieName);
    expect(actionCenterStr).not.toContain(sensitiveCookieVal);
    expect(actionCenterStr).not.toContain(sensitiveAuthToken);
    expect(actionCenterStr).not.toContain(sensitivePrivateIp);
    expect(actionCenterStr).not.toContain(sensitiveRawHtml);
  });
});
