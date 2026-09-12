const http = require('http');
const https = require('https');
const { URL } = require('url');
const net = require('net');
const config = require('../config/env');
const logger = require('../utils/logger');
const { createSafeDnsLookup } = require('../utils/safeDnsLookup');
const { isHostnameUnsafe, isIpSafe } = require('../validators/ipValidator');

const ALLOWED_PORTS = new Set([80, 443, 8080, 8443]);
const SUPPORTED_CONTENT_TYPES = ['text/html', 'application/xhtml+xml', 'text/xml'];

/**
 * Custom Error Class for Scanner Fetch Errors
 */
class ScannerFetchError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'ScannerFetchError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Validates a candidate URL string for protocol, port, credentials, and hostname safety.
 * @param {string} rawUrl 
 * @returns {URL} Parsed URL object
 */
const validateUrlSyntaxAndPolicy = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new ScannerFetchError('INVALID_URL', 'Please enter a valid website URL.', 400);
  }

  const trimmed = rawUrl.trim();

  // Reject embedded credentials (e.g. user:pass@host)
  if (trimmed.includes('@')) {
    throw new ScannerFetchError('INVALID_URL', 'URLs containing credentials (user:pass@domain) are not allowed.', 400);
  }

  // Reject whitespace
  if (/\s/.test(trimmed)) {
    throw new ScannerFetchError('INVALID_URL', 'URLs cannot contain spaces.', 400);
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ScannerFetchError('INVALID_URL', 'Please enter a valid website URL (e.g. https://example.com).', 400);
  }

  // Protocol check: HTTP & HTTPS only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new ScannerFetchError('UNSUPPORTED_PROTOCOL', 'Only HTTP and HTTPS website URLs are supported.', 400);
  }

  // Hostname check
  const hostname = parsed.hostname;
  if (!hostname || hostname.length === 0) {
    throw new ScannerFetchError('INVALID_URL', 'Please enter a valid website hostname (e.g. example.com).', 400);
  }

  if (isHostnameUnsafe(hostname)) {
    throw new ScannerFetchError('UNSAFE_DESTINATION', 'The target URL points to a restricted or private destination.', 400);
  }

  // IP address hostname check
  if (net.isIP(hostname)) {
    const ipCheck = isIpSafe(hostname);
    if (!ipCheck.isSafe) {
      throw new ScannerFetchError('UNSAFE_DESTINATION', `The target URL points to a restricted IP address (${hostname}).`, 400);
    }
  }

  // Port policy check
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    if (isNaN(portNum) || !ALLOWED_PORTS.has(portNum)) {
      throw new ScannerFetchError('UNSAFE_DESTINATION', `Port ${parsed.port} is restricted. Only standard web ports (80, 443, 8080, 8443) are allowed.`, 400);
    }
  }

  return parsed;
};

/**
 * Checks if a Content-Type header string matches supported HTML content types.
 * @param {string} contentTypeHeader 
 * @returns {boolean}
 */
const isSupportedContentType = (contentTypeHeader) => {
  if (!contentTypeHeader) return true; // Fallback to HTML parsing if header missing

  const lower = contentTypeHeader.toLowerCase();
  return SUPPORTED_CONTENT_TYPES.some((type) => lower.includes(type));
};

/**
 * Performs a single HTTP/HTTPS request with safe DNS lookup, timeouts, and body size streaming limits.
 * @param {URL} parsedUrl 
 * @param {object} options 
 * @returns {Promise<{ statusCode: number, statusText: string, headers: object, body: string, finalUrl: string }>}
 */
const fetchSingleUrl = (parsedUrl, options = {}) => {
  return new Promise((resolve, reject) => {
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const safeDnsLookup = createSafeDnsLookup();
    const timeoutMs = options.timeoutMs || config.SCAN_TIMEOUT_MS;
    const maxBytes = options.maxBytes || config.MAX_SCAN_RESPONSE_BYTES;
    const userAgent = config.SCAN_USER_AGENT || 'HMWebDoctorBot/1.0 (+https://hmwebdoctor.com/bot)';

    let isSettled = false;
    let timeoutTimer = null;

    const reqOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,text/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'close',
      },
      lookup: safeDnsLookup, // Enforce socket-level DNS & IP security check
      servername: isHttps ? parsedUrl.hostname : undefined, // Preserve TLS SNI
    };

    const cleanup = () => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
    };

    const req = httpModule.request(reqOptions, (res) => {
      const statusCode = res.statusCode;
      const contentType = res.headers['content-type'] || '';

      // Check Content-Length if available
      const contentLengthStr = res.headers['content-length'];
      if (contentLengthStr) {
        const contentLength = parseInt(contentLengthStr, 10);
        if (!isNaN(contentLength) && contentLength > maxBytes) {
          req.destroy();
          cleanup();
          isSettled = true;
          return reject(new ScannerFetchError('RESPONSE_TOO_LARGE', `Target webpage exceeds maximum readable document size (${Math.round(maxBytes / 1024 / 1024)}MB).`, 413));
        }
      }

      // Check for redirect status (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        req.destroy();
        cleanup();
        isSettled = true;
        return resolve({
          isRedirect: true,
          statusCode,
          location: res.headers.location || null,
          headers: res.headers,
        });
      }

      // Check Content-Type whitelist for non-redirect responses
      if (!isSupportedContentType(contentType)) {
        req.destroy();
        cleanup();
        isSettled = true;
        return reject(new ScannerFetchError('UNSUPPORTED_CONTENT_TYPE', `Target page returned unsupported content type '${contentType}' (only HTML pages are supported).`, 415));
      }

      // Stream body up to maxBytes
      let downloadedBytes = 0;
      const chunks = [];

      res.on('data', (chunk) => {
        if (isSettled) return;

        downloadedBytes += chunk.length;
        if (downloadedBytes > maxBytes) {
          isSettled = true;
          req.destroy();
          cleanup();
          return reject(new ScannerFetchError('RESPONSE_TOO_LARGE', `Target webpage exceeds maximum readable document size (${Math.round(maxBytes / 1024 / 1024)}MB).`, 413));
        }
        chunks.push(chunk);
      });

      res.on('end', () => {
        if (isSettled) return;
        cleanup();
        isSettled = true;

        const bodyBuffer = Buffer.concat(chunks);
        const bodyText = bodyBuffer.toString('utf-8');

        resolve({
          isRedirect: false,
          statusCode,
          statusText: res.statusMessage || 'OK',
          headers: res.headers,
          body: bodyText,
          downloadedBytes,
          finalUrl: parsedUrl.toString(),
        });
      });

      res.on('error', (streamErr) => {
        if (isSettled) return;
        cleanup();
        isSettled = true;
        reject(new ScannerFetchError('UPSTREAM_ERROR', `Error reading response stream from target website: ${streamErr.message}`, 502));
      });
    });

    // Request Timeout handling
    timeoutTimer = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      req.destroy();
      reject(new ScannerFetchError('REQUEST_TIMEOUT', 'The target website took too long to respond (timeout).', 504));
    }, timeoutMs);

    req.on('error', (err) => {
      if (isSettled) return;
      cleanup();
      isSettled = true;

      if (err.code === 'UNSAFE_DESTINATION') {
        return reject(err);
      }

      logger.warn('fetch_connection_failed', `Failed outbound HTTP request to ${parsedUrl.toString()}`, {
        url: parsedUrl.toString(),
        error: err.message,
        code: err.code,
      });

      reject(new ScannerFetchError('UPSTREAM_ERROR', `Unable to connect to target website server: ${err.message}`, 502));
    });

    req.end();
  });
};

/**
 * Executes outbound website fetch with manual redirect loop validation.
 * @param {string} initialUrl Raw target URL
 * @param {object} customOptions Configuration overrides
 */
const safeFetchWebsite = async (initialUrl, customOptions = {}) => {
  const maxRedirects = customOptions.maxRedirects || config.MAX_REDIRECTS;
  let currentUrlObj = validateUrlSyntaxAndPolicy(initialUrl);
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    const fetchResult = await fetchSingleUrl(currentUrlObj, customOptions);

    if (!fetchResult.isRedirect) {
      return {
        statusCode: fetchResult.statusCode,
        statusText: fetchResult.statusText,
        headers: fetchResult.headers,
        body: fetchResult.body,
        downloadedBytes: fetchResult.downloadedBytes,
        finalUrl: currentUrlObj.toString(),
        redirectCount,
      };
    }

    // Handle Redirect
    redirectCount++;
    if (redirectCount > maxRedirects) {
      throw new ScannerFetchError('REDIRECT_LIMIT_EXCEEDED', `The target website exceeded the maximum allowed redirect hops (${maxRedirects}).`, 400);
    }

    if (!fetchResult.location) {
      throw new ScannerFetchError('UPSTREAM_ERROR', 'Target server returned redirect status without a Location header.', 502);
    }

    // Resolve relative or absolute redirect URL against current URL
    let nextUrlString;
    try {
      nextUrlString = new URL(fetchResult.location, currentUrlObj).toString();
    } catch {
      throw new ScannerFetchError('INVALID_URL', `Target server returned malformed redirect Location header '${fetchResult.location}'.`, 400);
    }

    // Re-validate syntax, protocol, and hostname policy for redirect destination
    currentUrlObj = validateUrlSyntaxAndPolicy(nextUrlString);

    logger.info('scan_redirect_followed', `Followed valid redirect step (${redirectCount}/${maxRedirects})`, {
      from: fetchResult.location,
      to: currentUrlObj.toString(),
    });
  }

  throw new ScannerFetchError('REDIRECT_LIMIT_EXCEEDED', `Exceeded maximum redirect limit of ${maxRedirects}.`, 400);
};

/**
 * Primary scanner entrypoint for fetching target URL safely with redirect tracking.
 * @param {string} initialUrl 
 * @param {object} customOptions 
 */
const fetchSafeUrl = async (initialUrl, customOptions = {}) => {
  const redirectChain = [];
  const maxRedirects = customOptions.maxRedirects || config.MAX_REDIRECTS;
  let currentUrlObj = validateUrlSyntaxAndPolicy(initialUrl);
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    const fetchResult = await fetchSingleUrl(currentUrlObj, customOptions);

    if (!fetchResult.isRedirect) {
      return {
        targetUrl: initialUrl,
        finalUrl: currentUrlObj.toString(),
        statusCode: fetchResult.statusCode,
        statusText: fetchResult.statusText,
        contentType: fetchResult.headers['content-type'] || 'text/html',
        contentLengthBytes: fetchResult.downloadedBytes,
        headers: fetchResult.headers,
        html: fetchResult.body,
        redirectCount,
        redirectChain,
      };
    }

    redirectChain.push({
      url: currentUrlObj.toString(),
      status: fetchResult.statusCode,
      location: fetchResult.location,
    });

    redirectCount++;
    if (redirectCount > maxRedirects) {
      throw new ScannerFetchError('REDIRECT_LIMIT_EXCEEDED', `The target website exceeded the maximum allowed redirect hops (${maxRedirects}).`, 400);
    }

    if (!fetchResult.location) {
      throw new ScannerFetchError('UPSTREAM_ERROR', 'Target server returned redirect status without a Location header.', 502);
    }

    let nextUrlString;
    try {
      nextUrlString = new URL(fetchResult.location, currentUrlObj).toString();
    } catch {
      throw new ScannerFetchError('INVALID_URL', `Target server returned malformed redirect Location header '${fetchResult.location}'.`, 400);
    }

    currentUrlObj = validateUrlSyntaxAndPolicy(nextUrlString);
  }

  throw new ScannerFetchError('REDIRECT_LIMIT_EXCEEDED', `Exceeded maximum redirect limit of ${maxRedirects}.`, 400);
};

module.exports = {
  fetchSafeUrl,
  safeFetchWebsite,
  validateUrlSyntaxAndPolicy,
  ScannerFetchError,
};
