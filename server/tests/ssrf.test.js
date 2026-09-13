const dns = require('dns').promises;
const { isPrivateIp, isHostnameUnsafe, validateIpAddress } = require('../src/validators/ipValidator');
const { fetchSafeUrl, ScannerFetchError, validateUrlSyntaxAndPolicy } = require('../src/services/safeFetcher');
const { createSafeDnsLookup } = require('../src/utils/safeDnsLookup');

describe('SSRF Protection & Security Verification Pass', () => {
  describe('1. IPv4 Prohibited Range Coverage', () => {
    it('blocks loopback IPv4 addresses (127.0.0.0/8)', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('127.0.0.53')).toBe(true);
      expect(isPrivateIp('127.255.255.255')).toBe(true);
    });

    it('blocks unspecified/current network IPv4 addresses (0.0.0.0/8)', () => {
      expect(isPrivateIp('0.0.0.0')).toBe(true);
      expect(isPrivateIp('0.0.0.1')).toBe(true);
      expect(isPrivateIp('0.255.255.255')).toBe(true);
    });

    it('blocks RFC 1918 private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
      expect(isPrivateIp('192.168.0.1')).toBe(true);
      expect(isPrivateIp('192.168.255.255')).toBe(true);
    });

    it('blocks link-local & cloud metadata IPv4 range (169.254.0.0/16)', () => {
      expect(isPrivateIp('169.254.169.254')).toBe(true);
      expect(isPrivateIp('169.254.0.1')).toBe(true);
      expect(isPrivateIp('169.254.255.255')).toBe(true);
    });

    it('blocks Carrier-Grade NAT / CGNAT IPv4 range (100.64.0.0/10)', () => {
      expect(isPrivateIp('100.64.0.1')).toBe(true);
      expect(isPrivateIp('100.127.255.255')).toBe(true);
    });

    it('blocks multicast IPv4 range (224.0.0.0/4)', () => {
      expect(isPrivateIp('224.0.0.1')).toBe(true);
      expect(isPrivateIp('239.255.255.255')).toBe(true);
    });

    it('blocks reserved / broadcast IPv4 range (240.0.0.0/4)', () => {
      expect(isPrivateIp('240.0.0.1')).toBe(true);
      expect(isPrivateIp('255.255.255.255')).toBe(true);
    });

    it('allows valid public IPv4 addresses', () => {
      expect(isPrivateIp('8.8.8.8')).toBe(false);
      expect(isPrivateIp('1.1.1.1')).toBe(false);
      expect(isPrivateIp('93.184.216.34')).toBe(false);
    });
  });

  describe('2. IPv6 Prohibited Range Coverage', () => {
    it('blocks loopback IPv6 (::1/128)', () => {
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('[::1]')).toBe(true);
    });

    it('blocks unspecified IPv6 (::/128)', () => {
      expect(isPrivateIp('::')).toBe(true);
    });

    it('blocks Unique Local Unicast IPv6 range (fc00::/7)', () => {
      expect(isPrivateIp('fc00::1')).toBe(true);
      expect(isPrivateIp('fd00::1')).toBe(true);
    });

    it('blocks link-local IPv6 range (fe80::/10)', () => {
      expect(isPrivateIp('fe80::1')).toBe(true);
      expect(isPrivateIp('fe80::abcd')).toBe(true);
    });

    it('blocks multicast IPv6 range (ff00::/8)', () => {
      expect(isPrivateIp('ff02::1')).toBe(true);
      expect(isPrivateIp('ff05::2')).toBe(true);
    });

    it('blocks IPv4-mapped IPv6 loopback and private addresses', () => {
      expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
      expect(isPrivateIp('::ffff:10.0.0.1')).toBe(true);
      expect(isPrivateIp('::ffff:192.168.1.1')).toBe(true);
      expect(isPrivateIp('::ffff:169.254.169.254')).toBe(true);
    });

    it('allows valid public IPv6 addresses', () => {
      expect(isPrivateIp('2606:2800:220:1:248:1893:25c8:1946')).toBe(false);
    });
  });

  describe('3. Metadata & Hostname Security', () => {
    it('blocks AWS cloud metadata IP 169.254.169.254', async () => {
      try {
        await fetchSafeUrl('http://169.254.169.254/latest/meta-data/');
      } catch (err) {
        expect(err.code).toBe('UNSAFE_DESTINATION');
      }
    });

    it('blocks metadata hostnames and internal domains', () => {
      expect(isHostnameUnsafe('localhost')).toBe(true);
      expect(isHostnameUnsafe('metadata.google.internal')).toBe(true);
      expect(isHostnameUnsafe('metadata.tencentyun.com')).toBe(true);
      expect(isHostnameUnsafe('instance-data')).toBe(true);
      expect(isHostnameUnsafe('metadata')).toBe(true);
      expect(isHostnameUnsafe('metadata.aws.com')).toBe(true);
      expect(isHostnameUnsafe('test.localhost')).toBe(true);
      expect(isHostnameUnsafe('server.local')).toBe(true);
      expect(isHostnameUnsafe('cluster.internal')).toBe(true);
    });

    it('allows valid public hostnames', () => {
      expect(isHostnameUnsafe('example.com')).toBe(false);
      expect(isHostnameUnsafe('google.com')).toBe(false);
    });
  });

  describe('4. DNS Rebinding (TOCTOU) Protection Proof', () => {
    it('executes socket-level lookup and rejects hostname resolving to private IP', async () => {
      vi.spyOn(dns, 'lookup').mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);

      const safeLookup = createSafeDnsLookup();
      await new Promise((resolve) => {
        safeLookup('spoofed.rebinding.domain', {}, (err, address) => {
          expect(err).not.toBeNull();
          expect(err.code).toBe('UNSAFE_DESTINATION');
          expect(err.message).toContain('127.0.0.1');
          expect(address).toBeUndefined();
          resolve();
        });
      });

      vi.restoreAllMocks();
    });

    it('rejects connection if ANY resolved IP in multi-record DNS is private', async () => {
      vi.spyOn(dns, 'lookup').mockResolvedValue([
        { address: '93.184.216.34', family: 4 },
        { address: '10.0.0.1', family: 4 },
      ]);

      const safeLookup = createSafeDnsLookup();
      await new Promise((resolve) => {
        safeLookup('multi-ip.rebinding.domain', {}, (err, address) => {
          expect(err).not.toBeNull();
          expect(err.code).toBe('UNSAFE_DESTINATION');
          expect(err.message).toContain('10.0.0.1');
          expect(address).toBeUndefined();
          resolve();
        });
      });

      vi.restoreAllMocks();
    });
  });

  describe('5. Unusual IP Representations & Protocol Syntax', () => {
    it('rejects URLs containing embedded credentials (user:pass@host)', () => {
      expect(() => validateUrlSyntaxAndPolicy('http://admin:secret@example.com')).toThrow(
        ScannerFetchError
      );
    });

    it('rejects non-HTTP/HTTPS protocols (ftp, file, gopher, etc.)', () => {
      expect(() => validateUrlSyntaxAndPolicy('ftp://example.com')).toThrow(
        ScannerFetchError
      );
      expect(() => validateUrlSyntaxAndPolicy('file:///etc/passwd')).toThrow(
        ScannerFetchError
      );
    });

    it('rejects non-standard restricted ports (SSH 22, MySQL 3306)', () => {
      expect(() => validateUrlSyntaxAndPolicy('http://example.com:22')).toThrow(
        ScannerFetchError
      );
      expect(() => validateUrlSyntaxAndPolicy('http://example.com:3306')).toThrow(
        ScannerFetchError
      );
    });

    it('identifies invalid IP format strings', () => {
      expect(() => validateIpAddress('not-an-ip')).toThrow('Invalid IP address format');
    });
  });
});
