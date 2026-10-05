import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LeadModeProvider } from '@/app/providers/LeadModeProvider.tsx';
import { ThemeProvider } from '@/app/providers/ThemeProvider.tsx';
import { Header } from '@/components/Header/Header.tsx';

function renderHeader(user?: { id: string; displayName: string }) {
  return render(
    <ThemeProvider>
      <LeadModeProvider>
        <Header user={user} />
      </LeadModeProvider>
    </ThemeProvider>,
  );
}

describe('Header', () => {
  it('renders the portal title', () => {
    renderHeader();

    expect(
      screen.getByRole('heading', { name: 'Portal do Desenvolvedor' }),
    ).toBeInTheDocument();
  });

  it('renders the current user when provided', () => {
    renderHeader({
      id: 'sophie',
      displayName: 'Sophie Quines',
    });

    expect(screen.getByLabelText(/sophie quines/i)).toBeInTheDocument();
  });

  it('renders a loading fallback without a user', () => {
    renderHeader();

    expect(screen.getByText('Carregando usuário...')).toBeInTheDocument();
  });

  it('toggles the dark theme beside the user name', async () => {
    const user = userEvent.setup();
    renderHeader({
      id: 'sophie',
      displayName: 'Sophie Quines',
    });

    await user.click(screen.getByRole('button', { name: 'Ativar modo escuro' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button', { name: 'Ativar modo claro' })).toBeInTheDocument();
  });

  it('toggles lead mode beside the theme button', async () => {
    const user = userEvent.setup();
    renderHeader({
      id: 'sophie',
      displayName: 'Sophie Quines',
    });

    const leadMode = screen.getByRole('button', { name: 'Ativar Lead Mode' });
    expect(leadMode.compareDocumentPosition(screen.getByRole('button', { name: 'Ativar modo escuro' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    await user.click(leadMode);

    expect(screen.getByRole('button', { name: 'Desativar Lead Mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
