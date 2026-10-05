import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LEAD_MODE_STORAGE_KEY } from '@/app/providers/leadModeContext.ts';
import { LeadModeProvider } from '@/app/providers/LeadModeProvider.tsx';
import { useLeadMode } from '@/hooks/useLeadMode.ts';

function Probe() {
  const { leadMode, toggleLeadMode } = useLeadMode();

  return (
    <button type="button" onClick={toggleLeadMode}>
      {leadMode ? 'on' : 'off'}
    </button>
  );
}

describe('LeadModeProvider', () => {
  it('toggles and persists lead mode', async () => {
    const user = userEvent.setup();

    render(
      <LeadModeProvider>
        <Probe />
      </LeadModeProvider>,
    );

    expect(screen.getByRole('button')).toHaveTextContent('off');
    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('button')).toHaveTextContent('on');
    expect(window.localStorage.getItem(LEAD_MODE_STORAGE_KEY)).toBe('on');
  });

  it('throws when the hook is used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(
      'useLeadMode deve ser usado dentro de LeadModeProvider.',
    );
  });
});
