'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  badge?: number;
  disabled?: boolean;
}

interface GlassTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'default' | 'glass';
  className?: string;
}

/**
 * GlassTabs — accessible tab navigation.
 * variant='glass' for control chrome, 'default' for content tabs.
 */
export function GlassTabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  className,
}: GlassTabsProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    const active = tabs.filter(t => !t.disabled);
    const currentIdx = active.findIndex(t => t.id === activeTab);
    if (e.key === 'ArrowRight') {
      const next = active[(currentIdx + 1) % active.length];
      onChange(next.id);
    } else if (e.key === 'ArrowLeft') {
      const prev = active[(currentIdx - 1 + active.length) % active.length];
      onChange(prev.id);
    } else if (e.key === 'Home') {
      onChange(active[0].id);
    } else if (e.key === 'End') {
      onChange(active[active.length - 1].id);
    }
    void idx;
  }

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        'flex items-center gap-1 p-1 rounded-md',
        variant === 'glass'
          ? 'glass-ctrl'
          : 'bg-surface-raised border border-border-subtle',
        className
      )}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5',
              'text-sm font-medium rounded-sm',
              'transition-base cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]',
              isActive
                ? 'bg-surface text-accent shadow-sm border border-border-subtle'
                : 'text-text-muted hover:text-text',
              tab.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
            )}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center',
                  'min-w-[1.25rem] h-5 px-1',
                  'text-xs font-semibold rounded-pill',
                  isActive ? 'bg-accent text-text-inverse' : 'bg-surface-raised text-text-muted'
                )}
                aria-label={`${tab.badge} items`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
