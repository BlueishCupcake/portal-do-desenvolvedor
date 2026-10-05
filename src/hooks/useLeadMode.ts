import { useContext } from 'react';

import {
  LeadModeContext,
  type LeadModeContextValue,
} from '@/app/providers/leadModeContext.ts';

export function useLeadMode(): LeadModeContextValue {
  const value = useContext(LeadModeContext);

  if (!value) {
    throw new Error('useLeadMode deve ser usado dentro de LeadModeProvider.');
  }

  return value;
}
