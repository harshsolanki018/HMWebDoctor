const ipaddr = require('ipaddr.js');

/**
 * Centralized IP Address Safety Validator for HMWebDoctor.
 * Evaluates IPv4 and IPv6 addresses against private, loopback, link-local,
 * multicast, carrier-grade NAT, cloud metadata, and reserved ranges.
 */

// Explicit CIDR ranges to block in addition to ipaddr.js range checking
const BLOCKED_IPV4_CIDRS = [
  ipaddr.parseCIDR('0.0.0.0/8'),        // Unspecified / Current network
  ipaddr.parseCIDR('10.0.0.0/8'),       // Private-Use (RFC 1918)
  ipaddr.parseCIDR('100.64.0.0/10'),    // Shared Address Space / CGNAT
  ipaddr.parseCIDR('127.0.0.0/8'),      // Loopback
  ipaddr.parseCIDR('169.254.0.0/16'),   // Link-Local / Cloud Metadata
  ipaddr.parseCIDR('172.16.0.0/12'),    // Private-Use (RFC 1918)
  ipaddr.parseCIDR('192.0.0.0/24'),     // IETF Protocol Assignments
  ipaddr.parseCIDR('192.0.2.0/24'),     // TEST-NET-1
  ipaddr.parseCIDR('192.168.0.0/16'),   // Private-Use (RFC 1918)
  ipaddr.parseCIDR('198.18.0.0/15'),    // Benchmarking
  ipaddr.parseCIDR('198.51.100.0/24'),  // TEST-NET-2
  ipaddr.parseCIDR('203.0.113.0/24'),   // TEST-NET-3
  ipaddr.parseCIDR('224.0.0.0/4'),      // Multicast
  ipaddr.parseCIDR('240.0.0.0/4'),      // Reserved for Future Use / Broadcast
];

const BLOCKED_IPV6_CIDRS = [
  ipaddr.parseCIDR('::/128'),           // Unspecified
  ipaddr.parseCIDR('::1/128'),          // Loopback
  ipaddr.parseCIDR('::/96'),            // IPv4-compatible (Deprecated)
  ipaddr.parseCIDR('100::/64'),         // Discard-Only Prefix
  ipaddr.parseCIDR('2001:db8::/32'),    // Documentation
  ipaddr.parseCIDR('fc00::/7'),         // Unique Local Unicast (ULA)
  ipaddr.parseCIDR('fe80::/10'),        // Link-Local
  ipaddr.parseCIDR('ff00::/8'),         // Multicast
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.tencentyun.com',
  'instance-data',
];

/**
 * Normalizes and checks whether an IP address (IPv4 or IPv6 string) is safe for outbound requests.
 * @param {string} ipAddress Raw IP address string
 * @returns {{ isSafe: boolean, ip: string, reason: string | null }}
 */
const isIpSafe = (ipAddress) => {
  if (!ipAddress || typeof ipAddress !== 'string') {
    return { isSafe: false, ip: '', reason: 'Missing or non-string IP address' };
  }

  let cleanedIp = ipAddress.trim();

  // Strip IPv6 brackets if present (e.g. "[::1]")
  if (cleanedIp.startsWith('[') && cleanedIp.endsWith(']')) {
    cleanedIp = cleanedIp.slice(1, -1);
  }

  let parsedIp;
  try {
    parsedIp = ipaddr.parse(cleanedIp);
  } catch {
    return { isSafe: false, ip: cleanedIp, reason: 'Invalid IP address syntax' };
  }

  // Unwrap IPv4-mapped IPv6 address (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
  if (parsedIp.kind() === 'ipv6' && parsedIp.isIPv4MappedAddress()) {
    parsedIp = parsedIp.toIPv4Address();
  }

  const range = parsedIp.range();

  // Check ipaddr.js default range classifications
  if (range !== 'unicast') {
    return {
      isSafe: false,
      ip: parsedIp.toString(),
      reason: `IP address belongs to restricted range: ${range}`,
    };
  }

  // Check IPv4 CIDRs
  if (parsedIp.kind() === 'ipv4') {
    for (const cidr of BLOCKED_IPV4_CIDRS) {
      if (parsedIp.match(cidr)) {
        return {
          isSafe: false,
          ip: parsedIp.toString(),
          reason: `IPv4 address matches restricted CIDR block: ${cidr[0].toString()}/${cidr[1]}`,
        };
      }
    }
  }

  // Check IPv6 CIDRs
  if (parsedIp.kind() === 'ipv6') {
    for (const cidr of BLOCKED_IPV6_CIDRS) {
      if (parsedIp.match(cidr)) {
        return {
          isSafe: false,
          ip: parsedIp.toString(),
          reason: `IPv6 address matches restricted CIDR block: ${cidr[0].toString()}/${cidr[1]}`,
        };
      }
    }
  }

  return { isSafe: true, ip: parsedIp.toString(), reason: null };
};

/**
 * Checks if a hostname matches known local/internal metadata names or patterns.
 * @param {string} hostname Target hostname
 * @returns {boolean} True if hostname is unsafe
 */
const isHostnameUnsafe = (hostname) => {
  if (!hostname || typeof hostname !== 'string') return true;

  const lower = hostname.toLowerCase().trim();

  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  if (
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.startsWith('metadata.')
  ) {
    return true;
  }

  return false;
};

/**
 * Returns true if an IP address belongs to any restricted/private range.
 * @param {string} ipAddress 
 * @returns {boolean}
 */
const isPrivateIp = (ipAddress) => {
  const result = isIpSafe(ipAddress);
  return !result.isSafe;
};

/**
 * Validates an IP address syntax and throws if invalid.
 * @param {string} ipAddress 
 */
const validateIpAddress = (ipAddress) => {
  const result = isIpSafe(ipAddress);
  if (!result.isSafe && result.reason && result.reason.includes('Invalid IP address syntax')) {
    throw new Error('Invalid IP address format');
  }
  return result;
};

module.exports = {
  isIpSafe,
  isHostnameUnsafe,
  isPrivateIp,
  validateIpAddress,
};
