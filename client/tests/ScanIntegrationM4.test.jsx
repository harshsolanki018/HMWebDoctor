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

describe('Milestone 4 — Scan Page M4 Category Integration Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all 4 passive category cards (SEO, Security Headers, Crawlability, Technical) and summary badges', async () => {
    const mockM4Response = {
      success: true,
      data: {
        scanId: 'scan_m4_test123',
        targetUrl: 'https://example.com',
        finalUrl: 'https://example.com/',
        redirectCount: 0,
        redirectChain: [],
        timing: { durationMs: 140, fetchedAt: '2026-09-06T12:00:00.000Z' },
        summary: { pass: 10, warn: 2, fail: 0, info: 4 },
        document: {
          statusCode: 200,
          contentType: 'text/html; charset=UTF-8',
          contentLengthBytes: 2500,
          baseline: {
            title: 'Example Domain Test Title (Optimal Length 45 Chars)',
            lang: 'en',
            charset: 'utf-8',
            description: 'Optimal meta description sample for milestone 4 integration test pass.',
            documentSizeBytes: 2500,
            hasDoctype: true,
          },
        },
        categories: {
          seo: {
            status: 'completed',
            summary: { pass: 4, warn: 1, fail: 0, info: 2 },
            findings: [
              {
                id: 'seo-title',
                category: 'seo',
                status: 'pass',
                severity: 'info',
                title: 'Page Title',
                message: 'Page title is well-structured (45 characters).',
                value: 'Example Domain Test Title',
                recommendation: 'Maintain optimal title length.',
              },
            ],
          },
          securityHeaders: {
            status: 'completed',
            summary: { pass: 3, warn: 1, fail: 0, info: 1 },
            findings: [
              {
                id: 'sec-hsts',
                category: 'securityHeaders',
                status: 'pass',
                severity: 'info',
                title: 'HSTS Header',
                message: 'Strict-Transport-Security (HSTS) is active.',
                value: 'max-age=31536000',
                recommendation: 'Maintain HSTS header.',
              },
            ],
          },
          crawlability: {
            status: 'completed',
            summary: { pass: 2, warn: 0, fail: 0, info: 1 },
            findings: [
              {
                id: 'crawl-robots-txt',
                category: 'crawlability',
                status: 'pass',
                severity: 'info',
                title: 'Robots.txt File',
                message: 'Robots.txt file is present at origin.',
                value: { exists: true, statusCode: 200 },
                recommendation: 'Maintain valid robots.txt.',
              },
            ],
          },
          technical: {
            status: 'completed',
            summary: { pass: 1, warn: 0, fail: 0, info: 0 },
            findings: [
              {
                id: 'tech-status-code',
                category: 'technical',
                status: 'pass',
                severity: 'info',
                title: 'HTTP Status Code',
                message: 'Target server responded with HTTP 200 OK.',
                value: 200,
                recommendation: 'Maintain healthy 200 OK responses.',
              },
            ],
          },
        },
      },
      error: null,
    };

    api.executeScan.mockResolvedValue(mockM4Response);

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
      expect(screen.getByText('SEO Analysis')).toBeInTheDocument();
      expect(screen.getByText('Passive Security Headers & Transport')).toBeInTheDocument();
      expect(screen.getByText('Crawlability & Indexability')).toBeInTheDocument();
      expect(screen.getByText('Technical Response Details')).toBeInTheDocument();

      expect(screen.getByText('10 Passed Checks')).toBeInTheDocument();
      expect(screen.getByText('2 Warnings')).toBeInTheDocument();

      expect(screen.getByText('Strict-Transport-Security (HSTS) is active.')).toBeInTheDocument();
      expect(screen.getByText('Robots.txt file is present at origin.')).toBeInTheDocument();
    });

    // Ensure NO fake scores or grades appear
    expect(screen.queryByText(/overall score/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/health grade/i)).not.toBeInTheDocument();
  });
});
