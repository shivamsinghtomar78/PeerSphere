'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';
import { GlassIconButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';
import type { Theme } from '@/types';

interface ThemeSwitcherProps {
  compact?: boolean;
}

const themes: { value: Theme; label: string; iconPath: string }[] = [
  { value: 'light',  label: 'Light mode',  iconPath: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z' },
  { value: 'dark',   label: 'Dark mode',   iconPath: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
  { value: 'system', label: 'System mode', iconPath: 'M2 13.5V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.5M2 13.5l10-9 10 9M2 13.5V8L12 1l10 7v5.5' },
];

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme: storedTheme, setTheme } = useTheme();

  // The stored theme comes from localStorage, which the server can't see —
  // render the server default until mounted to avoid a hydration mismatch.
  // useSyncExternalStore (rather than a mount-flag state + effect) gives that
  // signal without calling setState from inside an effect body.
  const mounted = React.useSyncExternalStore(
    () => () => {}, // value never changes after the initial client render
    () => true, // client snapshot
    () => false // server snapshot
  );
  const theme: Theme = mounted ? storedTheme : 'system';

  if (compact) {
    // Cycle through themes on click
    function cycleTheme() {
      const order: Theme[] = ['light', 'dark', 'system'];
      const next = order[(order.indexOf(theme) + 1) % order.length];
      setTheme(next);
    }
    const current = themes.find(t => t.value === theme)!;
    return (
      <GlassIconButton
        label={`Current: ${current.label}. Click to switch theme.`}
        variant="ghost"
        size="sm"
        onClick={cycleTheme}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={current.iconPath} />
        </svg>
      </GlassIconButton>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-md bg-surface-raised border border-border-subtle" role="group" aria-label="Theme switcher">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          aria-pressed={theme === t.value}
          aria-label={t.label}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-sm text-sm transition-base cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]',
            theme === t.value
              ? 'bg-surface text-accent shadow-sm'
              : 'text-text-muted hover:text-text'
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={t.iconPath} />
          </svg>
        </button>
      ))}
    </div>
  );
}
