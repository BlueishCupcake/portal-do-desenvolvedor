import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MetricCard } from '@/components/Metrics/MetricCard.tsx';

describe('MetricCard', () => {
  it('renders the KPI and toggles selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <MetricCard
        kpi={{
          id: 'active',
          label: 'Ativos',
          value: 4,
          definition: 'Work items ativos',
          kind: 'current',
        }}
        selected
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole('button', { name: /Ativos: 4/ });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Atual')).toBeInTheDocument();

    await user.click(button);
    expect(onSelect).toHaveBeenCalledWith('active');
  });

  it('labels period-based KPIs as period counts', () => {
    render(
      <MetricCard
        kpi={{
          id: 'completed',
          label: 'Concluídos no período',
          value: 2,
          definition: 'Concluídos no intervalo',
          kind: 'period',
        }}
      />,
    );

    expect(screen.getByText('Período')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contagem do período/ })).toBeInTheDocument();
  });
});
