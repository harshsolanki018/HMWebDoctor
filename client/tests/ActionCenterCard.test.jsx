import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ActionCenterCard } from '../src/components/sections/ActionCenterCard';
import { ToastProvider } from '../src/components/ui/Toast';

const renderWithToast = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

describe('ActionCenterCard Component Suite (M8)', () => {
  const mockActionCenterData = {
    status: 'completed',
    summary: {
      actionable: 3,
      high: 1,
      medium: 1,
      low: 1,
    },
    domainCounts: {
      security: 1,
      accessibility: 1,
      performance: 1,
      seo_crawlability: 0,
      markup_structure: 0,
    },
    items: [
      {
        findingId: 'sec-hsts-missing',
        category: 'securityHeaders',
        status: 'fail',
        severity: 'high',
        domain: 'security',
        title: 'Missing HSTS Security Header',
        message: 'Strict-Transport-Security header missing',
        recommendation: 'Configure HSTS header on web server.',
        remediation: {
          summary: 'Enable HTTP Strict Transport Security.',
          impact: 'Enforces HTTPS for all client requests.',
          codeFix: 'Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
          steps: ['Open server config', 'Add HSTS header', 'Restart server'],
          verification: 'Run curl -I to check header.',
        },
      },
      {
        findingId: 'a11y-img-alt-missing',
        category: 'accessibility',
        status: 'warn',
        severity: 'medium',
        domain: 'accessibility',
        title: 'Missing Image Alt Attributes',
        message: '2 image(s) missing alt text',
        recommendation: 'Provide descriptive alt text for images.',
        remediation: {
          summary: 'Add alt attributes to image tags.',
          impact: 'Improves accessibility for screen readers.',
          codeFix: '<img src="hero.png" alt="Company Logo" />',
          steps: ['Locate image tags', 'Add meaningful alt text'],
          verification: 'Inspect DOM for alt attribute.',
        },
      },
      {
        findingId: 'perf-oversized-html',
        category: 'performance',
        status: 'warn',
        severity: 'low',
        domain: 'performance',
        title: 'Oversized HTML Payload',
        message: 'HTML size exceeds 500KB',
        recommendation: 'Minimize HTML payload size.',
        remediation: {
          summary: 'Reduce initial HTML payload size.',
          impact: 'Speeds up initial page load.',
          codeFix: null,
          steps: ['Remove inline styles', 'Enable compression'],
          verification: 'Check document size in DevTools.',
        },
      },
    ],
  };

  it('renders Action Center card header, badges, and all action items by default', () => {
    renderWithToast(<ActionCenterCard actionCenterData={mockActionCenterData} />);

    expect(screen.getByText('Action Center & Finding Prioritization')).toBeInTheDocument();
    expect(screen.getByText('1 High')).toBeInTheDocument();
    expect(screen.getByText('Missing HSTS Security Header')).toBeInTheDocument();
    expect(screen.getByText('Missing Image Alt Attributes')).toBeInTheDocument();
    expect(screen.getByText('Oversized HTML Payload')).toBeInTheDocument();
  });

  it('filters items by technical domain tabs', () => {
    renderWithToast(<ActionCenterCard actionCenterData={mockActionCenterData} />);

    // Click Security domain tab
    const securityTab = screen.getByRole('button', { name: /security \(1\)/i });
    fireEvent.click(securityTab);

    expect(screen.getByText('Missing HSTS Security Header')).toBeInTheDocument();
    expect(screen.queryByText('Missing Image Alt Attributes')).not.toBeInTheDocument();
    expect(screen.queryByText('Oversized HTML Payload')).not.toBeInTheDocument();

    // Click Accessibility domain tab
    const accessibilityTab = screen.getByRole('button', { name: /accessibility \(1\)/i });
    fireEvent.click(accessibilityTab);

    expect(screen.getByText('Missing Image Alt Attributes')).toBeInTheDocument();
    expect(screen.queryByText('Missing HSTS Security Header')).not.toBeInTheDocument();
  });

  it('filters items by severity tabs', () => {
    renderWithToast(<ActionCenterCard actionCenterData={mockActionCenterData} />);

    // Click High severity tab
    const highTab = screen.getByRole('button', { name: /^high \(1\)$/i });
    fireEvent.click(highTab);

    expect(screen.getByText('Missing HSTS Security Header')).toBeInTheDocument();
    expect(screen.queryByText('Missing Image Alt Attributes')).not.toBeInTheDocument();

    // Click Medium severity tab
    const mediumTab = screen.getByRole('button', { name: /^medium \(1\)$/i });
    fireEvent.click(mediumTab);

    expect(screen.getByText('Missing Image Alt Attributes')).toBeInTheDocument();
    expect(screen.queryByText('Missing HSTS Security Header')).not.toBeInTheDocument();
  });

  it('opens remediation drawer when View Fix Guide button is clicked', () => {
    renderWithToast(<ActionCenterCard actionCenterData={mockActionCenterData} />);

    const fixButtons = screen.getAllByRole('button', { name: /view fix guide/i });
    expect(fixButtons.length).toBe(3);

    fireEvent.click(fixButtons[0]);

    // Drawer should open displaying remediation details
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getAllByText('Missing HSTS Security Header').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Enable HTTP Strict Transport Security.')).toBeInTheDocument();
    expect(screen.getByText('Enforces HTTPS for all client requests.')).toBeInTheDocument();
  });

  it('displays empty state when no action items match active filter', () => {
    renderWithToast(<ActionCenterCard actionCenterData={mockActionCenterData} />);

    // Click SEO domain tab which has 0 items
    const seoTab = screen.getByRole('button', { name: /seo & crawlability \(0\)/i });
    fireEvent.click(seoTab);

    expect(screen.getByText('No actionable issues match the selected domain or severity filters.')).toBeInTheDocument();
  });

  it('displays empty message when actionCenterData has 0 actionable items', () => {
    const emptyActionCenter = {
      status: 'completed',
      summary: { actionable: 0, high: 0, medium: 0, low: 0 },
      domainCounts: { security: 0, accessibility: 0, performance: 0, seo_crawlability: 0, markup_structure: 0 },
      items: [],
    };

    renderWithToast(<ActionCenterCard actionCenterData={emptyActionCenter} />);

    expect(screen.getByText('No actionable issues match the selected domain or severity filters.')).toBeInTheDocument();
  });

  it('returns null when actionCenterData is null or undefined', () => {
    renderWithToast(<ActionCenterCard actionCenterData={null} />);
    expect(screen.queryByText('Action Center & Finding Prioritization')).not.toBeInTheDocument();
  });
});
