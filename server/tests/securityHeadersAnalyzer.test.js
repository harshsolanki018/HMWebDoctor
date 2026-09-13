const { analyzeSecurityHeaders } = require('../src/scanners/securityHeadersAnalyzer');

describe('Security Headers Analyzer Suite', () => {
  it('detects unencrypted HTTP protocol as warn with high severity', () => {
    const res = analyzeSecurityHeaders({}, 'http://example.com');
    const httpsFinding = res.findings.find((f) => f.id === 'sec-https');
    expect(httpsFinding.status).toBe('warn');
    expect(httpsFinding.severity).toBe('high');
  });

  describe('HSTS Analysis', () => {
    it('detects missing HSTS over HTTPS connection as warn', () => {
      const resMissing = analyzeSecurityHeaders({}, 'https://example.com');
      const hstsFinding = resMissing.findings.find((f) => f.id === 'sec-hsts');
      expect(hstsFinding.status).toBe('warn');
      expect(hstsFinding.severity).toBe('medium');
    });

    it('analyzes HSTS max-age, includeSubDomains, and preload directives over HTTPS', () => {
      const resPass = analyzeSecurityHeaders(
        { 'strict-transport-security': 'max-age=31536000; includeSubDomains; preload' },
        'https://example.com'
      );
      const hstsFinding = resPass.findings.find((f) => f.id === 'sec-hsts');
      expect(hstsFinding.status).toBe('pass');
      expect(hstsFinding.value.maxAge).toBe(31536000);
      expect(hstsFinding.value.includesSubDomains).toBe(true);
      expect(hstsFinding.value.preloadDirective).toBe(true);
      expect(hstsFinding.value.preloadNotice).toContain('does not verify whether the domain is currently listed on browser preload lists');
    });

    it('treats HSTS absence on unencrypted HTTP as informational (not a failure)', () => {
      const resHttp = analyzeSecurityHeaders({}, 'http://example.com');
      const hstsFinding = resHttp.findings.find((f) => f.id === 'sec-hsts');
      expect(hstsFinding.status).toBe('info');
      expect(hstsFinding.severity).toBe('info');
      expect(hstsFinding.message).toContain('HSTS header check skipped on unencrypted HTTP connection');
    });
  });

  describe('CSP Analysis (4 Mandatory Scenarios)', () => {
    it('Scenario 1: passes with default-src fallback alone', () => {
      const res = analyzeSecurityHeaders(
        { 'content-security-policy': "default-src 'self'" },
        'https://example.com'
      );
      const cspFinding = res.findings.find((f) => f.id === 'sec-csp');
      expect(cspFinding.status).toBe('pass');
    });

    it('Scenario 2: passes with script-src alone', () => {
      const res = analyzeSecurityHeaders(
        { 'content-security-policy': "script-src 'self' https://scripts.example.com" },
        'https://example.com'
      );
      const cspFinding = res.findings.find((f) => f.id === 'sec-csp');
      expect(cspFinding.status).toBe('pass');
    });

    it('Scenario 3: passes with both default-src and script-src', () => {
      const res = analyzeSecurityHeaders(
        { 'content-security-policy': "default-src 'self'; script-src 'self'" },
        'https://example.com'
      );
      const cspFinding = res.findings.find((f) => f.id === 'sec-csp');
      expect(cspFinding.status).toBe('pass');
    });

    it('Scenario 4: reports informational finding when CSP is missing', () => {
      const res = analyzeSecurityHeaders({}, 'https://example.com');
      const cspFinding = res.findings.find((f) => f.id === 'sec-csp');
      expect(cspFinding.status).toBe('info');
      expect(cspFinding.message).toContain('Content-Security-Policy header is missing.');
    });
  });

  it('evaluates X-Frame-Options and X-Content-Type-Options', () => {
    const res = analyzeSecurityHeaders(
      {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
      },
      'https://example.com'
    );
    expect(res.findings.find((f) => f.id === 'sec-x-frame-options').status).toBe('pass');
    expect(res.findings.find((f) => f.id === 'sec-x-content-type-options').status).toBe('pass');
  });

  it('evaluates Set-Cookie headers without exposing raw cookie names or sensitive token values', () => {
    const res = analyzeSecurityHeaders(
      {
        'set-cookie': [
          'session_id=SECRET_TOKEN_123; Path=/; Secure; HttpOnly; SameSite=Strict',
          'auth=SECRET_TOKEN_456; Path=/; HttpOnly',
        ],
      },
      'https://example.com'
    );

    const cookieFinding = res.findings.find((f) => f.id === 'sec-cookie-flags');
    expect(cookieFinding.status).toBe('warn');
    expect(cookieFinding.value).toEqual({
      totalCookies: 2,
      missingSecureCount: 1,
      missingHttpOnlyCount: 0,
      missingSameSiteCount: 1,
    });

    // Ensure raw cookie value is NOT leaked in message, title, or value
    const fullJson = JSON.stringify(cookieFinding);
    expect(fullJson).not.toContain('SECRET_TOKEN');
    expect(fullJson).not.toContain('session_id');
  });

  it('verifies summary consistency: summary counts equal count of findings matching status', () => {
    const res = analyzeSecurityHeaders({}, 'https://example.com');
    expect(res.summary.pass).toBe(res.findings.filter((f) => f.status === 'pass').length);
    expect(res.summary.warn).toBe(res.findings.filter((f) => f.status === 'warn').length);
    expect(res.summary.fail).toBe(res.findings.filter((f) => f.status === 'fail').length);
    expect(res.summary.info).toBe(res.findings.filter((f) => f.status === 'info').length);
  });
});
