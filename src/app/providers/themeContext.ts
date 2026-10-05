import { createContext } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const THEME_STORAGE_KEY = 'portal-theme';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
