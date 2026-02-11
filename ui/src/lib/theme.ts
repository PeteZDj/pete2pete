import { useState, useEffect, useCallback } from 'react';
import { type ThemeMode, loadTheme, saveTheme, applyTheme } from './storage.ts';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(loadTheme);

  useEffect(() => {
    applyTheme(theme);

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    saveTheme(mode);
    setThemeState(mode);
  }, []);

  const cycle = useCallback(() => {
    const next: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    setTheme(next[theme]);
  }, [theme, setTheme]);

  return { theme, setTheme, cycle };
}
