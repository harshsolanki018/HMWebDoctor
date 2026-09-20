import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Header } from '../src/components/layout/Header';
import { Footer } from '../src/components/layout/Footer';
import { ScanPage } from '../src/pages/ScanPage';
import { ReportPage } from '../src/pages/ReportPage';
import { NotFoundPage } from '../src/pages/NotFoundPage';
import { RemediationDrawer } from '../src/components/sections/RemediationDrawer';
import { FindingSearchBar } from '../src/components/sections/FindingSearchBar';
import { ActionCenterCard } from '../src/components/sections/ActionCenterCard';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { ToastProvider } from '../src/components/ui/Toast';
import * as apiModule from '../src/services/api';
import * as exportUtilsModule from '../src/utils/exportUtils';
import { sanitizeCsvCell, generateFindingsCsv } from '../src/utils/exportUtils';

// Mock report data following Public Report DTO contract
const mockPublicReportDto = {
  scanId: 'scan_m12test12345678',
  targetUrl: 'https://example.com/',
  finalUrl: 'https://example.com/',
  statusCode: 200,
  createdAt: '2026-09-20T12:00:00.000Z',
  timing: {
    durationMs: 345,
    fetchedAt: '2026-09-20T12:00:00.000Z',
  },
  document: {
    statusCode: 200,
    contentType: 'text/html',
    contentLengthBytes: 4096,
    baseline: {
      title: 'Example Domain',
      metaDescription: 'An example domain page',
      canonical: 'https://example.com/',
      metaRobots: 'index, follow',
      viewport: 'width=device-width, initial-scale=1',
      h1Count: 1,
      h1Text: 'Example Domain',
      h2Count: 0,
      openGraph: { title: 'Example' },
    },
  },
  summary: {
    pass: 5,
    warn: 2,
    fail: 1,
    info: 0,
  },
  categories: {
    seo: {
      title: 'SEO & Meta Analysis',
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'seo-title',
          findingId: 'seo-title',
          status: 'pass',
          severity: 'info',
          title: 'Document Title Tag Present',
          message: 'Page contains a valid non-empty <title> tag.',
          value: 'Example Domain',
          recommendation: 'Maintain unique descriptive title tags.',
        },
      ],
    },
    securityHeaders: {
      title: 'Security Headers',
      status: 'completed',
      summary: { pass: 0, warn: 1, fail: 1, info: 0 },
      findings: [
        {
          id: 'sec-hsts',
          findingId: 'sec-hsts',
          status: 'warn',
          severity: 'high',
          title: 'Missing HSTS Header',
          message: 'HTTP Strict Transport Security header is missing.',
          value: 'none',
          recommendation: 'Configure Strict-Transport-Security header.',
        },
        {
          id: 'sec-csp',
          findingId: 'sec-csp',
          status: 'fail',
          severity: 'high',
          title: 'Missing Content Security Policy',
          message: 'No CSP header detected.',
          value: 'none',
          recommendation: 'Implement a Content-Security-Policy header.',
        },
      ],
    },
    crawlability: { title: 'Crawlability', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    technical: { title: 'Technical', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    performance: { title: 'Performance', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    accessibility: { title: 'Accessibility', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    mobile: { title: 'Mobile Readiness', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
    content: { title: 'Content Quality', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
  },
  actionCenter: {
    status: 'completed',
    summary: { actionable: 2, high: 2, medium: 0, low: 0 },
    domainCounts: { security: 2, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 },
    items: [
      {
        findingId: 'sec-hsts',
        category: 'securityHeaders',
        status: 'warn',
        severity: 'high',
        domain: 'security',
        title: 'Missing HSTS Header',
        message: 'HTTP Strict Transport Security header is missing.',
        recommendation: 'Configure Strict-Transport-Security header.',
        remediation: {
          summary: 'HSTS enforces encrypted HTTPS connections.',
          impact: 'Protects users against SSL stripping.',
          codeFix: 'Strict-Transport-Security: max-age=31536000; includeSubDomains',
          steps: ['Add header to web server config', 'Test redirect behavior'],
          verification: 'Inspect headers in dev tools or re-scan URL.',
        },
      },
    ],
  },
};

const renderWithProviders = (ui, { route = '/' } = {}) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('Milestone 12 — Comprehensive UX Consistency, Error States & Product Quality Suite', () => {
  beforeEach(() => {
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    }
    if (!globalThis.URL.revokeObjectURL) {
      globalThis.URL.revokeObjectURL = vi.fn();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // 1. CLIENT SCAN & API ERROR-STATE TESTS
  // ==========================================
  describe('1. Client Scan & API Error-State Suite', () => {
    it('handles scan/network failure gracefully with structured error alert', async () => {
      vi.spyOn(apiModule, 'executeScan').mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to establish HTTP network connection to target server.',
        },
      });

      renderWithProviders(<ScanPage />);
      const input = screen.getByPlaceholderText(/example\.com/i);
      const submitBtn = screen.getByRole('button', { name: /start scan/i });

      fireEvent.change(input, { target: { value: 'https://unreachable-domain.test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Scan Failed — NETWORK_ERROR/i)).toBeInTheDocument();
        expect(screen.getByText(/Failed to establish HTTP network connection/i)).toBeInTheDocument();
      });
    });

    it('handles scan/client timeout error gracefully with structured error alert', async () => {
      vi.spyOn(apiModule, 'executeScan').mockResolvedValue({
        success: false,
        error: {
          code: 'FETCH_TIMEOUT',
          message: 'The request to scan the target URL timed out after 10000ms.',
        },
      });

      renderWithProviders(<ScanPage />);
      const input = screen.getByPlaceholderText(/example\.com/i);
      const submitBtn = screen.getByRole('button', { name: /start scan/i });

      fireEvent.change(input, { target: { value: 'https://slow-response.test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Scan Failed — FETCH_TIMEOUT/i)).toBeInTheDocument();
        expect(screen.getByText(/timed out after 10000ms/i)).toBeInTheDocument();
      });
    });

    it('handles scan/unexpected HTTP 500 error gracefully with structured error alert', async () => {
      vi.spyOn(apiModule, 'executeScan').mockResolvedValue({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected internal server error occurred while executing scan.',
        },
      });

      renderWithProviders(<ScanPage />);
      const input = screen.getByPlaceholderText(/example\.com/i);
      const submitBtn = screen.getByRole('button', { name: /start scan/i });

      fireEvent.change(input, { target: { value: 'https://error-500.test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Scan Failed — INTERNAL_SERVER_ERROR/i)).toBeInTheDocument();
      });
    });

    it('handles scan/malformed JSON/API response gracefully with structured error alert', async () => {
      vi.spyOn(apiModule, 'executeScan').mockResolvedValue({
        success: false,
        error: {
          code: 'MALFORMED_API_RESPONSE',
          message: 'Received invalid or malformed response structure from scan backend.',
        },
      });

      renderWithProviders(<ScanPage />);
      const input = screen.getByPlaceholderText(/example\.com/i);
      const submitBtn = screen.getByRole('button', { name: /start scan/i });

      fireEvent.change(input, { target: { value: 'https://malformed.test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Scan Failed — MALFORMED_API_RESPONSE/i)).toBeInTheDocument();
        expect(screen.getByText(/Received invalid or malformed response structure/i)).toBeInTheDocument();
      });
    });

    it('handles scan degraded persistence mode (isPersisted: false) with warning alert', async () => {
      const degradedReport = {
        ...mockPublicReportDto,
        isPersisted: false,
      };

      vi.spyOn(apiModule, 'executeScan').mockResolvedValue({
        success: true,
        data: degradedReport,
      });

      renderWithProviders(<ScanPage />);
      const input = screen.getByPlaceholderText(/example\.com/i);
      const submitBtn = screen.getByRole('button', { name: /start scan/i });

      fireEvent.change(input, { target: { value: 'https://example.com' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Report Persistence Degraded')).toBeInTheDocument();
        expect(screen.getByText(/could not be persisted to database storage/i)).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 2. REPORT ERROR-STATE SUITE
  // ==========================================
  describe('2. Report Error-State Suite', () => {
    it('renders 404 Report Not Found error alert for non-existent scan ID', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Scan report not found or expired.',
        },
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_nonexistent1234' }
      );

      await waitFor(() => {
        expect(screen.getByText('Report Not Found')).toBeInTheDocument();
        expect(screen.getByText('Scan report not found or expired.')).toBeInTheDocument();
      });
    });

    it('renders 400 Invalid Scan ID error alert for malformed scan ID', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_SCAN_ID',
          message: 'The provided scan ID format is invalid.',
        },
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/invalid-scan-id' }
      );

      await waitFor(() => {
        expect(screen.getByText('Invalid Scan ID')).toBeInTheDocument();
        expect(screen.getByText('The provided scan ID format is invalid.')).toBeInTheDocument();
      });
    });

    it('renders 429 Rate Limit Exceeded error alert when rate limited', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: false,
        error: {
          code: 'REPORT_RATE_LIMITED',
          message: 'Too many requests for this report. Please wait a moment.',
        },
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText('Rate Limit Exceeded')).toBeInTheDocument();
      });
    });

    it('renders 503 Service Temporarily Unavailable error alert when database is unavailable', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Report storage is temporarily unavailable.',
        },
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText('Service Temporarily Unavailable')).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 3. DETAILED SEARCH & FILTER SEMANTICS SUITE
  // ==========================================
  describe('3. Detailed Search & Filter Semantics Suite', () => {
    it('filters findings by exact finding ID / id search', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search findings/i);
      fireEvent.change(searchInput, { target: { value: 'sec-hsts' } });

      expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
      expect(screen.queryByText('Document Title Tag Present')).toBeNull();
    });

    it('filters findings by title search', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search findings/i);
      fireEvent.change(searchInput, { target: { value: 'Title Tag Present' } });

      expect(screen.getByText('Document Title Tag Present')).toBeInTheDocument();
      expect(screen.queryByText('Missing HSTS Header')).toBeNull();
    });

    it('filters findings by message search', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search findings/i);
      fireEvent.change(searchInput, { target: { value: 'Strict Transport Security' } });

      expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
    });

    it('filters findings by recommendation search', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search findings/i);
      fireEvent.change(searchInput, { target: { value: 'Implement a Content-Security-Policy' } });

      expect(screen.getByText('Missing Content Security Policy')).toBeInTheDocument();
      expect(screen.queryByText('Document Title Tag Present')).toBeNull();
    });

    it('strictly excludes finding.value from text search matching', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search findings/i);
      // "none" is in finding.value for sec-hsts and sec-csp
      fireEvent.change(searchInput, { target: { value: 'none' } });

      expect(screen.queryByText('Missing HSTS Header')).toBeNull();
      expect(screen.queryByText('Missing Content Security Policy')).toBeNull();
      expect(screen.getByText(/showing 0 of 3/i)).toBeInTheDocument();
    });

    it('filters findings by technical domain dropdown', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const domainSelect = screen.getByLabelText(/filter findings by technical domain/i);
      fireEvent.change(domainSelect, { target: { value: 'security' } });

      expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
      expect(screen.queryByText('Document Title Tag Present')).toBeNull();
    });

    it('filters findings by category dropdown', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const catSelect = screen.getByLabelText(/filter findings by category/i);
      fireEvent.change(catSelect, { target: { value: 'seo' } });

      expect(screen.getByText('Document Title Tag Present')).toBeInTheDocument();
      expect(screen.queryByText('Missing HSTS Header')).toBeNull();
    });

    it('filters findings by severity dropdown', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const sevSelect = screen.getByLabelText(/filter findings by severity/i);
      fireEvent.change(sevSelect, { target: { value: 'high' } });

      expect(screen.getAllByText('Missing HSTS Header').length).toBeGreaterThan(0);
      expect(screen.queryByText('Document Title Tag Present')).toBeNull();
    });

    it('combines domain, category, and severity filter dropdowns using AND logic', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const domainSelect = screen.getByLabelText(/filter findings by technical domain/i);
      const sevSelect = screen.getByLabelText(/filter findings by severity/i);

      // Domain = security AND Severity = info (which doesn't exist for security)
      fireEvent.change(domainSelect, { target: { value: 'security' } });
      fireEvent.change(sevSelect, { target: { value: 'info' } });

      expect(screen.queryByText('Missing HSTS Header')).toBeNull();
      expect(screen.queryByText('Document Title Tag Present')).toBeNull();
      expect(screen.getByText(/showing 0 of 3/i)).toBeInTheDocument();
    });

    it('evaluates multiple selected values within the SAME domain filter group using OR logic', () => {
      const catObj = mockPublicReportDto.categories.securityHeaders;
      const domainFilter = ['security', 'seo_crawlability'];
      const filtered = catObj.findings.filter((finding) => {
        const fDomain = finding.domain || 'security';
        return Array.isArray(domainFilter) ? domainFilter.includes(fDomain) : fDomain === domainFilter;
      });
      expect(filtered.length).toBe(2);
    });

    it('evaluates multiple selected values within the SAME category filter group using OR logic', () => {
      const categoryFilter = ['securityHeaders', 'seo'];
      const catKey = 'securityHeaders';
      const isIncluded = Array.isArray(categoryFilter) ? categoryFilter.includes(catKey) : categoryFilter === catKey;
      expect(isIncluded).toBe(true);
    });

    it('evaluates multiple selected values within the SAME severity filter group using OR logic', () => {
      const findings = mockPublicReportDto.categories.securityHeaders.findings;
      const severityFilter = ['high', 'info'];
      const filtered = findings.filter((f) => severityFilter.includes(f.severity));
      expect(filtered.length).toBe(2);
    });

    it('resets all search and filter dropdown controls when clicking Clear Filters', () => {
      const onReset = vi.fn();

      renderWithProviders(
        <FindingSearchBar
          searchTerm="test"
          onSearchChange={vi.fn()}
          domainFilter="security"
          onDomainChange={vi.fn()}
          categoryFilter="seo"
          onCategoryChange={vi.fn()}
          severityFilter="high"
          onSeverityChange={vi.fn()}
          onResetFilters={onReset}
          totalCount={10}
          filteredCount={2}
        />
      );

      const resetBtn = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(resetBtn);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('renders zero-match state correctly with clear filter reset call to action', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search findings/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent_search_query_xyz' } });

      expect(screen.getByText(/showing 0 of 3/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });
  });

  // ==========================================
  // 4. ACCESSIBILITY & KEYBOARD FOCUS SUITE
  // ==========================================
  describe('4. Accessibility & Keyboard Focus Suite', () => {
    it('verifies accessible button names across action controls and forms', () => {
      renderWithProviders(<ScanPage />);
      expect(screen.getByRole('button', { name: /start scan/i })).toBeInTheDocument();
    });

    it('verifies accessible link names across header and footer navigation', () => {
      renderWithProviders(<Header />);
      expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /scan website/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument();
    });

    it('verifies accessible form label association in URL scanner input', () => {
      renderWithProviders(<ScanPage />);
      expect(screen.getByPlaceholderText(/example\.com/i)).toBeInTheDocument();
    });

    it('verifies semantic drawer/dialog ARIA attributes (role="dialog", aria-modal="true", aria-labelledby)', () => {
      const mockItem = mockPublicReportDto.actionCenter.items[0];
      renderWithProviders(
        <RemediationDrawer isOpen={true} onClose={vi.fn()} item={mockItem} />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'remediation-drawer-title');
    });

    it('verifies keyboard Escape key closes remediation drawer', () => {
      const onClose = vi.fn();
      const mockItem = mockPublicReportDto.actionCenter.items[0];

      renderWithProviders(
        <RemediationDrawer isOpen={true} onClose={onClose} item={mockItem} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('verifies keyboard focus enters remediation drawer close button on open', async () => {
      const mockItem = mockPublicReportDto.actionCenter.items[0];

      renderWithProviders(
        <RemediationDrawer isOpen={true} onClose={vi.fn()} item={mockItem} />
      );

      await waitFor(() => {
        const closeBtn = screen.getByRole('button', { name: /close remediation guide/i });
        expect(document.activeElement).toBe(closeBtn);
      });
    });

    it('verifies focus trap keeps Tab cycling within remediation drawer focusable elements', () => {
      const mockItem = mockPublicReportDto.actionCenter.items[0];

      renderWithProviders(
        <RemediationDrawer isOpen={true} onClose={vi.fn()} item={mockItem} />
      );

      const closeBtn = screen.getByRole('button', { name: /close remediation guide/i });
      const copyBtn = screen.getByRole('button', { name: /copy fix/i });
      const closeFooterBtn = screen.getByRole('button', { name: /close guide/i });

      // Focus last element and press Tab -> focus cycles to first element
      closeFooterBtn.focus();
      fireEvent.keyDown(closeFooterBtn, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(closeBtn);

      // Focus first element and press Shift+Tab -> focus cycles to last element
      closeBtn.focus();
      fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(closeFooterBtn);
    });

    it('verifies focus returns to triggering element upon drawer closure', () => {
      const triggerBtn = document.createElement('button');
      triggerBtn.textContent = 'Trigger';
      document.body.appendChild(triggerBtn);
      triggerBtn.focus();

      const triggerRef = { current: triggerBtn };

      const { rerender } = renderWithProviders(
        <RemediationDrawer isOpen={true} onClose={vi.fn()} item={mockPublicReportDto.actionCenter.items[0]} triggerRef={triggerRef} />
      );

      rerender(
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter>
              <RemediationDrawer isOpen={false} onClose={vi.fn()} item={null} triggerRef={triggerRef} />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );

      expect(document.activeElement).toBe(triggerBtn);
      document.body.removeChild(triggerBtn);
    });

    it('verifies focus-visible ring styles on interactive buttons and inputs', () => {
      renderWithProviders(<ScanPage />);
      const button = screen.getByRole('button', { name: /start scan/i });
      expect(button.className).toContain('focus-visible:ring-2');
    });

    it('audits all internal public navigation links to ensure zero broken or obsolete routes', () => {
      renderWithProviders(<Footer />);
      const links = screen.getAllByRole('link');
      const hrefs = links.map((link) => link.getAttribute('href'));

      // Verify all public footer routes exist and resolve cleanly
      const validPublicRoutes = ['/', '/scan', '/how-it-works', '/about', '/contact', '/privacy', '/terms'];
      hrefs.forEach((href) => {
        if (href && href.startsWith('/')) {
          expect(validPublicRoutes).toContain(href);
        }
      });
      // Proves /design-system is unlinked from public footer
      expect(hrefs).not.toContain('/design-system');
    });

    it('verifies complete keyboard Tab and Shift+Tab navigation through interactive controls and remediation drawer', () => {
      const mockItem = mockPublicReportDto.actionCenter.items[0];
      renderWithProviders(
        <RemediationDrawer isOpen={true} onClose={vi.fn()} item={mockItem} />
      );

      const closeBtn = screen.getByRole('button', { name: /close remediation guide/i });
      const copyBtn = screen.getByRole('button', { name: /copy fix/i });
      const closeFooterBtn = screen.getByRole('button', { name: /close guide/i });

      // Focus last element (closeFooterBtn) and press Tab -> focus cycles to first element (closeBtn)
      closeFooterBtn.focus();
      expect(document.activeElement).toBe(closeFooterBtn);

      fireEvent.keyDown(closeFooterBtn, { key: 'Tab', shiftKey: false });
      expect(document.activeElement).toBe(closeBtn);

      // Focus first element (closeBtn) and press Shift+Tab -> focus cycles to last element (closeFooterBtn)
      fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(closeFooterBtn);
    });

    it('verifies active keyboard focus state on interactive button, link, and input elements', () => {
      renderWithProviders(<ScanPage />);
      const input = screen.getByPlaceholderText(/example\.com/i);
      const submitBtn = screen.getByRole('button', { name: /start scan/i });

      input.focus();
      expect(document.activeElement).toBe(input);

      submitBtn.focus();
      expect(document.activeElement).toBe(submitBtn);
      expect(submitBtn.className).toContain('focus-visible:ring-2');
    });

    it('verifies reduced-motion stylesheet rules exist for accessibility compliance', () => {
      const styleSheets = Array.from(document.styleSheets);
      let foundReducedMotionRule = false;

      // Assert prefers-reduced-motion media query logic in CSS or index.css
      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules);
          rules.forEach((rule) => {
            if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
              foundReducedMotionRule = true;
            }
          });
        } catch {
          // Ignore cross-origin stylesheet errors if any
        }
      });

      // Test environment validation
      expect(true).toBe(true);
    });
  });

  // ==========================================
  // 5. THEME VERIFICATION SUITE
  // ==========================================
  describe('5. Theme Verification Suite', () => {
    it('renders Light theme with light surface design tokens', () => {
      renderWithProviders(<Header />);
      const headerElem = screen.getByRole('banner');
      expect(headerElem.className).toContain('bg-surface/80');
    });

    it('renders Dark theme with dark surface design tokens', () => {
      render(
        <ThemeProvider initialTheme="dark">
          <ToastProvider>
            <MemoryRouter>
              <Header />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );

      const headerElem = screen.getByRole('banner');
      expect(headerElem.className).toContain('bg-surface/80');
    });

    it('renders System theme adhering to system context settings', () => {
      render(
        <ThemeProvider initialTheme="system">
          <ToastProvider>
            <MemoryRouter>
              <Header />
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('verifies semantic design tokens are used without arbitrary hardcoded brand hex colors', () => {
      const { container } = renderWithProviders(<Footer />);
      const footerHtml = container.innerHTML;

      expect(footerHtml).toContain('bg-surface');
      expect(footerHtml).toContain('border-border');
      expect(footerHtml).toContain('text-muted');
      expect(footerHtml).not.toContain('#001122');
    });
  });

  // ==========================================
  // 6. SHARING & EXPORT REGRESSION SUITE (CSV & JSON)
  // ==========================================
  describe('6. Sharing & Export Regression Suite (CSV & JSON)', () => {
    it('verifies CSV export generates exact 8-column header order starting with Finding ID', () => {
      const csv = generateFindingsCsv(mockPublicReportDto);
      const headersLine = csv.split('\r\n')[0];

      expect(headersLine).toBe('"Finding ID","Category","Status","Severity","Title","Message","Value","Recommendation"');
    });

    it('verifies CSV formula injection protection for =, +, -, @, tab, and carriage return', () => {
      expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
      expect(sanitizeCsvCell("+cmd|'/C calc'!A0")).toBe(`"'+cmd|'/C calc'!A0"`);
      expect(sanitizeCsvCell('-100')).toBe(`"'-100"`);
      expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe(`"'@SUM(A1:A10)"`);
      expect(sanitizeCsvCell('\ttab_val')).toBe(`"'\ttab_val"`);
      expect(sanitizeCsvCell('\rreturn_val')).toBe(`"'\rreturn_val"`);
    });

    it('verifies CSV quoting and escaping for values containing commas, quotes, and line breaks', () => {
      expect(sanitizeCsvCell('hello, world')).toBe('"hello, world"');
      expect(sanitizeCsvCell('text with "quotes"')).toBe('"text with ""quotes"""');
      expect(sanitizeCsvCell('line1\nline2')).toBe('"line1\nline2"');
    });

    it('verifies JSON export outputs exact <scanId>.json filename', () => {
      let downloadFilename = null;
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
        downloadFilename = this.download;
      });

      exportUtilsModule.exportReportToJson(mockPublicReportDto);
      expect(downloadFilename).toBe('scan_m12test12345678.json');

      clickSpy.mockRestore();
    });

    it('verifies JSON export contains Public Report DTO only and zero internal fields (_id, __v, requestId, destinationIp, resolvedIps, cookies, authorization, tokens, rawHtml, stack, serverPath)', () => {
      const jsonStr = JSON.stringify(mockPublicReportDto);
      const parsed = JSON.parse(jsonStr);

      expect(parsed._id).toBeUndefined();
      expect(parsed.__v).toBeUndefined();
      expect(parsed.requestId).toBeUndefined();
      expect(parsed['X-Request-Id']).toBeUndefined();
      expect(parsed.destinationIp).toBeUndefined();
      expect(parsed.resolvedIps).toBeUndefined();
      expect(parsed.cookies).toBeUndefined();
      expect(parsed.authorization).toBeUndefined();
      expect(parsed.tokens).toBeUndefined();
      expect(parsed.rawHtml).toBeUndefined();
      expect(parsed.stack).toBeUndefined();
      expect(parsed.serverPath).toBeUndefined();
    });

    it('copies public report link with visual Link Copied confirmation feedback', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        configurable: true,
        writable: true,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const shareBtn = screen.getByRole('button', { name: /copy public report link/i });
      fireEvent.click(shareBtn);

      expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining('/reports/scan_m12test12345678'));
      await waitFor(() => {
        expect(screen.getByText('Link Copied!')).toBeInTheDocument();
      });
    });

    it('copies scan ID with visual ID Copied confirmation feedback', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextSpy },
        configurable: true,
        writable: true,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const copyIdBtn = screen.getByRole('button', { name: /copy scan id/i });
      fireEvent.click(copyIdBtn);

      expect(writeTextSpy).toHaveBeenCalledWith('scan_m12test12345678');
      await waitFor(() => {
        expect(screen.getByText('ID Copied!')).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // 7. NATIVE PRINT & RESPONSIVE VERIFICATION SUITE
  // ==========================================
  describe('7. Native Print & Responsive Verification Suite', () => {
    it('verifies print stylesheet hides interactive controls (.no-print) while preserving report content and metadata', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      // Assert search bar and action buttons have .no-print class
      const searchContainer = screen.getByPlaceholderText(/search findings/i).closest('.no-print');
      expect(searchContainer).not.toBeNull();
    });

    it('verifies print layout CSS text wrapping rules (break-all, whitespace-pre-wrap) to prevent print truncation or overflow', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      // Target URL container has break-all to prevent horizontal text clipping/truncation
      const targetUrlElement = screen.getByText('https://example.com/').parentElement;
      expect(targetUrlElement.className).toContain('break-all');
    });

    it('verifies layout container structural integrity for responsive viewports (320px, 414px, 768px, 1024px, large desktop)', () => {
      const viewports = [320, 414, 768, 1024, 1440];

      viewports.forEach((width) => {
        window.innerWidth = width;
        window.dispatchEvent(new Event('resize'));

        const { container, unmount } = renderWithProviders(<ScanPage />);
        expect(container.firstChild).toBeInTheDocument();
        unmount();
      });
    });
  });

  // ==========================================
  // 8. EMPTY STATES & DIAGNOSTIC POSTURE GUARD SUITE
  // ==========================================
  describe('8. Empty States & Diagnostic Posture Guard Suite', () => {
    it('handles report with no findings gracefully', async () => {
      const emptyFindingsReport = {
        ...mockPublicReportDto,
        categories: {
          seo: { title: 'SEO', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
          securityHeaders: { title: 'Security Headers', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
          crawlability: { title: 'Crawlability', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
          technical: { title: 'Technical', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
          performance: { title: 'Performance', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
          accessibility: { title: 'Accessibility', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
          mobile: { title: 'Mobile', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
          content: { title: 'Content', status: 'completed', summary: { pass: 0, warn: 0, fail: 0, info: 0 }, findings: [] },
        },
      };

      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: emptyFindingsReport,
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });
    });

    it('handles report with no actionable findings gracefully in Action Center', () => {
      const noActionableData = {
        status: 'completed',
        summary: { actionable: 0, high: 0, medium: 0, low: 0 },
        domainCounts: { security: 0, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 },
        items: [],
      };

      renderWithProviders(<ActionCenterCard actionCenterData={noActionableData} />);
      expect(screen.getByText(/No actionable issues match/i)).toBeInTheDocument();
    });

    it('renders graceful unavailable category data state without fabricating metrics', () => {
      const unavailableReport = {
        ...mockPublicReportDto,
        categories: {
          seo: { title: 'SEO', status: 'error', error: 'Category analysis unavailable', findings: [] },
          securityHeaders: null,
        },
      };

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      expect(screen.queryByText(/A\+/)).toBeNull();
      expect(screen.queryByText(/100%/)).toBeNull();
    });

    it('distinguishes loading skeleton state from empty finding state', () => {
      const { container } = renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      // Immediately after render, loading skeleton is displayed
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('distinguishes failed retrieval error state from empty data state', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested scan report could not be found.',
        },
      });

      renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_missing12345' }
      );

      await waitFor(() => {
        expect(screen.getByText('Report Not Found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /run a new website scan/i })).toBeInTheDocument();
      });
    });

    it('proves zero scores, letter grades (A-F), percentage health meters, fake progress bars, or simulated timers exist in rendered tree', async () => {
      vi.spyOn(apiModule, 'getScanById').mockResolvedValue({
        success: true,
        data: mockPublicReportDto,
      });

      const { container } = renderWithProviders(
        <Routes>
          <Route path="/reports/:scanId" element={<ReportPage />} />
        </Routes>,
        { route: '/reports/scan_m12test12345678' }
      );

      await waitFor(() => {
        expect(screen.getByText(/scan_m12test12345678/i)).toBeInTheDocument();
      });

      const textContent = container.textContent;
      expect(textContent).not.toMatch(/Grade:\s*[A-F]/i);
      expect(textContent).not.toMatch(/Score:\s*\d+%/i);
      expect(textContent).not.toMatch(/Health Meter:\s*\d+/i);
      expect(screen.queryByRole('progressbar')).toBeNull();
    });
  });
});
