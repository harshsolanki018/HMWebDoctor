const request = require('supertest');
const app = require('../src/app');
const scanService = require('../src/services/scanService');

describe('POST /api/scans API Route Integration Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 Bad Request if URL is missing in request body', async () => {
    const response = await request(app).post('/api/scans').send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_URL');
  });

  it('should return 400 Bad Request if URL is not a valid URL string', async () => {
    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'not a valid url format' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('INVALID_URL');
  });

  it('should return 400 Bad Request when safeFetcher rejects private/internal target IP', async () => {
    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'http://127.0.0.1:5000/api/health' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNSAFE_DESTINATION');
  });

  it('should return 200 OK with baseline scan data on successful scan (without exposing resolved IP)', async () => {
    const mockScanData = {
      scanId: 'scan_1234567890abcdef',
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      redirectCount: 0,
      redirectChain: [],
      status: 'completed',
      timing: { durationMs: 120, fetchedAt: new Date().toISOString() },
      document: {
        statusCode: 200,
        contentType: 'text/html; charset=UTF-8',
        contentLengthBytes: 1250,
        baseline: {
          title: 'Example Domain',
          lang: 'en',
          charset: 'utf-8',
          description: null,
          documentSizeBytes: 1250,
          hasDoctype: true,
        },
      },
    };

    vi.spyOn(scanService, 'executeScan').mockResolvedValue(mockScanData);

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockScanData);
    expect(response.body.error).toBeNull();
    expect(response.body.data.document.ipAddress).toBeUndefined();
  });

  it('preserves target HTTP 404 status in baseline result when target returns 404 HTML page', async () => {
    const mock404Data = {
      scanId: 'scan_404notfound1',
      targetUrl: 'https://example.com/nonexistent',
      finalUrl: 'https://example.com/nonexistent',
      redirectCount: 0,
      redirectChain: [],
      status: 'completed',
      timing: { durationMs: 150, fetchedAt: new Date().toISOString() },
      document: {
        statusCode: 404,
        contentType: 'text/html',
        contentLengthBytes: 850,
        baseline: {
          title: '404 Not Found',
          lang: 'en',
          charset: 'utf-8',
          description: 'Page not found',
          documentSizeBytes: 850,
          hasDoctype: true,
        },
      },
    };

    vi.spyOn(scanService, 'executeScan').mockResolvedValue(mock404Data);

    const response = await request(app)
      .post('/api/scans')
      .send({ url: 'https://example.com/nonexistent' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.document.statusCode).toBe(404);
  });
});
