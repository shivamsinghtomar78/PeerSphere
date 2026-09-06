'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Theme } from '@/types';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(t: Theme): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const isDark =
    t === 'dark' ||
    (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return isDark ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem('ps-theme') as Theme) || 'system';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initialTheme = getStoredTheme();
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const themeRef = useRef(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(initialTheme)
  );

  // Apply theme attribute on mount and subscribe to system preference changes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (themeRef.current === 'system') {
        const next = resolveTheme('system');
        root.setAttribute('data-theme', next);
        setResolvedTheme(next);
      }
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTheme(t: Theme) {
    themeRef.current = t;
    setThemeState(t);
    localStorage.setItem('ps-theme', t);
    const next = resolveTheme(t);
    document.documentElement.setAttribute('data-theme', next);
    setResolvedTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}