import { useContext } from 'react';

import { ThemeContext, type ThemeContextValue } from '@/app/providers/themeContext.ts';

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  }

  return value;
}
