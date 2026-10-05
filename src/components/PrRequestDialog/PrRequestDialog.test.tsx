import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PrRequestDialog } from '@/components/PrRequestDialog/PrRequestDialog.tsx';
import { createWorkItem } from '@/test/factories/workItem.ts';

describe('PrRequestDialog', () => {
  it('lists selected tasks with links and copies the message', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <PrRequestDialog
        open
        workItems={[
          createWorkItem({
            id: 10,
            title: 'Ajustar retorno da API',
            assignedTo: 'Sophie Quines',
            url: 'https://dev.azure.com/item/10',
          }),
        ]}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('link', { name: '#10 — Ajustar retorno da API' }),
    ).toHaveAttribute('href', 'https://dev.azure.com/item/10');
    expect(screen.getByText('Responsável: Sophie Quines')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copiar mensagem' }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('criação das pull requests de release'),
    );
    expect(await screen.findByRole('button', { name: 'Mensagem copiada' })).toBeInTheDocument();
  });
});
