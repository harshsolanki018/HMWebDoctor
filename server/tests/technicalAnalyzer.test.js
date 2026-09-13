const { analyzeTechnical } = require('../src/scanners/technicalAnalyzer');

describe('Technical Analyzer Scope & Observations Suite', () => {
  it('evaluates HTTP status codes (200 OK, 3xx redirect, 4xx client error, 5xx server error)', () => {
    const res200 = analyzeTechnical({ statusCode: 200 }, {});
    expect(res200.findings.find((f) => f.id === 'tech-status-code').status).toBe('pass');

    const res301 = analyzeTechnical({ statusCode: 301 }, {});
    expect(res301.findings.find((f) => f.id === 'tech-status-code').status).toBe('info');

    const res404 = analyzeTechnical({ statusCode: 404 }, {});
    expect(res404.findings.find((f) => f.id === 'tech-status-code').status).toBe('warn');

    const res500 = analyzeTechnical({ statusCode: 500 }, {});
    expect(res500.findings.find((f) => f.id === 'tech-status-code').status).toBe('warn');
  });

  it('detects payload compression (gzip/br/deflate/absent)', () => {
    const resGzip = analyzeTechnical({ headers: { 'content-encoding': 'gzip' } }, {});
    expect(resGzip.findings.find((f) => f.id === 'tech-compression').status).toBe('pass');
    expect(resGzip.findings.find((f) => f.id === 'tech-compression').value).toBe('gzip');

    const resNone = analyzeTechnical({ headers: {} }, {});
    expect(resNone.findings.find((f) => f.id === 'tech-compression').status).toBe('info');
    expect(resNone.findings.find((f) => f.id === 'tech-compression').value).toBeNull();
  });

  it('observes HTTP caching headers (Cache-Control, ETag, Expires, Last-Modified)', () => {
    const resCache = analyzeTechnical(
      {
        headers: {
          'cache-control': 'max-age=3600',
          etag: '"12345"',
          expires: 'Sun, 13 Sep 2026 12:00:00 GMT',
          'last-modified': 'Sat, 12 Sep 2026 12:00:00 GMT',
        },
      },
      {}
    );

    const cacheFinding = resCache.findings.find((f) => f.id === 'tech-caching');
    expect(cacheFinding.status).toBe('pass');
    expect(cacheFinding.value).toEqual({
      cacheControl: 'max-age=3600',
      etag: '"12345"',
      expires: 'Sun, 13 Sep 2026 12:00:00 GMT',
      lastModified: 'Sat, 12 Sep 2026 12:00:00 GMT',
    });
  });

  it('evaluates DOCTYPE presence, document size, and charset alignment from baseline', () => {
    const res = analyzeTechnical(
      { contentLengthBytes: 2048 },
      { hasDoctype: true, documentSizeBytes: 2048, charset: 'utf-8' }
    );

    const doctypeFinding = res.findings.find((f) => f.id === 'tech-doctype-size');
    expect(doctypeFinding.status).toBe('pass');
    expect(doctypeFinding.value.hasDoctype).toBe(true);
    expect(doctypeFinding.value.sizeBytes).toBe(2048);

    const charsetFinding = res.findings.find((f) => f.id === 'tech-charset');
    expect(charsetFinding.status).toBe('pass');
    expect(charsetFinding.value).toBe('utf-8');
  });

  it('verifies summary consistency: summary counts equal count of findings matching status', () => {
    const res = analyzeTechnical({}, {});
    expect(res.summary.pass).toBe(res.findings.filter((f) => f.status === 'pass').length);
    expect(res.summary.warn).toBe(res.findings.filter((f) => f.status === 'warn').length);
    expect(res.summary.fail).toBe(res.findings.filter((f) => f.status === 'fail').length);
    expect(res.summary.info).toBe(res.findings.filter((f) => f.status === 'info').length);
  });
});
