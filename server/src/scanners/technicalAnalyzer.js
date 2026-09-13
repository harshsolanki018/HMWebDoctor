/**
 * Technical Response & Document Analyzer
 * Observes HTTP response attributes, compression, caching headers, character encoding, and DOCTYPE declarations.
 *
 * @param {object} fetchResult Raw fetch result object from safeFetcher
 * @param {object} baseline Baseline document metadata from baselineAnalyzer
 * @returns {object} { summary: { pass, warn, fail, info }, findings: [...] }
 */
function analyzeTechnical(fetchResult = {}, baseline = {}) {
  const findings = [];

  const headers = fetchResult.headers || {};
  const lowerHeaders = {};
  for (const key of Object.keys(headers)) {
    lowerHeaders[key.toLowerCase()] = headers[key];
  }

  // 1. HTTP Status Code Check
  const statusCode = fetchResult.statusCode || 200;
  if (statusCode === 200) {
    findings.push({
      id: 'tech-status-code',
      category: 'technical',
      status: 'pass',
      severity: 'info',
      title: 'HTTP Status Code',
      message: 'Target server responded with HTTP 200 OK.',
      value: statusCode,
      recommendation: 'Maintain healthy 200 OK responses for primary content URLs.',
    });
  } else if (statusCode >= 300 && statusCode < 400) {
    findings.push({
      id: 'tech-status-code',
      category: 'technical',
      status: 'info',
      severity: 'info',
      title: 'HTTP Status Code',
      message: `Target server returned redirect status ${statusCode}.`,
      value: statusCode,
      recommendation: 'Verify that redirects are permanent (301) and point directly to final destination.',
    });
  } else if (statusCode >= 400 && statusCode < 500) {
    findings.push({
      id: 'tech-status-code',
      category: 'technical',
      status: 'warn',
      severity: 'medium',
      title: 'HTTP Client Error Status',
      message: `Target server returned client error status ${statusCode}.`,
      value: statusCode,
      recommendation: 'Investigate URL resource location and server routing configuration.',
    });
  } else {
    findings.push({
      id: 'tech-status-code',
      category: 'technical',
      status: 'warn',
      severity: 'high',
      title: 'HTTP Server Error Status',
      message: `Target server returned server error status ${statusCode}.`,
      value: statusCode,
      recommendation: 'Inspect upstream application server logs to diagnose 5xx failures.',
    });
  }

  // 2. HTTP Compression Check
  const encoding = lowerHeaders['content-encoding'];
  if (encoding) {
    findings.push({
      id: 'tech-compression',
      category: 'technical',
      status: 'pass',
      severity: 'info',
      title: 'HTTP Payload Compression',
      message: `HTTP compression is enabled (${encoding}).`,
      value: encoding,
      recommendation: 'Maintain Gzip/Brotli compression on text assets.',
    });
  } else {
    findings.push({
      id: 'tech-compression',
      category: 'technical',
      status: 'info',
      severity: 'info',
      title: 'HTTP Payload Compression',
      message: 'HTTP compression header (content-encoding) is missing.',
      value: null,
      recommendation: 'Enable Gzip or Brotli compression on web server to reduce document response payload size.',
    });
  }

  // 3. HTTP Caching Headers Check
  const cacheControl = lowerHeaders['cache-control'];
  const etag = lowerHeaders['etag'];
  const expires = lowerHeaders['expires'];
  const lastModified = lowerHeaders['last-modified'];

  if (cacheControl || etag || expires || lastModified) {
    findings.push({
      id: 'tech-caching',
      category: 'technical',
      status: 'pass',
      severity: 'info',
      title: 'HTTP Cache Controls',
      message: 'HTTP caching controls are declared in response headers.',
      value: {
        cacheControl: cacheControl || null,
        etag: etag || null,
        expires: expires || null,
        lastModified: lastModified || null,
      },
      recommendation: 'Maintain explicit caching policies for static and dynamic responses.',
    });
  } else {
    findings.push({
      id: 'tech-caching',
      category: 'technical',
      status: 'info',
      severity: 'info',
      title: 'HTTP Cache Controls',
      message: 'No explicit HTTP caching headers found.',
      value: null,
      recommendation: 'Configure Cache-Control and ETag headers to optimize client and browser caching behavior.',
    });
  }

  // 4. Character Set Consistency Check
  const charset = baseline.charset;
  if (charset) {
    findings.push({
      id: 'tech-charset',
      category: 'technical',
      status: 'pass',
      severity: 'info',
      title: 'Character Set Encoding',
      message: `Character set encoding is declared (${charset}).`,
      value: charset,
      recommendation: 'Maintain UTF-8 character encoding for global web compatibility.',
    });
  } else {
    findings.push({
      id: 'tech-charset',
      category: 'technical',
      status: 'info',
      severity: 'info',
      title: 'Character Set Encoding',
      message: 'Character set declaration was not found in document baseline.',
      value: null,
      recommendation: 'Declare UTF-8 character encoding in Content-Type header or <meta charset="utf-8"> tag.',
    });
  }

  // 5. DOCTYPE & Document Size Check
  const hasDoctype = baseline.hasDoctype;
  const docSizeBytes = baseline.documentSizeBytes || fetchResult.contentLengthBytes || 0;
  const docSizeKb = Math.round(docSizeBytes / 1024);

  if (hasDoctype) {
    findings.push({
      id: 'tech-doctype-size',
      category: 'technical',
      status: 'pass',
      severity: 'info',
      title: 'HTML DOCTYPE & Document Size',
      message: `Standards HTML DOCTYPE is present. Document size is ${docSizeKb} KB (${docSizeBytes} bytes).`,
      value: { hasDoctype: true, sizeBytes: docSizeBytes },
      recommendation: 'Maintain standard DOCTYPE declaration and lean HTML document payloads.',
    });
  } else {
    findings.push({
      id: 'tech-doctype-size',
      category: 'technical',
      status: 'warn',
      severity: 'low',
      title: 'HTML DOCTYPE Missing',
      message: `HTML DOCTYPE declaration is missing. Document size is ${docSizeKb} KB (${docSizeBytes} bytes).`,
      value: { hasDoctype: false, sizeBytes: docSizeBytes },
      recommendation: 'Add <!DOCTYPE html> at the beginning of the HTML document to prevent quirks mode rendering.',
    });
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
  analyzeTechnical,
};
