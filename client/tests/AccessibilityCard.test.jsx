import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccessibilityCard } from '../src/components/sections/AccessibilityCard';

describe('AccessibilityCard Component Suite (M6)', () => {
  const mockAccessibilityData = {
    status: 'completed',
    summary: { pass: 1, warn: 1, fail: 1, info: 1 },
    findings: [
      {
        id: 'a11y-image-alt',
        category: 'accessibility',
        status: 'warn',
        severity: 'medium',
        title: 'Missing Image Alt Attributes',
        message: 'Found 1 image lacking an alt attribute.',
        value: { totalImages: 2, imagesMissingAlt: 1 },
        recommendation: 'Add alt attributes to images.',
      },
      {
        id: 'a11y-iframe-title',
        category: 'accessibility',
        status: 'pass',
        severity: 'info',
        title: 'Iframe Title Attributes',
        message: 'All iframes specify title attributes.',
        value: { totalIframes: 1 },
        recommendation: 'Maintain title attributes.',
      },
      {
        id: 'a11y-landmarks',
        category: 'accessibility',
        status: 'info',
        severity: 'info',
        title: 'Document Landmark Structure',
        message: 'Document includes a primary main landmark.',
        value: { hasMainLandmark: true },
        recommendation: 'Maintain main landmark.',
      },
      {
        id: 'category-error',
        category: 'accessibility',
        status: 'fail',
        severity: 'medium',
        title: 'Analysis Error',
        message: 'An unexpected category error occurred.',
        value: null,
        recommendation: 'Re-run scan.',
      },
    ],
  };

  it('renders card title, subtitle, summary badges, and all findings by default', () => {
    render(<AccessibilityCard accessibilityData={mockAccessibilityData} />);

    expect(screen.getByText('Passive Accessibility Markup Analysis')).toBeInTheDocument();
    expect(screen.getByText('Missing Image Alt Attributes')).toBeInTheDocument();
    expect(screen.getByText('Iframe Title Attributes')).toBeInTheDocument();
    expect(screen.getByText('Document Landmark Structure')).toBeInTheDocument();
    expect(screen.getByText('Analysis Error')).toBeInTheDocument();
  });

  it('filters findings when filter tabs (All, Pass, Warn, Fail, Info) are clicked', () => {
    render(<AccessibilityCard accessibilityData={mockAccessibilityData} />);

    // Click Pass filter tab
    const passBtn = screen.getByRole('button', { name: /pass \(1\)/i });
    fireEvent.click(passBtn);

    expect(screen.getByText('Iframe Title Attributes')).toBeInTheDocument();
    expect(screen.queryByText('Missing Image Alt Attributes')).not.toBeInTheDocument();

    // Click Warn filter tab
    const warnBtn = screen.getByRole('button', { name: /warn \(1\)/i });
    fireEvent.click(warnBtn);

    expect(screen.getByText('Missing Image Alt Attributes')).toBeInTheDocument();
    expect(screen.queryByText('Iframe Title Attributes')).not.toBeInTheDocument();

    // Click Fail filter tab
    const failBtn = screen.getByRole('button', { name: /fail \(1\)/i });
    fireEvent.click(failBtn);

    expect(screen.getByText('Analysis Error')).toBeInTheDocument();
    expect(screen.queryByText('Missing Image Alt Attributes')).not.toBeInTheDocument();

    // Click Info filter tab
    const infoBtn = screen.getByRole('button', { name: /info \(1\)/i });
    fireEvent.click(infoBtn);

    expect(screen.getByText('Document Landmark Structure')).toBeInTheDocument();

    // Click All filter tab
    const allBtn = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allBtn);

    expect(screen.getByText('Missing Image Alt Attributes')).toBeInTheDocument();
    expect(screen.getByText('Analysis Error')).toBeInTheDocument();
  });

  it('renders empty state message when no findings match selected filter tab', () => {
    const dataNoWarn = {
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'a11y-iframe-title',
          category: 'accessibility',
          status: 'pass',
          severity: 'info',
          title: 'Iframe Title Attributes',
          message: 'All iframes specify title attributes.',
          value: null,
          recommendation: 'Maintain title attributes.',
        },
      ],
    };

    render(<AccessibilityCard accessibilityData={dataNoWarn} />);

    const warnBtn = screen.getByRole('button', { name: /warn \(0\)/i });
    fireEvent.click(warnBtn);

    expect(screen.getByText(/No accessibility findings match the selected filter/i)).toBeInTheDocument();
  });
});
