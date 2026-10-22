import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PipelinesTabSkeleton } from '@/components/Loading/PipelinesTabSkeleton.tsx';

describe('PipelinesTabSkeleton', () => {
  it('renders an accessible pipelines loading placeholder', () => {
    render(<PipelinesTabSkeleton />);

    expect(
      screen.getByRole('status', { name: 'Carregando pipelines' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Carregando pipelines...')).toBeInTheDocument();
  });

  it('renders in dark theme', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    render(<PipelinesTabSkeleton />);

    expect(
      screen.getByRole('status', { name: 'Carregando pipelines' }),
    ).toBeInTheDocument();

    document.documentElement.removeAttribute('data-theme');
  });
});
