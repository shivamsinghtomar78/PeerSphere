'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar, Header, BottomNav, MobileDrawer } from './Navigation';

interface AppShellProps {
  role: 'student' | 'placement';
  title?: string;
  children: React.ReactNode;
}

/**
 * AppShell — the main application layout wrapper.
 *
 * Desktop: Glass sidebar (left) + header + main content area
 * Mobile:  Glass header + main content + glass bottom nav
 */
export function AppShell({ role, title, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {/* Desktop Sidebar */}
      <Sidebar
        role={role}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(c => !c)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        role={role}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Right side: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          role={role}
          title={title}
          onMenuOpen={() => setMobileOpen(true)}
        />

        {/* Main content */}
        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 overflow-y-auto',
            'pb-[var(--ps-bottom-nav-height)] lg:pb-0',
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav role={role} />
    </div>
  );
}
