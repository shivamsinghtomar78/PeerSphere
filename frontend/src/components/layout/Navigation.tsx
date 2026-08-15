'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GlassIconButton } from '@/components/ui/GlassButton';
import { ThemeSwitcher } from './ThemeSwitcher';

// ─── Student Navigation Items ─────────────────────────────────────
const studentNavItems = [
  { label: 'Dashboard',      href: '/student',                 iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { label: 'Jobs',           href: '/student/jobs',            iconPath: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
  { label: 'Applications',   href: '/student/applications',    iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  { label: 'Match Analysis', href: '/student/match',           iconPath: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' },
  { label: 'Skill Gaps',     href: '/student/skill-gaps',      iconPath: 'M2 20h.01M7 20v-4m5 4v-8m5 4v-2m5 4' },
  { label: 'Roadmap',        href: '/student/recommendations', iconPath: 'M12 22V12M12 12l-4-4m4 4 4-4M3 6l9-4 9 4v6H3z' },
  { label: 'Profile',        href: '/student/profile',         iconPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
];

// ─── Placement Officer Navigation Items ────────────────────────────
const placementNavItems = [
  { label: 'Dashboard',  href: '/placement',             iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { label: 'Students',   href: '/placement/students',    iconPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { label: 'Jobs',       href: '/placement/jobs',        iconPath: 'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' },
  { label: 'Applications', href: '/placement/applications', iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  { label: 'Candidates', href: '/placement/candidates',  iconPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { label: 'Analytics',  href: '/placement/analytics',   iconPath: 'M18 20V10M12 20V4M6 20v-6' },
  { label: 'Reports',    href: '/placement/reports',     iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
];

// ─── NavIcon ─────────────────────────────────────────────────────
function NavIcon({ path }: { path: string }) {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────
interface SidebarProps {
  role: 'student' | 'placement';
  collapsed?: boolean;
  onCollapse?: () => void;
}

export function Sidebar({ role, collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'student' ? studentNavItems : placementNavItems;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-full glass-nav transition-all duration-normal',
        'border-r border-border-subtle',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ zIndex: 'var(--ps-z-sidebar)' }}
      aria-label={`${role === 'student' ? 'Student' : 'Placement'} navigation`}
    >
      {/* Logo / Brand */}
      <div className={cn('flex items-center gap-3 px-4 h-14 border-b border-border-subtle shrink-0', collapsed && 'justify-center px-0')}>
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-text-inverse font-bold text-sm shrink-0">
          P
        </div>
        {!collapsed && (
          <span className="font-semibold text-text tracking-tight">PeerSphere</span>
        )}
      </div>

      {/* Role label */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="text-caption text-text-faint uppercase tracking-wider font-medium">
            {role === 'student' ? 'Student' : 'Placement Office'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul role="list" className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md',
                    'text-sm font-medium transition-base',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-focus)]',
                    isActive
                      ? 'bg-accent-light text-accent glass-nav-highlight'
                      : 'text-text-muted hover:text-text hover:bg-surface-raised',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <NavIcon path={item.iconPath} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border-subtle flex items-center gap-2 shrink-0">
        <ThemeSwitcher compact />
        {!collapsed && onCollapse && (
          <GlassIconButton
            label="Collapse sidebar"
            variant="ghost"
            size="sm"
            onClick={onCollapse}
            className="ml-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            </svg>
          </GlassIconButton>
        )}
        {collapsed && onCollapse && (
          <GlassIconButton
            label="Expand sidebar"
            variant="ghost"
            size="sm"
            onClick={onCollapse}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
            </svg>
          </GlassIconButton>
        )}
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────
interface HeaderProps {
  role: 'student' | 'placement';
  title?: string;
  onMenuOpen?: () => void;
}

export function Header({ role, title, onMenuOpen }: HeaderProps) {
  return (
    <header
      className="glass-nav border-b border-border-subtle h-14 px-4 flex items-center gap-4 shrink-0"
      style={{ zIndex: 'var(--ps-z-header)' }}
    >
      {/* Mobile menu toggle */}
      <GlassIconButton
        label="Open navigation menu"
        variant="ghost"
        size="sm"
        onClick={onMenuOpen}
        className="lg:hidden"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </GlassIconButton>

      {/* Logo (mobile only) */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-text-inverse font-bold text-xs">
          P
        </div>
        <span className="font-semibold text-text text-sm">PeerSphere</span>
      </div>

      {/* Page title */}
      {title && (
        <h1 className="hidden lg:block text-title text-text truncate">
          {title}
        </h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ThemeSwitcher compact />
        {/* Role switcher (mock only — for demo) */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-sm bg-surface-raised border border-border-subtle">
          <span className="text-xs text-text-muted">
            {role === 'student' ? 'Student View' : 'Placement View'}
          </span>
        </div>
      </div>
    </header>
  );
}

// ─── Mobile Bottom Navigation ────────────────────────────────────
const studentBottomItems = studentNavItems.slice(0, 5);
const placementBottomItems = placementNavItems.slice(0, 5);

export function BottomNav({ role }: { role: 'student' | 'placement' }) {
  const pathname = usePathname();
  const items = role === 'student' ? studentBottomItems : placementBottomItems;

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 glass-nav border-t border-border-subtle"
      style={{ zIndex: 'var(--ps-z-header)', height: 'var(--ps-bottom-nav-height)' }}
      aria-label="Primary navigation"
    >
      <ul role="list" className="flex h-full">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center h-full gap-1',
                  'text-xs font-medium transition-base',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ps-focus)]',
                  isActive ? 'text-accent' : 'text-text-muted',
                  // Minimum 44px touch target
                  'min-h-[44px]'
                )}
              >
                <NavIcon path={item.iconPath} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── Mobile Sidebar Drawer ─────────────────────────────────────────
interface MobileDrawerProps {
  role: 'student' | 'placement';
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ role, open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const navItems = role === 'student' ? studentNavItems : placementNavItems;

  if (!open) return null;

  return (
    <div className="fixed inset-0 lg:hidden" style={{ zIndex: 'var(--ps-z-overlay)' }}>
      {/* Scrim */}
      <div className="absolute inset-0 bg-scrim" onClick={onClose} aria-hidden="true" />
      {/* Drawer */}
      <div className="absolute inset-y-0 left-0 w-72 glass-overlay border-r border-border-subtle flex flex-col">
        <div className="flex items-center justify-between px-4 h-14 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-text-inverse font-bold text-sm">P</div>
            <span className="font-semibold text-text">PeerSphere</span>
          </div>
          <GlassIconButton label="Close navigation" variant="ghost" size="sm" onClick={onClose}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </GlassIconButton>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          <ul role="list" className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-base',
                      isActive ? 'bg-accent-light text-accent' : 'text-text-muted hover:text-text hover:bg-surface-raised'
                    )}
                  >
                    <NavIcon path={item.iconPath} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
