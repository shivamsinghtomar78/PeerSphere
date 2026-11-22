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
    <div className="ps-app-shell flex h-dvh overflow-hidden bg-canvas">
      <a className="ps-skip-link" href="#main-content">Skip to workspace</a>
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
            'ps-app-main flex-1 overflow-y-auto',
            'pb-[calc(var(--ps-bottom-nav-height)+env(safe-area-inset-bottom,0px))] lg:pb-0 bg-canvas',
          )}
        >
          <div className="ps-page-frame">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav role={role} />
    </div>
  );
}
