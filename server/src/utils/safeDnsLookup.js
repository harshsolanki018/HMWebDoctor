const dns = require('dns').promises;
const { isIpSafe, isHostnameUnsafe } = require('../validators/ipValidator');
const logger = require('./logger');

/**
 * Custom DNS Lookup Function for Node.js http/https Agent options.
 * Validates destination hostnames and IP addresses BEFORE socket establishment
 * to guarantee DNS Rebinding (TOCTOU) protection while preserving TLS SNI
 * and certificate hostname verification.
 */
const createSafeDnsLookup = () => {
  return async (hostname, options, callback) => {
    // Handle overload signatures (callback can be 2nd or 3rd argument)
    const cb = typeof options === 'function' ? options : callback;
    const opts = typeof options === 'object' && options !== null ? options : {};

    try {
      // Step 1: Check hostname blacklist (.localhost, .internal, etc.)
      if (isHostnameUnsafe(hostname)) {
        const err = new Error(`UNSAFE_DESTINATION: Hostname '${hostname}' is restricted.`);
        err.code = 'UNSAFE_DESTINATION';
        return cb(err);
      }

      // If hostname is already a raw IP string, validate directly
      const directIpCheck = isIpSafe(hostname);
      if (directIpCheck.isSafe) {
        const family = hostname.includes(':') ? 6 : 4;
        if (opts.all) {
          return cb(null, [{ address: hostname, family }]);
        }
        return cb(null, hostname, family);
      } else if (directIpCheck.reason && !directIpCheck.reason.includes('Invalid IP address syntax')) {
        // Was an invalid/restricted IP string (e.g. 127.0.0.1)
        const err = new Error(`UNSAFE_DESTINATION: IP '${hostname}' is in a restricted range.`);
        err.code = 'UNSAFE_DESTINATION';
        return cb(err);
      }

      // Step 2: Resolve DNS records using system DNS
      const lookupResults = await dns.lookup(hostname, { all: true });

      if (!lookupResults || lookupResults.length === 0) {
        const err = new Error(`ENOTFOUND: Unable to resolve hostname '${hostname}'`);
        err.code = 'ENOTFOUND';
        return cb(err);
      }

      // Step 3: Validate ALL resolved IP addresses against prohibited CIDRs
      const validatedResults = [];
      for (const res of lookupResults) {
        const safety = isIpSafe(res.address);
        if (!safety.isSafe) {
          logger.warn('ssrf_blocked_ip', `Blocked DNS resolution to restricted IP for hostname ${hostname}`, {
            hostname,
            ip: res.address,
            reason: safety.reason,
          });
          const err = new Error(`UNSAFE_DESTINATION: Destination IP '${res.address}' for '${hostname}' is restricted.`);
          err.code = 'UNSAFE_DESTINATION';
          return cb(err);
        }
        validatedResults.push(res);
      }

      // Step 4: Return validated IP to socket connection
      if (opts.all) {
        return cb(null, validatedResults);
      }

      const primary = validatedResults[0];
      return cb(null, primary.address, primary.family);
    } catch (err) {
      if (err.code === 'UNSAFE_DESTINATION') {
        return cb(err);
      }
      logger.warn('dns_resolution_failed', `DNS lookup failed for hostname '${hostname}'`, {
        hostname,
        error: err.message,
      });
      return cb(err);
    }
  };
};

module.exports = {
  createSafeDnsLookup,
};
