import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { TodosBoard } from '@/components/Todos/TodosBoard.tsx';
import { TODOS_STORAGE_KEY } from '@/utils/todosStorage.ts';

describe('TodosBoard', () => {
  it('creates, edits and deletes a post-it persisted in localStorage', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<TodosBoard />);

    expect(screen.getByText('Nenhum post-it ainda')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Novo post-it' }));
    await user.type(screen.getByLabelText('Texto do post-it 1'), 'Preparar a demo');

    expect(screen.getByDisplayValue('Preparar a demo')).toBeInTheDocument();
    expect(window.localStorage.getItem(TODOS_STORAGE_KEY)).toContain('Preparar a demo');

    unmount();
    render(<TodosBoard />);

    expect(screen.getByDisplayValue('Preparar a demo')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Excluir post-it Preparar a demo' }));

    expect(screen.queryByDisplayValue('Preparar a demo')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum post-it ainda')).toBeInTheDocument();
  });
});
