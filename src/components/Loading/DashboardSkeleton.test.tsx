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
  });

  it('renders a compact variant', () => {
    render(<DashboardSkeleton compact />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
