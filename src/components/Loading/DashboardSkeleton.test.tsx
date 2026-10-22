import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardSkeleton } from '@/components/Loading/DashboardSkeleton.tsx';

describe('DashboardSkeleton', () => {
  it('renders a contextual loading state', () => {
    render(<DashboardSkeleton />);

    expect(
      screen.getByRole('status', { name: 'Carregando tarefas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Carregando tarefas...')).toBeInTheDocument();
    expect(document.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });

  it('renders a compact variant', () => {
    render(<DashboardSkeleton compact />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders in dark theme', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<DashboardSkeleton />);

    expect(
      screen.getByRole('status', { name: 'Carregando tarefas' }),
    ).toBeInTheDocument();

    document.documentElement.removeAttribute('data-theme');
  });
});
