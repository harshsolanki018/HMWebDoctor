import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MobileReadinessCard } from '../src/components/sections/MobileReadinessCard';

describe('MobileReadinessCard Component Suite (M6)', () => {
  const mockMobileData = {
    status: 'completed',
    summary: { pass: 1, warn: 1, fail: 0, info: 1 },
    findings: [
      {
        id: 'mobile-viewport-zoom',
        category: 'mobile',
        status: 'warn',
        severity: 'medium',
        title: 'Viewport Zoom Disabled',
        message: 'Viewport contains zoom restrictions.',
        value: { viewportContent: 'user-scalable=no' },
        recommendation: 'Allow viewport zoom.',
      },
      {
        id: 'mobile-input-types',
        category: 'mobile',
        status: 'pass',
        severity: 'info',
        title: 'Mobile Touch Keyboard Input Types',
        message: 'Found 2 specialized mobile input types.',
        value: { totalInputs: 3, specializedInputTypesCount: 2 },
        recommendation: 'Maintain specialized input types.',
      },
      {
        id: 'mobile-meta-tags',
        category: 'mobile',
        status: 'info',
        severity: 'info',
        title: 'Mobile Presentation Metadata',
        message: 'Mobile presentation metadata present.',
        value: { hasThemeColorMeta: true },
        recommendation: 'Maintain theme-color meta.',
      },
    ],
  };

  it('renders card title, subtitle, summary badges, and all findings by default', () => {
    render(<MobileReadinessCard mobileData={mockMobileData} />);

    expect(screen.getByText('Passive Mobile Responsiveness Markup Analysis')).toBeInTheDocument();
    expect(screen.getByText('Viewport Zoom Disabled')).toBeInTheDocument();
    expect(screen.getByText('Mobile Touch Keyboard Input Types')).toBeInTheDocument();
    expect(screen.getByText('Mobile Presentation Metadata')).toBeInTheDocument();
  });

  it('filters findings when filter tabs are clicked', () => {
    render(<MobileReadinessCard mobileData={mockMobileData} />);

    // Click Pass filter tab
    const passBtn = screen.getByRole('button', { name: /pass \(1\)/i });
    fireEvent.click(passBtn);

    expect(screen.getByText('Mobile Touch Keyboard Input Types')).toBeInTheDocument();
    expect(screen.queryByText('Viewport Zoom Disabled')).not.toBeInTheDocument();

    // Click Warn filter tab
    const warnBtn = screen.getByRole('button', { name: /warn \(1\)/i });
    fireEvent.click(warnBtn);

    expect(screen.getByText('Viewport Zoom Disabled')).toBeInTheDocument();
    expect(screen.queryByText('Mobile Touch Keyboard Input Types')).not.toBeInTheDocument();
  });
});
