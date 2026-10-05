import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/EmptyState/EmptyState.tsx';

describe('EmptyState', () => {
  it('renders the sprint empty state', () => {
    render(
      <EmptyState
        title="Nenhuma tarefa encontrada"
        message="Você não possui tarefas atribuídas na Sprint atual."
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhuma tarefa encontrada',
    );
  });

  it('renders the filtered empty state', () => {
    render(
      <EmptyState
        title="Nenhum resultado encontrado"
        message="Tente alterar ou remover os filtros."
        filtered
      />,
    );

    expect(screen.getByText('Nenhum resultado encontrado')).toBeInTheDocument();
  });
});
