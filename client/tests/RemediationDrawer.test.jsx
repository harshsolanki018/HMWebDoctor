import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RemediationDrawer } from '../src/components/sections/RemediationDrawer';
import { ToastProvider } from '../src/components/ui/Toast';

const renderWithToast = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

describe('RemediationDrawer Component Suite (M8)', () => {
  const mockItemWithCode = {
    findingId: 'sec-hsts-missing',
    category: 'securityHeaders',
    status: 'fail',
    severity: 'high',
    domain: 'security',
    title: 'Missing HSTS Security Header',
    message: 'Strict-Transport-Security header missing',
    recommendation: 'Configure HSTS header on web server.',
    remediation: {
      summary: 'Enable HTTP Strict Transport Security on the web server.',
      impact: 'Enforces HTTPS for all client connections and prevents downgrade attacks.',
      codeFix: 'Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
      steps: [
        'Open the web server configuration file.',
        'Add the Strict-Transport-Security header declaration.',
        'Reload or restart the web server service.',
      ],
      verification: 'Run curl -I https://your-domain.com and check for Strict-Transport-Security response header.',
    },
  };

  const mockItemWithoutCode = {
    findingId: 'perf-oversized-html',
    category: 'performance',
    status: 'warn',
    severity: 'low',
    domain: 'performance',
    title: 'Oversized HTML Payload',
    message: 'HTML payload size exceeds 500KB',
    recommendation: 'Minimize HTML payload size.',
    remediation: {
      summary: 'Reduce initial HTML payload size to optimize parsing speed.',
      impact: 'Decreases initial download latency and memory usage.',
      codeFix: null,
      steps: [
        'Remove unnecessary inline styles and scripts.',
        'Enable Gzip or Brotli compression on server responses.',
      ],
      verification: 'Measure document download size using browser DevTools.',
    },
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('returns null when isOpen is false or item is null', () => {
    renderWithToast(
      <RemediationDrawer isOpen={false} item={mockItemWithCode} onClose={mockOnClose} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    renderWithToast(
      <RemediationDrawer isOpen={true} item={null} onClose={mockOnClose} />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders drawer header, badges, summary, impact, steps, and verification when open', () => {
    renderWithToast(<RemediationDrawer isOpen={true} item={mockItemWithCode} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Missing HSTS Security Header')).toBeInTheDocument();
    expect(screen.getByText('security')).toBeInTheDocument();

    expect(screen.getByText('Enable HTTP Strict Transport Security on the web server.')).toBeInTheDocument();
    expect(screen.getByText('Enforces HTTPS for all client connections and prevents downgrade attacks.')).toBeInTheDocument();
    expect(screen.getByText('Open the web server configuration file.')).toBeInTheDocument();
    expect(screen.getByText(/Run curl -I https:\/\/your-domain.com/)).toBeInTheDocument();
  });

  it('renders plain-text code snippet and copy button when codeFix is present', () => {
    renderWithToast(<RemediationDrawer isOpen={true} item={mockItemWithCode} onClose={mockOnClose} />);

    expect(screen.getByText(/Header set Strict-Transport-Security/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy fix/i })).toBeInTheDocument();
  });

  it('renders informational notice when codeFix is null', () => {
    renderWithToast(<RemediationDrawer isOpen={true} item={mockItemWithoutCode} onClose={mockOnClose} />);

    expect(screen.getByText(/No static code fix snippet applies/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy fix/i })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderWithToast(<RemediationDrawer isOpen={true} item={mockItemWithCode} onClose={mockOnClose} />);

    const closeBtn = screen.getByRole('button', { name: /close remediation guide/i });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop overlay is clicked', () => {
    renderWithToast(<RemediationDrawer isOpen={true} item={mockItemWithCode} onClose={mockOnClose} />);

    const dialogBackdrop = screen.getByRole('dialog');
    fireEvent.click(dialogBackdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    renderWithToast(<RemediationDrawer isOpen={true} item={mockItemWithCode} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('copies code snippet to clipboard when Copy Fix button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderWithToast(<RemediationDrawer isOpen={true} item={mockItemWithCode} onClose={mockOnClose} />);

    const copyBtn = screen.getByRole('button', { name: /copy fix/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      'Header set Strict-Transport-Security "max-age=31536000; includeSubDomains"'
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
    });
  });
});
