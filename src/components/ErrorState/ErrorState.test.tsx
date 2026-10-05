import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from '@/components/ErrorState/ErrorState.tsx';

describe('ErrorState', () => {
  it('renders the error message and retries', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ErrorState
        title="Não foi possível carregar sua Sprint"
        message="Verifique a conexão com o Azure DevOps e tente novamente."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar sua Sprint',
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
