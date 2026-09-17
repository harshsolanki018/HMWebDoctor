import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ContentQualityCard } from '../src/components/sections/ContentQualityCard';

describe('ContentQualityCard Component Suite (M7)', () => {
  const mockContentData = {
    status: 'completed',
    summary: { pass: 2, warn: 1, fail: 0, info: 1 },
    findings: [
      {
        id: 'content-word-count',
        category: 'content',
        status: 'pass',
        severity: 'info',
        title: 'Sufficient Text Content Volume',
        message: 'Document contains 150 words and 850 visible text characters.',
        value: { wordCount: 150, charCount: 850 },
        recommendation: 'Maintain well-structured text.',
      },
      {
        id: 'content-document-structure',
        category: 'content',
        status: 'pass',
        severity: 'info',
        title: 'Complete Document Structure',
        message: 'Document structure is complete with <html>, <head>, and <body> elements.',
        value: { hasHtmlTag: true, hasHeadTag: true, hasBodyTag: true },
        recommendation: 'Maintain standard structural markup.',
      },
      {
        id: 'content-duplicate-ids',
        category: 'content',
        status: 'warn',
        severity: 'medium',
        title: 'Duplicate Element IDs Detected',
        message: 'Detected 1 duplicate element ID(s) in document markup.',
        value: { totalDuplicates: 1, duplicateIds: ['header'], hasMoreDuplicates: false },
        recommendation: 'Ensure each id attribute value is unique.',
      },
      {
        id: 'content-link-classification',
        category: 'content',
        status: 'info',
        severity: 'info',
        title: 'Link Structure & Classification',
        message: 'Document contains 5 total link(s) (3 internal, 2 external, 0 anchor, 0 mailto, 0 tel).',
        value: { totalLinks: 5, internalLinks: 3, externalLinks: 2, anchorLinks: 0, mailtoLinks: 0, telLinks: 0 },
        recommendation: 'Ensure link targets are descriptive.',
      },
    ],
  };

  it('renders card title, subtitle, summary badges, and all findings by default', () => {
    render(<ContentQualityCard contentData={mockContentData} />);

    expect(screen.getByText('Passive Content & Technical HTML Quality Analysis')).toBeInTheDocument();
    expect(screen.getByText('Sufficient Text Content Volume')).toBeInTheDocument();
    expect(screen.getByText('Complete Document Structure')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Element IDs Detected')).toBeInTheDocument();
    expect(screen.getByText('Link Structure & Classification')).toBeInTheDocument();
  });

  it('filters findings when filter tabs are clicked', () => {
    render(<ContentQualityCard contentData={mockContentData} />);

    // Click Pass filter tab
    const passBtn = screen.getByRole('button', { name: /pass \(2\)/i });
    fireEvent.click(passBtn);

    expect(screen.getByText('Sufficient Text Content Volume')).toBeInTheDocument();
    expect(screen.getByText('Complete Document Structure')).toBeInTheDocument();
    expect(screen.queryByText('Duplicate Element IDs Detected')).not.toBeInTheDocument();

    // Click Warn filter tab
    const warnBtn = screen.getByRole('button', { name: /warn \(1\)/i });
    fireEvent.click(warnBtn);

    expect(screen.getByText('Duplicate Element IDs Detected')).toBeInTheDocument();
    expect(screen.queryByText('Sufficient Text Content Volume')).not.toBeInTheDocument();
  });

  it('returns null when contentData is null or undefined', () => {
    const { container } = render(<ContentQualityCard contentData={null} />);
    expect(container.firstChild).toBeNull();
  });
});
