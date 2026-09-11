'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Theme } from '@/types';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  /**
   * False during SSR and the hydration render, true afterwards. `theme` and
   * `resolvedTheme` come from localStorage, which the server cannot see — any
   * consumer that renders markup derived from them MUST fall back to the
   * server defaults ('system' / 'light') until this is true, or the markup
   * will hydrate-mismatch.
   */
  hydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// A subscribe that never fires: the snapshot flips from false (server) to
// true (client) exactly once, at hydration — no state, no extra render pass.
const emptySubscribe = () => () => {};
const useHydrated = () =>
  React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

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
  // Lazy initializers: read localStorage once, not on every provider render
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const themeRef = useRef<Theme | null>(null);
  if (themeRef.current === null) themeRef.current = theme;
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(getStoredTheme())
  );
  const hydrated = useHydrated();

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
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}