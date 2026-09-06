'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type GlassCardVariant = 'surface' | 'surface-raised' | 'canvas';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  radius?: 'md' | 'lg' | 'xl';
}

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const radiusMap = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};

/**
 * GlassCard — opaque content surface (NOT glass).
 * Use for data cards, stat cards, job cards.
 * Glass variants are only for nav/controls/overlays.
 */
export function GlassCard({
  children,
  variant = 'surface',
  padding = 'md',
  radius = 'lg',
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'transition-base',
        variant === 'surface' && 'surface',
        variant === 'surface-raised' && 'surface-raised',
        variant === 'canvas' && 'bg-canvas border border-border-subtle',
        paddingMap[padding],
        radiusMap[radius],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
