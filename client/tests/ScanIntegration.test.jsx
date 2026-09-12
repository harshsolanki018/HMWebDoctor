import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ScanPage } from '../src/pages/ScanPage';
import * as api from '../src/services/api';

vi.mock('../src/services/api', () => ({
  executeScan: vi.fn(),
  fetchHealth: vi.fn(),
}));

describe('Milestone 3 — Scan Page Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('executes scan on valid URL submission and displays baseline findings', async () => {
    const mockScanResponse = {
      success: true,
      data: {
        scanId: 'scan_mock12345',
        targetUrl: 'https://example.com',
        finalUrl: 'https://example.com/',
        redirectCount: 0,
        redirectChain: [],
        timing: { durationMs: 85, fetchedAt: '2026-09-06T12:00:00.000Z' },
        document: {
          statusCode: 200,
          contentType: 'text/html; charset=UTF-8',
          contentLengthBytes: 1250,
          ipAddress: '93.184.216.34',
          baseline: {
            title: 'Example Domain',
            lang: 'en',
            charset: 'utf-8',
            description: 'Domain for illustrative examples',
            documentSizeBytes: 1250,
            hasDoctype: true,
          },
        },
      },
      error: null,
    };

    api.executeScan.mockResolvedValue(mockScanResponse);

    render(
      <MemoryRouter initialEntries={['/scan']}>
        <ScanPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/example.com/i);
    const submitBtn = screen.getByRole('button', { name: /Start Scan/i });

    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.executeScan).toHaveBeenCalledWith('https://example.com/');
      expect(screen.getByText(/Baseline Scan Summary/i)).toBeInTheDocument();
      expect(screen.getByText('Example Domain')).toBeInTheDocument();
      expect(screen.getByText(/scan_mock12345/i)).toBeInTheDocument();
    });
  });

  it('displays error alert when scan API returns an error response', async () => {
    api.executeScan.mockResolvedValue({
      success: false,
      data: null,
      error: {
        code: 'UNSAFE_DESTINATION',
        message: 'Scan target resolves to restricted internal IP address',
      },
    });

    render(
      <MemoryRouter initialEntries={['/scan']}>
        <ScanPage />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/example.com/i);
    const submitBtn = screen.getByRole('button', { name: /Start Scan/i });

    fireEvent.change(input, { target: { value: 'http://127.0.0.1' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Scan Failed — UNSAFE_DESTINATION/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Scan target resolves to restricted internal IP address/i)
      ).toBeInTheDocument();
    });
  });
});
