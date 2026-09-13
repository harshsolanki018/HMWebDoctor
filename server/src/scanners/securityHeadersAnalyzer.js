/**
 * Security Headers & Transport Security Analyzer
 * Passively inspects response headers and TLS/HTTPS transport security settings.
 *
 * @param {object} headers HTTP response headers object
 * @param {string} finalUrl Scanned page URL
 * @returns {object} { summary: { pass, warn, fail, info }, findings: [...] }
 */
function analyzeSecurityHeaders(headers = {}, finalUrl = '') {
  if (typeof headers !== 'object' || headers === null) {
    headers = {};
  }

  // Lowercase all header keys for consistent lookup
  const lowerHeaders = {};
  for (const key of Object.keys(headers)) {
    lowerHeaders[key.toLowerCase()] = headers[key];
  }

  const findings = [];
  const isHttps = typeof finalUrl === 'string' && finalUrl.toLowerCase().startsWith('https://');

  // 1. HTTPS Enforcement Check
  if (isHttps) {
    findings.push({
      id: 'sec-https',
      category: 'securityHeaders',
      status: 'pass',
      severity: 'info',
      title: 'HTTPS Encryption',
      message: 'Scanned page was delivered over secure HTTPS.',
      value: 'https',
      recommendation: 'Maintain HTTPS encryption across all site assets.',
    });
  } else {
    findings.push({
      id: 'sec-https',
      category: 'securityHeaders',
      status: 'warn',
      severity: 'high',
      title: 'Unencrypted HTTP Connection',
      message: 'Scanned page was delivered over unencrypted HTTP protocol.',
      value: 'http',
      recommendation: 'Migrate site traffic to HTTPS and configure 301 redirects from HTTP to HTTPS.',
    });
  }

  // 2. HSTS (Strict-Transport-Security) Check
  const hstsHeader = lowerHeaders['strict-transport-security'];
  if (isHttps) {
    if (!hstsHeader) {
      findings.push({
        id: 'sec-hsts',
        category: 'securityHeaders',
        status: 'warn',
        severity: 'medium',
        title: 'HSTS Header Missing',
        message: 'Strict-Transport-Security (HSTS) header is missing on HTTPS connection.',
        value: null,
        recommendation: 'Enable HSTS with a max-age of at least 15552000 seconds (180 days) to prevent protocol downgrade attacks.',
      });
    } else {
      const match = String(hstsHeader).match(/max-age=(\d+)/i);
      const maxAge = match ? parseInt(match[1], 10) : 0;
      const lowerHsts = String(hstsHeader).toLowerCase();
      const includesSubDomains = lowerHsts.includes('includesubdomains');
      const hasPreloadDirective = lowerHsts.includes('preload');

      const hstsValue = {
        header: hstsHeader,
        maxAge,
        includesSubDomains,
        preloadDirective: hasPreloadDirective,
        preloadNotice: 'The preload directive in the response header indicates submission eligibility; it does not verify whether the domain is currently listed on browser preload lists.',
      };

      if (maxAge >= 15552000) {
        findings.push({
          id: 'sec-hsts',
          category: 'securityHeaders',
          status: 'pass',
          severity: 'info',
          title: 'HSTS Header',
          message: `Strict-Transport-Security (HSTS) is active with max-age >= 180 days (${maxAge}s).`,
          value: hstsValue,
          recommendation: 'Maintain long-duration HSTS directives with includeSubDomains.',
        });
      } else {
        findings.push({
          id: 'sec-hsts',
          category: 'securityHeaders',
          status: 'info',
          severity: 'low',
          title: 'HSTS Duration Short',
          message: `HSTS max-age is set to ${maxAge}s, which is below the recommended 180 days (15,552,000s).`,
          value: hstsValue,
          recommendation: 'Increase HSTS max-age to at least 15552000 seconds (180 days).',
        });
      }
    }
  } else {
    findings.push({
      id: 'sec-hsts',
      category: 'securityHeaders',
      status: 'info',
      severity: 'info',
      title: 'HSTS Check Skipped',
      message: 'HSTS header check skipped on unencrypted HTTP connection (HSTS requires HTTPS).',
      value: null,
      recommendation: 'Migrate to HTTPS before enabling HSTS.',
    });
  }

  // 3. Content-Security-Policy (CSP) Check
  const cspHeader = lowerHeaders['content-security-policy'];
  if (!cspHeader) {
    findings.push({
      id: 'sec-csp',
      category: 'securityHeaders',
      status: 'info',
      severity: 'info',
      title: 'Content Security Policy (CSP)',
      message: 'Content-Security-Policy header is missing.',
      value: null,
      recommendation: 'Implement a Content-Security-Policy header to restrict resource loading and mitigate XSS.',
    });
  } else {
    const cspStr = String(cspHeader).toLowerCase();
    if (cspStr.includes('default-src') || cspStr.includes('script-src')) {
      findings.push({
        id: 'sec-csp',
        category: 'securityHeaders',
        status: 'pass',
        severity: 'info',
        title: 'Content Security Policy (CSP)',
        message: 'Content-Security-Policy header is present with core directives.',
        value: cspHeader,
        recommendation: 'Regularly audit CSP directives to enforce principle of least privilege.',
      });
    } else {
      findings.push({
        id: 'sec-csp',
        category: 'securityHeaders',
        status: 'info',
        severity: 'info',
        title: 'Content Security Policy (CSP)',
        message: 'Content-Security-Policy header is present but may lack standard fallback directives.',
        value: cspHeader,
        recommendation: 'Include default-src or script-src directives in your Content-Security-Policy.',
      });
    }
  }

  // 4. X-Frame-Options Check
  const xfoHeader = lowerHeaders['x-frame-options'];
  if (!xfoHeader) {
    findings.push({
      id: 'sec-x-frame-options',
      category: 'securityHeaders',
      status: 'warn',
      severity: 'low',
      title: 'X-Frame-Options Missing',
      message: 'X-Frame-Options header is missing.',
      value: null,
      recommendation: 'Add X-Frame-Options header set to DENY or SAMEORIGIN to prevent clickjacking attacks.',
    });
  } else {
    const xfoVal = String(xfoHeader).toUpperCase().trim();
    if (xfoVal === 'DENY' || xfoVal === 'SAMEORIGIN') {
      findings.push({
        id: 'sec-x-frame-options',
        category: 'securityHeaders',
        status: 'pass',
        severity: 'info',
        title: 'X-Frame-Options',
        message: `X-Frame-Options is set to ${xfoVal}.`,
        value: xfoHeader,
        recommendation: 'Maintain framing protections to mitigate clickjacking.',
      });
    } else {
      findings.push({
        id: 'sec-x-frame-options',
        category: 'securityHeaders',
        status: 'info',
        severity: 'info',
        title: 'X-Frame-Options Configuration',
        message: `X-Frame-Options header is set to ${xfoVal}.`,
        value: xfoHeader,
        recommendation: 'Ensure framing policy aligns with security expectations.',
      });
    }
  }

  // 5. X-Content-Type-Options Check
  const xctoHeader = lowerHeaders['x-content-type-options'];
  if (!xctoHeader) {
    findings.push({
      id: 'sec-x-content-type-options',
      category: 'securityHeaders',
      status: 'warn',
      severity: 'low',
      title: 'X-Content-Type-Options Missing',
      message: 'X-Content-Type-Options header is missing.',
      value: null,
      recommendation: 'Add X-Content-Type-Options: nosniff header to prevent MIME-type sniffing.',
    });
  } else {
    const xctoVal = String(xctoHeader).toLowerCase().trim();
    if (xctoVal === 'nosniff') {
      findings.push({
        id: 'sec-x-content-type-options',
        category: 'securityHeaders',
        status: 'pass',
        severity: 'info',
        title: 'X-Content-Type-Options',
        message: 'X-Content-Type-Options is set to nosniff.',
        value: xctoHeader,
        recommendation: 'Maintain nosniff policy across static assets.',
      });
    } else {
      findings.push({
        id: 'sec-x-content-type-options',
        category: 'securityHeaders',
        status: 'info',
        severity: 'info',
        title: 'X-Content-Type-Options',
        message: `X-Content-Type-Options header is present (${xctoHeader}).`,
        value: xctoHeader,
        recommendation: 'Set X-Content-Type-Options to nosniff.',
      });
    }
  }

  // 6. Referrer-Policy Check
  const refHeader = lowerHeaders['referrer-policy'];
  if (!refHeader) {
    findings.push({
      id: 'sec-referrer-policy',
      category: 'securityHeaders',
      status: 'info',
      severity: 'info',
      title: 'Referrer-Policy',
      message: 'Referrer-Policy header is missing.',
      value: null,
      recommendation: 'Configure a Referrer-Policy header (e.g. strict-origin-when-cross-origin) to control referrer information exposure.',
    });
  } else {
    findings.push({
      id: 'sec-referrer-policy',
      category: 'securityHeaders',
      status: 'pass',
      severity: 'info',
      title: 'Referrer-Policy',
      message: `Referrer-Policy header is configured (${refHeader}).`,
      value: refHeader,
      recommendation: 'Maintain appropriate referrer privacy policies.',
    });
  }

  // 7. Permissions-Policy Check
  const permHeader = lowerHeaders['permissions-policy'] || lowerHeaders['feature-policy'];
  if (!permHeader) {
    findings.push({
      id: 'sec-permissions-policy',
      category: 'securityHeaders',
      status: 'info',
      severity: 'info',
      title: 'Permissions-Policy',
      message: 'Permissions-Policy header is missing.',
      value: null,
      recommendation: 'Consider adding a Permissions-Policy header to restrict browser feature access (camera, microphone, geolocation).',
    });
  } else {
    findings.push({
      id: 'sec-permissions-policy',
      category: 'securityHeaders',
      status: 'pass',
      severity: 'info',
      title: 'Permissions-Policy',
      message: 'Permissions-Policy header is configured.',
      value: permHeader,
      recommendation: 'Maintain strict browser feature access controls.',
    });
  }

  // 8. Cookie Security Flags Check (Set-Cookie)
  // NEVER log or expose actual cookie names or sensitive cookie values
  const setCookieRaw = lowerHeaders['set-cookie'];
  if (!setCookieRaw) {
    findings.push({
      id: 'sec-cookie-flags',
      category: 'securityHeaders',
      status: 'info',
      severity: 'info',
      title: 'Cookie Security Flags',
      message: 'No response cookies set.',
      value: null,
      recommendation: 'If cookies are introduced, ensure Secure, HttpOnly, and SameSite attributes are enabled.',
    });
  } else {
    const cookiesList = Array.isArray(setCookieRaw) ? setCookieRaw : [setCookieRaw];
    const totalCookies = cookiesList.length;
    let missingSecureCount = 0;
    let missingHttpOnlyCount = 0;
    let missingSameSiteCount = 0;

    for (const cookieStr of cookiesList) {
      const lowerCookie = String(cookieStr).toLowerCase();
      if (!lowerCookie.includes('secure')) {
        missingSecureCount++;
      }
      if (!lowerCookie.includes('httponly')) {
        missingHttpOnlyCount++;
      }
      if (!lowerCookie.includes('samesite')) {
        missingSameSiteCount++;
      }
    }

    const cookieSummaryValue = {
      totalCookies,
      missingSecureCount,
      missingHttpOnlyCount,
      missingSameSiteCount,
    };

    if (missingSecureCount === 0 && missingHttpOnlyCount === 0 && missingSameSiteCount === 0) {
      findings.push({
        id: 'sec-cookie-flags',
        category: 'securityHeaders',
        status: 'pass',
        severity: 'info',
        title: 'Cookie Security Flags',
        message: `All set cookies (${totalCookies}) include Secure, HttpOnly, and SameSite flags.`,
        value: cookieSummaryValue,
        recommendation: 'Maintain strict cookie flag configurations across all session cookies.',
      });
    } else {
      findings.push({
        id: 'sec-cookie-flags',
        category: 'securityHeaders',
        status: 'warn',
        severity: 'medium',
        title: 'Cookie Security Flags Missing',
        message: `Some set cookies lack security attributes (Total: ${totalCookies}, Missing Secure: ${missingSecureCount}, Missing HttpOnly: ${missingHttpOnlyCount}, Missing SameSite: ${missingSameSiteCount}).`,
        value: cookieSummaryValue,
        recommendation: 'Ensure all sensitive cookies include Secure, HttpOnly, and SameSite attributes.',
      });
    }
  }

  const summary = {
    pass: findings.filter((f) => f.status === 'pass').length,
    warn: findings.filter((f) => f.status === 'warn').length,
    fail: findings.filter((f) => f.status === 'fail').length,
    info: findings.filter((f) => f.status === 'info').length,
  };

  return { summary, findings };
}

module.exports = {
  analyzeSecurityHeaders,
};
