import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PerformanceCard } from '../src/components/sections/PerformanceCard';

describe('PerformanceCard Component Suite (M5)', () => {
  const mockPerformanceData = {
    status: 'completed',
    summary: { pass: 1, warn: 1, fail: 1, info: 1 },
    findings: [
      {
        id: 'perf-blocking-scripts',
        category: 'performance',
        status: 'warn',
        severity: 'medium',
        title: 'Render-Blocking Head Scripts',
        message: 'Found 1 synchronous script in head.',
        value: { totalScripts: 2, headSynchronousScripts: 1 },
        recommendation: 'Add async or defer to head scripts.',
      },
      {
        id: 'perf-stylesheets-css',
        category: 'performance',
        status: 'pass',
        severity: 'info',
        title: 'Stylesheets & Inline CSS',
        message: 'Found 1 external stylesheet.',
        value: { externalStylesheetCount: 1 },
        recommendation: 'Maintain external stylesheets.',
      },
      {
        id: 'perf-resource-hints',
        category: 'performance',
        status: 'info',
        severity: 'info',
        title: 'Browser Resource Hints',
        message: 'No resource hints declared.',
        value: { preconnectCount: 0 },
        recommendation: 'Add preconnect hints.',
      },
      {
        id: 'category-error',
        category: 'performance',
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
    render(<PerformanceCard performanceData={mockPerformanceData} />);

    expect(screen.getByText('Passive Resource & Performance Optimization')).toBeInTheDocument();
    expect(screen.getByText('Render-Blocking Head Scripts')).toBeInTheDocument();
    expect(screen.getByText('Stylesheets & Inline CSS')).toBeInTheDocument();
    expect(screen.getByText('Browser Resource Hints')).toBeInTheDocument();
    expect(screen.getByText('Analysis Error')).toBeInTheDocument();
  });

  it('filters findings when filter tabs (All, Pass, Warn, Fail, Info) are clicked', () => {
    render(<PerformanceCard performanceData={mockPerformanceData} />);

    // Click Pass filter tab
    const passBtn = screen.getByRole('button', { name: /pass \(1\)/i });
    fireEvent.click(passBtn);

    expect(screen.getByText('Stylesheets & Inline CSS')).toBeInTheDocument();
    expect(screen.queryByText('Render-Blocking Head Scripts')).not.toBeInTheDocument();

    // Click Warn filter tab
    const warnBtn = screen.getByRole('button', { name: /warn \(1\)/i });
    fireEvent.click(warnBtn);

    expect(screen.getByText('Render-Blocking Head Scripts')).toBeInTheDocument();
    expect(screen.queryByText('Stylesheets & Inline CSS')).not.toBeInTheDocument();

    // Click Fail filter tab
    const failBtn = screen.getByRole('button', { name: /fail \(1\)/i });
    fireEvent.click(failBtn);

    expect(screen.getByText('Analysis Error')).toBeInTheDocument();
    expect(screen.queryByText('Render-Blocking Head Scripts')).not.toBeInTheDocument();

    // Click Info filter tab
    const infoBtn = screen.getByRole('button', { name: /info \(1\)/i });
    fireEvent.click(infoBtn);

    expect(screen.getByText('Browser Resource Hints')).toBeInTheDocument();

    // Click All filter tab
    const allBtn = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allBtn);

    expect(screen.getByText('Render-Blocking Head Scripts')).toBeInTheDocument();
    expect(screen.getByText('Analysis Error')).toBeInTheDocument();
  });

  it('renders empty state message when no findings match selected filter tab', () => {
    const dataNoWarn = {
      status: 'completed',
      summary: { pass: 1, warn: 0, fail: 0, info: 0 },
      findings: [
        {
          id: 'perf-stylesheets-css',
          category: 'performance',
          status: 'pass',
          severity: 'info',
          title: 'Stylesheets & Inline CSS',
          message: 'Found 1 external stylesheet.',
          value: null,
          recommendation: 'Maintain external stylesheets.',
        },
      ],
    };

    render(<PerformanceCard performanceData={dataNoWarn} />);

    const warnBtn = screen.getByRole('button', { name: /warn \(0\)/i });
    fireEvent.click(warnBtn);

    expect(screen.getByText(/No performance findings match the selected filter/i)).toBeInTheDocument();
  });
});
