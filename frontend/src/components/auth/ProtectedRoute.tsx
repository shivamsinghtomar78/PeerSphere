'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

/**
 * ProtectedRoute component
 * 
 * Wraps children and only renders them if user is authenticated.
 * If not authenticated, can show a loading state or redirect.
 * 
 * @example
 * ```tsx
 * // In layout.tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
interface ProtectedRouteProps {
  children: ReactNode;
  /** Path to redirect to if not authenticated (default: '/auth') */
  redirectTo?: string;
  /** Show loading state instead of redirecting while checking auth (default: false) */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/auth',
  showLoading = false,
  loadingComponent = <div className="flex items-center justify-center min-h-screen">Loading...</div>,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // If still loading, show loading state or nothing
  if (isLoading) {
    return showLoading ? <>{loadingComponent}</> : null;
  }

  // If not authenticated, redirect
  if (!isAuthenticated) {
    // Use setTimeout to avoid hydration issues
    setTimeout(() => {
      router.push(redirectTo);
    }, 0);
    return showLoading ? <>{loadingComponent}</> : null;
  }

  // Authenticated, render children
  return <>{children}</>;
};

/**
 * ProtectedRoute with role check
 * 
 * Only renders children if user is authenticated AND has the specified role.
 * 
 * @example
 * ```tsx
 * <ProtectedRoute role="STUDENT">
 *   <StudentDashboard />
 * </ProtectedRoute>
 * ```
 */
interface ProtectedRouteWithRoleProps extends ProtectedRouteProps {
  /** Required role(s) to access the route */
  role: 'STUDENT' | 'PLACEMENT_ADMIN' | ('STUDENT' | 'PLACEMENT_ADMIN')[];
  /** Path to redirect to if role doesn't match (default: same as redirectTo) */
  unauthorizedRedirectTo?: string;
}

export const ProtectedRouteWithRole: React.FC<ProtectedRouteWithRoleProps> = ({
  children,
  role,
  redirectTo = '/auth',
  unauthorizedRedirectTo,
  showLoading = false,
  loadingComponent,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // If still loading, show loading state or nothing
  if (isLoading) {
    return showLoading ? <>{loadingComponent}</> : null;
  }

  // If not authenticated, redirect to auth
  if (!isAuthenticated) {
    setTimeout(() => {
      router.push(redirectTo);
    }, 0);
    return showLoading ? <>{loadingComponent}</> : null;
  }

  // Check role
  const roles = Array.isArray(role) ? role : [role];
  const hasRequiredRole = user && roles.includes(user.role);

  if (!hasRequiredRole) {
    const redirectPath = unauthorizedRedirectTo || redirectTo;
    setTimeout(() => {
      router.push(redirectPath);
    }, 0);
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <GlassCard variant="surface" padding="lg" className="max-w-md text-center">
          <h2 className="text-xl font-bold text-text mb-4">Access Denied</h2>
          <p className="text-text-muted mb-6">
            You do not have permission to access this page.
          </p>
          <GlassButton variant="primary" onClick={() => router.push('/')}>
            Return Home
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  // Authenticated with correct role, render children
  return <>{children}</>;
};

/**
 * GuestRoute component
 * 
 * Wraps children and only renders them if user is NOT authenticated.
 * If authenticated, redirects to the specified path or role-based path.
 * 
 * @example
 * ```tsx
 * // In login page layout
 * <GuestRoute redirectTo="/dashboard">
 *   <LoginForm />
 * </GuestRoute>
 * ```
 */
interface GuestRouteProps {
  children: ReactNode;
  /** Path to redirect to if authenticated (default: '/student' or '/placement' based on role) */
  redirectTo?: string;
  /** Show loading state (default: false) */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
}

export const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  redirectTo,
  showLoading = false,
  loadingComponent,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // If still loading, show loading state or nothing
  if (isLoading) {
    return showLoading ? <>{loadingComponent}</> : null;
  }

  // If authenticated, redirect
  if (isAuthenticated) {
    const path = redirectTo || (user?.role === 'STUDENT' ? '/student' : '/placement');
    setTimeout(() => {
      router.push(path);
    }, 0);
    return showLoading ? <>{loadingComponent}</> : null;
  }

  // Not authenticated, render children
  return <>{children}</>;
};
