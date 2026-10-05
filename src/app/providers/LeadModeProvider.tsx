import { type ReactNode, useCallback, useLayoutEffect, useMemo, useState } from 'react';

import {
  LEAD_MODE_STORAGE_KEY,
  LeadModeContext,
} from '@/app/providers/leadModeContext.ts';

interface LeadModeProviderProps {
  children: ReactNode;
}

function readStoredLeadMode(): boolean {
  try {
    return window.localStorage.getItem(LEAD_MODE_STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function LeadModeProvider({ children }: LeadModeProviderProps) {
  const [leadMode, setLeadMode] = useState(readStoredLeadMode);

  useLayoutEffect(() => {
    window.localStorage.setItem(LEAD_MODE_STORAGE_KEY, leadMode ? 'on' : 'off');
  }, [leadMode]);

  const toggleLeadMode = useCallback(() => {
    setLeadMode((current) => !current);
  }, []);

  const value = useMemo(
    () => ({
      leadMode,
      toggleLeadMode,
    }),
    [leadMode, toggleLeadMode],
  );

  return (
    <LeadModeContext.Provider value={value}>{children}</LeadModeContext.Provider>
  );
}
