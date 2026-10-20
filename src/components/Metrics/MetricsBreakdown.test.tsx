import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MetricsBreakdown } from '@/components/Metrics/MetricsBreakdown.tsx';

describe('MetricsBreakdown', () => {
  it('renders an accessible count summary', () => {
    render(
      <MetricsBreakdown
        title="Por tipo"
        items={[
          { label: 'Task', count: 3 },
          { label: 'Bug', count: 1 },
        ]}
      />,
    );

    expect(screen.getByLabelText('Por tipo')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('3 (75%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Task: 3 de 4')).toHaveAttribute('aria-valuenow', '3');
  });

  it('shows an empty message without fabricating bars', () => {
    render(<MetricsBreakdown title="Por estado" items={[]} />);

    expect(screen.getByText('Sem dados para este recorte.')).toBeInTheDocument();
  });
});
