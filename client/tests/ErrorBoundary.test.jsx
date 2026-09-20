import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from '../src/components/common/ErrorBoundary';

const ProblemChild = () => {
  throw new Error('Test Component Error');
};

describe('ErrorBoundary & Client Reliability Suite', () => {
  it('1. renders children normally when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('2. catches component rendering errors and renders accessible error fallback UI without raw stack traces', () => {
    // Suppress console.error output from React during intentional error boundary testing
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected application rendering error occurred. You can reload the page or return home to continue.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Application/i })).toBeInTheDocument();

    // Verify raw error string / stack is NOT leaked to user UI
    expect(screen.queryByText('Test Component Error')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('3. triggers onReset callback or reloads application when Reload button is clicked', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resetSpy = vi.fn();

    render(
      <ErrorBoundary onReset={resetSpy}>
        <ProblemChild />
      </ErrorBoundary>
    );

    const reloadBtn = screen.getByRole('button', { name: /Reload Application/i });
    fireEvent.click(reloadBtn);

    expect(resetSpy).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });
});
