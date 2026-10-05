import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { THEME_STORAGE_KEY } from '@/app/providers/themeContext.ts';
import { ThemeProvider } from '@/app/providers/ThemeProvider.tsx';
import { useTheme } from '@/hooks/useTheme.ts';

function Probe() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  );
}

describe('ThemeProvider', () => {
  it('toggles and persists the selected theme', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('light');
    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  });

  it('restores the stored dark theme', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('throws when the hook is used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(
      'useTheme deve ser usado dentro de ThemeProvider.',
    );
  });
});
