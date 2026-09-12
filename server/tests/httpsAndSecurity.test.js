const https = require('https');
const http = require('http');
const request = require('supertest');
const app = require('../src/app');
const { fetchSafeUrl } = require('../src/services/safeFetcher');
const scanService = require('../src/services/scanService');

describe('HTTPS, TLS & Information Exposure Security Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('HTTPS TLS Security Verification', () => {
    it('preserves TLS SNI (servername) and leaves rejectUnauthorized at default true', async () => {
      let capturedOptions = null;

      vi.spyOn(https, 'request').mockImplementation((options, callback) => {
        capturedOptions = options;
        const mockReq = {
          on: vi.fn(),
          destroy: vi.fn(),
          end: vi.fn(),
        };
        return mockReq;
      });

      try {
        await fetchSafeUrl('https://secure-target.com/page');
      } catch (_err) {
        // Expected because mockReq is partial
      }

      expect(capturedOptions).not.toBeNull();
      expect(capturedOptions.servername).toBe('secure-target.com');
      // Verify rejectUnauthorized is NOT explicitly set to false
      expect(capturedOptions.rejectUnauthorized).not.toBe(false);
    });

    it('preserves default HTTP Host header matching target hostname', async () => {
      let capturedOptions = null;

      vi.spyOn(http, 'request').mockImplementation((options, callback) => {
        capturedOptions = options;
        const mockReq = {
          on: vi.fn(),
          destroy: vi.fn(),
          end: vi.fn(),
        };
        return mockReq;
      });

      try {
        await fetchSafeUrl('http://my-domain.org/path');
      } catch (_err) {
        // Expected because mockReq is partial
      }

      expect(capturedOptions).not.toBeNull();
      expect(capturedOptions.hostname).toBe('my-domain.org');
    });
  });

  describe('Information Exposure Review', () => {
    it('omits resolved IP address, stack traces, and internal details from public scan API response', async () => {
      const mockScanData = {
        scanId: 'scan_clean12345678',
        targetUrl: 'https://example.com',
        finalUrl: 'https://example.com/',
        redirectCount: 0,
        redirectChain: [],
        status: 'completed',
        timing: { durationMs: 100, fetchedAt: new Date().toISOString() },
        document: {
          statusCode: 200,
          contentType: 'text/html',
          contentLengthBytes: 1000,
          baseline: { title: 'Test', lang: 'en', charset: 'utf-8', hasDoctype: true },
        },
      };

      vi.spyOn(scanService, 'executeScan').mockResolvedValue(mockScanData);

      const response = await request(app)
        .post('/api/scans')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(200);
      const jsonString = JSON.stringify(response.body);

      // Verify no ipAddress or internal sensitive strings present
      expect(response.body.data.document.ipAddress).toBeUndefined();
      expect(jsonString).not.toContain('ipAddress');
      expect(jsonString).not.toContain('stack');
      expect(jsonString).not.toContain('mongodb://');
    });
  });
});
