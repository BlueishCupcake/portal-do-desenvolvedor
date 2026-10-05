import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BoardStatus } from '@/components/Board/BoardStatus.tsx';

describe('BoardStatus', () => {
  it('renders the real board column label', () => {
    render(<BoardStatus column="Ag. QA" />);

    expect(screen.getByText('Ag. QA')).toBeInTheDocument();
  });

  it('exposes a status token for visual treatment', () => {
    const { container } = render(<BoardStatus column="Blocked" />);
    const status = container.querySelector('[data-status="blocked"]');

    expect(status).not.toBeNull();
  });
});
