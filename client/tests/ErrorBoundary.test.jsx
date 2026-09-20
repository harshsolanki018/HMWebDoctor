import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../src/components/common/ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test Component Error');
};

describe('ErrorBoundary & Client Reliability Suite', () => {
  it('1. renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('2. catches component rendering errors and renders accessible error fallback UI without raw stack traces', () => {
    // Suppress console.error output from React during intentional error boundary testing
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected application rendering error occurred. You can reload the page or return home to continue.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();

    // Verify raw error string / stack is NOT leaked to user UI
    expect(screen.queryByText('Test Component Error')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('3. triggers onReset callback or reloads application when Reload button is clicked', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resetSpy = vi.fn();

    render(
      <ErrorBoundary onReset={resetSpy}>
        <ProblemChild />
      </ErrorBoundary>
    );

    const reloadBtn = screen.getByRole('button', { name: /Reload Application/i });
    fireEvent.click(reloadBtn);

    expect(resetSpy).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  it('4. returns safe structured NETWORK_ERROR object when fetch fails or network is offline', async () => {
    const { getScanById } = await import('../src/services/api');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    const res = await getScanById('scan_0123456789abcdef');

    expect(res.success).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error.code).toBe('NETWORK_ERROR');
    expect(res.error.message).toBe('Failed to fetch');

    fetchSpy.mockRestore();
  });

  it('5. returns safe structured SERVER_ERROR when server returns non-JSON HTTP 500 error page', async () => {
    const { getScanById } = await import('../src/services/api');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 500,
      headers: { get: () => 'text/html' },
    });

    const res = await getScanById('scan_0123456789abcdef');

    expect(res.success).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error.code).toBe('SERVER_ERROR');
    expect(res.error.message).toBe('Server returned unexpected response (HTTP 500).');

    fetchSpy.mockRestore();
  });

  it('6. returns safe structured TIMEOUT_ERROR when client request times out', async () => {
    const { getScanById } = await import('../src/services/api');

    const timeoutErr = new Error('The operation was aborted due to timeout');
    timeoutErr.name = 'TimeoutError';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(timeoutErr);

    const res = await getScanById('scan_0123456789abcdef');

    expect(res.success).toBe(false);
    expect(res.data).toBeNull();
    expect(res.error.code).toBe('TIMEOUT_ERROR');
    expect(res.error.message).toBe('Request timed out while communicating with the server.');

    fetchSpy.mockRestore();
  });

  it('7. returns safe structured INVALID_RESPONSE when server returns malformed API payload', async () => {
    const { getScanById } = await import('../src/services/api');

    // Case A: Missing success envelope key (e.g. {"hello": "world"})
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ hello: 'world' }),
    });

    const resA = await getScanById('scan_0123456789abcdef');

    expect(resA.success).toBe(false);
    expect(resA.data).toBeNull();
    expect(resA.error.code).toBe('INVALID_RESPONSE');
    expect(resA.error.message).toBe('Server returned a malformed response envelope.');

    // Case B: success: true but missing data payload
    fetchSpy.mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true }),
    });

    const resB = await getScanById('scan_0123456789abcdef');

    expect(resB.success).toBe(false);
    expect(resB.data).toBeNull();
    expect(resB.error.code).toBe('INVALID_RESPONSE');
    expect(resB.error.message).toBe('Server returned a malformed or incomplete scan report payload.');

    fetchSpy.mockRestore();
  });
});
