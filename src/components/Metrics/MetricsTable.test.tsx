import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MetricsTable } from '@/components/Metrics/MetricsTable.tsx';

describe('MetricsTable', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<MetricsTable items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders work item rows with Azure links and a fallback date', () => {
    render(
      <MetricsTable
        items={[
          {
            id: 88,
            title: 'Tarefa',
            type: 'Task',
            state: 'Active',
            assignedTo: 'Sophie',
            updatedAt: '2026-10-04',
            url: 'https://dev.azure.com/item/88',
          },
          {
            id: 89,
            title: 'Sem data',
            type: 'Bug',
            state: 'New',
            assignedTo: 'Não atribuído',
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: '88' })).toHaveAttribute(
      'href',
      'https://dev.azure.com/item/88',
    );
    expect(screen.getByText('Tarefa')).toBeInTheDocument();
    expect(screen.getByText('04/10/2026')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
