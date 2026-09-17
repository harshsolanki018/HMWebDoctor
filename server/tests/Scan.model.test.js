const Scan = require('../src/models/Scan');

describe('Scan Mongoose Model Schema Specification Suite', () => {
  it('defines the model with strict schema options and bufferCommands disabled', () => {
    expect(Scan.schema.options.strict).toBe(true);
    expect(Scan.schema.options.bufferCommands).toBe(false);
  });

  it('enforces scanId regex validation pattern /^scan_[a-f0-9]{16}$/', () => {
    const scanIdPath = Scan.schema.paths.scanId;
    expect(scanIdPath.options.required).toBe(true);
    expect(scanIdPath.options.unique).toBe(true);
    expect(scanIdPath.options.index).toBe(true);
    expect(scanIdPath.options.match).toEqual(/^scan_[a-f0-9]{16}$/);
  });

  it('configures 30-day TTL index on createdAt field', () => {
    const createdAtPath = Scan.schema.paths.createdAt;
    expect(createdAtPath.options.expires).toBe(2592000);
    expect(createdAtPath.options.index).toBe(true);
  });

  it('validates required top-level document fields', () => {
    const doc = new Scan({});
    const err = doc.validateSync();

    expect(err).toBeDefined();
    expect(err.errors.scanId).toBeDefined();
    expect(err.errors.targetUrl).toBeDefined();
    expect(err.errors.finalUrl).toBeDefined();
    expect(err.errors.statusCode).toBeDefined();
    expect(err.errors['categories.seo']).toBeDefined();
  });

  it('validates a correct Scan instance without schema validation errors', () => {
    const validScan = new Scan({
      scanId: 'scan_0123456789abcdef',
      targetUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      timing: {
        startTime: new Date(),
        endTime: new Date(),
        durationMs: 150,
      },
      document: {
        statusCode: 200,
        contentType: 'text/html',
        contentLengthBytes: 1024,
        baseline: {
          title: 'Example',
          lang: 'en',
          charset: 'utf-8',
          description: 'Desc',
          hasDoctype: true,
        },
      },
      summary: { pass: 10, warn: 2, fail: 1, info: 0 },
      categories: {
        seo: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
        securityHeaders: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
        crawlability: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
        technical: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
        performance: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
        accessibility: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
        mobile: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
        content: { status: 'completed', summary: { pass: 1, warn: 0, fail: 0, info: 0 }, findings: [] },
      },
      actionCenter: {
        status: 'completed',
        summary: { actionable: 1, high: 0, medium: 1, low: 0 },
        domainCounts: { security: 0, accessibility: 0, performance: 0, seo_crawlability: 1, markup_structure: 0 },
        items: [],
      },
    });

    const err = validScan.validateSync();
    expect(err).toBeUndefined();
  });
});
