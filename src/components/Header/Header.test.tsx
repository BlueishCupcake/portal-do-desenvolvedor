import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LeadModeProvider } from '@/app/providers/LeadModeProvider.tsx';
import { ThemeProvider } from '@/app/providers/ThemeProvider.tsx';
import { WorkspaceViewProvider } from '@/app/providers/WorkspaceViewProvider.tsx';
import { Header } from '@/components/Header/Header.tsx';

function renderHeader(user?: { id: string; displayName: string }) {
  return render(
    <ThemeProvider>
      <LeadModeProvider>
        <WorkspaceViewProvider>
          <Header user={user} />
        </WorkspaceViewProvider>
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

    const tasksTab = screen.getByRole('tab', { name: 'Tasks' });
    const todosTab = screen.getByRole('tab', { name: "To Do's" });
    const pipelinesTab = screen.getByRole('tab', { name: 'Pipelines' });
    const leadMode = screen.getByRole('button', { name: 'Ativar Lead Mode' });
    expect(tasksTab.compareDocumentPosition(leadMode)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(todosTab.compareDocumentPosition(leadMode)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(pipelinesTab.compareDocumentPosition(leadMode)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(leadMode.compareDocumentPosition(screen.getByRole('button', { name: 'Ativar modo escuro' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    await user.click(leadMode);

    expect(screen.getByRole('button', { name: 'Desativar Lead Mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('switches between workspace tabs', async () => {
    const user = userEvent.setup();
    renderHeader();

    expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: "To Do's" }));

    expect(screen.getByRole('tab', { name: "To Do's" })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute('aria-selected', 'false');

    await user.click(screen.getByRole('tab', { name: 'Pipelines' }));

    expect(screen.getByRole('tab', { name: 'Pipelines' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
