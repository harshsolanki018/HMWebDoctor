import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { validateAndNormalizeUrl } from '../src/utils/urlValidator';

vi.mock('../src/services/api', () => ({
  fetchHealth: vi.fn().mockResolvedValue({
    success: true,
    data: {
      status: 'healthy',
      services: { api: 'healthy', database: 'healthy' },
    },
    error: null,
  }),
  executeScan: vi.fn().mockResolvedValue({
    success: true,
    data: {
      scanId: 'scan_test123',
      targetUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      redirectCount: 0,
      document: {
        statusCode: 200,
        contentType: 'text/html',
        contentLengthBytes: 500,
        ipAddress: '93.184.216.34',
        baseline: { title: 'Test', lang: 'en', charset: 'utf-8', hasDoctype: true },
      },
    },
    error: null,
  }),
}));

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>
  );
};

describe('Milestone 2 — Public Product Pages & Routing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Route Rendering & SEO Metadata', () => {
    it('renders HomePage at route "/"', () => {
      renderWithRouter('/');
      const headings = screen.getAllByRole('heading', { name: /Diagnose your website/i });
      expect(headings.length).toBeGreaterThan(0);
      expect(document.title).toContain('Diagnose Your Website');
    });

    it('renders HowItWorksPage at route "/how-it-works"', () => {
      renderWithRouter('/how-it-works');
      expect(
        screen.getByRole('heading', { name: /How HMWebDoctor Diagnoses Websites/i })
      ).toBeInTheDocument();
      expect(document.title).toContain('How It Works');
    });

    it('renders AboutPage at route "/about"', () => {
      renderWithRouter('/about');
      expect(
        screen.getByRole('heading', { name: /About HMWebDoctor/i })
      ).toBeInTheDocument();
      expect(document.title).toContain('About');
    });

    it('renders ContactPage at route "/contact"', () => {
      renderWithRouter('/contact');
      expect(
        screen.getByRole('heading', { name: /Get in Touch/i })
      ).toBeInTheDocument();
      expect(document.title).toContain('Contact Us');
    });

    it('renders PrivacyPage at route "/privacy"', () => {
      renderWithRouter('/privacy');
      expect(
        screen.getByRole('heading', { name: /Privacy Policy/i })
      ).toBeInTheDocument();
      expect(document.title).toContain('Privacy Policy');
    });

    it('renders TermsPage at route "/terms"', () => {
      renderWithRouter('/terms');
      expect(
        screen.getByRole('heading', { name: /Terms of Service/i })
      ).toBeInTheDocument();
      expect(document.title).toContain('Terms of Service');
    });

    it('renders ScanPage at route "/scan"', () => {
      renderWithRouter('/scan');
      expect(
        screen.getByRole('heading', { name: /Scan & Diagnose Website/i })
      ).toBeInTheDocument();
      expect(document.title).toContain('Scan Website');
    });

    it('renders NotFoundPage for unknown routes', () => {
      renderWithRouter('/some-random-unknown-page');
      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(document.title).toContain('404');
    });

    it('renders isolated DesignShowcase at "/design-system"', () => {
      renderWithRouter('/design-system');
      expect(
        screen.getByText(/HMWebDoctor Design System & Component Showcase/i)
      ).toBeInTheDocument();
    });
  });

  describe('Navigation & Isolation Constraints', () => {
    it('does NOT expose /design-system in Header or Footer navigation links', () => {
      renderWithRouter('/');

      const allLinks = screen.getAllByRole('link');
      const designSystemLinks = allLinks.filter(
        (link) => link.getAttribute('href') === '/design-system'
      );
      expect(designSystemLinks.length).toBe(0);
    });

    it('highlights active route link in Header', () => {
      renderWithRouter('/about');
      const aboutLinks = screen.getAllByRole('link', { name: 'About' });
      expect(aboutLinks[0].className).toContain('text-primary');
    });
  });

  describe('Client-Side URL Validation & Normalization Utility', () => {
    it('adds https:// automatically to raw domain inputs', () => {
      const res = validateAndNormalizeUrl('example.com');
      expect(res.isValid).toBe(true);
      expect(res.normalizedUrl).toBe('https://example.com/');
    });

    it('preserves existing https:// and http:// protocols', () => {
      const res1 = validateAndNormalizeUrl('https://my-site.org/page');
      expect(res1.isValid).toBe(true);
      expect(res1.normalizedUrl).toBe('https://my-site.org/page');

      const res2 = validateAndNormalizeUrl('http://my-site.org');
      expect(res2.isValid).toBe(true);
      expect(res2.normalizedUrl).toBe('http://my-site.org/');
    });

    it('rejects invalid/unsupported protocols like ftp:// or file://', () => {
      const res = validateAndNormalizeUrl('ftp://example.com');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/Only HTTP and HTTPS website URLs are supported/i);
    });

    it('rejects invalid hostnames', () => {
      const res = validateAndNormalizeUrl('not a valid url');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/URLs cannot contain spaces|valid website/i);
    });
  });

  describe('Contact Form Functionality', () => {
    it('shows preview submission alert without claiming fake email delivery', async () => {
      renderWithRouter('/contact');

      const nameInput = screen.getByLabelText(/Your Full Name/i);
      const emailInput = screen.getByLabelText(/Your Email Address/i);
      const subjectInput = screen.getByLabelText(/Subject/i);
      const messageInput = screen.getByLabelText(/Message/i);
      const submitBtn = screen.getByRole('button', { name: /Submit Inquiry/i });

      fireEvent.change(nameInput, { target: { value: 'Alice Developer' } });
      fireEvent.change(emailInput, { target: { value: 'alice@example.com' } });
      fireEvent.change(subjectInput, { target: { value: 'General Inquiry' } });
      fireEvent.change(messageInput, { target: { value: 'Inquiry regarding diagnostics details.' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Contact submission is currently in preview mode/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Scan Infrastructure & No Fake Metrics Guard', () => {
    it('executes baseline scan without generating fake scores or grades', async () => {
      renderWithRouter('/scan?url=example.com');

      await waitFor(() => {
        expect(screen.getByText(/Baseline Scan Summary/i)).toBeInTheDocument();
      });

      // Confirm no fake health scores or grade badges are present
      expect(screen.queryByText(/100\/100/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Grade A/i)).not.toBeInTheDocument();
    });
  });
});
