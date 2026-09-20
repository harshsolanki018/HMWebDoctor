const request = require('supertest');
const app = require('../src/app');
const logger = require('../src/utils/logger');
const { isValidRequestId } = require('../src/middleware/requestId');

describe('Milestone 11 — Observability, Reliability & Hardening Suite', () => {
  describe('Request Correlation ID Middleware (X-Request-Id)', () => {
    it('1. generates a new cryptographically safe request ID if incoming header is missing', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^req_[a-f0-9]{32}$/);
    });

    it('2. accepts and propagates a valid incoming X-Request-Id header', async () => {
      const customId = 'valid-custom-request-id-12345';
      const response = await request(app)
        .get('/api/health')
        .set('X-Request-Id', customId);

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).toBe(customId);
    });

    it('3. rejects unsafe or malformed incoming X-Request-Id and generates a safe fallback', async () => {
      const unsafeId = '<script>alert(1)</script>';
      const response = await request(app)
        .get('/api/health')
        .set('X-Request-Id', unsafeId);

      expect(response.status).toBe(200);
      expect(response.headers['x-request-id']).not.toBe(unsafeId);
      expect(response.headers['x-request-id']).toMatch(/^req_[a-f0-9]{32}$/);
    });

    it('4. validates request ID format via helper', () => {
      expect(isValidRequestId('valid-id-12345')).toBe(true);
      expect(isValidRequestId('short')).toBe(false);
      expect(isValidRequestId('a'.repeat(65))).toBe(false);
      expect(isValidRequestId('invalid key!')).toBe(false);
    });
  });

  describe('Readiness Endpoint (GET /api/ready)', () => {
    it('returns HTTP 200 READY when database is available or 503 NOT_READY without exposing internal details', async () => {
      const response = await request(app).get('/api/ready');
      expect([200, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toEqual({
          success: true,
          data: { status: 'READY', ready: true },
          error: null,
        });
      } else {
        expect(response.body.success).toBe(false);
        expect(response.body.data.status).toBe('NOT_READY');
        expect(response.body.error.code).toBe('SERVICE_NOT_READY');
      }

      // Assert no sensitive internal leakage
      const bodyStr = JSON.stringify(response.body);
      expect(bodyStr).not.toContain('mongodb');
      expect(bodyStr).not.toContain('localhost');
      expect(bodyStr).not.toContain('password');
    });
  });

  describe('Health Endpoint Privacy (GET /api/health)', () => {
    it('returns high-level health status without leaking hostnames, credentials, or environment paths', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(['healthy', 'degraded']).toContain(response.body.data.status);

      const bodyStr = JSON.stringify(response.body);
      expect(bodyStr).not.toContain('mongodb');
      expect(bodyStr).not.toContain('process.env');
      expect(bodyStr).not.toContain('C:\\');
      expect(bodyStr).not.toContain('/home/');
    });
  });

  describe('Sanitized Logger Security', () => {
    it('redacts passwords, tokens, URL credentials, query strings, and fragments', () => {
      const rawObj = {
        password: 'secretPassword123',
        token: 'secretToken456',
        authorization: 'Bearer token789',
        cookie: 'session=abc',
        destinationIp: '127.0.0.1',
        rawHtml: '<html>secret</html>',
        url: 'https://user:pass@example.com/page?token=SECRET123#fragment',
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.info('test_event', 'Testing logger', rawObj);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedJsonStr = consoleSpy.mock.calls[0][0];

      expect(loggedJsonStr).not.toContain('secretPassword123');
      expect(loggedJsonStr).not.toContain('secretToken456');
      expect(loggedJsonStr).not.toContain('token789');

      consoleSpy.mockRestore();
    });
  });

  describe('Global Error Handler Security & Response Envelope', () => {
    it('returns safe JSON error envelope with X-Request-Id header and no stack trace for 404 routes', async () => {
      const response = await request(app).get('/api/non-existent-route-12345');
      expect(response.status).toBe(404);
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeNull();
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Cannot GET');

      const bodyStr = JSON.stringify(response.body);
      expect(bodyStr).not.toContain('stack');
      expect(bodyStr).not.toContain('at ');
    });
  });
});
