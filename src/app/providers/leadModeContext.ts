import { createContext } from 'react';

export interface LeadModeContextValue {
  leadMode: boolean;
  toggleLeadMode: () => void;
}

export const LEAD_MODE_STORAGE_KEY = 'portal-lead-mode';

export const LeadModeContext = createContext<LeadModeContextValue | null>(null);
