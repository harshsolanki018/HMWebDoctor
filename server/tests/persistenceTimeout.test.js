const mongoose = require('mongoose');
const safeFetcher = require('../src/services/safeFetcher');
const scanService = require('../src/services/scanService');
const Scan = require('../src/models/Scan');

describe('Scan Persistence Timeout & Degraded Mode Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('marks isPersisted as true when Scan.create completes within 2000ms', async () => {
    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html',
      contentLengthBytes: 100,
      headers: {},
      html: '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>',
      redirectCount: 0,
      redirectChain: [],
    });

    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(Scan, 'create').mockResolvedValue({ scanId: 'scan_0123456789abcdef' });

    const result = await scanService.executeScan('https://example.com');

    expect(result.status).toBe('completed');
    expect(result.isPersisted).toBe(true);
  });

  it('times out and marks isPersisted as false when Scan.create exceeds 2000ms timeout', async () => {
    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html',
      contentLengthBytes: 100,
      headers: {},
      html: '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>',
      redirectCount: 0,
      redirectChain: [],
    });

    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

    // Mock Scan.create to hang longer than 2000ms timeout
    vi.spyOn(Scan, 'create').mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ scanId: 'scan_slow' }), 5000);
      });
    });

    const startTime = Date.now();
    const result = await scanService.executeScan('https://example.com');
    const elapsed = Date.now() - startTime;

    // Scan execution must not hang for 5000ms; it must return bounded near ~2000ms timeout
    expect(elapsed).toBeLessThan(3500);
    expect(result.status).toBe('completed');
    expect(result.isPersisted).toBe(false);
  });

  it('swallows late DB promise rejection using attached .catch() handler without crashing', async () => {
    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html',
      contentLengthBytes: 100,
      headers: {},
      html: '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>',
      redirectCount: 0,
      redirectChain: [],
    });

    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

    // Mock Scan.create to reject after timeout
    vi.spyOn(Scan, 'create').mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Late Mongo Connection Error')), 2500);
      });
    });

    const result = await scanService.executeScan('https://example.com');
    expect(result.status).toBe('completed');
    expect(result.isPersisted).toBe(false);
  });

  it('skips persistence and sets isPersisted to false when DB connection is offline (readyState !== 1)', async () => {
    vi.spyOn(safeFetcher, 'fetchSafeUrl').mockResolvedValue({
      targetUrl: 'https://example.com',
      finalUrl: 'https://example.com/',
      statusCode: 200,
      statusText: 'OK',
      contentType: 'text/html',
      contentLengthBytes: 100,
      headers: {},
      html: '<html><head><title>Test</title></head><body><h1>Test</h1></body></html>',
      redirectCount: 0,
      redirectChain: [],
    });

    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0); // offline
    const createSpy = vi.spyOn(Scan, 'create');

    const result = await scanService.executeScan('https://example.com');

    expect(result.status).toBe('completed');
    expect(result.isPersisted).toBe(false);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
