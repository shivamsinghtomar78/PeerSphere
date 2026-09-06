/**
 * PeerSphere Service Worker — offline app shell.
 *
 * Strategy:
 *  - NAVIGATIONS (HTML pages): network-first with cache fallback so users get
 *    the latest app, but can still open the shell offline.
 *  - STATIC ASSETS (/_next/static, /icons, /manifest.webmanifest): stale-while-
 *    revalidate — instant loads, background refresh.
 *  - API (/api/v1): network only — never cache auth or student data.
 */

const SHELL_CACHE = 'peersphere-shell-v1';
const STATIC_CACHE = 'peersphere-static-v1';

const NAVIGATION_URLS = ['/', '/student', '/placement'];

const isNavigationRequest = (request) => request.mode === 'navigate';
const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/icons/') ||
  url.pathname === '/manifest.webmanifest';

self.addEventListener('install', (event) => {
  // Pre-cache the minimal offline shell
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(NAVIGATION_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only — don't touch cross-origin (fonts, analytics)
  if (url.origin !== self.location.origin) return;

  // API requests: network only (fresh data, never cached)
  if (isApiRequest(url)) return;

  // Navigations: network-first, fall back to cached shell
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            // Fall back to the root shell for client-side routes
            return cached || caches.match('/');
          })
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});