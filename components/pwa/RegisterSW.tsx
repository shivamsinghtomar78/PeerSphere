'use client';

import { useEffect } from 'react';

/**
 * RegisterSW — registers the service worker in production only.
 * The SW is served from /sw.js (public dir) and enabled only when
 * the app is served over HTTPS or localhost.
 */
export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // SW registration is best-effort — never block the app on it.
      }
    };

    // Register after the page is interactive
    const id = window.setTimeout(register, 3000);
    return () => window.clearTimeout(id);
  }, []);

  return null;
}