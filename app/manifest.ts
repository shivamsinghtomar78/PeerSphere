import type { MetadataRoute } from 'next';

/**
 * PWA web app manifest — served at /manifest.webmanifest.
 * Enables "Add to Home Screen" / install with standalone display.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PeerSphere — AI Placement Matching & Skill Gap Analysis',
    short_name: 'PeerSphere',
    description:
      'Institutional platform providing deterministic eligibility screening, semantic skill matching, and skill-gap learning roadmaps.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f4f6f9',
    theme_color: '#3b5bdb',
    categories: ['education', 'productivity'],
    lang: 'en',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}