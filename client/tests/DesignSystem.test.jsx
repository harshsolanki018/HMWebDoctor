import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../src/App';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { Badge } from '../src/components/ui/Badge';
import { Alert } from '../src/components/ui/Alert';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { ThemeToggle } from '../src/components/navigation/ThemeToggle';

vi.mock('../src/services/api', () => ({
  fetchHealth: vi.fn().mockResolvedValue({
    success: true,
    data: {
      status: 'healthy',
      services: { api: 'healthy', database: 'healthy' },
    },
    error: null,
  }),
}));

describe('Milestone 1 — Design System & Components', () => {
  it('renders AppShell, Header, Footer, and DesignShowcase title', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/design-system']}>
          <AppRoutes />
        </MemoryRouter>
      );
    });
    expect(screen.getAllByText(/HMWebDoctor/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Design System & Component Showcase/i)).toBeInTheDocument();
    expect(screen.getByText(/Part of the HM Product Family/i)).toBeInTheDocument();
  });

  it('renders ThemeToggle and opens dropdown menu on click', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );
    });
    const toggleBtn = screen.getByLabelText(/Toggle theme mode/i);
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('renders Button component with variants and handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Test Action</Button>);

    const btn = screen.getByRole('button', { name: /Test Action/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Input component with label and error state', () => {
    render(<Input label="Website Domain" error="Invalid Domain" />);
    expect(screen.getByText(/Website Domain/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid Domain/i)).toBeInTheDocument();
  });

  it('renders Badge component with correct variant text', () => {
    render(<Badge variant="pass">PASS: 100</Badge>);
    expect(screen.getByText('PASS: 100')).toBeInTheDocument();
  });

  it('renders Alert component with title and message', () => {
    render(
      <Alert variant="success" title="Scan Finished">
        All checks passed.
      </Alert>
    );
    expect(screen.getByText('Scan Finished')).toBeInTheDocument();
    expect(screen.getByText('All checks passed.')).toBeInTheDocument();
  });
});
