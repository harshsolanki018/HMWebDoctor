import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../src/components/ui/Toast';
import { ReportPage } from '../src/pages/ReportPage';

const mockReportData = {
  scanId: 'scan_0123456789abcdef',
  targetUrl: 'https://example.com/',
  finalUrl: 'https://example.com/',
  statusCode: 200,
  createdAt: '2026-09-13T12:00:00.000Z',
  timing: {
    durationMs: 250,
    fetchedAt: '2026-09-13T12:00:00.000Z',
  },
  document: {
    statusCode: 200,
    contentType: 'text/html',
    contentLengthBytes: 2048,
    baseline: {
      title: 'Mock Test Site',
      lang: 'en',
      charset: 'utf-8',
      description: 'Test description',
      hasDoctype: true,
    },
  },
  summary: { pass: 10, warn: 2, fail: 1, info: 0 },
  categories: {
    seo: {
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'seo-title-ok',
          category: 'seo',
          status: 'pass',
          severity: 'info',
          title: 'Title Tag Present',
          message: 'Title tag found',
          value: 'Mock Test Site',
          recommendation: '',
        },
      ],
    },
    securityHeaders: {
      status: 'completed',
      summary: { pass: 0, warn: 1, fail: 0, info: 0 },
      findings: [
        {
          id: 'sec-hsts-missing',
          category: 'securityHeaders',
          status: 'warn',
          severity: 'medium',
          title: 'Missing HSTS Header',
          message: 'Strict-Transport-Security header is missing',
          value: null,
          recommendation: 'Add HSTS header with max-age >= 31536000',
        },
      ],
    },
    crawlability: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    technical: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    performance: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    accessibility: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    mobile: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    content: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
  },
  actionCenter: {
    status: 'completed',
    summary: { actionable: 1, high: 0, medium: 1, low: 0 },
    domainCounts: { security: 1, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 },
    items: [
      {
        findingId: 'sec-hsts-missing',
        category: 'securityHeaders',
        status: 'warn',
        severity: 'medium',
        domain: 'security',
        title: 'Missing HSTS Header',
        message: 'Strict-Transport-Security header is missing',
        recommendation: 'Add HSTS header',
        remediation: null,
      },
    ],
  },
};

vi.mock('../src/services/api', () => ({
  getScanById: vi.fn((scanId) => {
    if (scanId === 'scan_0123456789abcdef') {
      return Promise.resolve({
        success: true,
        data: mockReportData,
        error: null,
      });
    }
    return Promise.resolve({
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: 'Scan report not found or expired.' },
    });
  }),
}));

const renderReportPage = (scanId = 'scan_0123456789abcdef') => {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/reports/${scanId}`]}>
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
};

describe('ReportPage & Shareable Public Report Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets noindex, nofollow robots meta tag on mount for privacy compliance', async () => {
    renderReportPage();

    await waitFor(() => {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      expect(robotsMeta).toBeDefined();
      expect(robotsMeta?.getAttribute('content')).toBe('noindex, nofollow');
    });
  });

  it('renders report header, metadata, action buttons, and category findings', async () => {
    renderReportPage();

    await waitFor(() => {
      expect(screen.getByText('scan_0123456789abcdef')).toBeInTheDocument();
      expect(screen.getByText('https://example.com/')).toBeInTheDocument();
      expect(screen.getByText('Share Link')).toBeInTheDocument();
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
    });
  });

  it('filters findings dynamically when search text is entered', async () => {
    renderReportPage();

    await waitFor(() => {
      expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
    });

    const searchInput = screen.getByPlaceholderText(/Search findings by ID, title, description/i);
    fireEvent.change(searchInput, { target: { value: 'Title Tag' } });

    await waitFor(() => {
      expect(screen.getByText('Title Tag Present')).toBeInTheDocument();
      expect(screen.queryByText('Missing HSTS Header')).not.toBeInTheDocument();
    });
  });

  it('renders 404 state when scan report is not found or expired', async () => {
    renderReportPage('scan_ffffffffffffffff');

    await waitFor(() => {
      expect(screen.getByText('Report Not Found')).toBeInTheDocument();
      expect(screen.getByText('Scan report not found or expired.')).toBeInTheDocument();
      expect(screen.getByText('Run a New Website Scan')).toBeInTheDocument();
    });
  });
});
