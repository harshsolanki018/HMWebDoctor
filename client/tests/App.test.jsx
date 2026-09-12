import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import * as api from '../src/services/api';

vi.mock('../src/services/api');

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
    </MemoryRouter>
  );
};

describe('App Component Root Router', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders home page by default at route "/"', () => {
    renderWithRouter('/');
    const headings = screen.getAllByRole('heading', { name: /Diagnose your website/i });
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders design system showcase when navigating to "/design-system"', async () => {
    api.fetchHealth.mockResolvedValue({
      success: true,
      data: {
        status: 'healthy',
        services: {
          api: 'healthy',
          database: 'healthy',
        },
      },
      error: null,
    });

    renderWithRouter('/design-system');

    expect(
      screen.getByText(/HMWebDoctor Design System & Component Showcase/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Overall Health:/i)).toBeInTheDocument();
      const healthyElements = screen.getAllByText('healthy');
      expect(healthyElements.length).toBeGreaterThan(0);
    });
  });

  it('renders error alert on design system showcase when API call fails', async () => {
    api.fetchHealth.mockResolvedValue({
      success: false,
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Backend Unreachable',
      },
    });

    renderWithRouter('/design-system');

    await waitFor(() => {
      const errorElements = screen.getAllByText(/Backend Unreachable/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });
});
