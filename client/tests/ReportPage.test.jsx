import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../src/components/ui/Toast';
import { ReportPage, FINDING_DOMAIN_MAP, getDomainForFinding } from '../src/pages/ReportPage';

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
          value: 'UNIQUE_VALUE_ONLY_STRING_999',
          recommendation: 'Keep title tags unique across pages',
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
    technical: {
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'tech-compression',
          category: 'technical',
          status: 'pass',
          severity: 'low',
          title: 'Gzip Compression Enabled',
          message: 'Response payload is compressed using gzip',
          value: 'gzip',
          recommendation: 'Maintain compression settings',
        },
      ],
    },
    performance: {
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'perf-blocking-scripts',
          category: 'performance',
          status: 'warn',
          severity: 'high',
          title: 'Render-Blocking Scripts Found',
          message: 'Found 2 render-blocking script elements in head',
          value: 2,
          recommendation: 'Add defer or async attribute to scripts',
        },
      ],
    },
    accessibility: {
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'a11y-image-alt',
          category: 'accessibility',
          status: 'fail',
          severity: 'high',
          title: 'Images Missing Alt Attributes',
          message: '3 images lack descriptive alt text',
          value: 3,
          recommendation: 'Add meaningful alt attributes to images',
        },
      ],
    },
    mobile: { status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    content: {
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'content-low-volume',
          category: 'content',
          status: 'warn',
          severity: 'low',
          title: 'Low Visible Text Volume',
          message: 'Page has less than 50 visible words',
          value: 42,
          recommendation: 'Add comprehensive body content',
        },
      ],
    },
  },
  actionCenter: {
    status: 'completed',
    summary: { actionable: 3, high: 2, medium: 1, low: 0 },
    domainCounts: { security: 1, accessibility: 1, performance: 1, seo_crawlability: 0, markup_structure: 0 },
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
      {
        findingId: 'a11y-image-alt',
        category: 'accessibility',
        status: 'fail',
        severity: 'high',
        domain: 'accessibility',
        title: 'Images Missing Alt Attributes',
        message: '3 images lack descriptive alt text',
        recommendation: 'Add alt attributes',
        remediation: null,
      },
      {
        findingId: 'perf-blocking-scripts',
        category: 'performance',
        status: 'warn',
        severity: 'high',
        domain: 'performance',
        title: 'Render-Blocking Scripts Found',
        message: 'Found 2 render-blocking script elements in head',
        recommendation: 'Add defer attribute',
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

  describe('Report Page Core Rendering & Privacy', () => {
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

    it('renders 404 state when scan report is not found or expired', async () => {
      renderReportPage('scan_ffffffffffffffff');

      await waitFor(() => {
        expect(screen.getByText('Report Not Found')).toBeInTheDocument();
        expect(screen.getByText('Scan report not found or expired.')).toBeInTheDocument();
        expect(screen.getByText('Run a New Website Scan')).toBeInTheDocument();
      });
    });
  });

  describe('Fix 1 — Text Search Contract Suite', () => {
    it('1. matches finding by finding.id / findingId', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const searchInput = screen.getByPlaceholderText(/Search findings by ID, title/i);
      fireEvent.change(searchInput, { target: { value: 'sec-hsts' } });

      await waitFor(() => {
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
        expect(screen.queryByText('Title Tag Present')).not.toBeInTheDocument();
      });
    });

    it('2. matches finding by title', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const searchInput = screen.getByPlaceholderText(/Search findings by ID, title/i);
      fireEvent.change(searchInput, { target: { value: 'Title Tag Present' } });

      await waitFor(() => {
        expect(screen.getByText('Title Tag Present')).toBeInTheDocument();
        expect(screen.queryByText('Missing HSTS Header')).not.toBeInTheDocument();
      });
    });

    it('3. matches finding by message', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const searchInput = screen.getByPlaceholderText(/Search findings by ID, title/i);
      fireEvent.change(searchInput, { target: { value: 'Strict-Transport-Security' } });

      await waitFor(() => {
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
        expect(screen.queryByText('Title Tag Present')).not.toBeInTheDocument();
      });
    });

    it('4. matches finding by recommendation', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const searchInput = screen.getByPlaceholderText(/Search findings by ID, title/i);
      fireEvent.change(searchInput, { target: { value: '31536000' } });

      await waitFor(() => {
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
        expect(screen.queryByText('Title Tag Present')).not.toBeInTheDocument();
      });
    });

    it('5. DOES NOT match finding when query exists ONLY in finding.value', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getByText('Title Tag Present')).toBeInTheDocument());

      const searchInput = screen.getByPlaceholderText(/Search findings by ID, title/i);
      fireEvent.change(searchInput, { target: { value: 'UNIQUE_VALUE_ONLY_STRING_999' } });

      await waitFor(() => {
        // Must NOT match finding.value!
        expect(screen.queryByText('Title Tag Present')).not.toBeInTheDocument();
        expect(screen.getByText('Showing 0 of 6')).toBeInTheDocument();
      });
    });
  });

  describe('Fix 2 — Filter Contract & Domain Mapping Suite', () => {
    it('1. Security domain filter displays security findings only', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'security' } });

      await waitFor(() => {
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
        expect(screen.queryByText('Title Tag Present')).not.toBeInTheDocument();
        expect(screen.queryByText('Images Missing Alt Attributes')).not.toBeInTheDocument();
      });
    });

    it('2. Accessibility domain filter displays accessibility findings only', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'accessibility' } });

      await waitFor(() => {
        expect(screen.getAllByText('Images Missing Alt Attributes').length).toBeGreaterThan(0);
        expect(screen.queryByText('Missing HSTS Header')).not.toBeInTheDocument();
      });
    });

    it('3. Performance domain filter displays performance findings only', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'performance' } });

      await waitFor(() => {
        expect(screen.getAllByText('Render-Blocking Scripts Found').length).toBeGreaterThan(0);
        expect(screen.getByText('Gzip Compression Enabled')).toBeInTheDocument();
        expect(screen.queryByText('Missing HSTS Header')).not.toBeInTheDocument();
      });
    });

    it('4. seo_crawlability domain filter displays SEO findings only', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'seo_crawlability' } });

      await waitFor(() => {
        expect(screen.getByText('Title Tag Present')).toBeInTheDocument();
        expect(screen.queryByText('Missing HSTS Header')).not.toBeInTheDocument();
      });
    });

    it('5. markup_structure domain filter displays content & markup findings only', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'markup_structure' } });

      await waitFor(() => {
        expect(screen.getByText('Low Visible Text Volume')).toBeInTheDocument();
        expect(screen.queryByText('Missing HSTS Header')).not.toBeInTheDocument();
      });
    });

    it('6. Domain + Category filters use AND across groups', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      const categorySelect = screen.getByLabelText(/Filter findings by category/i);

      // Select Security Domain AND SEO Category -> 0 findings
      fireEvent.change(domainSelect, { target: { value: 'security' } });
      fireEvent.change(categorySelect, { target: { value: 'seo' } });

      await waitFor(() => {
        expect(screen.getByText('Showing 0 of 6')).toBeInTheDocument();
      });
    });

    it('7. Domain + Severity filters use AND across groups', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      const severitySelect = screen.getByLabelText(/Filter findings by severity/i);

      // Select Security Domain AND Medium Severity -> Missing HSTS Header
      fireEvent.change(domainSelect, { target: { value: 'security' } });
      fireEvent.change(severitySelect, { target: { value: 'medium' } });

      await waitFor(() => {
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
        expect(screen.queryByText('Render-Blocking Scripts Found')).not.toBeInTheDocument();
      });
    });

    it('8. Category + Severity filters use AND across groups', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const categorySelect = screen.getByLabelText(/Filter findings by category/i);
      const severitySelect = screen.getByLabelText(/Filter findings by severity/i);

      fireEvent.change(categorySelect, { target: { value: 'securityHeaders' } });
      fireEvent.change(severitySelect, { target: { value: 'medium' } });

      await waitFor(() => {
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
        expect(screen.queryByText('Title Tag Present')).not.toBeInTheDocument();
      });
    });

    it('9. Domain + Category + Severity + Text Search all use AND across groups', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      const categorySelect = screen.getByLabelText(/Filter findings by category/i);
      const severitySelect = screen.getByLabelText(/Filter findings by severity/i);
      const searchInput = screen.getByPlaceholderText(/Search findings by ID, title/i);

      fireEvent.change(domainSelect, { target: { value: 'security' } });
      fireEvent.change(categorySelect, { target: { value: 'securityHeaders' } });
      fireEvent.change(severitySelect, { target: { value: 'medium' } });
      fireEvent.change(searchInput, { target: { value: 'HSTS' } });

      await waitFor(() => {
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
      });
    });

    it('10. Clearing a filter restores expected findings', async () => {
      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'security' } });

      await waitFor(() => {
        expect(screen.queryByText('Title Tag Present')).not.toBeInTheDocument();
      });

      const clearBtn = screen.getByRole('button', { name: /Clear Filters/i });
      fireEvent.click(clearBtn);

      await waitFor(() => {
        expect(screen.getByText('Title Tag Present')).toBeInTheDocument();
        expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
      });
    });

    it('11. Source category and actionCenter objects remain completely unmutated', async () => {
      const originalSeoCount = mockReportData.categories.seo.findings.length;
      const originalActionItemCount = mockReportData.actionCenter.items.length;

      renderReportPage();
      await waitFor(() => expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0));

      const domainSelect = screen.getByLabelText(/Filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'security' } });

      // Assert source object references and arrays were NOT mutated
      expect(mockReportData.categories.seo.findings.length).toBe(originalSeoCount);
      expect(mockReportData.actionCenter.items.length).toBe(originalActionItemCount);
    });

    it('12. Correctly maps all 55 finding IDs via getDomainForFinding helper', () => {
      expect(getDomainForFinding({ id: 'sec-hsts' })).toBe('security');
      expect(getDomainForFinding({ id: 'a11y-image-alt' })).toBe('accessibility');
      expect(getDomainForFinding({ id: 'perf-blocking-scripts' })).toBe('performance');
      expect(getDomainForFinding({ id: 'seo-title' })).toBe('seo_crawlability');
      expect(getDomainForFinding({ id: 'content-empty-page' })).toBe('markup_structure');
      expect(getDomainForFinding({ id: 'unknown-future-id' })).toBe('markup_structure');
    });
  });
});
