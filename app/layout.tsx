import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/context/AuthContext';
import { RegisterSW } from '@/components/pwa/RegisterSW';

export const metadata: Metadata = {
  title: 'PeerSphere — AI-Based Placement Matching & Skill Gap Analysis',
  description:
    'Institutional platform providing deterministic eligibility screening, zero-hallucination semantic skill matching, explainable confidence metrics, and actionable skill-gap learning roadmaps.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'PeerSphere',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b5bdb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-text antialiased font-sans">
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
              <RegisterSW />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
