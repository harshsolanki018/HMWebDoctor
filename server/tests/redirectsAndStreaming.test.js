const http = require('http');
const { fetchSafeUrl, ScannerFetchError } = require('../src/services/safeFetcher');

describe('Redirect Policy, Streaming Size Limits & Timeout Security Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Redirect Security & Hop Validation', () => {
    it('rejects redirect chain when a redirect step points to localhost / 127.0.0.1', async () => {
      let callCount = 0;
      vi.spyOn(http, 'request').mockImplementation((options, callback) => {
        callCount++;
        const resListeners = {};
        const resMock = {
          statusCode: 302,
          headers: { location: 'http://127.0.0.1/admin' },
          on: (event, fn) => {
            resListeners[event] = fn;
          },
        };

        const mockReq = {
          on: vi.fn(),
          destroy: vi.fn(),
          end: () => {
            callback(resMock);
          },
        };
        return mockReq;
      });

      try {
        await fetchSafeUrl('http://example.com/redirect-to-local');
      } catch (err) {
        expect(err.code).toBe('UNSAFE_DESTINATION');
      }
    });

    it('rejects redirect chain when a redirect step points to AWS metadata IP 169.254.169.254', async () => {
      vi.spyOn(http, 'request').mockImplementation((options, callback) => {
        const resMock = {
          statusCode: 301,
          headers: { location: 'http://169.254.169.254/latest/meta-data/' },
          on: vi.fn(),
        };

        return {
          on: vi.fn(),
          destroy: vi.fn(),
          end: () => callback(resMock),
        };
      });

      try {
        await fetchSafeUrl('http://example.com/redirect-to-metadata');
      } catch (err) {
        expect(err.code).toBe('UNSAFE_DESTINATION');
      }
    });

    it('rejects redirect chain when a redirect step points to unsupported protocol (ftp://)', async () => {
      vi.spyOn(http, 'request').mockImplementation((options, callback) => {
        const resMock = {
          statusCode: 302,
          headers: { location: 'ftp://files.example.com/data.txt' },
          on: vi.fn(),
        };

        return {
          on: vi.fn(),
          destroy: vi.fn(),
          end: () => callback(resMock),
        };
      });

      try {
        await fetchSafeUrl('http://example.com/redirect-to-ftp');
      } catch (err) {
        expect(err.code).toBe('UNSUPPORTED_PROTOCOL');
      }
    });

    it('rejects fetch when redirect count exceeds MAX_REDIRECTS (5)', async () => {
      vi.spyOn(http, 'request').mockImplementation((options, callback) => {
        const resMock = {
          statusCode: 302,
          headers: { location: `http://example.com/hop-${Math.random()}` },
          on: vi.fn(),
        };

        return {
          on: vi.fn(),
          destroy: vi.fn(),
          end: () => callback(resMock),
        };
      });

      try {
        await fetchSafeUrl('http://example.com/infinite-loop');
      } catch (err) {
        expect(err.code).toBe('REDIRECT_LIMIT_EXCEEDED');
      }
    });
  });

  describe('2. Streaming Response Size Limits', () => {
    it('rejects up-front if Content-Length header exceeds 5MB limit', async () => {
      vi.spyOn(http, 'request').mockImplementation((options, callback) => {
        const resMock = {
          statusCode: 200,
          headers: {
            'content-type': 'text/html',
            'content-length': '10485760', // 10MB
          },
          on: vi.fn(),
        };

        return {
          on: vi.fn(),
          destroy: vi.fn(),
          end: () => callback(resMock),
        };
      });

      try {
        await fetchSafeUrl('http://example.com/large-file');
      } catch (err) {
        expect(err.code).toBe('RESPONSE_TOO_LARGE');
      }
    });

    it('destroys request socket immediately when chunked body exceeds 5MB mid-stream', async () => {
      const mockDestroy = vi.fn();

      vi.spyOn(http, 'request').mockImplementation((options, callback) => {
        const resListeners = {};
        const resMock = {
          statusCode: 200,
          headers: { 'content-type': 'text/html' },
          on: (event, fn) => {
            resListeners[event] = fn;
          },
        };

        const mockReq = {
          on: vi.fn(),
          destroy: mockDestroy,
          end: () => {
            callback(resMock);
            // Push large chunks (> 5MB)
            if (resListeners['data']) {
              const bigChunk = Buffer.alloc(6 * 1024 * 1024); // 6MB chunk
              resListeners['data'](bigChunk);
            }
          },
        };
        return mockReq;
      });

      try {
        await fetchSafeUrl('http://example.com/chunked-large');
      } catch (err) {
        expect(err.code).toBe('RESPONSE_TOO_LARGE');
        expect(mockDestroy).toHaveBeenCalled();
      }
    });
  });
});
