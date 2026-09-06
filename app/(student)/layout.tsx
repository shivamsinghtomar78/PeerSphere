'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or not a student
  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth');
      } else if (user?.role !== 'STUDENT') {
        // If placement admin, redirect to placement portal
        router.push('/placement');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading state while checking auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return <AppShell role="student">{children}</AppShell>;
}
