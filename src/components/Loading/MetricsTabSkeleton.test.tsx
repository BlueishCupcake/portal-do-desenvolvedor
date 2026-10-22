import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MetricsTabSkeleton } from '@/components/Loading/MetricsTabSkeleton.tsx';

describe('MetricsTabSkeleton', () => {
  it('renders an accessible metrics loading placeholder', () => {
    render(<MetricsTabSkeleton />);

    expect(
      screen.getByRole('status', { name: 'Carregando métricas' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Carregando métricas...')).toBeInTheDocument();
  });

  it('renders in dark theme', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<MetricsTabSkeleton />);

    expect(
      screen.getByRole('status', { name: 'Carregando métricas' }),
    ).toBeInTheDocument();

    document.documentElement.removeAttribute('data-theme');
  });
});
