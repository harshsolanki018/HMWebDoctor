/**
 * Client-side URL Validation & Normalization Utility
 * Note: This provides instant UX feedback for URL input forms.
 * It is NOT a security boundary. Server-side SSRF validation will be handled in Milestone 3.
 */
export const validateAndNormalizeUrl = (input) => {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'Please enter a website URL.',
    };
  }

  let trimmed = input.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'Please enter a website URL.',
    };
  }

  // Reject embedded credentials (user:pass@host)
  if (trimmed.includes('@')) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'URLs containing credentials (user:pass@domain) are not allowed.',
    };
  }

  // Reject spaces
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'URLs cannot contain spaces.',
    };
  }

  // Auto-prefix protocol if missing (if no scheme like http://, https://, ftp:// is present)
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsedUrl = new URL(trimmed);

    // Protocol check: HTTP or HTTPS only
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        isValid: false,
        normalizedUrl: '',
        error: 'Only HTTP and HTTPS website URLs are supported.',
      };
    }

    // Hostname check
    const hostname = parsedUrl.hostname;
    if (!hostname || hostname.length === 0) {
      return {
        isValid: false,
        normalizedUrl: '',
        error: 'Please enter a valid website hostname (e.g. example.com).',
      };
    }

    // Check for dot in hostname unless it is localhost for local dev
    if (!hostname.includes('.') && hostname !== 'localhost') {
      return {
        isValid: false,
        normalizedUrl: '',
        error: 'Please enter a valid domain name with an extension (e.g. example.com).',
      };
    }

    return {
      isValid: true,
      normalizedUrl: parsedUrl.toString(),
      error: null,
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: '',
      error: 'Please enter a valid website URL (e.g. https://example.com).',
    };
  }
};
