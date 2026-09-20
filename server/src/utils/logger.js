/**
 * Structured, sanitized logging utility for HMWebDoctor server.
 * Redacts secrets, tokens, passwords, and database credentials from log outputs.
 */

const sanitizeMessage = (data) => {
  if (typeof data === 'string') {
    // Redact MongoDB credentials from URIs (mongodb://user:pass@host)
    let sanitized = data.replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb$1://[REDACTED_CREDENTIALS]@');
    // Redact HTTP URL credentials (https://user:pass@host)
    sanitized = sanitized.replace(/https?:\/\/[^:\s]+:[^@\s]+@/gi, 'https://[REDACTED_CREDENTIALS]@');
    // Redact sensitive query parameters and URL credentials
    sanitized = sanitized.replace(/([?&])(token|secret|password|auth|access_token|key|apiKey)=[^&#\s]+/gi, '$1$2=[REDACTED]');
    // Redact URL fragments
    sanitized = sanitized.replace(/#[^\s]+/gi, '#[REDACTED]');
    // Redact password or token string values
    sanitized = sanitized.replace(/(password|token|secret|auth|authorization|cookie)=[^&\s]+/gi, '$1=[REDACTED]');
    return sanitized;
  }

  if (typeof data === 'object' && data !== null) {
    const copy = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie') ||
        lowerKey.includes('destinationip') ||
        lowerKey.includes('resolvedip') ||
        lowerKey.includes('rawhtml')
      ) {
        copy[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        copy[key] = sanitizeMessage(value);
      } else if (typeof value === 'string') {
        copy[key] = sanitizeMessage(value);
      } else {
        copy[key] = value;
      }
    }
    return copy;
  }

  return data;
};

const formatLog = (level, event, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    event,
    message: sanitizeMessage(message),
    ...(Object.keys(meta).length > 0 ? { meta: sanitizeMessage(meta) } : {}),
  };
  return JSON.stringify(logEntry);
};

const logger = {
  info: (event, message, meta) => {
    console.log(formatLog('info', event, message, meta));
  },
  warn: (event, message, meta) => {
    console.warn(formatLog('warn', event, message, meta));
  },
  error: (event, message, meta) => {
    console.error(formatLog('error', event, message, meta));
  },
};

module.exports = logger;
