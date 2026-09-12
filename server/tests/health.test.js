const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 200 and healthy status when API and DB are connected', async () => {
    // Mock Mongoose connection state to 1 (connected)
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'healthy',
        services: {
          api: 'healthy',
          database: 'healthy',
        },
      },
      error: null,
    });
  });

  it('should return 200 and degraded status when DB is disconnected/unavailable', async () => {
    // Mock Mongoose connection state to 0 (disconnected)
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'degraded',
        services: {
          api: 'healthy',
          database: 'unavailable',
        },
      },
      error: null,
    });
  });

  it('should not leak stack traces, connection strings, or sensitive details', async () => {
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

    const response = await request(app).get('/api/health');
    const responseText = JSON.stringify(response.body);

    expect(responseText).not.toContain('mongodb://');
    expect(responseText).not.toContain('stack');
    expect(responseText).not.toContain('password');
    expect(responseText).not.toContain('localhost');
  });
});
