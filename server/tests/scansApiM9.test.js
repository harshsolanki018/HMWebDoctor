const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Scan = require('../src/models/Scan');

describe('GET /api/scans/:scanId Public Report Retrieval API Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockScanDoc = {
    scanId: 'scan_0123456789abcdef',
    targetUrl: 'https://admin:secret@example.com/page?token=ABC123#top',
    finalUrl: 'https://example.com/page?session=XYZ',
    statusCode: 200,
    timing: {
      durationMs: 320,
      fetchedAt: '2026-09-13T10:00:00.000Z',
    },
    document: {
      statusCode: 200,
      contentType: 'text/html; charset=utf-8',
      contentLengthBytes: 1500,
      baseline: {
        title: 'Test Page',
        lang: 'en',
        charset: 'utf-8',
        description: 'Test description',
        hasDoctype: true,
      },
    },
    summary: { pass: 10, warn: 2, fail: 0, info: 0 },
    categories: {
      seo: { status: 'completed', summary: { pass: 2, warn: 0, fail: 0, info: 0 }, findings: [] },
      securityHeaders: { status: 'completed', summary: { pass: 2, warn: 0, fail: 0, info: 0 }, findings: [] },
      crawlability: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
      technical: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
      performance: { status: 'completed', summary: { pass: 1, warn: 1, fail: 0, info: 0 }, findings: [] },
      accessibility: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
      mobile: { status: 'completed', summary: { pass: 1, warn: 1, fail: 0, info: 0 }, findings: [] },
      content: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
    },
    actionCenter: {
      status: 'completed',
      summary: { actionable: 2, high: 0, medium: 2, low: 0 },
      domainCounts: { security: 0, accessibility: 0, performance: 1, seo_crawlability: 0, markup_structure: 1 },
      items: [],
    },
    createdAt: new Date('2026-09-13T10:00:00.000Z'),
  };

  it('returns HTTP 200 with sanitized public report DTO for valid existing scanId', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(Scan, 'findOne').mockReturnValue({
      lean: () => ({
        exec: async () => mockScanDoc,
      }),
    });

    const res = await request(app).get('/api/scans/scan_0123456789abcdef');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const report = res.body.data;
    expect(report.scanId).toBe('scan_0123456789abcdef');
    expect(report.targetUrl).toBe('https://example.com/page');
    expect(report.finalUrl).toBe('https://example.com/page');
    expect(report.document.baseline.title).toBe('Test Page');
    expect(report._id).toBeUndefined();
    expect(report.__v).toBeUndefined();
  });

  it('returns HTTP 400 for malformed scanId format', async () => {
    const res = await request(app).get('/api/scans/invalid-scan-id-123');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_SCAN_ID');
  });

  it('returns HTTP 404 when valid scanId format is not found or expired in DB', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(Scan, 'findOne').mockReturnValue({
      lean: () => ({
        exec: async () => null,
      }),
    });

    const res = await request(app).get('/api/scans/scan_ffffffffffffffff');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns HTTP 503 DATABASE_UNAVAILABLE when MongoDB connection is offline', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const res = await request(app).get('/api/scans/scan_0123456789abcdef');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect(res.body.error.message).toBe('Report storage is temporarily unavailable.');
  });
});
